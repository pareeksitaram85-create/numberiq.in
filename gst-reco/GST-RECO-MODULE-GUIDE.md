# GST Reconciliation Module — the complete guide

**Entity:** JOIN COMMERCE PVT LTD · PAN `AAECJ6910B` · 19 registrations (18 Regular + 1 Maharashtra ISD)
**Years live:** FY 2025-26 (full) and FY 2026-27 (Apr–Jun 26)
**Last verified:** 2026-08-09 — engine reproduces all 24 golden Overview lines across both years, 0 mismatches, 6/6 identity checks pass.

---

## 1. The two halves, and why both exist

There are two reconciliation engines. They are not duplicates and neither is legacy.

| | **Python pipeline** | **Web module** |
|---|---|---|
| Lives in | `gst-reco/_engine/tally_2a_reco.py` | `deploy/public/js/gst-reco-engine.js` |
| Runs on | Your PC, needs Tally on port 9000 for step 1 | Browser, needs nothing installed |
| Reads | Excel workbooks off the disk | Excel uploads → Supabase |
| Answers | *"What is the position for this year, right now?"* | *"What changed since last month, and who has still not filed?"* |
| Output | 14+ sheet Excel workbook | Ten live views + Excel export |
| Memory | None — every run starts from the files | Cumulative — rows accumulate, late filings match on a later run |

**The Python is the specification.** The JavaScript is a line-by-line port of it. Every rule in the Python exists because its absence produced a wrong number on real Join Commerce data, and the measured cost of each is recorded in its docstring. If the two ever disagree, the Python is right and the port has a bug.

**That claim is enforced, not asserted.** `deploy/src/lib/__tests__/gst-reco-engine.test.ts` runs the JS engine over the same workbooks the Python consumed and asserts every Overview line to the paisa. Change either engine and that test tells you within seconds whether you broke the agreement.

### Why keep the Python at all?

Because step 1 — pulling the GST purchase register out of Tally — can only happen on a machine with Tally running. The browser cannot talk to port 9000. The Python owns the Tally boundary; the web module owns everything after it.

---

## 2. Folder map

```
deploy/gst-reco/
│
├── GST-RECO-MODULE-GUIDE.md    this file
├── READ_ME_FIRST.txt           the one-page version, for the operator
├── .gitignore                  keeps client data out of git
│
├── 1_INPUT/          ← YOU PUT FILES HERE
│     JC 2A 25-26.xlsx           GSTR-2A downloaded off the portal
│     JC 2A 26-27.xlsx
│
├── 2_GENERATE/       ← YOU DOUBLE-CLICK HERE
│     0_CHECK_TALLY_CONNECTION.bat
│     1_EXPORT_BOOKS.bat
│     2_RUN_2A_RECO.bat
│     2b_CHECK_2A_COLUMNS.bat
│     3_VENDOR_SUMMARY.bat
│     4_LEDGER_EXPORT.bat
│
├── 3_OUTPUT/         ← RESULTS APPEAR HERE
│     GST_Entries_*.xlsx              books, from step 1
│     GST_2A_Reco_FY2025-26.xlsx      reconciliation, from step 2
│     GST_2A_Reco_FY2026-27.xlsx
│     GST_Vendor_Summary_ByPeriod.xlsx
│
└── _engine/          ← THE CODE. DO NOT EDIT WHILE A RUN IS IN PROGRESS
      paths.py                  every folder is derived here, once
      tally_gst_entries.py      step 1 — Tally → books workbook
      tally_2a_reco.py          step 2 — the reconciliation engine
      vendor_state_summary.py   step 3 — vendor/state rollup
      vendor_gstin_gaps.py      vendors with a missing GSTIN in books
      tally_ledger_export.py    general ledger MIS (unrelated to 2A)
      tally_group_export.py     group-wise MIS (unrelated to 2A)
      tally_input_gst_statewise.py   Input-GST balances by state
      check_tally_config.py / diagnose_tally.py
      our_gstins.csv            the 19 registrations
```

### What is tracked in git and what is not

| Tracked | Ignored |
|---|---|
| `_engine/*.py`, `_engine/our_gstins.csv` | `1_INPUT/*` — the 2A workbooks |
| `2_GENERATE/*.bat` | `3_OUTPUT/*` — books and reco output |
| `*.md`, `*.txt`, `.gitkeep` | `__pycache__/`, `_cache/` |

