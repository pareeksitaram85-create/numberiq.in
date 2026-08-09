"""
================================================================================
TALLY PRIME -> EXCEL : STATE-WISE INPUT GST  (balances method)
================================================================================
Reports every ledger under

    Current Liabilities > Duties & Taxes > GST & TDS > GST > GST Input

state by state, with opening, month-by-month movement and closing.

WHY BALANCES AND NOT VOUCHERS
-----------------------------
Pulling every voucher and filtering to Input GST works, but it makes Tally
materialise the whole company: measured here, ~65k entries/month, and Tally
climbed to 10.3 GB and stopped responding partway through a financial year.
This script never asks for a voucher. It asks only for ledger masters, one
request per month boundary - about a second each.

THE ONE TRAP THAT MAKES THIS WORK
---------------------------------
Tally's two balance fields do NOT behave the same way:

  OPENINGBALANCE  honours SVFROMDATE at any date.          RELIABLE
  CLOSINGBALANCE  does NOT honour SVTODATE for arbitrary
                  sub-periods - for 01..30-Apr-2025 it
                  returned the balance at the END OF DATA. UNRELIABLE

Verified on this company: Maharashtra Input CGST 9% reported closing
-144,062,179.38 for Apr-2025, Jul-2026 AND FY2026-27 - the same number three
times, because that is simply the last balance in the books.

So closing is never read from CLOSINGBALANCE. Instead:

    closing at date Y  ==  OPENINGBALANCE at (Y + 1 day)

Cross-check that holds in the data: opening at 01-Apr-2026 (-134,688,851.50)
equals the FY2025-26 closing at 31-Mar-2026.

LIMITATION
----------
Balances give NET movement per period, not separate Debit and Credit totals.
For an Input GST ledger the net is the meaningful figure (credit availed less
reversals). If you need the Dr/Cr split, that needs a voucher pull, which must
be done one month at a time.

RUN:  python tally_input_gst_statewise.py
================================================================================
"""

import collections
import datetime as dt
import os
import sys
import time

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tally_ledger_export as tly          # noqa: E402
import tally_group_export as tge           # noqa: E402

ROOT_GROUP = "GST Input"
ROOT_SENTINELS = {"", "Primary"}
OUTPUT_DIR = tly.OUTPUT_DIR


def month_starts(frm, to):
    """Every month boundary from frm to to, plus the day AFTER to.

    The trailing boundary is what gives us the closing balance, since
    closing at `to` is the opening at `to + 1 day`.
    """
    out, cur = [], frm.replace(day=1)
    while cur <= to:
        out.append(cur)
        cur = dt.date(cur.year + (cur.month == 12), (cur.month % 12) + 1, 1)
    out.append(to + dt.timedelta(days=1))
    return out


def build_tree(company):
    parent = {}
    for g in tge.collection("G", "Group", "PARENT", company).iter("GROUP"):
        n = (g.get("NAME") or "").strip()
        if n:
            parent[n] = tly.child_text(g, "PARENT").strip()
    kids = collections.defaultdict(list)
    for g, p in parent.items():
        kids[p].append(g)
    return parent, kids


def descendants(group, kids):
    out, stack = [], [group]
    while stack:
        cur = stack.pop()
        out.append(cur)
        stack.extend(kids.get(cur, []))
    return out


def state_of(group, parent, state_groups):
    cur, seen = group, set()
    while cur and cur not in seen and cur not in ROOT_SENTINELS:
        seen.add(cur)
        if cur in state_groups:
            return cur
        cur = parent.get(cur, "")
    return "(unassigned)"


def balances_at(company, when, scope, attempts=3):
    """OPENINGBALANCE for every in-scope ledger as at `when`.

    Retried: a single dropped reply should not lose a whole run. An EMPTY
    result is treated as failure too - Tally answers with a well-formed but
    empty collection when it is busy, and silently accepting that would put
    a zero row into the report instead of the real balance.
    """
    last = None
    for i in range(attempts):
        try:
            root = tge.collection("L", "Ledger", "PARENT, OPENINGBALANCE",
                                  company, when, when)
            out = {}
            for l in root.iter("LEDGER"):
                n = (l.get("NAME") or "").strip()
                grp = tly.child_text(l, "PARENT").strip()
                if n and grp in scope:
                    out[n] = (grp,
                              tly.to_float(tly.child_text(l, "OPENINGBALANCE")))
            if out:
                return out
            last = "Tally returned an empty ledger collection"
        except SystemExit:
            raise
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        if i < attempts - 1:
            print(f"      retry {i + 1}/{attempts - 1} for {when:%d-%b-%Y} "
                  f"({last})", flush=True)
            time.sleep(5)
    sys.exit(f"\nFAILED reading balances at {when:%d-%b-%Y}: {last}\n"
             "  Tally stopped answering. Restart Tally, get to 'Gateway of "
             "Tally', and re-run.")


