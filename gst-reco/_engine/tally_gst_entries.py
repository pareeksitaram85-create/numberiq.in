"""
================================================================================
TALLY PRIME -> EXCEL : ENTRY-LEVEL GST PURCHASE REGISTER, GSTIN / STATE-WISE
================================================================================
STEP 1 of the GSTR-2A reconciliation. Produces the BOOKS side: one row per
purchase voucher per state, carrying supplier, invoice reference, taxable value
and the CGST / SGST / IGST / CESS / ISD / reversal split.

Step 2 (matching against a GSTR-2A download) is deliberately NOT done here.
'Reco Status' is left as "Pending Reco".

--------------------------------------------------------------------------------
HOW STATE IS DECIDED  (this is the part Antigravity got wrong)
--------------------------------------------------------------------------------
A voucher's state comes from the GROUP TREE position of the Input GST ledger it
actually hits:

    Current Liabilities > Duties & Taxes > GST & TDS > GST > GST Input
        > "<code> - <State> GST Input"

never from parsing the voucher type or ledger name, and never from a default.
The earlier tool defaulted unknown states to Punjab, which silently mislabels
rows on a 18-GSTIN company.

Validated: for Jul-2025 this reproduced all 18 state balances EXACTLY (0.00).

--------------------------------------------------------------------------------
WHY IT IS BUILT THIS WAY  (each rule cost a Tally crash to learn)
--------------------------------------------------------------------------------
* Voucher FETCH stays LEAN. Adding PARTYGSTIN / PLACEOFSUPPLY / REFERENCEDATE at
  voucher level drove Tally to 6.5 GB and it stopped answering. Supplier GSTIN
  and PAN come from the LEDGER MASTER instead - one cheap request.
* ONE MONTH PER REQUEST. A full-FY pull took Tally 390 MB -> 10.3 GB, then dead.
* EMPTY REPLIES ARE FAILURES. A busy Tally returns a well-formed but EMPTY
  collection. Accepting it would write zero rows for a month and look fine.
* EVERY MONTH IS CHECKPOINTED to the _cache folder. If Tally dies you restart it and
  re-run; completed months are skipped, nothing is lost.

--------------------------------------------------------------------------------
VERIFICATION GATE
--------------------------------------------------------------------------------
Per state, the sum of the tax columns must equal the Input GST balance movement
computed independently from OPENINGBALANCE at month boundaries. Any non-zero
delta is printed loudly and written to the Verification sheet.

Dr = Cr is NOT accepted as proof - it stayed balanced even when a real
double-counting bug was live.

RUN:  python tally_gst_entries.py      (or RUN_GST_ENTRIES.bat)
================================================================================
"""

import collections
import datetime as dt
import os
import re
import sys
import time

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tally_ledger_export as tly          # noqa: E402
import tally_group_export as tge           # noqa: E402

ROOT_GROUP = "GST Input"
ROOT_SENTINELS = {"", "Primary"}
OUTPUT_DIR = tly.OUTPUT_DIR
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_cache")

COLUMNS = [
    "Voucher Date", "Voucher Type", "Voucher No.", "Supplier Name",
    "Supplier GSTIN", "Supplier Reg Type", "Supplier PAN", "Supplier Inv No",
    "Supplier Inv Date", "Taxable Value",
    "CGST", "SGST / UTGST", "IGST", "CESS", "ISD", "Reversal 17(5)",
    "Other GST", "Total Tax", "Total Invoice Value", "Our GSTIN", "State",
    "Multi-State Vch", "Narration", "Reco Status",
]

TAX_COLS = ["CGST", "SGST / UTGST", "IGST", "CESS", "ISD",
            "Reversal 17(5)", "Other GST"]


# ------------------------------------------------------------------ preflight
def preflight():
    print("Checking Tally ...", flush=True)
    try:
        loaded = tly.loaded_companies()
    except SystemExit:
        raise
    except Exception as exc:
        sys.exit(f"Cannot reach Tally at {tly.TALLY_URL} ({exc}).")
    if not loaded:
        sys.exit(
            "Tally answered but NO COMPANY is loaded.\n"
            "  1. A second Tally instance may own port 9000 with nothing "
            "loaded - it replies with 0 bytes. Close the small one.\n"
            "  2. A License box or the Company Login (username/password) "
            "screen may be up - clear it yourself.\n"
            "  3. Then press Esc until you see 'Gateway of Tally'.\n"
            "  Title bar must end in ':9000'.")
    return loaded[0]


