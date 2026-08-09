"""
================================================================================
COMBINE THE TWO YEARLY 2A RECONCILIATIONS INTO ONE WORKBOOK
================================================================================
The reconciliation runs one year at a time (books and 2A are filed per year, and
keeping the runs separate stops one year's rows being consumed by the other).
This merges the two outputs into a single workbook for review, tagging every row
with the year it came from.

Nothing is recomputed here - the numbers are exactly what each yearly run
produced. This is presentation only, so the combined file cannot disagree with
the yearly ones.

RUN:  python combine_reco.py
================================================================================
"""

import glob
import os

import pandas as pd

from paths import OUTPUT_DIR

RECO_DIR = OUTPUT_DIR

# sheet -> whether it is per-book-row (gets an FY tag) or a control block
DETAIL_SHEETS = [
    "All_Detail",
    "At_Risk_In_Books_Not_In_2A",
    "In_2A_Only",
    "RCM_In_2A_Not_ITC",
    "Timing_Other_Year",
    "Inter_Branch_Matched",
    "Not_In_2A_ISD_Reversal",
    "Superseded_By_Amendment",
    "ISD_2A_Invoices",
    "Summary",
    "Overview",
    "ISD_Control",
]


def find(name):
    """Newest copy of a yearly workbook, wherever it currently sits."""
    hits = glob.glob(os.path.join(RECO_DIR, name))
    return max(hits, key=os.path.getmtime) if hits else ""


def load(path, sheet):
    try:
        return pd.read_excel(path, sheet_name=sheet)
    except Exception:
        return pd.DataFrame()


def main():
    years = {}
    for lbl, pat in (("FY2025-26", "GST_2A_Reco_FY2025-26*.xlsx"),
                     ("FY2026-27", "GST_2A_Reco_FY2026-27*.xlsx")):
        p = find(pat)
        if p:
            years[lbl] = p
            print(f"  {lbl}: {os.path.basename(p)}")
        else:
            print(f"  {lbl}: NOT FOUND - run tally_2a_reco.py first")
    if not years:
        raise SystemExit("No yearly reconciliations found.")

    os.makedirs(RECO_DIR, exist_ok=True)
    out = os.path.join(RECO_DIR, "GST_2A_Reco_COMBINED.xlsx")
    n = 1
    while True:
        try:
            open(out, "a+b").close()
            break
        except PermissionError:
            out = os.path.join(RECO_DIR, f"GST_2A_Reco_COMBINED_v{n}.xlsx")
            n += 1

    with pd.ExcelWriter(out, engine="openpyxl") as xl:
        # --- headline, both years plus total ---------------------------------
        heads = []
        for lbl, p in years.items():
            ov = load(p, "Overview")
            if ov.empty:
                continue
            ov = ov.copy()
            ov.insert(0, "Year", lbl)
            heads.append(ov)
        if heads:
            allov = pd.concat(heads, ignore_index=True)
            allov.to_excel(xl, sheet_name="Overview_By_Year", index=False)

            # combined totals per line item
            tot = (allov.groupby(["#", "Item"], as_index=False)
                        .agg(Count=("Count", lambda s: pd.to_numeric(
                             s, errors="coerce").sum()),
                             Tax=("Tax", lambda s: pd.to_numeric(
                                 s, errors="coerce").sum())))
            tot = tot.sort_values("#", key=lambda s: s.astype(str))
            tot.to_excel(xl, sheet_name="Overview_TOTAL", index=False)

        # --- every detail sheet, stacked with a Year column -----------------
        for sheet in DETAIL_SHEETS:
            if sheet in ("Overview",):
                continue
            parts = []
            for lbl, p in years.items():
                d = load(p, sheet)
                if d.empty:
                    continue
                d = d.copy()
                d.insert(0, "Year", lbl)
                parts.append(d)
            if not parts:
                continue
            comb = pd.concat(parts, ignore_index=True, sort=False)
            comb.to_excel(xl, sheet_name=sheet[:31], index=False)
            print(f"    {sheet:<32} {len(comb):>7,} rows")

        # --- who to chase, across both years --------------------------------
        def top(sheet, keycols, label):
            parts = []
            for lbl, p in years.items():
                d = load(p, sheet)
                if d.empty:
                    continue
                d = d.copy()
                d["Year"] = lbl
                parts.append(d)
            if not parts:
                return
            c = pd.concat(parts, ignore_index=True, sort=False)
            keys = [k for k in keycols if k in c.columns]
            if not keys or "Total Tax" not in c.columns:
                return
            c["Total Tax"] = pd.to_numeric(c["Total Tax"], errors="coerce").fillna(0)
            g = (c.groupby(keys, as_index=False)
                   .agg(Rows=(keys[0], "size"), Tax=("Total Tax", "sum"))
                   .sort_values("Tax", ascending=False))
            g.to_excel(xl, sheet_name=label[:31], index=False)

        top("At_Risk_In_Books_Not_In_2A", ["Supplier Name", "Supplier GSTIN"],
            "Chase_Suppliers_At_Risk")
        top("In_2A_Only", ["Why unmatched", "Supplier Name", "Supplier GSTIN"],
            "Review_In_2A_Only")

    print(f"\n  Saved: {out}")


if __name__ == "__main__":
    main()