def preflight():
    """Fail with something actionable, never a stack trace.

    Every failure mode hit while building this script is checked here:
    dead port, a stray instance holding 9000 with no company, and the
    License modal that makes Tally accept connections but never reply.
    """
    print("Checking Tally ...", flush=True)
    try:
        loaded = tly.loaded_companies()
    except SystemExit:
        raise
    except Exception as exc:
        sys.exit(f"Cannot reach Tally on {tly.TALLY_URL} ({exc}).\n"
                 "  -> Is Tally open? Title bar must read "
                 "'TallyPrime Edit Log:9000'.")

    if not loaded:
        sys.exit(
            "Tally answered but NO COMPANY is loaded.\n"
            "  Common causes, in the order they actually happen:\n"
            "   1. A second Tally instance owns port 9000 with nothing "
            "loaded - it replies with 0 bytes. Close the small one.\n"
            "   2. A License modal is up ('Unable to access the configured "
            "Tally Gateway Server') - dismiss it.\n"
            "   3. Tally is on Select Company - load the company and press "
            "Esc to reach 'Gateway of Tally'.\n"
            "  The title bar must end in ':9000' or the XML server is off "
            "(F1 > Settings > Connectivity, then restart Tally).")
    return loaded[0]


def main():
    print("=" * 72)
    print(" STATE-WISE INPUT GST  (balances method - no voucher pulls)")
    print("=" * 72)

    company = preflight()
    print(f"Company : {company}")

    frm, to, tag = tge.choose_period()

    parent, kids = build_tree(company)
    if ROOT_GROUP not in parent:
        sys.exit(f"Group {ROOT_GROUP!r} not found.")
    state_groups = set(kids.get(ROOT_GROUP, []))
    scope = set(descendants(ROOT_GROUP, kids))
    print(f"\n{len(state_groups)} state groups, {len(scope)} groups in scope")

    bounds = month_starts(frm, to)
    print(f"\nReading balances at {len(bounds)} month boundaries ...")
    series, groups = {}, {}
    for i, when in enumerate(bounds):
        got = balances_at(company, when, scope)
        for name, (grp, bal) in got.items():
            series.setdefault(name, {})[when] = bal
            groups[name] = grp
        print(f"   {when:%d-%b-%Y}: {len(got):>4} ledgers", flush=True)

    if not series:
        sys.exit("No ledgers found under GST Input.")

    # --- assemble ----------------------------------------------------------
    rows = []
    for name, by_date in series.items():
        grp = groups[name]
        st = state_of(grp, parent, state_groups)
        opening = by_date.get(bounds[0], 0.0)
        closing = by_date.get(bounds[-1], 0.0)
        rec = {
            "State Code": st.split(" - ")[0].strip() if " - " in st else "",
            "State Group": st,
            "Group": grp,
            "Ledger": name,
            "Opening": opening,
            "Closing": closing,
            "Net Movement": closing - opening,
        }
        for a, b in zip(bounds[:-1], bounds[1:]):
            rec[f"{a:%b-%y}"] = by_date.get(b, 0.0) - by_date.get(a, 0.0)
        rows.append(rec)

    df = pd.DataFrame(rows).sort_values(["State Code", "Ledger"])
    month_cols = [f"{a:%b-%y}" for a, b in zip(bounds[:-1], bounds[1:])]

    # internal consistency: monthly movements must sum to net movement
    resid = (df[month_cols].sum(axis=1) - df["Net Movement"]).abs()
    print(f"\nconsistency: monthly movements sum to net movement for "
          f"{(resid <= 0.01).sum():,}/{len(df):,} ledgers")

    # --- workbook ----------------------------------------------------------
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(
        OUTPUT_DIR,
        f"InputGST_StateWise_{tag}_{tly.safe_file_part(company)}.xlsx")

    used = set()
    with pd.ExcelWriter(path, engine="openpyxl") as xl:
        summary = (df.groupby(["State Code", "State Group"], as_index=False)
                     .agg({"Ledger": "nunique", "Opening": "sum",
                           "Net Movement": "sum", "Closing": "sum",
                           **{m: "sum" for m in month_cols}})
                     .rename(columns={"Ledger": "Ledgers"}))
        summary.sort_values("State Code").to_excel(
            xl, sheet_name="State_Summary", index=False)
        used.add("state_summary")

        df.to_excel(xl, sheet_name="Ledger_Detail", index=False)
        used.add("ledger_detail")

        for st in sorted(df["State Group"].unique()):
            sub = df[df["State Group"] == st]
            sheet = tly.safe_sheet_name(st, used)
            sub.to_excel(xl, sheet_name=sheet, index=False)

        pd.DataFrame([
            {"Note": "Opening/closing come from Tally OPENINGBALANCE at month "
                     "boundaries. CLOSINGBALANCE is NOT used - it ignores "
                     "SVTODATE for sub-periods and returns the end-of-data "
                     "balance."},
            {"Note": "Closing at date Y is read as the opening balance at "
                     "Y+1 day."},
            {"Note": "Figures are NET movement per month. Balances cannot "
                     "give a separate Debit/Credit split."},
            {"Note": f"Period {frm:%d-%b-%Y} to {to:%d-%b-%Y}. "
                     f"Company: {company}."},
        ]).to_excel(xl, sheet_name="Method", index=False)

    print("\n" + "=" * 72)
    print(f" States      : {summary.shape[0]}")
    print(f" Ledgers     : {len(df):,}")
    print(f" Opening     : {df['Opening'].sum():>20,.2f}")
    print(f" Net movement: {df['Net Movement'].sum():>20,.2f}")
    print(f" Closing     : {df['Closing'].sum():>20,.2f}")
    print(f" Saved       : {path}")
    print("=" * 72)
    print("\nState summary:")
    print(summary[["State Code", "State Group", "Ledgers", "Opening",
                   "Net Movement", "Closing"]].to_string(index=False))


if __name__ == "__main__":
    main()
