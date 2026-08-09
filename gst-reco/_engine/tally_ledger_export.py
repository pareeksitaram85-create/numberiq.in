"""
================================================================================
TALLY PRIME -> EXCEL : LEDGER-WISE VOUCHER EXPORT (LAST MONTH)
================================================================================
Pulls every voucher of the previous calendar month from the company CURRENTLY
OPEN in Tally Prime, and writes one Excel workbook with ONE SHEET PER LEDGER.

Design note: makes ONE HTTP call to Tally (not one per ledger) and pivots in
memory - keeps RAM and Tally load low even on 50k+ voucher months.

PREREQUISITE IN TALLY PRIME (one-time):
    F1 (Help) > Settings > Connectivity > Client/Server configuration
        TallyPrime acts as        : Both
        Enable ODBC               : Yes
        Port                      : 9000
    Keep Tally open with the target company loaded, then run this script.

INSTALL (one-time):
    pip install requests pandas openpyxl

RUN:
    python tally_ledger_export.py
================================================================================
"""

import os
import re
import sys
import datetime as dt
from collections import defaultdict

import requests
import pandas as pd

# ============================== CONFIGURATION ===============================
TALLY_URL = "http://127.0.0.1:9000"   # 127.0.0.1, not localhost: avoids the
                                      # Windows IPv6 (::1) resolution trap

# Leave as None for automatic "last completed calendar month".
# To force a period, set e.g. FROM_DATE = dt.date(2026, 4, 1)
FROM_DATE = None
TO_DATE = None

# Which company/companies to export.
#   []   -> EVERY company currently loaded in Tally (default; nothing to edit)
#   [..] -> only these exact names, as shown in Tally's Select Company list
COMPANIES = [
    # "Join Flora Private Limited",
    # "Join Commerce Private Limited - FY 2025-2026",
]

# Which workbooks to produce for each company.
#   "MONTH" -> last completed calendar month
#   "FY"    -> Indian financial year, 1-Apr to 31-Mar, containing that month
PERIODS = ["MONTH", "FY"]

# Resolved from paths.py, which derives every folder from its own location.
# Do NOT use expanduser("~") here: when the script is launched from an elevated
# ("Administrator:") prompt, ~ can resolve to a different user profile and the
# workbook silently lands on another Desktop.
from paths import OUTPUT_DIR  # noqa: E402

# Safety valve: if the month touches more ledgers than this, the per-ledger
# sheets are skipped and only the flat consolidated sheet is written.
MAX_LEDGER_SHEETS = 5000

REQUEST_TIMEOUT = 600  # seconds

# Long periods are pulled in chunks of this many days. One giant request makes
# Tally materialise the whole period at once; it froze the UI at 5 GB RSS and
# never answered. Chunking keeps each response small and Tally responsive.
CHUNK_DAYS = 31

# Fields fetched per voucher. Name every leaf EXPLICITLY - never use
# ALLLEDGERENTRIES.* here. The wildcard drags in every GST / excise / VAT /
# bill / bank field Tally knows about: measured on 01-Jul-2026..03-Jul-2026 it
# returned 97.9 MB in 27.4 s, against 16.4 MB in 1.8 s for the list below -
# and both parse to the identical 10,539 rows / 900 ledgers / same Dr and Cr
# totals. The wildcard costs 15x the time for zero extra information.
VOUCHER_FETCH = """DATE, VOUCHERTYPENAME, VOUCHERNUMBER, REFERENCE, REFERENCEDATE, NARRATION,
             PARTYLEDGERNAME, ISCANCELLED, ISOPTIONAL,
             ALLLEDGERENTRIES.LEDGERNAME, ALLLEDGERENTRIES.AMOUNT,
             ALLLEDGERENTRIES.CATEGORYALLOCATIONS.CATEGORY,
             ALLLEDGERENTRIES.CATEGORYALLOCATIONS.COSTCENTREALLOCATIONS.NAME,
             ALLLEDGERENTRIES.CATEGORYALLOCATIONS.COSTCENTREALLOCATIONS.AMOUNT,
             LEDGERENTRIES.LEDGERNAME, LEDGERENTRIES.AMOUNT,
             LEDGERENTRIES.CATEGORYALLOCATIONS.CATEGORY,
             LEDGERENTRIES.CATEGORYALLOCATIONS.COSTCENTREALLOCATIONS.NAME,
             LEDGERENTRIES.CATEGORYALLOCATIONS.COSTCENTREALLOCATIONS.AMOUNT,
             INVENTORYENTRIES.ACCOUNTINGALLOCATIONS.LEDGERNAME,
             INVENTORYENTRIES.ACCOUNTINGALLOCATIONS.AMOUNT,
             INVENTORYENTRIES.ACCOUNTINGALLOCATIONS.CATEGORYALLOCATIONS.CATEGORY,
             INVENTORYENTRIES.ACCOUNTINGALLOCATIONS.CATEGORYALLOCATIONS.COSTCENTREALLOCATIONS.NAME,
             INVENTORYENTRIES.ACCOUNTINGALLOCATIONS.CATEGORYALLOCATIONS.COSTCENTREALLOCATIONS.AMOUNT"""