**Why the data is excluded, in one sentence:** a file called `gst_reco_master_data.json` once sat in `deploy/public/data/`, and everything under `public/` is served to the open internet with no authentication — that file carried real vendor GSTINs and ₹24 crore of tax. It is now blocked by `.gitignore` and the module reads Supabase instead. Never put client financial data anywhere under `public/`, and never `git add -f` anything out of `1_INPUT` or `3_OUTPUT`.

**Relocating the folder is safe.** `paths.py` derives every path from its own file location and the `.bat` launchers use `%~dp0..\_engine`, so the whole tree can be moved or renamed and everything still resolves.

---

## 3. End-to-end data flow

```
  TALLY PRIME (port 9000)
        │
        │  1_EXPORT_BOOKS.bat  →  tally_gst_entries.py
        ▼
  3_OUTPUT/GST_Entries_*.xlsx          "the books"
        │                               sheet: Consolidated
        │                               + one sheet per state (presentation only)
        │
        ├──────────────────────────┐
        │                          │
  GST PORTAL                       │
        │                          │
        │  download GSTR-2A        │
        ▼                          │
  1_INPUT/JC 2A ##-##.xlsx         │    "the portal"
        │                          │
        │  2_RUN_2A_RECO.bat  →  tally_2a_reco.py
        ▼                          ▼
  3_OUTPUT/GST_2A_Reco_FY####-##.xlsx     ← the Excel answer
        │
        │  ─── OR, for the continuous view ───
        │
        │  upload both workbooks through the browser
        ▼
  Supabase   gst_books  ·  gst_portal                (raw, cumulative)
        │
        │  "Run Reconciliation Engine" →  gst-reco-engine.js
        ▼
  Supabase   gst_reco_runs  ·  gst_reco_rows  ·  gst_portal_only
        │
        ▼
  /dashboard/gst-reco-analytics                      ← the live answer
```

### The tables, in the order data reaches them

| Table | One row per | Written by |
|---|---|---|
| `gst_uploads` | file uploaded (SHA-256 unique — a double-click cannot duplicate) | upload |
| `gst_books` | book entry, keyed on a validated natural `row_key` | upload |
| `gst_portal` | portal **invoice** after rate-line collapsing | upload |
| `gst_payments` | creditor payment — **empty today**, see §6.4 | upload |
| `gst_reco_runs` | reconciliation run (overview, by_head, statutory, identity as JSONB) | run |
| `gst_reco_rows` | book row × run — bucket, tier, every statutory flag | run |
| `gst_portal_only` | leftover portal row × run — `PORTAL_ONLY` / `RCM` / `ISD` | run |
| `gst_vendor_actions` | vendor chase state — **survives re-runs**, this is the working layer | you |

Re-uploading the same month **replaces** rather than duplicates, because both `row_key`s are natural keys that were validated against the real data before being made unique: 0 collisions across 38,163 book rows. Dropping `supplier_gstin` from the book key leaves 111 collisions; dropping `section` from the portal key collides 82 amendment/original pairs — which is exactly the double-count that amendment resolution exists to prevent. **Do not shorten either key.**

---

## 4. How matching actually works

### 4.1 Before any matching — three things happen to the portal file

**a) Rate-line collapsing.** GSTR-2A reports B2B invoices one row per tax rate. Books hold one row per invoice. Lines are grouped on `(our GSTIN, supplier GSTIN, section, invoice no)` and summed; the rates seen are kept as a comma list on the invoice. Without this, a 3-rate invoice looks like three invoices and nothing ties.

**b) Amendment supersession.** A `B2BA` / `CDNA` row replaces the `B2B` / `CDN` row it amends, matched on (supplier GSTIN, normalised *original* document number). The superseded original is set aside, not deleted, and is reportable. Without this the same invoice matches twice — once at its original value and once amended — and the totals cannot tie.

**c) The QRMP 3B rule.** A QRMP supplier files GSTR-3B once a *quarter*. For the first two months of each quarter the portal reports "Not Filed" even though the quarter's return is filed in the third month. The rule: if a supplier has any filed 3B inside a calendar quarter, every invoice of that supplier in that quarter counts as covered. On real data this rescued 1,882 rows / ₹70.8 lakh, leaving 212 rows / ₹19.2 lakh genuinely unfiled — and confirmed the diagnosis exactly, because of 2,094 "Not Filed" rows, **none** fell in March, June, September or December.

