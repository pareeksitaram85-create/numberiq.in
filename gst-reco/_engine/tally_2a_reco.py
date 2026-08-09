"""
================================================================================
GSTR-2A RECONCILIATION  (step 2)  -  books vs portal, GSTIN-wise
================================================================================
Matches the book entries from step 1 (tally_gst_entries.py) against the GSTR-2A
export, per GSTIN, and reports matched / in-books-only / in-2A-only.

NO TALLY CONNECTION NEEDED - pure file work.

--------------------------------------------------------------------------------
DECISIONS BAKED IN (agreed with the user)
--------------------------------------------------------------------------------
1. ONE YEAR PER RUN. Two separate workbooks, not a pooled match.
   Mitigation: an unmatched book row is still looked up in the OTHER year's 2A.
   If found there it is labelled "timing - in adjacent year 2A" instead of
   "not in 2A". The lookup only LABELS; it never consumes a 2A row, so the two
   runs stay independent and neither double-counts.

2. AMENDMENTS SUPERSEDE ORIGINALS. B2BA/CDNA rows replace the B2B/CDN row they
   amend (linked on Original Document Number + supplier GSTIN). The superseded
   original is removed from the match pool and written to its own sheet.
   Without this the amended invoice would be counted twice.

3. 3B FILING STATUS IS NOT USED AT ALL. No flag, no separate sheet, no effect
   on the match. The portal's value proved unreliable here - QRMP (quarterly)
   suppliers report "Not Filed" for the first two months of every quarter, and
   the ISD sheet carries no 3B column - and acting on it wrongly put 1.37 crore
   into "at risk". The raw portal value stays in the "2A 3B Status" column as
   source data; nothing is derived from it.

4. THE REAL ITC RISK IS "IN BOOKS, NOT IN 2A". Under s.16(2)(aa) credit can
   only be taken on an invoice reported by the supplier, so a book entry with
   no 2A counterpart is the exposure. That is the At_Risk_In_Books_Not_In_2A
   sheet. Its mirror, In_2A_Only, is unclaimed credit - an opportunity.

--------------------------------------------------------------------------------
MATCH TIERS  (each book row and each 2A row consumed at most once)
--------------------------------------------------------------------------------
 1   supplier GSTIN + invoice no                 Matched
 2   as tier 1 but tax differs                   Matched - amount differs
 2P  supplier PAN + invoice no                   Matched on PAN (multi-state
                                                 vendor billing from another
                                                 state's GSTIN on one ledger)
 3   invoice no + tax, no GSTIN in books         Matched - GSTIN missing in books
 4   fuzzy supplier name + invoice no + tax      Probable - verify
 5   GSTIN + date + taxable value                Probable - invoice no differs

Invoice numbers are normalised per segment (punctuation and leading zeros), so
JDC/25-26/03 == JDC-25-26-3 while JDC/25-26/03 != JDC/25-26/30.

Dates come from the SUPPLIER's invoice date where available, never our booking
date - 2A reports the supplier's date and the two differ across period ends.

RUN:
    python tally_2a_reco.py                  (prompts)
    python tally_2a_reco.py --inspect        (column mapping only, no matching)
================================================================================
"""

import argparse
import datetime as dt
import difflib
import glob
import os
import re
import sys

import pandas as pd

from paths import INPUT_DIR, OUTPUT_DIR
RECO_DIR = OUTPUT_DIR

TAX_TOLERANCE = 1.00
NAME_SIMILARITY = 0.88
OWN_PAN = "AAECJ6910B"

GSTIN_RE = re.compile(r"\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z][A-Z\d])\b")
PAN_RE = re.compile(r"^[A-Z]{5}\d{4}[A-Z]$")

# Ordered: the FIRST column whose lowered header contains the pattern wins, so
# specific patterns must precede loose ones. "Taxable Value" must be found
# before "Total Taxable Value"; "IGST Amount" before "Total IGST"; the GSTR-1
# filing STATUS before the filing RETURN PERIOD.
FIELD_PATTERNS = {
    "my_gstin":       ["my gstin"],
    "return_period":  ["return period"],
    "supplier_gstin": ["supplier gstin"],
    "supplier_name":  ["supplier legal name", "supplier trade name",
                       "trade/legal name", "legal name", "supplier name"],
    "doc_type":       ["document type"],
    "section":        ["section name"],
    "invoice_date":   ["document date", "invoice date", "note date"],
    "invoice_no":     ["document number", "invoice number", "invoice no"],
    "taxable_value":  ["taxable value"],
    "tax_rate":       ["tax rate", "rate(%)"],
    "tax_value":      ["tax value"],
    "igst":           ["igst amount"],
    "cgst":           ["cgst amount"],
    "sgst":           ["sgst amount"],
    "cess":           ["cess amount"],
    "invoice_value":  ["total invoice value", "invoice value",
                       "document value"],
    "rcm":            ["reverse charge"],
    "gstr3b_status":  ["gstr-3b filing status"],
    "gstr1_status":   ["gstr-1/iff/gstr-5 filing status"],
    "filing_period":  ["gstr-1/iff/gstr-5 filing return period"],
    "filing_date":    ["gstr-1/iff/gstr-5 filing date"],
    "orig_doc_no":    ["original document number"],
    "orig_doc_date":  ["original document date"],
    "amendment_type": ["amendment type"],
    "supplier_pan":   ["supplier pan"],
    "cancel_date":    ["cancellation date"],
    "taxpayer_type":  ["taxpayer type"],
}
REQUIRED = ["invoice_no", "taxable_value"]
TAX_FIELDS = ["igst", "cgst", "sgst", "cess"]