# ============================================================================


def resolve_period():
    """Last completed calendar month."""
    if FROM_DATE and TO_DATE:
        return FROM_DATE, TO_DATE
    today = dt.date.today()
    last_day_prev = today.replace(day=1) - dt.timedelta(days=1)
    first_day_prev = last_day_prev.replace(day=1)
    return first_day_prev, last_day_prev


def resolve_fy(any_date):
    """Indian financial year (1-Apr to 31-Mar) containing `any_date`.

    Apr-2026..Mar-2027 is 'FY 2026-27'. A date in Jan/Feb/Mar belongs to the
    FY that STARTED in the previous calendar year - e.g. 15-Feb-2027 is still
    FY 2026-27, so the start year is 2026, not 2027.
    """
    start_year = any_date.year if any_date.month >= 4 else any_date.year - 1
    frm = dt.date(start_year, 4, 1)
    to = dt.date(start_year + 1, 3, 31)
    label = f"FY{start_year}-{str(start_year + 1)[-2:]}"   # FY2026-27
    return frm, to, label


def period_plan():
    """Return [(from, to, tag, description), ...] for the configured PERIODS."""
    m_frm, m_to = resolve_period()
    plan = []
    for kind in PERIODS:
        k = kind.strip().upper()
        if k == "MONTH":
            plan.append((m_frm, m_to, f"Monthly_{m_frm:%Y%m}",
                         f"{m_frm:%b-%Y} (month)"))
        elif k == "FY":
            f_frm, f_to, label = resolve_fy(m_frm)
            plan.append((f_frm, f_to, label, f"{label} (1-Apr to 31-Mar)"))
        else:
            print(f"WARNING: unknown period {kind!r} in PERIODS - ignored.")
    return plan


def xml_escape(txt):
    return (txt.replace("&", "&amp;").replace("<", "&lt;")
               .replace(">", "&gt;").replace('"', "&quot;"))


def build_request_xml(frm, to, company=None):
    """TDL collection request: all vouchers in period, with ledger allocations."""
    cmp_tag = (f"\n    <SVCURRENTCOMPANY>{xml_escape(company)}</SVCURRENTCOMPANY>"
               if company else "")
    return f"""<ENVELOPE>
 <HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>AllVouchersForPeriod</ID>
 </HEADER>
 <BODY>
  <DESC>
   <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    <SVFROMDATE TYPE="Date">{frm.strftime('%Y%m%d')}</SVFROMDATE>
    <SVTODATE TYPE="Date">{to.strftime('%Y%m%d')}</SVTODATE>{cmp_tag}
   </STATICVARIABLES>
   <TDL>
    <TDLMESSAGE>
     <COLLECTION NAME="AllVouchersForPeriod" ISMODIFY="No" ISINITIALIZE="Yes">
      <TYPE>Voucher</TYPE>
      <FETCH>{VOUCHER_FETCH}</FETCH>
     </COLLECTION>
    </TDLMESSAGE>
   </TDL>
  </DESC>
 </BODY>
</ENVELOPE>"""