> **3B filing status drives nothing.** It is carried as source data and shown, but no bucket depends on it. Acting on it wrongly put ₹1.37 crore into "at risk". The ISD sheet carries no 3B column at all. A match rests on invoice evidence, never on a filing status the portal reports unreliably.

### 4.2 The six match tiers

Each book row and each portal row is consumed **at most once**. Tiers are tried in order; the first hit wins.

| Tier | Key | Status written | Why it exists |
|---|---|---|---|
| **1** | supplier GSTIN + invoice no | `Matched` — or `Matched - amount differs` beyond ₹1 | the normal case |
| **2P** | supplier **PAN** + invoice no | `Matched on PAN - GSTIN differs by state` | a multi-state vendor sits on one Tally ledger, so books carry the Delhi GSTIN while 2A reports the Haryana one |
| **3** | invoice no + tax (no GSTIN in books) | `Matched - GSTIN missing in books` | the ledger master was never given a GSTIN |
| **4** | fuzzy supplier name ≥ 0.88 + invoice no + tax | `Probable - verify (0.xx)` | spelling and abbreviation drift between the master and the portal |
| **5** | GSTIN + invoice date + tax | `Probable - invoice no differs` | the invoice number was typed differently on both sides |

Two behaviours worth knowing:

- **Tiers 1 and 2P take the first unused candidate regardless of amount**, and the amount then decides the *label*. Tiers 3 and 5 skip a candidate that is outside tolerance entirely. This mirrors the Python exactly.
- **Tolerance is ₹1.00 on total tax, per invoice.** Name similarity threshold is 0.88.

### 4.3 The adjacent-year lookup

An unmatched book row is looked up in the **other year's** portal pool on (PAN, invoice no). If found, the row is labelled `Timing - found in FY####-## 2A (Mmm YYYY)` instead of `In books only - not in 2A`.

**The lookup only labels. It never consumes a portal row.** That is what keeps the two years independent so neither double-counts.

> ⚠️ **Always run both years together.** If one year is skipped, the other reports timing as 0 and moves every one of those invoices into AT RISK. On FY26-27 that is 345 invoices / ₹25,58,317.06 wrongly presented as exposure.

### 4.4 What is out of scope, and how that is decided

Out of scope is decided by **the GST bucket, not the voucher type**.

A row is out of scope only if it carries no ordinary GST (IGST/CGST/SGST/CESS all under ₹0.01) but does carry a special head (ISD, 17(5) reversal, or Other GST). Those never appear in 2A.

This was got wrong once and the cost was measured. "GST Journal" is how commission and service invoices (Swiggy, Zomato) get booked, and **95.2% of those rows — 12,761 of 13,404, ₹9.39 crore of tax — have their invoice number present in 2A.** Excluding by voucher type produced 23,018 false "In 2A only" rows worth ₹12.78 crore. Genuinely outside 2A is only 200 rows / ₹1.00 crore.

### 4.5 Inter-branch is matched, not excluded

Invoices where the supplier GSTIN contains our own PAN are **matched like any other supply and simply tagged**, so they can be filtered.

Excluding them on the books side while leaving their counterparts in the portal pool was asymmetric: 1,571 book rows (₹1,56,14,136.63) were held back while their 1,577 counterpart 2A invoices (₹1,58,97,549.68) fell straight into "In 2A only" — 55% of that pile was the company billing itself.

---

## 5. The Overview — every line, and what to do about it

This is the front sheet of the Excel and view 1 of the module. Figures below are the **verified FY 2025-26 / FY 2026-27** position as at the last run.

