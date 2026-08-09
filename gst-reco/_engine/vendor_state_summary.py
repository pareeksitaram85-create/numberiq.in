"""
================================================================================
VENDOR-WISE ITC COMPARISON  -  BY PERIOD, BY STATE GSTIN, AND ONE-PAGE ROLL-UP
================================================================================
Every sheet states the period it covers. The earlier version silently pooled
FY2025-26 and FY2026-27, which made the figures unusable for filing - a number
you cannot attach to a return period is not a working paper.

WHAT IS PRODUCED
  00_READ_ME              what each sheet covers and the period it is for
  01_ONE_PAGE_ALL_GSTIN   one row per vendor, ALL states, both periods side by
                          side plus total - the single-page picture
  02/03  State_Summary    per state GSTIN, one sheet per period
  04     State_Summary_TOTAL
  05/06  Vendors by period (vendor x state)
  07     Vendors TOTAL
  <state sheets>          one per state GSTIN, carrying a Period column
  CHK_*                   duplicates, rate plausibility, s.16(4), s.17(5)
  Unbooked_Gross_vs_Net   unbooked invoices vs unbooked CNs, per vendor

VENDOR IS KEYED ON PAN, NOT GSTIN.
A vendor billing 18 states holds 18 GSTINs but one Tally ledger. Keying on
GSTIN would split them into fragments the books side can never line up against.
PAN is stable across registrations - GSTIN[2:12] == PAN held in 27,621 of
27,645 rows where both were present. Every GSTIN is still listed on the row.

TAX HEADS ARE REPORTED SEPARATELY - a blended total can tie while IGST has been
booked as CGST+SGST.

RUN:  python vendor_state_summary.py
================================================================================
"""

import datetime as dt
import glob
import os
import re

import pandas as pd

from paths import OUTPUT_DIR

OUT_DIR = OUTPUT_DIR

PERIODS = {"FY2025-26": "FY 2025-26 (01-Apr-2025 to 31-Mar-2026)",
           "FY2026-27": "FY 2026-27 (01-Apr-2026 to 30-Jun-2026)"}
HEADS = ["IGST", "CGST", "SGST", "CESS"]
BOOK_HEADS = {"IGST": "IGST", "CGST": "CGST", "SGST": "SGST / UTGST",
              "CESS": "CESS"}
S16_4 = {"FY2025-26": dt.date(2026, 11, 30), "FY2026-27": dt.date(2027, 11, 30)}

BLOCKED = {
    "motor vehicle / conveyance": r"\b(?:car|motor|vehicle|cab|taxi|bike|scooter)\b",
    "food & beverage / catering": r"\b(?:food|beverage|catering|restaurant|canteen|snack)\b",
    "club / health / fitness": r"\b(?:club|gym|fitness|membership)\b",
    "works contract / construction": r"\b(?:works\s*contract|construction|civil\s*work)\b",
    "CSR": r"\bcsr\b|corporate\s+social",
    "gift / free sample": r"\b(?:gift|free\s*sample|donation)\b",
}


def num(s):
    return pd.to_numeric(s, errors="coerce").fillna(0)


def find(pat):
    hits = glob.glob(os.path.join(OUT_DIR, pat))
    return max(hits, key=os.path.getmtime) if hits else ""


def pan_from(g):
    g = str(g or "").strip().upper()
    return g[2:12] if re.fullmatch(r"\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z][A-Z\d]", g) else ""


