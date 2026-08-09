"""
================================================================================
TALLY PRIME -> EXCEL : GROUP-WISE LEDGER EXPORT  (interactive)
================================================================================
Asks you three things, then builds one workbook:

    1. PERIOD  - a month, a full financial year, FY-to-date, or custom dates
    2. GROUPS  - which top-level groups you want (Purchase, Expenses, ...)
    3. nothing else - PAN, GSTIN and opening balance always come along

One sheet per selected group, ledger-wise inside, plus a Ledger_Master sheet
carrying GSTIN / PAN / opening / closing per ledger.

WHY THIS EXISTS (and not one sheet per ledger): a single month touches ~1,900
ledgers. Writing 1,900 Excel tabs is what made the old export slow - the Tally
fetch itself takes seconds. Grouping collapses that to ~11 sheets.

OPENING BALANCE is taken as at the START OF THE SELECTED PERIOD. Tally's
OPENINGBALANCE honours SVFROMDATE, so a July run reports the balance carried
into 01-Jul, not the 01-Apr book opening. (Verified: 2,032 ledgers differ
between the two dates.)

PREREQUISITE IN TALLY PRIME (one-time):
    F1 (Help) > Settings > Connectivity > Client/Server configuration
        TallyPrime acts as : Both
        Port               : 9000
    Keep Tally on the 'Gateway of Tally' screen with the company loaded.

RUN:
    python tally_group_export.py           (or double-click RUN_GROUP_EXPORT.bat)
================================================================================
"""

import datetime as dt
import os
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

import pandas as pd
import requests

# Reuse the hardened request/parse helpers - the lean FETCH, the XML sanitiser
# and the voucher flattener all live there and must not diverge.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tally_ledger_export as tly  # noqa: E402

OUTPUT_DIR = tly.OUTPUT_DIR
ROOT_SENTINELS = {"", "Primary"}


# ------------------------------------------------------------------ prompting
def ask(prompt, default=None):
    suffix = f" [{default}]" if default is not None else ""
    try:
        val = input(f"{prompt}{suffix}: ").strip()
    except EOFError:
        val = ""
    return val or (default if default is not None else "")


def ask_int(prompt, default, lo, hi):
    while True:
        raw = ask(prompt, str(default))
        try:
            n = int(raw)
        except ValueError:
            print(f"  ! enter a number between {lo} and {hi}")
            continue
        if lo <= n <= hi:
            return n
        print(f"  ! must be between {lo} and {hi}")


def ask_date(prompt, default_date):
    while True:
        raw = ask(prompt, default_date.strftime("%d-%m-%Y"))
        for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%Y%m%d"):
            try:
                return dt.datetime.strptime(raw, fmt).date()
            except ValueError:
                continue
        print("  ! use DD-MM-YYYY")


def choose_period():
    today = dt.date.today()
    last_day_prev = today.replace(day=1) - dt.timedelta(days=1)

    print("\n" + "=" * 62)
    print(" PERIOD")
    print("=" * 62)
    print("  1. A single month")
    print("  2. Full financial year (1-Apr to 31-Mar)")
    print("  3. Financial year to date (1-Apr to today)")
    print("  4. Custom date range")
    choice = ask_int("  Choose", 1, 1, 4)

    if choice == 1:
        y = ask_int("  Year", last_day_prev.year, 2000, 2100)
        m = ask_int("  Month (1-12)", last_day_prev.month, 1, 12)
        frm = dt.date(y, m, 1)
        nxt = dt.date(y + (m == 12), (m % 12) + 1, 1)
        to = nxt - dt.timedelta(days=1)
        tag = f"Monthly_{frm:%Y%m}"

    elif choice in (2, 3):
        default_start = today.year if today.month >= 4 else today.year - 1
        sy = ask_int("  FY starting April of year", default_start, 2000, 2100)
        frm = dt.date(sy, 4, 1)
        to = dt.date(sy + 1, 3, 31) if choice == 2 else today
        tag = f"FY{sy}-{str(sy + 1)[-2:]}" + ("" if choice == 2 else "_ToDate")

    else:
        frm = ask_date("  From (DD-MM-YYYY)", last_day_prev.replace(day=1))
        to = ask_date("  To   (DD-MM-YYYY)", last_day_prev)
        if to < frm:
            frm, to = to, frm
        tag = f"{frm:%Y%m%d}-{to:%Y%m%d}"

    print(f"\n  -> {frm:%d-%b-%Y} to {to:%d-%b-%Y}")
    print(f"  -> opening balance will be as at {frm:%d-%b-%Y}")
    return frm, to, tag