| # | Line | FY25-26 | FY26-27 | What it means | Action |
|---|---|---|---|---|---|
| **1** | Book entries in scope | 31,442 · ₹24,03,92,423.67 | 6,503 · ₹4,25,05,803.18 | purchases / journals / notes carrying ordinary GST | — |
| **2** | **MATCHED** — found in 2A | 29,905 · ₹23,32,32,528.41 | 5,902 · ₹3,85,67,011.17 | ITC available and supported | none |
| **3** | of which inter-company | 1,567 · ₹1,56,72,394.63 | 98 · ₹16,84,203.00 | own branches billing each other | none — a subset of line 2, not an addition |
| **4** | **TIMING** — in the other year's 2A | 18 · ₹2,43,705.88 | 345 · ₹25,58,317.06 | supplier filed in a different year | none, but watch s.16(4) |
| **5** | **AT RISK** — in books, NOT in 2A | 1,519 · ₹69,16,189.38 | 256 · ₹13,80,474.95 | ITC claimed the supplier has not reported — **s.16(2)(aa) exposure** | **chase the supplier** |
| **6** | In 2A, NOT in books | 3,980 · ₹1,07,22,997.54 | 1,816 · ₹90,18,577.51 | split three ways below — never act on this line as a whole | — |
| **6a** | ↳ supplier **CREDIT NOTES** not booked | 790 · **−₹57,41,394.15** | 272 · ₹7,69,801.84 | you claimed ITC the supplier later credited | **a LIABILITY, not an opportunity** — book the reversal |
| **6b** | ↳ party in books, reference/period differs | 2,777 · ₹1,60,40,743.31 | 1,294 · ₹66,91,893.51 | same supplier already dealt with | **verify — do NOT re-book** |
| **6c** | ↳ party NOT in books at all | 413 · ₹4,23,648.38 | 250 · ₹15,56,882.16 | the only genuinely unclaimed credit | check and book |
| **6.5** | Reverse charge — in 2A, tax paid by us | 568 · ₹24,44,494.11 | 126 · ₹6,20,482.69 | supplier reports it, **we** pay the tax | none — not ordinary ITC and not a gap |
| **7** | Out of scope (ISD / 17(5) reversal) | 200 · ₹1,00,20,769.48 | 18 · ₹9,55,153.24 | never appears in 2A | see ISD control |
| **8** | CHECK: 2 + 4 + 5 must equal 1 | ₹24,03,92,423.67 ✓ | ₹4,25,05,803.18 ✓ | in-scope identity | must tie exactly |
| **9** | BOOKS TOTAL (1 + 7) | 31,642 · ₹25,04,13,193.15 | 6,521 · ₹4,34,60,956.42 | ties to the step-1 workbook | must tie exactly |

**The two mistakes this table is built to stop:**

1. Reading line 6 as "unclaimed credit we should book". Most of it is not. Booking 6b re-books invoices you already have; 6a is money you *owe*.
2. Treating 6.5 (RCM) as a gap. Leaving RCM inside line 6 presented 604 invoices / ₹26,04,900.84 as unclaimed ITC — led by SmartShift Logistics with 492 invoices / ₹18,45,270.27 — when the tax on all of them is paid by us, not the vendor.

---

## 6. Statutory overlays

Reconciling is half the job. These test the *matched* credit against the conditions that govern whether it can be kept. **Every one of them flags for review and cites the provision. None silently excludes or reverses anything.**

### 6.1 s.16(2)(aa) — the credit must be reported by the supplier

This is not a separate check; it is why line 5 exists. Credit can only be taken on an invoice the supplier has reported, so a book entry with no portal counterpart is the exposure. Its mirror, line 6, is either unclaimed credit or an unrecognised liability.

### 6.2 s.16(4) — the 30 November cutoff

ITC on an invoice for a financial year cannot be taken after **30 November following the end of that year**, or the furnishing of the annual return, whichever is earlier. The 30-November limb is the one that binds in practice, so that is what is computed. If the annual return is filed first, the real date is earlier and the module must say so.

Each row gets `sec16_4_due`, `sec16_4_days` and a state:

| State | Meaning |
|---|---|
| `Open` | window still open |
| `Closing` | fewer than 60 days left |
| `Expired` | deadline passed — the credit has lapsed |

This is what turns "last year's invoice appearing in this year's 2A" from a label into an action: a FY25-26 invoice surfacing in FY26-27's 2A is only worth chasing while the window is open.

### 6.3 s.17(5) — blocked credits

Screened on **narration and voucher type only**. Deliberately conservative — it is a prompt to look, not a determination.