def fetch_from_tally(xml_payload, timeout=None):
    try:
        resp = requests.post(
            TALLY_URL,
            data=xml_payload.encode("utf-8"),
            headers={"Content-Type": "text/xml;charset=utf-8"},
            timeout=timeout or REQUEST_TIMEOUT,
        )
    except requests.exceptions.Timeout:
        sys.exit(
            "TALLY DID NOT RESPOND.\n"
            "  The port is open but Tally never answered the request.\n"
            "  This happens when Tally is sitting on a modal screen -\n"
            "  splash, Select Company, or the username/password login.\n"
            "  -> Get Tally to the 'Gateway of Tally' screen, then re-run.")
    except requests.exceptions.ConnectionError:
        sys.exit(
            "ERROR: Cannot reach Tally at %s\n"
            "  -> Is Tally Prime open?\n"
            "  -> F1 > Settings > Connectivity > 'TallyPrime acts as' = Both, Port 9000"
            % TALLY_URL
        )
    resp.raise_for_status()
    return resp.content.decode("utf-8", errors="replace")


def sanitise_xml(raw):
    """Make Tally's XML parseable by Python's strict expat parser.

    Tally's Collection export emits three things that break ElementTree:
      1. Namespace-prefixed tags/attributes (<UDF:...>, UDF:TYPE="...") while
         the xmlns:UDF declaration sits on TALLYMESSAGE or is missing entirely
         -> "unbound prefix" ParseError.
      2. Numeric character references to control chars (&#4; &#5;) that are
         illegal in XML 1.0.
      3. Bare & in ledger / party names (M/s A & B Co.).
    """
    # 1. Strip the BOM / anything before the first '<'
    first = raw.find("<")
    if first > 0:
        raw = raw[first:]

    # 2. Kill numeric refs pointing at illegal control characters,
    #    but keep legitimate ones (&#39; &#8377; etc.)
    def _strip_bad_ref(m):
        try:
            code = int(m.group(1))
        except ValueError:
            return ""
        if code in (9, 10, 13) or code >= 32:
            return m.group(0)
        return ""
    raw = re.sub(r"&#(\d+);", _strip_bad_ref, raw)

    # 3. Raw control bytes
    raw = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", raw)

    # 4. Bare ampersands
    raw = re.sub(r"&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);)", "&amp;", raw)

    # 5. THE ACTUAL FIX -- drop namespace prefixes so nothing is "unbound".
    #    <UDF:FIELD>  -> <FIELD>      </UDF:FIELD> -> </FIELD>
    raw = re.sub(r"<(/?)[A-Za-z_][\w.\-]*:", r"<\1", raw)
    #    UDF:TYPE="String" -> TYPE="String"   and drops xmlns:UDF declarations
    raw = re.sub(r'\sxmlns:[\w.\-]+\s*=\s*"[^"]*"', "", raw)
    raw = re.sub(r'\s[A-Za-z_][\w.\-]*:([A-Za-z_][\w.\-]*)\s*=', r" \1=", raw)

    return raw


def to_float(txt):
    if not txt:
        return 0.0
    txt = txt.strip().replace(",", "")
    txt = re.sub(r"[^0-9\.\-]", "", txt)
    try:
        return float(txt)
    except ValueError:
        return 0.0