# ------------------------------------------------------------------ tally i/o
def collection(cid, ctype, fetch, company, frm=None, to=None, timeout=300):
    """Generic master-data Collection request."""
    period = ""
    if frm and to:
        period = (f"\n    <SVFROMDATE TYPE=\"Date\">{frm:%Y%m%d}</SVFROMDATE>"
                  f"\n    <SVTODATE TYPE=\"Date\">{to:%Y%m%d}</SVTODATE>")
    xml = f"""<ENVELOPE>
 <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST>
 <TYPE>Collection</TYPE><ID>{cid}</ID></HEADER>
 <BODY><DESC><STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    <SVCURRENTCOMPANY>{tly.xml_escape(company)}</SVCURRENTCOMPANY>{period}
   </STATICVARIABLES>
   <TDL><TDLMESSAGE>
     <COLLECTION NAME="{cid}" ISMODIFY="No">
      <TYPE>{ctype}</TYPE><FETCH>{fetch}</FETCH>
     </COLLECTION>
   </TDLMESSAGE></TDL>
  </DESC></BODY></ENVELOPE>"""
    raw = tly.fetch_from_tally(xml, timeout=timeout)
    return ET.fromstring(tly.sanitise_xml(raw))


def load_group_tree(company):
    """group name -> immediate parent."""
    parent = {}
    for g in collection("Grps", "Group", "PARENT", company).iter("GROUP"):
        name = (g.get("NAME") or "").strip()
        if name:
            parent[name] = tly.child_text(g, "PARENT").strip()
    return parent


def top_level_of(group, parent_map, _cache={}):
    """Walk up to the highest real group sitting under Tally's 'Primary' root."""
    if group in _cache:
        return _cache[group]
    cur, seen = group, set()
    while cur and cur not in seen:
        seen.add(cur)
        par = parent_map.get(cur, "")
        if par in ROOT_SENTINELS:
            break
        cur = par
    _cache[group] = cur or group
    return _cache[group]


LEDGER_FIELDS = ("PARENT, OPENINGBALANCE, CLOSINGBALANCE, INCOMETAXNUMBER, "
                 "PARTYGSTIN, GSTREGISTRATIONTYPE, LEDSTATENAME, PINCODE, EMAIL")


def load_ledger_master(company, frm, to, parent_map):
    """Ledger master as at the period start (SVFROMDATE drives OPENINGBALANCE)."""
    root = collection("Ldgs", "Ledger", LEDGER_FIELDS, company, frm, to)
    out = {}
    for l in root.iter("LEDGER"):
        name = (l.get("NAME") or "").strip()
        if not name:
            continue
        grp = tly.child_text(l, "PARENT").strip()
        out[name] = {
            "Ledger": name,
            "Group": grp,
            "Top Group": top_level_of(grp, parent_map),
            "GSTIN": tly.child_text(l, "PARTYGSTIN").strip(),
            "PAN": tly.child_text(l, "INCOMETAXNUMBER").strip(),
            "GST Reg Type": tly.child_text(l, "GSTREGISTRATIONTYPE").strip(),
            "State": tly.child_text(l, "LEDSTATENAME").strip(),
            "PIN": tly.child_text(l, "PINCODE").strip(),
            "Email": tly.child_text(l, "EMAIL").strip(),
            "Opening": tly.to_float(tly.child_text(l, "OPENINGBALANCE")),
        }
    return out