| Clause | Label | Skipped on |
|---|---|---|
| 17(5)(a) | Motor vehicle (≤13 seats) | |
| 17(5)(aa)/(ab) | Vessel / aircraft, or its insurance & repair | |
| 17(5)(b)(i) | Food, beverage, catering, beauty or health service | **Purchase vouchers** |
| 17(5)(b)(ii) | Club or health & fitness centre membership | |
| 17(5)(b)(iii) | Employee vacation travel benefit | |
| 17(5)(c)/(d) | Works contract / construction of immovable property | |
| 17(5)(fa) | CSR expenditure | |
| 17(5)(g) | Personal consumption | |
| 17(5)(h) | Goods lost, stolen, destroyed or written off | |
| 17(5)(h) | Goods **disposed of** as gift or free sample | **Purchase vouchers** |

Each flagged row is reconciled against what was actually booked: `Reversal already booked` needs no action; `Flagged - no reversal booked` is the item to review.

> ### ⚠️ The three traps this screen is built to avoid
>
> **1. Supplier NAME is never screened.** "Shree Narain Food Industries" is a supplier of stock-in-trade, not a blocked food expense.
>
> **2. Buying is not disposing.** A bare `gift` keyword flagged **240 rows worth ₹42.7 lakh** that were "purchase of gift items" and "gift box 860 Pcs" — gift boxes bought to *sell*. s.17(5)(h) blocks goods *disposed of* by way of gift or free sample, so the gift limb is scoped to disposal wording and skipped on Purchase vouchers entirely. Loss and write-off, which carry no such ambiguity, stay as their own rule.
>
> **3. Clause (b)(i) is skipped on Purchase vouchers.** Where inward food is used to make an outward taxable supply of the same category, the proviso to (b) restores the credit — and for a food business that is most of the ledger. Flagging it would bury the real hits.
>
> Keywords match on a word boundary at the **start only**, so `ltc` does not fire inside "multcolour" while `distribut` still catches "distributed".

### 6.4 Second proviso to s.16(2) — the 180-day rule

Where the recipient fails to pay the supplier within 180 days of the invoice date, the credit is added back to output tax with interest, and may be re-availed once payment is made.

**This overlay is built but inert.** It needs a creditors/payments export that the step-1 workbook does not carry. Until `gst_payments` has rows, every entry reports **`Awaiting payment data`**.

> It must never report "0 breaches". An unpaid-looking invoice that was in fact settled is a damaging false positive, and a zero implies a check that did not happen. `tally_ledger_export.py` is where the payments export would be added.

### 6.5 Rate plausibility

Any invoice dated **on or after 22-Sep-2025** carrying a slab withdrawn on that date is flagged `…% slab was withdrawn on 22-Sep-2025 - query the invoice`. Rates come from the portal side, which is where the rate is reported.

### 6.6 Cancelled supplier GSTIN

Flags credit taken on an invoice dated on or after the date the supplier's registration was cancelled. Applied to both matched rows and the portal-only pile.

### 6.7 Duplicate booking

The same supplier invoice entered twice, keyed on (PAN or GSTIN, normalised invoice no). Reconciliation does not catch this on its own — both copies can match different portal rows, or one matches while the other lands in AT RISK. Each member of a duplicate group gets `duplicate_group` and `duplicate_count`.

---

## 7. The self-checks — read these before you file anything

Every run prints and stores three checks:

| Check | Assertion |
|---|---|
| **in-scope identity** | matched + timing + at-risk **=** book entries in scope |
| **books identity** | in-scope + out-of-scope **=** books total |
| **no double-match** | portal rows consumed **=** matched count |

In Excel they print at the end of each year:

```
  books identity 250,413,193.15 vs 250,413,193.15  OK
  no double-match:                                 OK
```

**If either says `*** BROKEN ***`, the workbook is not trustworthy — do not file from it.**

In the web module the same checks are stored on `gst_reco_runs.identity`, and the store layer **refuses to persist a run whose identity fails**, throwing with the actual figures. A broken identity means the ITC numbers are wrong, so a saved-but-wrong run is worse than no run.

> `Dr = Cr` alone is **not** sufficient evidence of correctness. The old `ALLLEDGERENTRIES`/`LEDGERENTRIES` double-count bug balanced perfectly and was still doubling ledgers.

---

## 8. Excel sheet ↔ module view