def build():
    years, B_, O_ = {}, [], []
    for lbl, pat in (("FY2025-26", "GST_2A_Reco_FY2025-26*.xlsx"),
                     ("FY2026-27", "GST_2A_Reco_FY2026-27*.xlsx")):
        p = find(pat)
        if not p:
            print(f"  {lbl}: NOT FOUND")
            continue
        years[lbl] = p
        print(f"  {lbl}: {os.path.basename(p)}")
        d = pd.read_excel(p, sheet_name="All_Detail"); d["Period"] = lbl
        o = pd.read_excel(p, sheet_name="In_2A_Only"); o["Period"] = lbl
        B_.append(d); O_.append(o)
    if not years:
        raise SystemExit("No reconciliation workbooks found.")

    B = pd.concat(B_, ignore_index=True, sort=False)
    O = pd.concat(O_, ignore_index=True, sort=False)

    B["PAN"] = [str(p).strip().upper() if str(p).strip() else pan_from(g)
                for p, g in zip(B.get("Supplier PAN", ""), B.get("Supplier GSTIN", ""))]
    B["Vendor"] = B["Supplier Name"].astype(str).str.strip()
    B["StateKey"] = B["State"].astype(str)
    O["PAN"] = O["Supplier GSTIN"].map(pan_from)
    O["Vendor"] = O["Supplier Name"].astype(str).str.strip()
    st = (B[["Our GSTIN", "StateKey"]].dropna().drop_duplicates()
          .set_index("Our GSTIN")["StateKey"].to_dict())
    O["StateKey"] = O["Our GSTIN"].map(st).fillna(O["Our GSTIN"].astype(str))

    matched = B[B["Match Tier"].astype(str).str.strip() != ""]

    # 2A side = matched rows' 2A figures + rows only in 2A
    m = matched.copy(); m["_t"] = num(m["2A Tax"])
    o = O.copy(); o["_t"] = num(o["Total Tax"])
    twoa = pd.concat([m[["Period", "StateKey", "PAN", "Vendor", "_t"]],
                      o[["Period", "StateKey", "PAN", "Vendor", "_t"]]],
                     ignore_index=True)
    twoa["2A Inv ITC"] = twoa["_t"].clip(lower=0)
    twoa["2A CN ITC"] = twoa["_t"].clip(upper=0)
    T = twoa.groupby(["Period", "StateKey", "PAN"], as_index=False).agg(
        **{"2A Docs": ("_t", "size"), "2A Inv ITC": ("2A Inv ITC", "sum"),
           "2A CN ITC": ("2A CN ITC", "sum"), "2A Net ITC": ("_t", "sum")})

    bk = B.copy(); bk["_t"] = num(bk["Total Tax"])
    bk["Bk Inv ITC"] = bk["_t"].clip(lower=0)
    bk["Bk CN ITC"] = bk["_t"].clip(upper=0)
    agg = {"Bk Docs": ("_t", "size"), "Bk Inv ITC": ("Bk Inv ITC", "sum"),
           "Bk CN ITC": ("Bk CN ITC", "sum"), "Bk Net ITC": ("_t", "sum")}
    for h in HEADS:
        c = BOOK_HEADS[h]
        if c in bk.columns:
            bk[f"Bk {h}"] = num(bk[c]); agg[f"Bk {h}"] = (f"Bk {h}", "sum")
    K = bk.groupby(["Period", "StateKey", "PAN"], as_index=False).agg(**agg)

    nm = pd.concat([bk[["PAN", "Vendor"]], twoa[["PAN", "Vendor"]]])
    nm["PAN"] = nm["PAN"].astype(str).str.strip().str.upper()
    nm["Vendor"] = nm["Vendor"].astype(str).str.strip()
    names = (nm[~nm["Vendor"].isin(["", "nan", "None"])]
             .groupby("PAN", as_index=False).first())
    gpair = pd.concat([B[["PAN", "Supplier GSTIN"]], O[["PAN", "Supplier GSTIN"]]])
    gpair["PAN"] = gpair["PAN"].astype(str).str.strip().str.upper()
    gpair["Supplier GSTIN"] = gpair["Supplier GSTIN"].astype(str).str.strip().str.upper()
    gpair = gpair[~gpair["Supplier GSTIN"].isin(["", "NAN", "NONE"])]
    gst = (gpair.groupby("PAN")["Supplier GSTIN"]
           .agg(lambda s: ", ".join(sorted({str(x) for x in s})[:8]))
           .reset_index().rename(columns={"Supplier GSTIN": "Vendor GSTINs"}))

    V = T.merge(K, on=["Period", "StateKey", "PAN"], how="outer").fillna(0)
    V = V.merge(names, on="PAN", how="left").merge(gst, on="PAN", how="left")
    V["Diff (2A - Books)"] = (V["2A Net ITC"] - V["Bk Net ITC"]).round(2)
    V["Abs Diff"] = V["Diff (2A - Books)"].abs()
    V["Status"] = "Both - agrees"
    V.loc[V["Abs Diff"] > 1, "Status"] = "Both - DIFFERENCE"
    V.loc[V["Bk Docs"] == 0, "Status"] = "Only in 2A - not booked"
    V.loc[V["2A Docs"] == 0, "Status"] = "Only in books - MISSING IN 2A"
    V["Period Covered"] = V["Period"].map(PERIODS)
    return B, O, V, years