def fetch_vouchers(company, frm, to):
    """Chunked voucher pull - one request per calendar month window."""
    rows = []
    for start, end in tly.get_month_chunks(frm, to):
        got = tly.extract_rows(
            tly.fetch_from_tally(tly.build_request_xml(start, end, company)))
        rows.extend(got)
        print(f"    {start:%d-%b-%Y} to {end:%d-%b-%Y}: {len(got):,} entries",
              flush=True)
    return rows


# ------------------------------------------------------------------ selection
def choose_groups(master):
    """Asked BEFORE the voucher pull, so both questions land up front and the
    run then proceeds unattended."""
    counts = Counter(m["Top Group"] for m in master.values())
    ordered = [g for g, _ in counts.most_common()]

    print("\n" + "=" * 62)
    print(" GROUPS")
    print("=" * 62)
    for i, g in enumerate(ordered, 1):
        print(f"  {i:>2}. {g:<34} {counts[g]:>6,} ledgers")
    print(f"   0. ALL of the above")

    while True:
        raw = ask("\n  Numbers (comma separated, e.g. 2,3 or 0 for all)", "0")
        if raw.strip() == "0":
            return ordered
        try:
            picks = [ordered[int(p.strip()) - 1] for p in raw.split(",")
                     if p.strip()]
        except (ValueError, IndexError):
            print("  ! use numbers from the list above")
            continue
        if picks:
            return picks


# ------------------------------------------------------------------- workbook
GROUP_COLS = ["Date", "Voucher Type", "Voucher No.", "Ledger", "Group",
              "GSTIN", "PAN", "Opening", "Party Ledger", "Cost Category",
              "Cost Centre", "Debit", "Credit", "Reference", "Narration"]


def write_workbook(df, master, picks, frm, to, tag, company):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    part = "AllGroups" if len(picks) > 3 else "-".join(
        tly.safe_file_part(p)[:18] for p in picks)
    path = os.path.join(
        OUTPUT_DIR,
        f"TallyGroup_{tag}_{part}_{tly.safe_file_part(company)}.xlsx")

    used = set()
    with pd.ExcelWriter(path, engine="openpyxl") as xl:
        # --- Sheet 1: Consolidated all detailed voucher entries line-by-line ---
        df[GROUP_COLS].to_excel(xl, sheet_name="All_Entries", index=False)
        used.add("all_entries")

        # --- One sheet per selected top-level group (Detailed line-by-line) ---
        index_rows = []
        for g in picks:
            sub = df[df["Top Group"] == g].copy()
            if sub.empty:
                continue
            sub = sub.sort_values(["Ledger", "Date", "Voucher No."],
                                  kind="stable")
            sheet = tly.safe_sheet_name(g, used)
            sub[GROUP_COLS].to_excel(xl, sheet_name=sheet, index=False)
            index_rows.append({"Top Group": g, "Sheet": sheet,
                               "Ledgers": sub["Ledger"].nunique(),
                               "Entries": len(sub),
                               "Debit": sub["Debit"].sum(),
                               "Credit": sub["Credit"].sum()})
            print(f"    {sheet:<32} {sub['Ledger'].nunique():>5,} ledgers  "
                  f"{len(sub):>7,} rows", flush=True)

        # --- Ledger master: GSTIN / PAN / opening / movement / closing ------
        led = (df.groupby("Ledger", as_index=False)
                 .agg(Entries=("Amount", "size"), Debit=("Debit", "sum"),
                      Credit=("Credit", "sum")))
        meta = pd.DataFrame([master[l] for l in led["Ledger"] if l in master])
        led = led.merge(meta, on="Ledger", how="left")
        led["Opening"] = led["Opening"].fillna(0.0)
        # Tally signs a credit balance negative, and our Debit/Credit are both
        # positive magnitudes, so movement is Dr - Cr on top of the opening.
        led["Closing"] = led["Opening"] + led["Debit"] - led["Credit"]
        led = led[["Ledger", "Top Group", "Group", "GSTIN", "PAN",
                   "GST Reg Type", "State", "PIN", "Email", "Opening",
                   "Entries", "Debit", "Credit", "Closing"]]
        led.sort_values(["Top Group", "Group", "Ledger"]).to_excel(
            xl, sheet_name="Ledger_Master", index=False)
        used.add("ledger_master")

        # --- Group summary ---------------------------------------------------
        gsum = (led.groupby(["Top Group", "Group"], as_index=False)
                   .agg(Ledgers=("Ledger", "nunique"),
                        Entries=("Entries", "sum"), Opening=("Opening", "sum"),
                        Debit=("Debit", "sum"), Credit=("Credit", "sum"),
                        Closing=("Closing", "sum")))
        gsum.sort_values(["Top Group", "Group"]).to_excel(
            xl, sheet_name="Group_Summary", index=False)
        used.add("group_summary")

        pd.DataFrame(index_rows).to_excel(xl, sheet_name="Index", index=False)

    return path, led