# ------------------------------------------------------------- normalisation
def norm_inv(v):
    """Split on separators, strip each segment's leading zeros, rejoin.

    Order matters. Stripping separators first loses the segment boundaries and
    then interior zeros get eaten too: 250404FS03000564 -> 2544FS3564, which
    both mangles the number and can collide two different invoices.
    """
    s = str(v or "").strip().upper()
    if s in ("", "NAN", "NONE"):
        return ""
    parts = [p for p in re.split(r"[\s\-/\\.,#:_()]+", s) if p]
    return "".join(re.sub(r"^0+(?=\d)", "", p) for p in parts)


def norm_gstin(v):
    s = str(v or "").strip().upper().replace(" ", "")
    return s if GSTIN_RE.fullmatch(s) else ""


def pan_of(gstin, pan_field=""):
    """PAN identifies a vendor across all their state GSTINs.

    105 vendors bill into 3+ of our states while holding <=1 GSTIN in Tally
    (single ledger), carrying 105,088,718.48 of tax. GSTIN cannot match those;
    PAN can. Safe: GSTIN[2:12] == PAN in 27,621 of 27,645 rows where both exist.
    """
    g = norm_gstin(gstin)
    if g:
        return g[2:12]
    p = str(pan_field or "").strip().upper()
    return p if PAN_RE.match(p) else ""


def norm_name(v):
    s = str(v or "").strip().upper()
    s = re.sub(r"\b(PVT|PRIVATE|LTD|LIMITED|LLP|CO|COMPANY|AND|THE|M/S)\b", " ", s)
    return re.sub(r"[^A-Z0-9]+", " ", s).strip()


def to_num(v):
    if v is None:
        return 0.0
    s = str(v).replace(",", "").strip()
    if s in ("", "-", "nan", "None"):
        return 0.0
    try:
        return round(float(re.sub(r"[^0-9.\-]", "", s) or 0), 2)
    except ValueError:
        return 0.0


def to_date(v):
    if isinstance(v, (dt.date, dt.datetime)):
        return pd.Timestamp(v).date()
    s = str(v or "").strip()
    if s in ("", "nan", "NaT"):
        return None
    for f in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d-%b-%Y", "%d-%b-%y",
              "%Y%m%d"):
        try:
            return dt.datetime.strptime(s, f).date()
        except ValueError:
            continue
    try:
        return pd.to_datetime(s, dayfirst=True).date()
    except Exception:
        return None


def fy_of(d):
    if not d:
        return ""
    y = d.year if d.month >= 4 else d.year - 1
    return f"FY{y}-{str(y + 1)[-2:]}"


# --------------------------------------------------------------- 2A reading
def find_header_row(raw, scan=10):
    best, best_hits = 0, -1
    for i in range(min(scan, len(raw))):
        joined = " | ".join(_hdr(c) for c in raw.iloc[i].tolist())
        hits = sum(1 for pats in FIELD_PATTERNS.values()
                   if any(p in joined for p in pats))
        if hits > best_hits:
            best, best_hits = i, hits
    return best, best_hits


def _hdr(c):
    """Normalise a header for matching.

    The ISD sheet is laid out differently from the state sheets - header on
    row 0, and 'Document  Date' carries a DOUBLE space, so a plain
    'document date' test misses it. Collapse whitespace before comparing.
    """
    return re.sub(r"\s+", " ", str(c).strip().lower())


def map_columns(cols):
    lower = {c: _hdr(c) for c in cols}
    mapping, taken = {}, set()
    for field, pats in FIELD_PATTERNS.items():
        for p in pats:
            hit = next((c for c in cols if c not in taken and p in lower[c]),
                       None)
            if hit is not None:
                mapping[field] = hit
                taken.add(hit)
                break
    return mapping, [c for c in cols if c not in taken
                     and not str(c).startswith("Unnamed")]