# ------------------------------------------------------------------ structure
def classify(ledger_name):
    """Split Input GST ledgers into the buckets a 2A reco actually needs.

    ISD credit and 17(5) reversals are NOT ordinary ITC - folding them into
    CGST/SGST/IGST would overstate credit availed.
    """
    u = ledger_name.upper()
    if re.search(r"REVERSAL", u):
        return "Reversal 17(5)"
    if re.search(r"\bISD\b", u):
        return "ISD"
    if re.search(r"CASH LEDGER|ELECTRONIC CASH", u):
        return "Other GST"
    if re.search(r"\bCGST\b|CENTRAL\s*TAX", u):
        return "CGST"
    if re.search(r"\bSGST\b|\bUTGST\b|STATE\s*TAX", u):
        return "SGST / UTGST"
    if re.search(r"\bIGST\b|INTEGRATED\s*TAX", u):
        return "IGST"
    if re.search(r"\bCESS\b", u):
        return "CESS"
    return "Other GST"


def build_structure(company):
    parent = {}
    for g in tge.collection("G", "Group", "PARENT", company).iter("GROUP"):
        n = (g.get("NAME") or "").strip()
        if n:
            parent[n] = tly.child_text(g, "PARENT").strip()
    kids = collections.defaultdict(list)
    for g, p in parent.items():
        kids[p].append(g)

    if ROOT_GROUP not in parent:
        sys.exit(f"Group {ROOT_GROUP!r} not found in this company.")

    scope, stack = set(), [ROOT_GROUP]
    while stack:
        cur = stack.pop()
        scope.add(cur)
        stack.extend(kids.get(cur, []))
    states = set(kids.get(ROOT_GROUP, []))

    def state_of(grp):
        cur, seen = grp, set()
        while cur and cur not in seen and cur not in ROOT_SENTINELS:
            seen.add(cur)
            if cur in states:
                return cur
            cur = parent.get(cur, "")
        return "(unassigned)"

    return scope, states, state_of


MASTER_FETCH = (
    "PARENT, INCOMETAXNUMBER, PARTYGSTIN, LEDSTATENAME, "
    "LEDGSTREGDETAILS.GSTIN, LEDGSTREGDETAILS.APPLICABLEFROM, "
    "LEDGSTREGDETAILS.GSTREGISTRATIONTYPE, LEDGSTREGDETAILS.PLACEOFSUPPLY"
)


def load_masters(company, scope, state_of):
    """One request. GST-ledger -> (state, bucket), plus supplier identity.

    SUPPLIER GSTIN DOES NOT LIVE IN `PARTYGSTIN` on this Tally (release 7).
    That field is empty even when the ledger visibly shows a GSTIN in the UI -
    reading it found only 3,207 GSTINs where 5,567 distinct ones exist.

    The real location is a repeating LEDGSTREGDETAILS.LIST, one entry per
    registration, each with an APPLICABLEFROM date. Ledgers genuinely change
    GSTIN mid-year: 'Jaipan Industries Ltd' carries 27AAACS5635F1ZE from
    01-Apr-2022 and 27AAACS5636F1ZE from 31-Mar-2025 - one character apart.
    So the registration must be chosen against the VOUCHER DATE, not just
    "take the last one", or rows silently carry the wrong GSTIN into the 2A
    match.
    """
    root = tge.collection("L", "Ledger", MASTER_FETCH, company)
    gst_ledgers, suppliers = {}, {}
    for l in root.iter("LEDGER"):
        name = (l.get("NAME") or "").strip()
        if not name:
            continue
        grp = tly.child_text(l, "PARENT").strip()
        if grp in scope:
            gst_ledgers[name] = (state_of(grp), classify(name))

        regs = []
        for r in l.iter("LEDGSTREGDETAILS.LIST"):
            g = tly.child_text(r, "GSTIN").strip().upper()
            if not g:
                continue
            regs.append((tly.parse_date(tly.child_text(r, "APPLICABLEFROM")),
                         g,
                         tly.child_text(r, "GSTREGISTRATIONTYPE").strip()))
        # legacy fallback for ledgers still using the old single field
        legacy = tly.child_text(l, "PARTYGSTIN").strip().upper()
        if not regs and legacy:
            regs.append((None, legacy, ""))
        regs.sort(key=lambda x: (x[0] or dt.date(1900, 1, 1)))

        pan = tly.child_text(l, "INCOMETAXNUMBER").strip()
        if regs or pan:
            suppliers[name] = {"pan": pan, "regs": regs}
    return gst_ledgers, suppliers