# ----------------------------------------------------------------------- main
def main():
    print("=" * 62)
    print(" TALLY GROUP-WISE LEDGER EXPORT")
    print("=" * 62)
    print(f"Connecting: {tly.TALLY_URL}")

    open_now = tly.loaded_companies()
    if not open_now:
        sys.exit("NO COMPANY LOADED. Open the company and return to "
                 "'Gateway of Tally', then re-run.")

    if len(open_now) == 1:
        company = open_now[0]
    else:
        print("\nCompanies loaded:")
        for i, c in enumerate(open_now, 1):
            print(f"  {i}. {c}")
        company = open_now[ask_int("  Choose", 1, 1, len(open_now)) - 1]
    print(f"Company   : {company}")

    frm, to, tag = choose_period()

    print("\nReading masters ...", flush=True)
    parent_map = load_group_tree(company)
    master = load_ledger_master(company, frm, to, parent_map)
    print(f"  {len(parent_map):,} groups, {len(master):,} ledgers")

    picks = choose_groups(master)

    print("\n" + "=" * 62)
    print(f" Working - no more questions. {len(picks)} group(s) selected.")
    print("=" * 62)

    print("\nReading vouchers ...", flush=True)
    rows = fetch_vouchers(company, frm, to)
    if not rows:
        sys.exit("\nNo vouchers in this period - nothing to write.")

    df = pd.DataFrame(rows)
    df = df[df["Date"].notna()]
    df["Top Group"] = df["Ledger"].map(
        lambda l: master.get(l, {}).get("Top Group", "(unmapped)"))
    df["Group"] = df["Ledger"].map(
        lambda l: master.get(l, {}).get("Group", ""))
    df["GSTIN"] = df["Ledger"].map(lambda l: master.get(l, {}).get("GSTIN", ""))
    df["PAN"] = df["Ledger"].map(lambda l: master.get(l, {}).get("PAN", ""))
    df["Opening"] = df["Ledger"].map(
        lambda l: master.get(l, {}).get("Opening", 0.0))

    print(f"\n  vouchers {df['Voucher No.'].nunique():,} | "
          f"entries {len(df):,} | ledgers {df['Ledger'].nunique():,}")

    df = df[df["Top Group"].isin(picks)]
    if df.empty:
        sys.exit("\nNothing in the selected groups for this period.")

    print(f"\nWriting {len(picks)} group sheet(s) ...", flush=True)
    path, led = write_workbook(df, master, picks, frm, to, tag, company)

    print("\n" + "=" * 62)
    print(f" Entries     : {len(df):,}")
    print(f" Ledgers     : {df['Ledger'].nunique():,}")
    print(f" With GSTIN  : {(led['GSTIN'].fillna('') != '').sum():,}")
    print(f" With PAN    : {(led['PAN'].fillna('') != '').sum():,}")
    print(f" Debit       : {df['Debit'].sum():,.2f}")
    print(f" Credit      : {df['Credit'].sum():,.2f}")
    print(f" Saved       : {path}")
    print("=" * 62)


if __name__ == "__main__":
    main()