def read_2a(path, label, inspect_only=False):
    xl = pd.ExcelFile(path)
    print(f"\n2A: {os.path.basename(path)}   ({len(xl.sheet_names)} sheets)")
    frames, report = [], []

    for sheet in xl.sheet_names:
        raw = pd.read_excel(path, sheet_name=sheet, header=None, nrows=10,
                            dtype=object)
        if raw.empty:
            continue
        hdr, _ = find_header_row(raw)
        df = pd.read_excel(path, sheet_name=sheet, header=hdr, dtype=object)
        df = df.dropna(how="all")
        mapping, unmapped = map_columns(list(df.columns))
        missing = [f for f in REQUIRED if f not in mapping]
        if missing:
            report.append({"Sheet": sheet, "Status": f"SKIPPED missing {missing}"})
            print(f"  [skip] {sheet}: missing {missing}")
            continue

        g = lambda f: (df[mapping[f]] if f in mapping else pd.Series([""] * len(df)))
        out = pd.DataFrame({
            "2A Sheet": sheet,
            "Our GSTIN": g("my_gstin").map(norm_gstin),
            "Return Period": g("return_period").astype(str).str.strip(),
            "Supplier GSTIN": g("supplier_gstin").map(norm_gstin),
            "Supplier Name": g("supplier_name").astype(str).str.strip(),
            "Supplier PAN": g("supplier_pan").astype(str).str.strip().str.upper(),
            "Doc Type": g("doc_type").astype(str).str.strip().str.upper(),
            "Section": g("section").astype(str).str.strip().str.upper(),
            "Invoice No": g("invoice_no").astype(str).str.strip(),
            "Invoice Date": g("invoice_date").map(to_date),
            "Taxable Value": g("taxable_value").map(to_num),
            "Tax Rate": g("tax_rate").astype(str).str.strip(),
            "Invoice Value": g("invoice_value").map(to_num),
            "RCM": g("rcm").astype(str).str.strip(),
            "3B Status": (g("gstr3b_status").astype(str).str.strip()
                          if "gstr3b_status" in mapping else "(not reported)"),
            "GSTR1 Status": g("gstr1_status").astype(str).str.strip(),
            "Filing Period": g("filing_period").astype(str).str.strip(),
            "Filing Date": g("filing_date").astype(str).str.strip(),
            "Orig Doc No": g("orig_doc_no").astype(str).str.strip(),
            "Amendment Type": g("amendment_type").astype(str).str.strip(),
            "GSTIN Cancelled": g("cancel_date").astype(str).str.strip(),
            "Taxpayer Type": g("taxpayer_type").astype(str).str.strip(),
        })
        for f in TAX_FIELDS:
            out[f.upper()] = g(f).map(to_num)
        out["Total Tax"] = out[[f.upper() for f in TAX_FIELDS]].sum(axis=1)

        out = out[(out["Invoice No"] != "") & (out["Invoice No"].str.lower() != "nan")]
        if out.empty:
            continue

        # A supplier credit note REDUCES available credit. Portals report the
        # amount positive with the direction carried in Doc Type, so the sign
        # has to be applied here or credit notes would inflate ITC.
        cn = out["Doc Type"].str.contains("CREDIT", na=False)
        for c in [f.upper() for f in TAX_FIELDS] + ["Taxable Value",
                                                    "Invoice Value", "Total Tax"]:
            out.loc[cn, c] = -out.loc[cn, c]

        frames.append(out)
        rep = {"Sheet": sheet, "Status": "read", "Rows": len(out),
               "Header row": hdr + 1,
               "Unmapped": ", ".join(str(c) for c in unmapped[:5])}
        rep.update({f"-> {k}": str(v) for k, v in mapping.items()})
        report.append(rep)
        print(f"  [ok]   {sheet:<6} {len(out):>6,} rows")

    rdf = pd.DataFrame(report)
    if inspect_only or not frames:
        return pd.DataFrame(), rdf

    a2 = pd.concat(frames, ignore_index=True)
    a2["_src"] = label
    a2["_inv"] = a2["Invoice No"].map(norm_inv)
    a2["_name"] = a2["Supplier Name"].map(norm_name)
    a2["_pan"] = [pan_of(gg, pp) for gg, pp
                  in zip(a2["Supplier GSTIN"], a2["Supplier PAN"])]
    return a2, rdf


def aggregate_invoices(a2):
    """Collapse 2A rate lines into one row per invoice.

    GSTR-2A reports B2B RATE-WISE: an invoice spanning 5% and 18% appears as
    two rows. Books hold one row for the whole invoice. Matching line-by-line
    therefore (a) compares the book invoice against a single rate line, so the
    amount looks wrong, and (b) leaves the other rate line unmatched, inflating
    "In 2A only".

    Real example - BL/25-26/12553, supplier 03ADJPS8003P1Z6:
        line 1   5%   taxable 49,779.25   tax 2,488.96
        line 2  18%   taxable    190.67   tax    34.32
        invoice      taxable 49,969.92   tax 2,523.28   <- what books hold

    Scale: FY25-26 38,768 rate lines -> 34,518 invoices (3,219 multi-rate,
    up to 5 lines each); FY26-27 8,608 -> 7,887.

    Section is part of the key so a B2BA amendment stays separate from the
    B2B it amends - the amendment logic runs after this and needs both.
    """
    key = ["Our GSTIN", "Supplier GSTIN", "Section", "_inv"]
    sums = ["Taxable Value", "Invoice Value", "Total Tax"] + \
           [f.upper() for f in TAX_FIELDS]
    agg = {c: "sum" for c in sums}
    for c in a2.columns:
        if c not in sums and c not in key:
            agg[c] = "first"
    out = a2.groupby(key, dropna=False, as_index=False).agg(agg)
    lines = a2.groupby(key, dropna=False).size().reset_index(name="Rate Lines")
    rates = (a2.groupby(key, dropna=False)["Tax Rate"]
               .apply(lambda s: ", ".join(sorted({str(x) for x in s if str(x)
                                                  not in ("", "nan")})))
               .reset_index(name="Rates"))
    out = out.merge(lines, on=key).merge(rates, on=key)
    print(f"  rate lines {len(a2):,} -> invoices {len(out):,} "
          f"({int((out['Rate Lines'] > 1).sum()):,} multi-rate)")
    return out


_MONTHS = {m: i + 1 for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July",
     "August", "September", "October", "November", "December"])}