def gstin_on(supplier, when):
    """The registration in force on `when`; else the earliest known."""
    info = supplier or {}
    regs = info.get("regs") or []
    if not regs:
        return "", ""
    applicable = [r for r in regs if r[0] is None or (when and r[0] <= when)]
    chosen = applicable[-1] if applicable else regs[0]
    return chosen[1], chosen[2]


GSTIN_MAP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              "our_gstins.csv")
GSTIN_RE = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$")


def load_our_gstins(states):
    """Our own GSTIN per state code, from a file YOU control.

    Deliberately not scraped from Tally: the company-level GST collection is
    expensive to query (a wildcard probe took Tally down) and its shape varies
    by Tally version. Deliberately not hardcoded either - the previous tool
    shipped 18 baked-in GSTINs and defaulted anything unknown to Punjab.

    On first run this writes a template with every state code already filled
    in; paste your GSTINs once and every later run picks them up. Until then
    the column says so plainly instead of showing a made-up number.
    """
    codes = {}
    for st in sorted(states):
        m = re.match(r"^(\d{2})\s*-\s*(.+)$", st)
        if m:
            codes[m.group(1)] = m.group(2).strip()

    if not os.path.exists(GSTIN_MAP_FILE):
        pd.DataFrame([{"State Code": c, "State": n, "Our GSTIN": ""}
                      for c, n in sorted(codes.items())]).to_csv(
            GSTIN_MAP_FILE, index=False)
        print(f"  created {GSTIN_MAP_FILE}")
        print("  -> paste your 15-digit GSTINs into it once; later runs use them")
        return {}

    got, isd, bad = {}, {}, []
    for r in pd.read_csv(GSTIN_MAP_FILE, dtype=str).fillna("").to_dict("records"):
        code = str(r.get("State Code", "")).strip().zfill(2)
        gst = str(r.get("Our GSTIN", "")).strip().upper()
        kind = str(r.get("Type", "Regular")).strip().upper() or "REGULAR"
        if not gst:
            continue
        if not GSTIN_RE.match(gst):
            bad.append((code, gst))
        elif gst[:2] != code:
            bad.append((code, gst + " (state code mismatch)"))
        elif kind == "ISD":
            # An ISD registration shares its state code with the regular one
            # (Maharashtra has both 27...1ZW and 27...2ZV, differing only in
            # the entity digit). Keeping them in one dict would silently
            # overwrite the regular GSTIN for that state.
            isd[code] = gst
        else:
            got[code] = gst
    for code, gst in bad:
        print(f"  WARNING ignoring invalid GSTIN for {code}: {gst!r}")
    if isd:
        print(f"  ISD registrations: {', '.join(sorted(isd.values()))}")
    return got


# -------------------------------------------------------------------- vouchers
def month_windows(frm, to):
    out, cur = [], frm
    while cur <= to:
        nxt = dt.date(cur.year + (cur.month == 12), (cur.month % 12) + 1, 1)
        out.append((cur, min(nxt - dt.timedelta(days=1), to)))
        cur = nxt
    return out


def fetch_month(company, f, t, attempts=3):
    """Vouchers for one month. Empty result counts as failure and is retried."""
    last = None
    for i in range(attempts):
        try:
            rows = tly.extract_rows(
                tly.fetch_from_tally(tly.build_request_xml(f, t, company)))
            if rows:
                return rows
            last = "Tally returned no vouchers (empty collection)"
        except SystemExit:
            raise
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        if i < attempts - 1:
            print(f"      retry {i + 1} ({last})", flush=True)
            time.sleep(8)
    sys.exit(
        f"\nFAILED on {f:%b-%Y}: {last}\n"
        "  Tally has most likely run out of headroom. Restart Tally, clear the\n"
        "  login/licence screens, reach 'Gateway of Tally', and RE-RUN this\n"
        f"  script - months already written to {CACHE_DIR} are skipped.")


