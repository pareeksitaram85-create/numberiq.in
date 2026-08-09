"""
================================================================================
VENDOR GSTIN GAP LIST  -  what your team needs to fix in Tally
================================================================================
Reads the step-1 books workbook and lists every supplier whose ledger has no
valid 15-character GSTIN, ranked by the tax riding on it - so the team fixes the
ones that actually block ITC matching first, not alphabetically.

WHY THIS MATTERS
    GSTIN is the primary key for GSTR-2A matching. Measured on FY2025-26, only
    43.9% of book rows carry a valid supplier GSTIN. Every missing one forces
    the reconciliation onto weaker fallbacks (invoice number, fuzzy name), which
    is slower and needs manual verification.

It also flags PARTIAL vendors - where the same supplier name appears both with
and without a GSTIN. That is a data-entry inconsistency, usually a duplicate
ledger, and is the cheapest thing to fix.

RUN:  python vendor_gstin_gaps.py
================================================================================
"""

import glob
import os
import re
import sys

import pandas as pd

from paths import OUTPUT_DIR
GSTIN_RE = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$")
OWN_PAN = "AAECJ6910B"


def num(v):
    try:
        return round(float(str(v).replace(",", "")), 2)
    except (TypeError, ValueError):
        return 0.0


def main():
    files = glob.glob(os.path.join(OUTPUT_DIR, "GST_Entries_*.xlsx"))
    if not files:
        sys.exit(f"No GST_Entries_*.xlsx under {OUTPUT_DIR}. Run step 1 first.")
    src = max(files, key=os.path.getmtime)
    print(f"Reading {os.path.basename(src)}")

    df = pd.read_excel(src, sheet_name="Consolidated", dtype=object).fillna("")
    for c in ["Taxable Value", "Total Tax"]:
        df[c] = df[c].map(num)

    df["_g"] = df["Supplier GSTIN"].astype(str).str.strip().str.upper()
    df["_valid"] = df["_g"].map(lambda x: bool(GSTIN_RE.match(x)))
    df["_name"] = df["Supplier Name"].astype(str).str.strip()
    vt = df["Voucher Type"].astype(str).str.lower()
    df["_kind"] = "Other"
    df.loc[vt.str.contains("purchase"), "_kind"] = "Purchase"
    df.loc[vt.str.contains("journal"), "_kind"] = "Journal"
    df.loc[vt.str.contains("debit note"), "_kind"] = "Debit Note"
    df.loc[vt.str.contains("credit note"), "_kind"] = "Credit Note"

    named = df[df["_name"] != ""]
    print(f"  {len(df):,} rows | {named['_name'].nunique():,} distinct suppliers")

    # per-supplier rollup
    agg = (named.groupby("_name")
                .agg(Rows=("_name", "size"),
                     Vouchers=("Voucher No.", "nunique"),
                     With_GSTIN=("_valid", "sum"),
                     Taxable=("Taxable Value", "sum"),
                     Tax=("Total Tax", "sum"),
                     States=("State", lambda s: ", ".join(sorted(set(s))[:4])),
                     First=("Voucher Date", "min"),
                     Last=("Voucher Date", "max"))
                .reset_index().rename(columns={"_name": "Supplier Name"}))
    # a supplier's GSTIN where at least one row has it
    known = (named[named["_valid"]].groupby("_name")["_g"]
             .agg(lambda s: s.mode().iat[0] if len(s) else ""))
    agg["Known GSTIN"] = agg["Supplier Name"].map(known).fillna("")
    agg["Missing Rows"] = agg["Rows"] - agg["With_GSTIN"]

    missing = agg[(agg["With_GSTIN"] == 0)].copy()
    partial = agg[(agg["With_GSTIN"] > 0) & (agg["Missing Rows"] > 0)].copy()

    # drop our own branches from the chase list - not third-party vendors
    own_names = set(named.loc[named["_g"].str.contains(OWN_PAN, na=False),
                              "_name"].unique())
    missing["Inter-branch?"] = missing["Supplier Name"].isin(own_names).map(
        {True: "own branch", False: ""})

    missing = missing.sort_values("Tax", ascending=False)
    partial = partial.sort_values("Tax", ascending=False)

    print(f"\n  suppliers with NO GSTIN anywhere : {len(missing):,}")
    print(f"    tax riding on them             : {missing['Tax'].sum():,.2f}")
    print(f"  suppliers with PARTIAL GSTIN     : {len(partial):,}")
    print(f"    tax on their un-tagged rows    : {partial['Tax'].sum():,.2f}")

    cols = ["Supplier Name", "Known GSTIN", "Vouchers", "Rows", "Missing Rows",
            "Taxable", "Tax", "States", "First", "Last", "Inter-branch?"]
    pcols = [c for c in cols if c != "Inter-branch?"]

    # If the workbook is open in Excel the file is locked; write beside it
    # rather than losing the run.
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out = os.path.join(OUTPUT_DIR, "Vendor_GSTIN_Gaps.xlsx")
    n = 1
    while True:
        try:
            with open(out, "a+b"):
                pass
            break
        except PermissionError:
            out = os.path.join(OUTPUT_DIR, f"Vendor_GSTIN_Gaps_v{n}.xlsx")
            n += 1

    with pd.ExcelWriter(out, engine="openpyxl") as xl:
        missing[cols].to_excel(xl, sheet_name="Missing_GSTIN", index=False)
        partial[pcols].to_excel(xl, sheet_name="Partial_GSTIN", index=False)

        # what to hand the team first: top 100 by tax
        missing.head(100)[cols].to_excel(
            xl, sheet_name="Fix_First_Top100", index=False)

        pd.DataFrame([
            {"Metric": "Rows in books", "Value": len(df)},
            {"Metric": "Distinct suppliers", "Value": named["_name"].nunique()},
            {"Metric": "Suppliers with no GSTIN", "Value": len(missing)},
            {"Metric": "Tax on those suppliers", "Value": round(missing["Tax"].sum(), 2)},
            {"Metric": "Suppliers with partial GSTIN", "Value": len(partial)},
            {"Metric": "Tax on partial suppliers", "Value": round(partial["Tax"].sum(), 2)},
            {"Metric": "Rows with valid GSTIN", "Value": int(df["_valid"].sum())},
            {"Metric": "Rows without valid GSTIN", "Value": int((~df["_valid"]).sum())},
        ]).to_excel(xl, sheet_name="Summary", index=False)

        pd.DataFrame([
            {"Note": "Fix in Tally: Alter the ledger > Set/Alter GST Details > "
                     "enter the 15-digit GSTIN in 'GST Registration Number'."},
            {"Note": "Partial_GSTIN usually means a DUPLICATE LEDGER for the "
                     "same vendor - one tagged, one not. Merge them."},
            {"Note": "Rows marked 'own branch' are your own state registrations, "
                     "not vendors to chase."},
            {"Note": "Ranked by tax, not alphabetically - fixing the top rows "
                     "recovers the most matchable ITC per unit of effort."},
        ]).to_excel(xl, sheet_name="How_To_Fix", index=False)

    print(f"\n  Saved: {out}")

    print("\n  TOP 15 BY TAX AT STAKE")
    print(f"  {'supplier':<46}{'vch':>6}{'tax':>16}")
    for _, r in missing.head(15).iterrows():
        print(f"  {str(r['Supplier Name'])[:44]:<46}{r['Vouchers']:>6,}"
              f"{r['Tax']:>16,.2f}")


if __name__ == "__main__":
    main()