def parse_date(txt):
    if not txt:
        return None
    txt = txt.strip()
    for fmt in ("%Y%m%d", "%d-%b-%Y", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(txt, fmt).date()
        except ValueError:
            continue
    return None


def child_text(node, tag):
    el = node.find(tag)
    return el.text if el is not None and el.text else ""


def extract_rows(xml_text):
    """Flatten every voucher into one row per ledger allocation."""
    import xml.etree.ElementTree as ET

    clean = sanitise_xml(xml_text)
    try:
        root = ET.fromstring(clean)
    except ET.ParseError as exc:
        # Dump the cleaned XML and show the offending line so the exact
        # malformed construct is visible instead of just a line number.
        dump = os.path.join(OUTPUT_DIR, "tally_raw_dump.xml")
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        with open(dump, "w", encoding="utf-8", errors="replace") as fh:
            fh.write(clean)
        line_no = getattr(exc, "position", (0, 0))[0]
        lines = clean.splitlines()
        lo, hi = max(0, line_no - 4), min(len(lines), line_no + 3)
        context = "\n".join(f"  {i+1}: {lines[i][:300]}" for i in range(lo, hi))
        sys.exit(
            f"XML PARSE ERROR: {exc}\n"
            f"Cleaned XML saved to: {dump}\n"
            f"Context around the failure:\n{context}"
        )
    rows = []

    for vch in root.iter("VOUCHER"):
        if child_text(vch, "ISCANCELLED").lower() == "yes":
            continue

        vdate = parse_date(child_text(vch, "DATE"))
        common = {
            "Date": vdate,
            "Voucher Type": child_text(vch, "VOUCHERTYPENAME"),
            "Voucher No.": child_text(vch, "VOUCHERNUMBER"),
            "Party Ledger": child_text(vch, "PARTYLEDGERNAME"),
            "Reference": child_text(vch, "REFERENCE"),
            # The SUPPLIER's invoice date, which is what GSTR-2A carries.
            # Distinct from DATE above, which is when we booked it - the two
            # differ across month and year ends, exactly where 2A mismatches
            # cluster. Costs nothing to fetch (measured: 10.2MB -> 10.4MB,
            # same 1.2s), unlike PARTYGSTIN/PLACEOFSUPPLY which do not.
            "Reference Date": parse_date(child_text(vch, "REFERENCEDATE")),
            "Narration": child_text(vch, "NARRATION"),
            "Optional": child_text(vch, "ISOPTIONAL"),
        }

        # ALLLEDGERENTRIES.LIST and LEDGERENTRIES.LIST are two VIEWS OF THE
        # SAME accounting entries, not separate ones. Purchase / Sales / Debit
        # Note vouchers get both: 430 of 4,657 vouchers over 01..05-Jul-2026,
        # every one byte-identical, and LEDGERENTRIES never appeared alone.
        # Reading both doubled those ledgers - "Rajasthan Purchase IGST 5%"
        # came out at exactly 2x Tally's own closing balance. Take
        # ALLLEDGERENTRIES and only fall back when it is genuinely absent.
        entries = list(vch.iter("ALLLEDGERENTRIES.LIST"))
        if not entries:
            entries = list(vch.iter("LEDGERENTRIES.LIST"))

        # Inventory-side allocations are a different set - measured overlap
        # with the above was 0 ledgers - so these are always added.
        entries.extend(vch.iter("ACCOUNTINGALLOCATIONS.LIST"))

        for ent in entries:
            ledger = child_text(ent, "LEDGERNAME")
            if not ledger:
                continue
            amt = to_float(child_text(ent, "AMOUNT"))

            def emit(amount, category, centre, ledger=ledger):
                # Tally convention: negative = Credit, positive = Debit
                rows.append({
                    **common,
                    "Ledger": ledger.strip(),
                    "Cost Category": category,
                    "Cost Centre": centre,
                    "Debit": amount if amount > 0 else 0.0,
                    "Credit": -amount if amount < 0 else 0.0,
                    "Amount": amount,
                })

            # Cost centre allocations sit under CATEGORYALLOCATIONS.LIST.
            # One ledger entry can be split across several cost centres,
            # so emit one row per allocation - never duplicate the parent
            # amount, or the sheet would double-count.
            allocated = 0.0
            found = False
            for cat in ent.iter("CATEGORYALLOCATIONS.LIST"):
                category = child_text(cat, "CATEGORY").strip()
                for cc in cat.iter("COSTCENTREALLOCATIONS.LIST"):
                    centre = child_text(cc, "NAME").strip()
                    if not centre:
                        continue
                    cc_amt = to_float(child_text(cc, "AMOUNT"))
                    emit(cc_amt, category, centre)
                    allocated += cc_amt
                    found = True

            if not found:
                emit(amt, "", "")
            else:
                # Anything the cost centres did not absorb stays visible
                # as an unallocated remainder so totals still tie back.
                residual = round(amt - allocated, 2)
                if abs(residual) >= 0.01:
                    emit(residual, "", "(Unallocated)")

    return rows


_INVALID_SHEET = re.compile(r"[\\/\*\?\:\[\]]")


def safe_sheet_name(name, used):
    base = _INVALID_SHEET.sub("-", name).strip() or "Ledger"
    base = base[:31]
    candidate, n = base, 1
    while candidate.lower() in used:
        suffix = f"~{n}"
        candidate = base[: 31 - len(suffix)] + suffix
        n += 1
    used.add(candidate.lower())
    return candidate


_INVALID_FILE = re.compile(r'[<>:"/\\|\?\*]')


def safe_file_part(name):
    """Turn a company name into something legal inside a Windows filename."""
    cleaned = _INVALID_FILE.sub("-", name).strip().rstrip(".")
    cleaned = re.sub(r"\s+", "_", cleaned)
    return cleaned[:60] or "Company"


def get_month_chunks(frm, to):
    """Splits date range strictly by calendar months (e.g. 01-Apr to 30-Apr, 01-May to 31-May)."""
    chunks = []
    cur_start = frm
    while cur_start <= to:
        if cur_start.month == 12:
            last_day = dt.date(cur_start.year, 12, 31)
        else:
            last_day = dt.date(cur_start.year, cur_start.month + 1, 1) - dt.timedelta(days=1)
        
        cur_end = min(to, last_day)
        chunks.append((cur_start, cur_end))
        
        if cur_start.month == 12:
            cur_start = dt.date(cur_start.year + 1, 1, 1)
        else:
            cur_start = dt.date(cur_start.year, cur_start.month + 1, 1)
    return chunks


def export_one(frm, to, company, tag, description):
    print(f"  {description:<28} {frm:%d-%b-%Y} to {to:%d-%b-%Y}")

    rows = []
    for chunk_start, chunk_end in get_month_chunks(frm, to):
        xml_text = fetch_from_tally(
            build_request_xml(chunk_start, chunk_end, company))
        got = extract_rows(xml_text)
        rows.extend(got)
        print(f"      {chunk_start:%d-%b-%Y} to {chunk_end:%d-%b-%Y}: "
              f"{len(got):,} entries", flush=True)

    if not rows:
        print("    WARNING: no vouchers in this period - workbook not created.")
        return

    df = pd.DataFrame(rows)
    df = df[df["Date"].notna()]
    df = df.sort_values(["Ledger", "Date", "Voucher No."], kind="stable")

    cols = ["Date", "Voucher Type", "Voucher No.", "Ledger", "Party Ledger",
            "Cost Category", "Cost Centre",
            "Debit", "Credit", "Reference", "Narration"]
    df = df[cols + [c for c in df.columns if c not in cols]]

    ledgers = sorted(df["Ledger"].unique())
    cc_tagged = int((df["Cost Centre"].fillna("") != "").sum())
    print(f"    Vouchers {df['Voucher No.'].nunique()} | "
          f"Entries {len(df)} | Ledgers {len(ledgers)} | "
          f"Cost-centre rows {cc_tagged}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    # Company AND period tag both go in the filename, so the monthly workbook
    # can never overwrite the FY one (or another company's).
    out_path = os.path.join(
        OUTPUT_DIR, f"Tally_{tag}_{safe_file_part(company)}.xlsx")

    used = set()
    index_rows = []

    with pd.ExcelWriter(out_path, engine="openpyxl") as xl:
        # --- Sheet 1: consolidated flat table (Power Query friendly) --------
        df.to_excel(xl, sheet_name="All_Entries", index=False)
        used.add("all_entries")

        # --- Summary: ledger-wise Dr / Cr / Net -----------------------------
        summary = (df.groupby("Ledger", as_index=False)
                     .agg(Entries=("Amount", "size"),
                          Debit=("Debit", "sum"),
                          Credit=("Credit", "sum")))
        summary["Net (Dr-Cr)"] = summary["Debit"] - summary["Credit"]
        summary = summary.sort_values("Ledger")

        if len(ledgers) > MAX_LEDGER_SHEETS:
            print(f"NOTE: {len(ledgers)} ledgers exceeds MAX_LEDGER_SHEETS "
                  f"({MAX_LEDGER_SHEETS}). Per-ledger sheets skipped.")
        else:
            for ledger in ledgers:
                sheet = safe_sheet_name(ledger, used)
                sub = df[df["Ledger"] == ledger].copy()
                sub["Running Balance"] = (sub["Debit"] - sub["Credit"]).cumsum()
                sub.drop(columns=["Ledger"]).to_excel(
                    xl, sheet_name=sheet, index=False)
                index_rows.append({"Ledger": ledger, "Sheet": sheet,
                                   "Entries": len(sub)})

        summary.to_excel(xl, sheet_name="Summary", index=False)

        # --- Cost centre analysis ------------------------------------------
        cc = df[df["Cost Centre"].fillna("") != ""].copy()
        if not cc.empty:
            cc_sum = (cc.groupby(["Cost Category", "Cost Centre"],
                                 as_index=False)
                        .agg(Entries=("Amount", "size"),
                             Debit=("Debit", "sum"),
                             Credit=("Credit", "sum")))
            cc_sum["Net (Dr-Cr)"] = cc_sum["Debit"] - cc_sum["Credit"]
            cc_sum = cc_sum.sort_values(["Cost Category", "Cost Centre"])
            cc_sum.to_excel(xl, sheet_name="CostCentre_Summary", index=False)

            cc_led = (cc.groupby(["Cost Centre", "Ledger"], as_index=False)
                        .agg(Entries=("Amount", "size"),
                             Debit=("Debit", "sum"),
                             Credit=("Credit", "sum")))
            cc_led["Net (Dr-Cr)"] = cc_led["Debit"] - cc_led["Credit"]
            cc_led = cc_led.sort_values(["Cost Centre", "Ledger"])
            cc_led.to_excel(xl, sheet_name="CostCentre_x_Ledger", index=False)

        if index_rows:
            pd.DataFrame(index_rows).to_excel(
                xl, sheet_name="Index", index=False)

    print(f"    Saved -> {out_path}")


def loaded_companies():
    """Ask Tally which companies are actually OPEN right now."""
    req = ("<ENVELOPE><HEADER><VERSION>1</VERSION>"
           "<TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE>"
           "<ID>ListOfCompanies</ID></HEADER><BODY><DESC>"
           "<STATICVARIABLES>"
           "<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>"
           "</STATICVARIABLES><TDL><TDLMESSAGE>"
           '<COLLECTION NAME="ListOfCompanies" ISMODIFY="No">'
           "<TYPE>Company</TYPE><FETCH>NAME</FETCH>"
           "</COLLECTION></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>")
    import xml.etree.ElementTree as ET
    try:
        # Short timeout: this probe must fail fast if Tally is stuck on a
        # modal screen, instead of blocking for the full REQUEST_TIMEOUT.
        raw = fetch_from_tally(req, timeout=30)
        root = ET.fromstring(sanitise_xml(raw))
    except SystemExit:
        raise
    except Exception:
        return None            # couldn't determine - don't block the run
    names = []
    for c in root.iter("COMPANY"):
        n = child_text(c, "NAME") or (c.get("NAME") or "")
        if n.strip():
            names.append(n.strip())
    return names


def main():
    print("Connecting  : " + TALLY_URL)

    open_now = loaded_companies()
    if not open_now:
        sys.exit(
            "NO COMPANY IS LOADED IN TALLY.\n"
            "  Tally's server answers on the port even with no company open,\n"
            "  which is why the connection test passes but no data comes back.\n"
            "  -> In Tally: Select Company, finish the username/password login,\n"
            "     and confirm you are on the 'Gateway of Tally' screen.")

    print("Loaded      : " + ", ".join(open_now))

    plan = period_plan()
    for frm, to, tag, desc in plan:
        print(f"Will export : {desc}")

    # No COMPANIES configured -> export every company open in Tally.
    targets = COMPANIES if COMPANIES else list(open_now)

    made = 0
    for company in targets:
        print(f"\nCompany     : {company}")
        if company not in open_now:
            print("  SKIPPED: not loaded in Tally. Load it first (Alt+F3).")
            continue
        for frm, to, tag, desc in plan:
            try:
                export_one(frm, to, company, tag, desc)
                made += 1
            except SystemExit:
                raise
            except Exception as exc:
                print(f"    FAILED ({desc}): {type(exc).__name__}: {exc}")

    print(f"\nDone. {made} workbook(s) attempted in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