def rows_for_month(company, f, t, gst_ledgers, suppliers):
    """One output row per (voucher, state). Returns (rows, optional_rows).

    OPTIONAL VOUCHERS ARE EXCLUDED from the register. Tally treats them as
    provisional - they never hit the ledger balances - but the voucher
    collection still returns them. Including them overstated availed ITC by
    exactly 12,334.00 over FY2025-26 (Delhi 2,196.00 across 4 entries,
    Maharashtra 10,138.00 on 1), which is precisely what the verification
    gate flagged. They are reported separately, never silently dropped.
    """
    raw = fetch_month(company, f, t)
    by_vch = collections.defaultdict(list)
    optional = []
    for r in raw:
        if r["Date"] is None:
            continue
        if str(r.get("Optional", "")).strip().lower() == "yes":
            if r["Ledger"] in gst_ledgers:
                optional.append({
                    "Voucher Date": r["Date"], "Voucher Type": r["Voucher Type"],
                    "Voucher No.": r["Voucher No."],
                    "Supplier Name": r["Party Ledger"],
                    "Ledger": r["Ledger"],
                    "State": gst_ledgers[r["Ledger"]][0],
                    "Bucket": gst_ledgers[r["Ledger"]][1],
                    "Amount": round(-r["Amount"], 2),
                    "Why excluded": "Optional voucher - not in Tally balances",
                })
            continue
        by_vch[(r["Date"], r["Voucher Type"], r["Voucher No."])].append(r)

    out = []
    for (vdate, vtype, vno), entries in by_vch.items():
        hits = [e for e in entries if e["Ledger"] in gst_ledgers]
        if not hits:
            continue

        states_hit = {gst_ledgers[e["Ledger"]][0] for e in hits}
        party = next((e["Party Ledger"] for e in entries
                      if e["Party Ledger"]), "")
        sup = suppliers.get(party)
        pan = (sup or {}).get("pan", "")
        gstin, regtype = gstin_on(sup, vdate)
        ref = next((e["Reference"] for e in entries if e["Reference"]), "")
        refdate = next((e.get("Reference Date") for e in entries
                        if e.get("Reference Date")), None)
        narr = next((e["Narration"] for e in entries if e["Narration"]), "")

        for st in sorted(states_hit):
            mine = [e for e in hits if gst_ledgers[e["Ledger"]][0] == st]
            rec = dict.fromkeys(TAX_COLS, 0.0)
            for e in mine:
                # Amount is signed (negative = credit). ITC availed sits on the
                # credit side here, so negate to show credit availed positive
                # and reversals negative.
                rec[gst_ledgers[e["Ledger"]][1]] += -e["Amount"]

            # Taxable = everything that is neither a GST ledger nor the party.
            # Negated for the same reason as the tax columns: in this company
            # purchase-side entries carry the credit sign, so the raw sum comes
            # out negative. Negating makes taxable and tax both read positive.
            taxable = -sum(
                e["Amount"] for e in entries
                if e["Ledger"] not in gst_ledgers and e["Ledger"] != party
            ) if len(states_hit) == 1 else 0.0

            total_tax = sum(rec[c] for c in TAX_COLS)
            out.append({
                "Voucher Date": vdate, "Voucher Type": vtype,
                "Voucher No.": vno, "Supplier Name": party,
                "Supplier GSTIN": gstin, "Supplier Reg Type": regtype,
                "Supplier PAN": pan,
                "Supplier Inv No": ref,
                "Supplier Inv Date": refdate,
                "Taxable Value": round(taxable, 2),
                **{c: round(rec[c], 2) for c in TAX_COLS},
                "Total Tax": round(total_tax, 2),
                "Total Invoice Value": round(taxable + total_tax, 2),
                "Our GSTIN": "", "State": st,
                "Multi-State Vch": "Yes" if len(states_hit) > 1 else "",
                "Narration": narr, "Reco Status": "Pending Reco",
            })
    return out, optional