| Excel sheet | Module view |
|---|---|
| `Overview` | 1 · Executive Overview |
| `Summary` (state-wise) + per-state sheets | 9 · State & GSTIN |
| `All_Detail` | 4 · Entry Grid |
| `Timing_Other_Year` | 4 · Entry Grid, bucket = TIMING |
| `At_Risk_In_Books_Not_In_2A` | 4 · Entry Grid, bucket = AT_RISK · 2 · Vendor Chase |
| `In_2A_Only` | 5 · In 2A Only, split 6a / 6b / 6c |
| `RCM_In_2A_Not_ITC` | 5 · In 2A Only, bucket = RCM |
| `Not_In_2A_ISD_Reversal` | 6 · ISD Control |
| `ISD_Control`, `ISD_2A_Invoices` | 6 · ISD Control |
| `Inter_Branch_Matched` | 4 · Entry Grid, inter-branch filter |
| `Superseded_By_Amendment` | 10 · Uploads, Mapping & Run Delta |
| `Column_Mapping` | 10 · Uploads, Mapping & Run Delta |
| — | 3 · Period Trend · 7 · s.16(4) · 8 · Statutory Exceptions · run delta |

**ISD cannot be matched invoice-by-invoice.** The 2A ISD sheet holds invoices *received by* the ISD registration; the book entries are monthly distribution journals carrying no invoice number and no supplier. They are opposite ends of the same mechanism. **Reconcile on totals only** — that is what `ISD_Control` does.

---

## 9. Monthly runbook

### Excel route — the full position