def apply_qrmp_rule(a2):
    """A QRMP supplier files GSTR-3B once a QUARTER, not monthly.

    For the first two months of a quarter the portal reports 3B as "Not Filed"
    even though the quarter's return is filed in the third month. Treating
    those as unfiled overstates Rule 37A exposure badly.

    The data confirms the pattern exactly: of 2,094 "Not Filed" rows, NONE
    fall in March, June, September or December - they sit only in the first
    two months of each quarter. Example 27DLEPS0417M1ZT: Not Filed Jan+Feb ->
    Filed Mar, Not Filed Apr+May -> Filed Jun, Not Filed Jul+Aug -> Filed Sep.

    Rule: if a supplier has ANY filed 3B within a calendar quarter, every
    invoice of that supplier in that quarter counts as covered. That rescued
    1,882 rows / 7,079,828.04, leaving 212 rows / 1,917,770.82 genuinely
    unfiled.
    """
    def ym(s):
        p = str(s).split()
        return (int(p[1]), _MONTHS[p[0]]) if len(p) == 2 and p[0] in _MONTHS \
            else None

    per = a2["Return Period"].map(ym)
    a2 = a2.copy()
    a2["_q"] = per.map(lambda t: (t[0], (t[1] - 1) // 3) if t else None)
    st = a2["3B Status"].astype(str).str.strip().str.lower()
    filed = ~st.str.startswith("not filed")
    filed_q = set(zip(a2.loc[filed, "Supplier GSTIN"], a2.loc[filed, "_q"]))

    rescued = (~filed) & pd.Series(
        [(g, q) in filed_q for g, q in zip(a2["Supplier GSTIN"], a2["_q"])],
        index=a2.index)
    a2["3B Effective"] = "Filed"
    a2.loc[~filed & ~rescued, "3B Effective"] = "Not Filed"
    a2["3B Basis"] = ""
    a2.loc[rescued, "3B Basis"] = "Quarterly filer - quarter 3B filed"
    if int(rescued.sum()):
        print(f"  QRMP: {int(rescued.sum()):,} rows re-classified as filed "
              f"(quarter return filed), "
              f"{int((~filed & ~rescued).sum()):,} remain unfiled")
    return a2.drop(columns=["_q"])


def resolve_amendments(a2):
    """B2BA/CDNA supersede the B2B/CDN row they amend. Drop the original.

    Matched on (supplier GSTIN, normalised ORIGINAL document number). Without
    this the same invoice is matched twice - once at its original value and
    once amended - and the totals cannot tie.
    """
    is_amd = a2["Section"].str.endswith("A", na=False)
    amd = a2[is_amd]
    if amd.empty:
        return a2, pd.DataFrame()
    keys = {(r["Supplier GSTIN"], norm_inv(r["Orig Doc No"]))
            for _, r in amd.iterrows() if norm_inv(r["Orig Doc No"])}
    orig_key = list(zip(a2["Supplier GSTIN"], a2["_inv"]))
    superseded = (~is_amd) & pd.Series([k in keys for k in orig_key],
                                       index=a2.index)
    print(f"  amendments {int(is_amd.sum()):,} -> superseded originals removed:"
          f" {int(superseded.sum()):,}")
    return a2[~superseded].copy(), a2[superseded].copy()


# ------------------------------------------------------------ books reading
def read_books(path):
    df = pd.read_excel(path, sheet_name="Consolidated", dtype=object)
    df = df.dropna(how="all")
    for c in ["Taxable Value", "CGST", "SGST / UTGST", "IGST", "CESS",
              "Total Tax", "Total Invoice Value"]:
        if c in df.columns:
            df[c] = df[c].map(to_num)
    df["Voucher Date"] = df["Voucher Date"].map(to_date)
    if "Supplier Inv Date" in df.columns:
        df["Supplier Inv Date"] = df["Supplier Inv Date"].map(to_date)
        df["_date"] = [s or v for s, v in
                       zip(df["Supplier Inv Date"], df["Voucher Date"])]
    else:
        print("  WARNING: books file has no 'Supplier Inv Date' - falling back "
              "to voucher date. Regenerate with the current step-1 script.")
        df["_date"] = df["Voucher Date"]
    df["_inv"] = df["Supplier Inv No"].map(norm_inv)
    df["_gstin"] = df["Supplier GSTIN"].map(norm_gstin)
    df["_name"] = df["Supplier Name"].map(norm_name)
    df["_pan"] = [pan_of(g, p) for g, p in
                  zip(df["Supplier GSTIN"],
                      df.get("Supplier PAN", pd.Series([""] * len(df))))]
    vt = df["Voucher Type"].astype(str).str.lower()
    df["_kind"] = "Other"
    df.loc[vt.str.contains("purchase"), "_kind"] = "Purchase"
    df.loc[vt.str.contains("journal"), "_kind"] = "Journal"
    df.loc[vt.str.contains("debit note"), "_kind"] = "Debit Note"
    df.loc[vt.str.contains("credit note"), "_kind"] = "Credit Note"
    df["_interbranch"] = df["_gstin"].str.contains(OWN_PAN, na=False)

    # WHAT IS OUT OF SCOPE FOR 2A IS DECIDED BY THE GST BUCKET, NOT THE
    # VOUCHER TYPE.
    # "GST Journal" here is how commission/service invoices (Swiggy, Zomato)
    # are booked, and 95.2% of those rows - 12,761 of 13,404, 93,887,809.87 of
    # tax - have their invoice number present in 2A. Excluding by voucher type
    # produced 23,018 false "In 2A only" rows worth 127,758,423.98.
    # Genuinely outside 2A is only credit that is ISD-distributed or a 17(5)
    # reversal: 200 rows, 10,020,769.48.
    ordinary = sum(df.get(c, pd.Series([0.0] * len(df))).map(to_num)
                   for c in ("CGST", "SGST / UTGST", "IGST", "CESS"))
    special = sum(df.get(c, pd.Series([0.0] * len(df))).map(to_num)
                  for c in ("ISD", "Reversal 17(5)", "Other GST"))
    df["_not_2a"] = (ordinary.abs() < 0.01) & (special.abs() >= 0.01)
    return df


# ---------------------------------------------------------------- matching
def match(books, a2, other2a=None):
    used = set()
    other_idx = {}
    if other2a is not None and not other2a.empty:
        for i, r in other2a.iterrows():
            other_idx.setdefault((r["_pan"], r["_inv"]), i)

    results = []
    for _, b in books.iterrows():
        hit = tier = status = None

        def scan(mask, tname, ok_status, bad_status=None, amount=True):
            for i in a2.index[mask]:
                if i in used:
                    continue
                d = abs(a2.at[i, "Total Tax"] - b["Total Tax"])
                if amount and d > TAX_TOLERANCE and bad_status is None:
                    continue
                return i, tname, (ok_status if d <= TAX_TOLERANCE
                                  else (bad_status or ok_status))
            return None, None, None

        if b["_gstin"] and b["_inv"]:
            hit, tier, status = scan(
                (a2["Supplier GSTIN"] == b["_gstin"]) & (a2["_inv"] == b["_inv"]),
                "1", "Matched", "Matched - amount differs")
        if hit is None and b["_pan"] and b["_inv"]:
            hit, tier, status = scan(
                (a2["_pan"] == b["_pan"]) & (a2["_inv"] == b["_inv"]),
                "2P", "Matched on PAN - GSTIN differs by state",
                "Matched on PAN - amount differs")
        if hit is None and not b["_gstin"] and b["_inv"]:
            hit, tier, status = scan(a2["_inv"] == b["_inv"], "3",
                                     "Matched - GSTIN missing in books")
        if hit is None and b["_inv"] and b["_name"]:
            for i in a2.index[a2["_inv"] == b["_inv"]]:
                if i in used:
                    continue
                sim = difflib.SequenceMatcher(None, b["_name"],
                                              a2.at[i, "_name"]).ratio()
                if (sim >= NAME_SIMILARITY
                        and abs(a2.at[i, "Total Tax"] - b["Total Tax"])
                        <= TAX_TOLERANCE):
                    hit, tier, status = i, "4", f"Probable - verify ({sim:.2f})"
                    break
        if hit is None and b["_gstin"] and b["_date"]:
            hit, tier, status = scan(
                (a2["Supplier GSTIN"] == b["_gstin"])
                & (a2["Invoice Date"] == b["_date"]), "5",
                "Probable - invoice no differs")

        row = b.to_dict()
        if hit is None:
            # Not in THIS year's 2A - is it in the adjacent year's? Label only;
            # the other year's row is never consumed, so the two runs stay
            # independent.
            k = (b["_pan"], b["_inv"])
            if k in other_idx and b["_inv"]:
                o = other2a.loc[other_idx[k]]
                st = (f"Timing - found in {o['_src']} 2A "
                      f"({o['Return Period']})")
            else:
                st = "In books only - not in 2A"
            row.update({"Reco Status": st, "Match Tier": "",
                        "2A Invoice No": "", "2A Supplier": "", "2A Date": "",
                        "2A Taxable": "", "2A Tax": "", "2A Return Period": "",
                        "2A 3B Status": "", "ITC Available": "",
                        "Books FY": fy_of(b["_date"]), "2A FY": "",
                        "Date Gap (days)": "", "Tax Diff": ""})
        else:
            used.add(hit)
            m = a2.loc[hit]
            # Rule 37A: supplier has not filed 3B, so this credit is not
            # available even though the invoice is genuinely in 2A. Kept as a
            # MATCH - calling it "missing" would confuse a filing problem with
            # an absent invoice.
            # 3B FILING STATUS IS INFORMATIONAL ONLY (user decision).
            # The portal's 3B status proved unreliable here: quarterly (QRMP)
            # filers report "Not Filed" for the first two months of a quarter,
            # and the ISD sheet carries no 3B column at all. Rather than let a
            # questionable status downgrade a genuine invoice match, the match
            # stands on its own and the status is carried as a flag for review.
            # 3B filing status is NOT used at all. The portal's value proved
            # unreliable here (QRMP filers show "Not Filed" for two months of
            # every quarter; the ISD sheet has no 3B column), and a match rests
            # on invoice evidence. The raw portal value is still carried in the
            # "2A 3B Status" column as source data, but nothing is derived from
            # it and nothing is separated out on its basis.
            filed = True
            bfy, afy = fy_of(b["_date"]), fy_of(m["Invoice Date"])
            if bfy and afy and bfy != afy:
                status += f" | cross-year {bfy} vs {afy}"
            row.update({
                "Reco Status": status, "Match Tier": tier,
                "2A Invoice No": m["Invoice No"], "2A Supplier": m["Supplier Name"],
                "2A Date": m["Invoice Date"], "2A Taxable": m["Taxable Value"],
                "2A Tax": m["Total Tax"], "2A Return Period": m["Return Period"],
                "2A 3B Status": m["3B Status"],

                "ITC Available": "Yes" if filed else "NO - 3B not filed",
                "Books FY": bfy, "2A FY": afy,
                "Date Gap (days)": ((m["Invoice Date"] - b["_date"]).days
                                    if b["_date"] and m["Invoice Date"] else ""),
                "Tax Diff": round(b["Total Tax"] - m["Total Tax"], 2)})
        results.append(row)

    a2 = a2.copy()
    a2["_used"] = a2.index.isin(used)
    return pd.DataFrame(results), a2


# -------------------------------------------------------------------- main
def find_books(pattern):
    """Newest step-1 books workbook in 3_OUTPUT."""
    hits = glob.glob(os.path.join(OUTPUT_DIR, pattern))
    return max(hits, key=os.path.getmtime) if hits else ""


# A 2A workbook is recognised by the financial year written somewhere in its
# name, not by an exact filename - rename the file however you like as long as
# the year survives. "JC 2A 26-27.xlsx", "GSTR2A_2026-2027 final.xlsx" and
# "2a 2627 v3.xlsx" all resolve to FY2026-27.
FY_TOKENS = {
    "FY2025-26": ("2025-2026", "2025-26", "25-26", "2526"),
    "FY2026-27": ("2026-2027", "2026-27", "26-27", "2627"),
}


def _normalise(name):
    """Fold separators so 25_26, 25.26, '25 - 26' all read as 25-26."""
    s = name.lower()
    for ch in " _.":
        s = s.replace(ch, "-" if ch != " " else "")
    while "--" in s:
        s = s.replace("--", "-")
    return s


def find_2a(label):
    """Newest workbook in 1_INPUT whose name carries this financial year."""
    hits = []
    for p in glob.glob(os.path.join(INPUT_DIR, "*.xlsx")):
        base = os.path.basename(p)
        if base.startswith("~$"):          # Excel lock file
            continue
        norm = _normalise(base)
        mine = any(t in norm for t in FY_TOKENS[label])
        other = any(t in norm
                    for lbl, toks in FY_TOKENS.items() if lbl != label
                    for t in toks)
        if mine and not other:
            hits.append(p)
    return max(hits, key=os.path.getmtime) if hits else ""


def ask(prompt, default=""):
    """Prompt for a path, falling back to the auto-detected default.

    Anything that is not a usable path - a stray space, a BOM piped in on
    stdin, a typo - falls back to the default rather than silently dropping
    a whole year from the reconciliation.
    """
    label = f" [{os.path.basename(default)}]" if default else ""
    try:
        v = input(f"{prompt}{label}: ")
    except EOFError:
        v = ""
    v = v.strip().strip('﻿​').strip().strip('"').strip()
    if not v:
        return default
    if not os.path.exists(v) and default:
        print(f"    '{v}' not found - using {os.path.basename(default)}")
        return default
    return v


def run_year(books_path, twoa_path, other2a, label, other_label, inspect):
    print("\n" + "=" * 78)
    print(f" {label}")
    print("=" * 78)
    a2, report = read_2a(twoa_path, label, inspect_only=inspect)
    if inspect:
        return None, report
    a2 = apply_qrmp_rule(aggregate_invoices(a2))
    a2, superseded = resolve_amendments(a2)

    books = read_books(books_path)
    print(f"  books {len(books):,} rows, tax {books['Total Tax'].sum():,.2f}")
    print(f"  2A    {len(a2):,} rows, tax {a2['Total Tax'].sum():,.2f}")

    # INTER-BRANCH IS MATCHED, NOT EXCLUDED.
    # Excluding it on the books side while leaving the same invoices in the 2A
    # pool was asymmetric: 1,571 book rows (15,614,136.63) were held back while
    # their 1,577 counterpart 2A invoices (15,897,549.68) fell straight into
    # "In 2A only" - 55% of that pile was the company billing itself. They are
    # matched like any other supply and simply TAGGED so they can be filtered.
    journals = books[books["_not_2a"]]
    matchable = books[~books["_not_2a"]]
    print(f"  out-of-scope (ISD/reversal) {len(journals):,} | "
          f"matchable {len(matchable):,} "
          f"(incl. {int(matchable['_interbranch'].sum()):,} inter-branch)")

    res, a2 = match(matchable, a2, other2a)
    only2a_all = a2[~a2["_used"]]
    is_isd = only2a_all["2A Sheet"].astype(str).str.upper().eq("ISD")
    # REVERSE-CHARGE supplies are reported by the supplier in 2A but the tax is
    # paid by US, so they are never booked as an ordinary purchase credit.
    # Leaving them in "In 2A only" presents them as unclaimed ITC, which they
    # are not: 604 invoices / 2,604,900.84, led by SmartShift Logistics
    # (492 invoices, 1,845,270.27).
    is_rcm = (only2a_all["RCM"].astype(str).str.strip().str.upper()
              .isin(["Y", "YES", "TRUE"]))
    only2a = only2a_all[~is_isd & ~is_rcm].copy()
    rcm_2a = only2a_all[~is_isd & is_rcm]
    isd_unmatched = only2a_all[is_isd]

    # WHY is each leftover 2A row unmatched? Without this the pile reads as one
    # undifferentiated number when in fact most of it is explainable.
    # Measured FY25-26: credit notes -5,856,248.88 (812), party already in the
    # books under a different reference or period 17,976,215.72 (3,095), and
    # only 491,789.22 (388) from parties absent from the books entirely.
    known_pans = set(books["_pan"]) - {""}
    is_cn = only2a["Doc Type"].astype(str).str.contains("CREDIT", na=False)
    known = only2a["_pan"].isin(known_pans)
    only2a["Why unmatched"] = "Party NOT in books - genuinely unbooked"
    only2a.loc[known, "Why unmatched"] = (
        "Party IS in books - invoice reference or period differs")
    only2a.loc[is_cn, "Why unmatched"] = (
        "Supplier CREDIT NOTE not booked - reduces your ITC")
    matched = res[res["Match Tier"] != ""]
    avail = matched
    booksonly = res[res["Match Tier"] == ""]
    timing = booksonly[booksonly["Reco Status"].str.startswith("Timing")]

    print(f"\n  matched            {len(matched):>6,}  {matched['Total Tax'].sum():>16,.2f}")
    print(f"    ITC available    {len(avail):>6,}  {avail['Total Tax'].sum():>16,.2f}")
    print(f"  timing (other yr)  {len(timing):>6,}  {timing['Total Tax'].sum():>16,.2f}")
    print(f"  AT RISK (books, not in 2A) {len(booksonly)-len(timing):>6,}  "
          f"{(booksonly['Total Tax'].sum()-timing['Total Tax'].sum()):>16,.2f}")
    print(f"  in 2A only         {len(only2a):>6,}  {only2a['Total Tax'].sum():>16,.2f}")
    print(f"  RCM (2A, we pay)   {len(rcm_2a):>6,}  {rcm_2a['Total Tax'].sum():>16,.2f}")

    lhs = (matched["Total Tax"].sum() + booksonly["Total Tax"].sum()
           + journals["Total Tax"].sum())
    rhs = books["Total Tax"].sum()
    print(f"\n  books identity {lhs:,.2f} vs {rhs:,.2f}  "
          f"{'OK' if abs(lhs-rhs) <= 0.01 else '*** BROKEN ***'}")
    print(f"  no double-match: "
          f"{'OK' if a2['_used'].sum() == len(matched) else '*** BROKEN ***'}")

    res["Inter-Branch"] = res["_interbranch"].map({True: "Yes", False: ""})
    drop = [c for c in res.columns if c.startswith("_")]
    os.makedirs(RECO_DIR, exist_ok=True)
    out = os.path.join(RECO_DIR, f"GST_2A_Reco_{label}.xlsx")
    n = 1
    while True:
        try:
            open(out, "a+b").close()
            break
        except PermissionError:
            out = os.path.join(RECO_DIR, f"GST_2A_Reco_{label}_v{n}.xlsx")
            n += 1

    used_names = set()
    with pd.ExcelWriter(out, engine="openpyxl") as xl:
        resx = res.drop(columns=drop, errors="ignore")
        summ = (resx.groupby("State", as_index=False)
                    .agg(Rows=("Voucher No.", "size"), Book_Tax=("Total Tax", "sum")))
        real_risk = booksonly[~booksonly["Reco Status"].str.startswith("Timing")]
        for nm, sub in (("Matched", matched),
                        ("Timing_Other_Year", timing),
                        ("At_Risk_Not_In_2A", real_risk)):
            t = sub.groupby("State", as_index=False).agg(**{
                nm: ("Voucher No.", "size"), f"{nm}_Tax": ("Total Tax", "sum")})
            summ = summ.merge(t, on="State", how="left")
        summ.fillna(0).to_excel(xl, sheet_name="Summary", index=False)
        resx.to_excel(xl, sheet_name="All_Detail", index=False)
        timing.drop(columns=drop, errors="ignore").to_excel(
            xl, sheet_name="Timing_Other_Year", index=False)
        booksonly[~booksonly["Reco Status"].str.startswith("Timing")].drop(
            columns=drop, errors="ignore").to_excel(
            xl, sheet_name="At_Risk_In_Books_Not_In_2A", index=False)
        only2a.drop(columns=[c for c in only2a.columns if c.startswith("_")],
                    errors="ignore").to_excel(xl, sheet_name="In_2A_Only",
                                              index=False)
        rcm_2a.drop(columns=[c for c in rcm_2a.columns if c.startswith("_")],
                    errors="ignore").to_excel(
            xl, sheet_name="RCM_In_2A_Not_ITC", index=False)
        used_names.add("rcm_in_2a_not_itc")
        journals.drop(columns=drop, errors="ignore").to_excel(
            xl, sheet_name="Not_In_2A_ISD_Reversal", index=False)
        resx[resx["Inter-Branch"] == "Yes"].to_excel(
            xl, sheet_name="Inter_Branch_Matched", index=False)
        if not superseded.empty:
            superseded.drop(columns=[c for c in superseded.columns
                                     if c.startswith("_")],
                            errors="ignore").to_excel(
                xl, sheet_name="Superseded_By_Amendment", index=False)
        isd_2a = a2[a2["2A Sheet"].astype(str).str.upper().eq("ISD")]
        if not isd_2a.empty or "ISD" in books.columns:
            isd_col = (books["ISD"].map(to_num) if "ISD" in books.columns
                       else pd.Series([0.0] * len(books), index=books.index))
            books_isd = isd_col.sum()
            inward = isd_2a["Total Tax"].sum()
            pd.DataFrame([
                {"Item": "2A ISD sheet - invoices RECEIVED by the ISD "
                         "registration", "Rows": len(isd_2a), "Tax": inward},
                {"Item": "Books - ISD credit DISTRIBUTED to state units",
                 "Rows": int((isd_col.abs() >= 0.01).sum()),
                 "Tax": books_isd},
                {"Item": "Difference (received less distributed)",
                 "Rows": "", "Tax": inward - books_isd},
                {"Item": "NOTE: these are opposite ends of the ISD mechanism "
                         "and CANNOT be matched invoice-by-invoice - the book "
                         "entries are monthly distribution journals carrying "
                         "no invoice number or supplier. Reconcile on totals.",
                 "Rows": "", "Tax": ""},
            ]).to_excel(xl, sheet_name="ISD_Control", index=False)
            isd_2a.drop(columns=[c for c in isd_2a.columns
                                 if c.startswith("_")], errors="ignore"
                        ).to_excel(xl, sheet_name="ISD_2A_Invoices", index=False)
            used_names.update(["isd_control", "isd_2a_invoices"])
        # Plain-language front sheet - the numbers someone acts on.
        ib = resx[resx["Inter-Branch"] == "Yes"]
        ib_m = ib[ib["Match Tier"] != ""]
        pd.DataFrame([
            {"#": 1, "Item": "Book entries in scope", "Count": len(resx),
             "Tax": resx["Total Tax"].sum(),
             "Meaning": "purchases / journals / notes carrying ordinary GST"},
            {"#": 2, "Item": "MATCHED - found in 2A", "Count": len(matched),
             "Tax": matched["Total Tax"].sum(),
             "Meaning": "ITC available and supported"},
            {"#": 3, "Item": "  of which inter-company", "Count": len(ib_m),
             "Tax": ib_m["Total Tax"].sum(),
             "Meaning": "own branches billing each other - matched, not an issue"},
            {"#": 4, "Item": "TIMING - in the other year's 2A",
             "Count": len(timing), "Tax": timing["Total Tax"].sum(),
             "Meaning": "supplier filed in a different year - no action"},
            {"#": 5, "Item": "AT RISK - in books, NOT in 2A",
             "Count": len(real_risk), "Tax": real_risk["Total Tax"].sum(),
             "Meaning": "ITC claimed but supplier has not reported it - "
                        "s.16(2)(aa) exposure. CHASE THE SUPPLIER."},
            {"#": 6, "Item": "In 2A, NOT in books", "Count": len(only2a),
             "Tax": only2a["Total Tax"].sum(),
             "Meaning": "see 'Why unmatched' column - split below"},
            {"#": "6a", "Item": "   supplier CREDIT NOTES not booked",
             "Count": int((only2a["Why unmatched"].str.startswith("Supplier CRED")).sum()),
             "Tax": only2a.loc[only2a["Why unmatched"].str.startswith("Supplier CRED"),
                               "Total Tax"].sum(),
             "Meaning": "negative - you have claimed ITC the supplier later "
                        "credited. LIABILITY, not opportunity."},
            {"#": "6b", "Item": "   party in books, reference/period differs",
             "Count": int((only2a["Why unmatched"].str.startswith("Party IS")).sum()),
             "Tax": only2a.loc[only2a["Why unmatched"].str.startswith("Party IS"),
                               "Total Tax"].sum(),
             "Meaning": "same supplier already dealt with - usually timing or "
                        "a different invoice reference. Verify, do not re-book."},
            {"#": "6c", "Item": "   party NOT in books at all",
             "Count": int((only2a["Why unmatched"].str.startswith("Party NOT")).sum()),
             "Tax": only2a.loc[only2a["Why unmatched"].str.startswith("Party NOT"),
                               "Total Tax"].sum(),
             "Meaning": "the only genuinely unclaimed credit. CHECK AND BOOK."},
            {"#": 6.5, "Item": "Reverse charge - in 2A, tax paid by us",
             "Count": len(rcm_2a), "Tax": rcm_2a["Total Tax"].sum(),
             "Meaning": "supplier reports it, WE pay the tax - not ordinary "
                        "ITC and not a gap. No action."},
            {"#": 7, "Item": "Out of scope (ISD / 17(5) reversal)",
             "Count": len(journals), "Tax": journals["Total Tax"].sum(),
             "Meaning": "never appears in 2A - see ISD_Control"},
            {"#": 8, "Item": "CHECK: 2 + 4 + 5 must equal 1", "Count": "",
             "Tax": (matched["Total Tax"].sum() + timing["Total Tax"].sum()
                     + real_risk["Total Tax"].sum()),
             "Meaning": "in-scope identity - must equal line 1 exactly"},
            {"#": 9, "Item": "BOOKS TOTAL (1 + 7)", "Count": len(books),
             "Tax": books["Total Tax"].sum(),
             "Meaning": "ties to the step-1 books workbook"},
        ]).to_excel(xl, sheet_name="Overview", index=False)
        used_names.add("overview")
        report.to_excel(xl, sheet_name="Column_Mapping", index=False)
        for s in ("summary", "all_detail", 
                  "timing_other_year", "at_risk_in_books_not_in_2a", "in_2a_only",
                  "not_in_2a_isd_reversal", "inter_branch_matched",
                  "superseded_by_amendment", "column_mapping"):
            used_names.add(s)
        for st in sorted(resx["State"].dropna().unique()):
            nm = re.sub(r'[\\/*?:\[\]]', "-", str(st))[:31]
            if nm.lower() in used_names:
                nm = nm[:28] + "~1"
            used_names.add(nm.lower())
            resx[resx["State"] == st].to_excel(xl, sheet_name=nm, index=False)
    print(f"  saved: {out}")
    return out, report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inspect", action="store_true")
    args = ap.parse_args()

    print("=" * 78)
    print(" GSTR-2A RECONCILIATION  (step 2) - one workbook per year")
    print("=" * 78)

    print(f"\n  2A files read from : {INPUT_DIR}")
    print(f"  books read from    : {OUTPUT_DIR}")
    print("  press Enter to accept each file, or paste a different path\n")

    b25 = ask("Books FY25-26", find_books("GST_Entries_FY2025-26_*.xlsx"))
    b26 = ask("Books FY26-27", find_books("GST_Entries_20260401-20260630_*.xlsx"))
    a25 = ask("2A FY25-26", find_2a("FY2025-26"))
    a26 = ask("2A FY26-27", find_2a("FY2026-27"))
    # Run whichever years are actually present. A missing FY26-27 2A should
    # not block the FY25-26 reconciliation.
    have25 = os.path.exists(b25) and os.path.exists(a25)
    have26 = os.path.exists(b26) and os.path.exists(a26)
    for label, ok, files in (("FY2025-26", have25, (b25, a25)),
                             ("FY2026-27", have26, (b26, a26))):
        if not ok:
            books, twoa = files
            miss = []
            if not os.path.exists(books):
                miss.append("books - run 1_EXPORT_BOOKS.bat first"
                            if not books else os.path.basename(books))
            if not os.path.exists(twoa):
                miss.append(f"2A - no file in 1_INPUT named for {label}"
                            if not twoa else os.path.basename(twoa))
            print(f"  SKIPPING {label} - missing: {'; '.join(miss)}")
    if not (have25 or have26):
        sys.exit(
            "Neither year has both its books and its 2A file.\n"
            f"  2A workbooks go in : {INPUT_DIR}\n"
            "  name them so the year is visible, e.g. 'JC 2A 26-27.xlsx'")

    if args.inspect:
        for p, lbl in ((a25, "FY2025-26"), (a26, "FY2026-27")):
            _, rep = read_2a(p, lbl, inspect_only=True)
            o = os.path.join(RECO_DIR, f"GST_2A_ColumnMapping_{lbl}.xlsx")
            rep.to_excel(o, index=False)
            print(f"  mapping -> {o}")
        return

    pool25 = (apply_qrmp_rule(aggregate_invoices(read_2a(a25, "FY2025-26")[0]))
              if have25 else None)
    pool26 = (apply_qrmp_rule(aggregate_invoices(read_2a(a26, "FY2026-27")[0]))
              if have26 else None)
    if have25:
        run_year(b25, a25, pool26, "FY2025-26", "FY2026-27", False)
    if have26:
        run_year(b26, a26, pool25, "FY2026-27", "FY2025-26", False)
    print("\n" + "=" * 78)


if __name__ == "__main__":
    main()