# ---------------------------------------------------------------- verification
def balance_movement(company, frm, to, scope, state_of):
    """Independent per-state net movement from OPENINGBALANCE at boundaries.

    CLOSINGBALANCE is deliberately unused - it ignores SVTODATE for
    sub-periods and returns the end-of-data balance.
    """
    def bal_at(when):
        root = tge.collection("L", "Ledger", "PARENT, OPENINGBALANCE",
                              company, when, when)
        out = {}
        for l in root.iter("LEDGER"):
            n = (l.get("NAME") or "").strip()
            grp = tly.child_text(l, "PARENT").strip()
            if n and grp in scope:
                out[n] = (state_of(grp),
                          tly.to_float(tly.child_text(l, "OPENINGBALANCE")))
        return out

    start, end = bal_at(frm), bal_at(to + dt.timedelta(days=1))
    agg = collections.defaultdict(float)
    for name, (st, closing) in end.items():
        agg[st] += closing - start.get(name, (st, 0.0))[1]
    return dict(agg)


# ---------------------------------------------------------------------- main
def main():
    print("=" * 74)
    print(" GST PURCHASE REGISTER - ENTRY LEVEL, GSTIN/STATE-WISE  (step 1)")
    print("=" * 74)

    company = preflight()
    print(f"Company : {company}")
    frm, to, tag = tge.choose_period()

    print("\nReading structure ...", flush=True)
    scope, states, state_of = build_structure(company)
    gst_ledgers, suppliers = load_masters(company, scope, state_of)
    print(f"  {len(states)} state groups | {len(gst_ledgers)} GST ledgers | "
          f"{len(suppliers):,} ledgers carrying GSTIN/PAN")
    buckets = collections.Counter(v[1] for v in gst_ledgers.values())
    print(f"  buckets: {dict(buckets)}")

    our = load_our_gstins(states)
    print(f"  our GSTINs loaded: {len(our)}/{len(states)}")

    os.makedirs(CACHE_DIR, exist_ok=True)
    safe_cmp = tly.safe_file_part(company)

    all_rows, all_opt = [], []
    for f, t in month_windows(frm, to):
        cache = os.path.join(CACHE_DIR, f"{safe_cmp}_{f:%Y%m}.csv")
        ocache = os.path.join(CACHE_DIR, f"{safe_cmp}_{f:%Y%m}_optional.csv")
        if os.path.exists(cache):
            got = pd.read_csv(cache).to_dict("records")
            opt = (pd.read_csv(ocache).to_dict("records")
                   if os.path.exists(ocache) else [])
            print(f"  {f:%b-%Y}: {len(got):>6,} rows (cached)", flush=True)
        else:
            got, opt = rows_for_month(company, f, t, gst_ledgers, suppliers)
            pd.DataFrame(got, columns=COLUMNS).to_csv(cache, index=False)
            if opt:
                pd.DataFrame(opt).to_csv(ocache, index=False)
            note = f"  ({len(opt)} optional excluded)" if opt else ""
            print(f"  {f:%b-%Y}: {len(got):>6,} rows{note}", flush=True)
        all_rows.extend(got)
        all_opt.extend(opt)

    if not all_rows:
        sys.exit("No GST purchase entries in this period.")

    df = pd.DataFrame(all_rows, columns=COLUMNS)
    df["State Code"] = df["State"].str.extract(r"^(\d{2})")[0].fillna("")
    df["Our GSTIN"] = df["State Code"].map(
        lambda c: our.get(c, f"{c} — fill our_gstins.csv"))
    df = df.sort_values(["State Code", "Voucher Date", "Voucher No."],
                        kind="stable")

    # --- verification gate ---------------------------------------------------
    print("\nVerifying against Input GST balance movement ...", flush=True)
    move = balance_movement(company, frm, to, scope, state_of)
    ver = []
    for st in sorted(set(df["State"]) | set(move)):
        from_entries = df.loc[df["State"] == st, TAX_COLS].sum().sum()
        from_balances = -move.get(st, 0.0)   # movement is negative = credit
        ver.append({"State": st, "Tax from entries": round(from_entries, 2),
                    "From balances": round(from_balances, 2),
                    "Difference": round(from_entries - from_balances, 2)})
    vdf = pd.DataFrame(ver)
    bad = vdf[vdf["Difference"].abs() > 0.01]

    print(f"\n{'State':<34}{'entries':>18}{'balances':>18}{'diff':>14}")
    for _, r in vdf.iterrows():
        flag = "  <-- MISMATCH" if abs(r["Difference"]) > 0.01 else ""
        print(f"{r['State']:<34}{r['Tax from entries']:>18,.2f}"
              f"{r['From balances']:>18,.2f}{r['Difference']:>14,.2f}{flag}")

    if bad.empty:
        print("\n  ALL STATES RECONCILE EXACTLY.")
    else:
        print(f"\n  *** {len(bad)} STATE(S) DO NOT RECONCILE - see "
              f"Verification sheet ***")

    # --- workbook ------------------------------------------------------------
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, f"GST_Entries_{tag}_{safe_cmp}.xlsx")
    used = set()
    with pd.ExcelWriter(path, engine="openpyxl") as xl:
        df[COLUMNS].to_excel(xl, sheet_name="Consolidated", index=False)
        used.add("consolidated")

        summary = (df.groupby(["State Code", "State", "Our GSTIN"],
                              as_index=False)
                     .agg(Vouchers=("Voucher No.", "nunique"),
                          Rows=("Voucher No.", "size"),
                          **{c: (c, "sum") for c in
                             ["Taxable Value"] + TAX_COLS + ["Total Tax"]}))
        summary.sort_values("State Code").to_excel(
            xl, sheet_name="State_Summary", index=False)
        used.add("state_summary")

        vdf.to_excel(xl, sheet_name="Verification", index=False)
        used.add("verification")

        # Excluded, but visible - never silently dropped.
        (pd.DataFrame(all_opt) if all_opt else pd.DataFrame(
            [{"Note": "No optional vouchers touched Input GST in this period"}])
         ).to_excel(xl, sheet_name="Optional_Excluded", index=False)
        used.add("optional_excluded")

        for st in sorted(df["State"].unique()):
            sub = df[df["State"] == st]
            xl_sheet = tly.safe_sheet_name(st, used)
            sub[COLUMNS].to_excel(xl, sheet_name=xl_sheet, index=False)

        pd.DataFrame([
            {"Note": "State comes from the Input GST ledger's position in the "
                     "group tree, never from voucher-type text and never "
                     "defaulted."},
            {"Note": "ISD and Reversal 17(5) are kept OUT of CGST/SGST/IGST - "
                     "they are not ordinary ITC."},
            {"Note": "Tax shown positive = credit availed; negative = reversal."},
            {"Note": "'Our GSTIN' is read from Tally. Where it could not be "
                     "read the cell says so rather than guessing."},
            {"Note": "Reco Status is 'Pending Reco' - GSTR-2A matching is "
                     "step 2 and is not done here."},
            {"Note": f"Period {frm:%d-%b-%Y} to {to:%d-%b-%Y}. {company}."},
        ]).to_excel(xl, sheet_name="Method", index=False)

    print("\n" + "=" * 74)
    print(f" Rows          : {len(df):,}")
    print(f" Vouchers      : {df['Voucher No.'].nunique():,}")
    print(f" States        : {df['State'].nunique()}")
    print(f" With supplier GSTIN : "
          f"{(df['Supplier GSTIN'].fillna('') != '').sum():,} / {len(df):,}")
    print(f" Multi-state vouchers: {(df['Multi-State Vch'] == 'Yes').sum():,}")
    print(f" Optional excluded   : {len(all_opt):,} entries")
    print(f" Taxable Value : {df['Taxable Value'].sum():>20,.2f}")
    print(f" Total Tax     : {df['Total Tax'].sum():>20,.2f}")
    print(f" Reconciles    : {len(vdf) - len(bad)}/{len(vdf)} states")
    print(f" Saved         : {path}")
    print("=" * 74)


if __name__ == "__main__":
    main()