def main():
    B, O, V, years = build()
    cols = (["Period", "Period Covered", "StateKey", "Vendor", "PAN",
             "Vendor GSTINs", "Status", "2A Docs", "2A Inv ITC", "2A CN ITC",
             "2A Net ITC", "Bk Docs", "Bk Inv ITC", "Bk CN ITC", "Bk Net ITC"]
            + [f"Bk {h}" for h in HEADS if f"Bk {h}" in V.columns]
            + ["Diff (2A - Books)", "Abs Diff"])
    cols = [c for c in cols if c in V.columns]

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, "GST_Vendor_Summary_ByPeriod.xlsx")
    n = 1
    while True:
        try:
            open(out, "a+b").close(); break
        except PermissionError:
            out = os.path.join(OUT_DIR, f"GST_Vendor_Summary_ByPeriod_v{n}.xlsx"); n += 1

    with pd.ExcelWriter(out, engine="openpyxl") as xl:
        # ---------------- 00 READ ME ----------------
        pd.DataFrame([
            {"Sheet": "01_ONE_PAGE_ALL_GSTIN",
             "Period": "BOTH, shown side by side",
             "Covers": "One row per vendor across ALL 18 state GSTINs. "
                       "FY25-26, FY26-27 and TOTAL columns. Sorted by total "
                       "difference, largest first."},
            {"Sheet": "02_State_Summary_FY2025-26", "Period": PERIODS["FY2025-26"],
             "Covers": "Per state GSTIN totals"},
            {"Sheet": "03_State_Summary_FY2026-27", "Period": PERIODS["FY2026-27"],
             "Covers": "Per state GSTIN totals"},
            {"Sheet": "04_State_Summary_TOTAL", "Period": "BOTH combined",
             "Covers": "Per state GSTIN totals, both periods added"},
            {"Sheet": "05_Vendors_FY2025-26", "Period": PERIODS["FY2025-26"],
             "Covers": "Vendor x state detail"},
            {"Sheet": "06_Vendors_FY2026-27", "Period": PERIODS["FY2026-27"],
             "Covers": "Vendor x state detail"},
            {"Sheet": "07_Vendors_TOTAL", "Period": "BOTH combined",
             "Covers": "Vendor x state detail, both periods added"},
            {"Sheet": "<state code> sheets", "Period": "BOTH - filter the Period column",
             "Covers": "One sheet per state GSTIN"},
            {"Sheet": "Unbooked_Gross_vs_Net", "Period": "BOTH",
             "Covers": "Unbooked invoices vs unbooked credit notes per vendor. "
                       "No unbooked CN references an unbooked invoice, so the "
                       "net offsets UNRELATED documents - book each CN against "
                       "its own original invoice."},
            {"Sheet": "CHK_*", "Period": "BOTH",
             "Covers": "Duplicates, rate plausibility, s.16(4) deadline, "
                       "s.17(5) blocked-credit flags"},
            {"Sheet": "NOTE", "Period": "",
             "Covers": "Vendor keyed on PAN so multi-state vendors stay as one "
                       "vendor. Tax heads shown separately. 180-day rule NOT "
                       "included - needs bill-wise payment data from Tally."},
        ]).to_excel(xl, sheet_name="00_READ_ME", index=False)

        # ---------------- 01 ONE PAGE ----------------
        piv = V.pivot_table(index=["Vendor", "PAN", "Vendor GSTINs"],
                            columns="Period",
                            values=["2A Net ITC", "Bk Net ITC", "Diff (2A - Books)"],
                            aggfunc="sum", fill_value=0)
        piv.columns = [f"{b} {a}" for a, b in piv.columns]
        piv = piv.reset_index()
        for c in ["2A Net ITC", "Bk Net ITC", "Diff (2A - Books)"]:
            parts = [f"{y} {c}" for y in PERIODS if f"{y} {c}" in piv.columns]
            piv[f"TOTAL {c}"] = piv[parts].sum(axis=1) if parts else 0
        stx = (V.groupby("PAN")["StateKey"]
                 .agg(lambda s: len(set(s))).reset_index(name="States"))
        piv = piv.merge(stx, on="PAN", how="left")
        piv["Abs Total Diff"] = piv["TOTAL Diff (2A - Books)"].abs()
        piv["Action"] = "Agrees"
        piv.loc[piv["Abs Total Diff"] > 1, "Action"] = "Review difference"
        piv.loc[piv["TOTAL Bk Net ITC"].abs() < 1, "Action"] = "Only in 2A - book it"
        piv.loc[piv["TOTAL 2A Net ITC"].abs() < 1, "Action"] = "Only in books - AT RISK"
        order = (["Vendor", "PAN", "Vendor GSTINs", "States", "Action"]
                 + [f"{y} {c}" for y in PERIODS
                    for c in ["2A Net ITC", "Bk Net ITC", "Diff (2A - Books)"]
                    if f"{y} {c}" in piv.columns]
                 + ["TOTAL 2A Net ITC", "TOTAL Bk Net ITC",
                    "TOTAL Diff (2A - Books)", "Abs Total Diff"])
        piv[[c for c in order if c in piv.columns]].sort_values(
            "Abs Total Diff", ascending=False).to_excel(
            xl, sheet_name="01_ONE_PAGE_ALL_GSTIN", index=False)

        # ---------------- state summaries ----------------
        def state_sum(df, sheet):
            g = (df.groupby("StateKey", as_index=False)
                   .agg(Vendors=("PAN", "nunique"),
                        **{c: (c, "sum") for c in
                           ["2A Net ITC", "Bk Net ITC", "Diff (2A - Books)"]}))
            g["Abs Diff"] = g["Diff (2A - Books)"].abs()
            g.sort_values("Abs Diff", ascending=False).to_excel(
                xl, sheet_name=sheet, index=False)

        for i, (y, lbl) in enumerate(PERIODS.items(), start=2):
            sub = V[V["Period"] == y]
            if not sub.empty:
                state_sum(sub, f"0{i}_State_Summary_{y}")
        state_sum(V, "04_State_Summary_TOTAL")

        for i, y in enumerate(PERIODS, start=5):
            sub = V[V["Period"] == y]
            if not sub.empty:
                sub[cols].sort_values("Abs Diff", ascending=False).to_excel(
                    xl, sheet_name=f"0{i}_Vendors_{y}", index=False)
        tot = (V.groupby(["StateKey", "Vendor", "PAN", "Vendor GSTINs"],
                         as_index=False)
                 .agg({c: "sum" for c in V.columns
                       if c.startswith(("2A ", "Bk ")) or c == "Diff (2A - Books)"}))
        tot["Abs Diff"] = tot["Diff (2A - Books)"].abs()
        tot.sort_values("Abs Diff", ascending=False).to_excel(
            xl, sheet_name="07_Vendors_TOTAL", index=False)

        used = {"00_read_me", "01_one_page_all_gstin", "04_state_summary_total",
                "07_vendors_total"}
        for s in sorted(V["StateKey"].dropna().unique()):
            nm = re.sub(r'[\\/*?:\[\]]', "-", str(s))[:31]
            if nm.lower() in used:
                nm = nm[:28] + "~1"
            used.add(nm.lower())
            V[V["StateKey"] == s][cols].sort_values(
                ["Period", "Abs Diff"], ascending=[True, False]).to_excel(
                xl, sheet_name=nm, index=False)

        # ---------------- unbooked gross vs net ----------------
        Ox = O.copy()
        Ox["isCN"] = Ox["Doc Type"].astype(str).str.contains("CREDIT", na=False)
        Ox["Total Tax"] = num(Ox["Total Tax"])
        gn = (Ox.groupby(["Period", "StateKey", "Vendor", "Supplier GSTIN"],
                         as_index=False)
                .agg(Inv_Count=("isCN", lambda s: int((~s).sum())),
                     Inv_ITC=("Total Tax", lambda s: s[s > 0].sum()),
                     CN_Count=("isCN", lambda s: int(s.sum())),
                     CN_ITC=("Total Tax", lambda s: s[s < 0].sum())))
        gn["NET_Unbooked_ITC"] = gn["Inv_ITC"] + gn["CN_ITC"]
        gn["Type"] = "Invoices only"
        gn.loc[(gn["Inv_Count"] > 0) & (gn["CN_Count"] > 0), "Type"] = \
            "Both invoice + CN - net applies"
        gn.loc[gn["Inv_Count"] == 0, "Type"] = "CN only - pure liability"
        gn.sort_values("NET_Unbooked_ITC", ascending=False).to_excel(
            xl, sheet_name="Unbooked_Gross_vs_Net", index=False)

        # ---------------- checks ----------------
        db = (B[B["Supplier Inv No"].astype(str).str.strip() != ""]
              .groupby(["Period", "PAN", "Supplier Inv No"]).size()
              .reset_index(name="times"))
        db[db["times"] > 1].sort_values("times", ascending=False).to_excel(
            xl, sheet_name="CHK_Duplicates_Books", index=False)
        da = O.groupby(["Period", "Supplier GSTIN", "Invoice No"]).size() \
              .reset_index(name="times")
        da[da["times"] > 1].sort_values("times", ascending=False).to_excel(
            xl, sheet_name="CHK_Duplicates_2A", index=False)

        rate = pd.DataFrame()
        if "Rates" in O.columns:
            od = pd.to_datetime(O.get("Invoice Date"), errors="coerce")
            rate = O[(od >= pd.Timestamp(2025, 9, 22))
                     & O["Rates"].astype(str).str.contains("12%|28%", na=False)]
        (rate if not rate.empty else pd.DataFrame(
            [{"Result": "No 12%/28% lines dated 22-Sep-2025 or later"}])
         ).to_excel(xl, sheet_name="CHK_Rate_Plausibility", index=False)

        today = dt.date.today()
        s = O.copy()
        s["Availment deadline"] = s["Period"].map(S16_4)
        s["Days left"] = s["Availment deadline"].map(
            lambda d: (d - today).days if pd.notna(d) else None)
        s.sort_values("Days left").to_excel(
            xl, sheet_name="CHK_s16(4)_Deadline", index=False)

        txt = (B.get("Narration", "").astype(str) + " "
               + B.get("Voucher Type", "").astype(str)).str.lower()
        bl = []
        for label, pat in BLOCKED.items():
            mask = txt.str.contains(pat, na=False, regex=True)
            if mask.any():
                x = B[mask].copy(); x["s.17(5) flag"] = label; bl.append(x)
        (pd.concat(bl, ignore_index=True) if bl else pd.DataFrame(
            [{"Result": "no s.17(5) keywords found"}])).to_excel(
            xl, sheet_name="CHK_s17(5)_Blocked", index=False)

    print(f"\n  vendor x state x period rows : {len(V):,}")
    print(f"  one-page vendors             : {piv.shape[0]:,}")
    print(f"  Saved: {out}")
    print("\n  Top 8 vendors by TOTAL difference (all states, both periods):")
    for _, r in piv.sort_values("Abs Total Diff", ascending=False).head(8).iterrows():
        print(f"    {str(r['Vendor'])[:34]:<36}{r['TOTAL Diff (2A - Books)']:>14,.2f}"
              f"   {r['Action']}")


if __name__ == "__main__":
    main()