1. **Open Tally.** The title bar must read `TallyPrime Edit Log:9000`. The `:9000` suffix is the only proof the XML server is bound.
2. `2_GENERATE\1_EXPORT_BOOKS.bat` → writes `3_OUTPUT\GST_Entries_*.xlsx`.
3. **Download GSTR-2A** for both years off the portal into `1_INPUT\`. The financial year must be visible in the filename — `JC 2A 26-27.xlsx`, `GSTR2A_2026-2027 final.xlsx`, `2a 2627 v3.xlsx` all work. If two files claim the same year, the most recently modified wins. A file naming both years, or neither, is ignored.
4. **First time a 2A arrives in a new layout:** `2b_CHECK_2A_COLUMNS.bat`. It reconciles nothing and reports which column was read as what. Read it before trusting any reconciliation.
5. `2_RUN_2A_RECO.bat`. Tally is **not** needed. Press Enter at each prompt to accept the detected file, or paste a full path.
6. **Check both self-checks say OK** for both years.
7. `3_VENDOR_SUMMARY.bat` for the vendor and state rollup.

### Web route — the continuous view

1. Open `/dashboard/gst-reco-analytics` and sign in through the module gate.
2. Upload the books workbook (kind = `books`) and the 2A workbook (kind = `portal`, source = `2A` or `2B`) for the year.
3. Press **Run Reconciliation Engine**. It re-runs over the *whole* accumulated pool, so an invoice the supplier filed late matches on this run instead of sitting in AT RISK forever.
4. Read the run delta on view 10 — that is the thing the Excel cannot tell you.
5. Work view 2 (Vendor Chase). Chase state persists across runs.

**Do both years in the same sitting.** See §4.3.

---

## 10. Troubleshooting

### Tally will not answer

| Symptom | Cause | Fix |
|---|---|---|
| 0 bytes back | a second Tally instance owns port 9000 but has no company loaded | close every instance, restart the one with the company |
| Every request hangs | a License modal ("Unable to access the configured Tally Gateway Server") blocks all XML replies | dismiss it |
| Title bar has no `:9000` | Tally binds the port at startup — freeing it is not enough | restart Tally |
| Ran fine, now unresponsive mid-FY | Tally leaks memory across big Collection requests — 390 MB → 10.3 GB observed | restart Tally |

Run `0_CHECK_TALLY_CONNECTION.bat` first; it tests the port and changes nothing.

### Three Tally XML traps — do not reintroduce these

1. **Never use `ALLLEDGERENTRIES.*` wildcards in `<FETCH>`.** The wildcard drags in every GST/excise/VAT/bill/bank field. One month froze Tally's UI at 5.2 GB RSS and never answered — the 600 s timeout looked like "Tally is on a modal screen", which it was not. Naming leaves explicitly is ~15× faster for byte-identical parsed output.
2. **`ALLLEDGERENTRIES.LIST` and `LEDGERENTRIES.LIST` are two views of the SAME entries.** Purchase / Sales / Debit Note vouchers emit both, always identical. Reading both double-counts those ledgers by exactly 2×. Prefer `ALLLEDGERENTRIES`, fall back only if absent. `ACCOUNTINGALLOCATIONS.LIST` genuinely does not overlap.
3. **`CLOSINGBALANCE` lies for sub-periods.** It ignores `SVTODATE` and returns the end-of-data balance — Maharashtra Input CGST 9% reported −144,062,179.38 for Apr-2025, Jul-2026 *and* FY2026-27, the same number three times. `OPENINGBALANCE` honours `SVFROMDATE` correctly. **Closing at date Y = OPENINGBALANCE at Y+1 day.**

**How to verify any change to the export scripts:** compare computed `Opening + Debit − Credit` against Tally's own `CLOSINGBALANCE` for the same window, per ledger. Correct output = 0 mismatches across all ledgers.

### A year was skipped

```
SKIPPING FY2026-27 - missing: 2A - no file in 1_INPUT named for FY2026-27
```

The year token was not found in any filename in `1_INPUT`. Rename the file so the year shows. This matters more than it looks — see §4.3.

### The golden test skipped instead of running

The suite prints `source workbooks not found in … - skipping golden-number tests` when the data directory is absent, and vitest still reports green. **A skipped golden test proves nothing.** Point `GST_RECO_DIR` at the pipeline folder, or place the workbooks in `1_INPUT` / `3_OUTPUT`.

### Scale reference

One month of Join Commerce ≈ 15.5k vouchers, 47k entries, 1,900 ledgers, but only **11 top-level groups**. Writing 1,900 Excel tabs is the bottleneck — the Tally fetch itself takes seconds.

---

## 11. Access and security

### How access actually works

There are **two** boundaries, and only one of them is real.

| | |
|---|---|
| **The gate** (`public/js/gst-reco-gate.js`) | Supabase email/password sign-in plus a `user_access` check on the `gst-reco-analytics` slug. This is the **UX** boundary. `/api/module/<slug>` serves the HTML shell unauthenticated — as every module route in this repo does — so anyone with the URL can load the empty page. |
| **Postgres RLS** | `gst_has_access()` gates every `gst_*` table. A visitor with no session and no matching `user_access` row sees an **empty module**. This is the **security** boundary. |

### Three rules that follow from that

1. **Never ship module data as a static file under `public/`.** It is world-readable and bypasses both boundaries. This has happened once already.
2. **Never add a client-side PIN.** Anything compared in the browser is readable in the browser; a literal password in React source ships to every visitor in the JS bundle. A previous version compared `accessPin.length >= 4`, then a hardcoded literal — guarding a route that was directly reachable anyway.
3. **Views must be `security_invoker = on`.** Without it a view runs as its owner and quietly bypasses every policy above.

### Granting someone access

Add the `gst-reco-analytics` slug to their `allowed_modules` in the `user_access` table. The owner email is bypassed in the gate. Writes are admin-only everywhere except `gst_vendor_actions`, which is the one thing a viewer is meant to update.

---

## 12. Quick reference

| I want to… | Do this |
|---|---|
| Get this month's books out of Tally | `2_GENERATE\1_EXPORT_BOOKS.bat` |
| Reconcile books against 2A | `2_GENERATE\2_RUN_2A_RECO.bat` (Tally not needed) |
| Check a new 2A layout before trusting it | `2_GENERATE\2b_CHECK_2A_COLUMNS.bat` |
| Know who to chase | Excel `At_Risk_In_Books_Not_In_2A`, or module view 2 |
| Know what changed since last month | module view 10, run delta — the Excel cannot tell you |
| Know if the numbers are safe to file | the two self-checks, §7 |
| Prove the engine is still correct | `npx vitest run` in `deploy/` — it must **run**, not skip |
| Find why a rule exists | read the docstring above it in `tally_2a_reco.py`; every one records its measured cost |

---

*Engine spec: `_engine/tally_2a_reco.py`. Port: `deploy/public/js/gst-reco-engine.js`. Agreement enforced by `deploy/src/lib/__tests__/gst-reco-engine.test.ts`.*
