// Pure invoice → Tally conversion logic, shared by the browser tool
// (components/calculators/invoice-to-tally.tsx) and the automation API
// (app/api/invoice-to-tally). Keep in sync with automation/invoice-watcher/src/tally-xml.js,
// which is a verbatim port of these functions.

// One extracted invoice = one Tally voucher row (all amounts kept as strings for editing)
export interface TallyRow {
  id: number;
  File_Name: string;
  Invoice_Number: string;
  Invoice_Date: string; // as extracted / typed (DD-MM-YYYY preferred)
  Supplier_Name: string;
  Supplier_GSTIN: string;
  Taxable_Amount: string;
  CGST_Amount: string;
  SGST_Amount: string;
  IGST_Amount: string;
  Total_Amount: string;
  Party_Ledger: string;
  _src: string; // offline | AI | csv | manual
  _warn: string;
  _ledger?: "exact" | "fuzzy" | "new"; // match status vs the uploaded Tally ledger list
}

export interface VoucherSettings {
  company: string;
  voucherType: "Purchase" | "Sales";
  purchaseLedger: string;
  salesLedger: string;
  cgstLedger: string;
  sgstLedger: string;
  igstLedger: string;
  roundOffLedger: string;
}

export const ROW_HEADERS = [
  "File_Name", "Invoice_Number", "Invoice_Date", "Supplier_Name", "Supplier_GSTIN",
  "Taxable_Amount", "CGST_Amount", "SGST_Amount", "IGST_Amount", "Total_Amount", "Party_Ledger"
];

export const num = (v: any) => {
  if (v == null || v === "") return NaN;
  const n = parseFloat(String(v).replace(/[,₹\s]/g, ""));
  return isNaN(n) ? NaN : n;
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const xmlEsc = (s: any) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c] || c)
  );

// Parse common Indian invoice date formats to Tally's YYYYMMDD. Returns null when unsure —
// callers must surface that instead of guessing a wrong accounting period.
export const toTallyDate = (raw: string): string | null => {
  if (!raw) return null;
  const s = raw.trim();
  const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const pad = (n: number) => String(n).padStart(2, "0");
  const build = (d: number, m: number, y: number) => {
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}${pad(m)}${pad(d)}`;
  };
  // 12-01-2026 / 12/01/26 / 12.1.2026  (Indian convention: DD-MM-YYYY)
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) return build(+m[1], +m[2], +m[3]);
  // 2026-01-12 (ISO)
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) return build(+m[3], +m[2], +m[1]);
  // 12-Jan-2026 / 12 January 26
  m = s.match(/^(\d{1,2})[\s\-\/.]*([A-Za-z]{3,9})[\s\-\/.,]*(\d{2,4})$/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return build(+m[1], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[3]);
  // Jan 12, 2026
  m = s.match(/^([A-Za-z]{3,9})[\s\-.]*(\d{1,2})[\s,]*(\d{2,4})$/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return build(+m[2], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[3]);
  return null;
};

// Build one <VOUCHER> block. Tally convention: credits are positive with
// ISDEEMEDPOSITIVE=No, debits are negative with ISDEEMEDPOSITIVE=Yes; entries must sum to 0.
export const buildVoucherXml = (row: TallyRow, s: VoucherSettings): { xml: string; warn: string } => {
  const isPurchase = s.voucherType === "Purchase";
  const taxable = num(row.Taxable_Amount) || 0;
  const cgst = num(row.CGST_Amount) || 0;
  const sgst = num(row.SGST_Amount) || 0;
  const igst = num(row.IGST_Amount) || 0;
  let total = num(row.Total_Amount);
  if (isNaN(total) || total === 0) total = round2(taxable + cgst + sgst + igst);
  const diff = round2(total - (taxable + cgst + sgst + igst));
  let warn = "";
  if (Math.abs(diff) > 10) warn = `Round-off ₹${Math.abs(diff).toFixed(2)} is large — verify amounts`;

  const date = toTallyDate(row.Invoice_Date);
  if (!date) return { xml: "", warn: "Invalid/missing date — row skipped" };

  const party = (row.Party_Ledger || row.Supplier_Name || "").trim();
  if (!party) return { xml: "", warn: "Missing party ledger — row skipped" };
  if (total <= 0) return { xml: "", warn: "Missing/zero total — row skipped" };

  const vchNo = row.Invoice_Number && row.Invoice_Number !== "Missing" ? row.Invoice_Number : row.File_Name;

  // sign helpers: dr = debit line, cr = credit line
  const entry = (ledger: string, amount: number, isDebit: boolean, billAlloc = false) => {
    if (round2(Math.abs(amount)) === 0) return "";
    const amt = (isDebit ? -Math.abs(amount) : Math.abs(amount)).toFixed(2);
    return `
    <ALLLEDGERENTRIES.LIST>
     <LEDGERNAME>${xmlEsc(ledger)}</LEDGERNAME>
     <ISDEEMEDPOSITIVE>${isDebit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
     <AMOUNT>${amt}</AMOUNT>${billAlloc ? `
     <BILLALLOCATIONS.LIST>
      <NAME>${xmlEsc(vchNo)}</NAME>
      <BILLTYPE>New Ref</BILLTYPE>
      <AMOUNT>${amt}</AMOUNT>
     </BILLALLOCATIONS.LIST>` : ""}
    </ALLLEDGERENTRIES.LIST>`;
  };

  let lines = "";
  if (isPurchase) {
    // Party credited with total; expense + input GST debited
    lines += entry(party, total, false, true);
    lines += entry(s.purchaseLedger, taxable, true);
    lines += entry(s.cgstLedger, cgst, true);
    lines += entry(s.sgstLedger, sgst, true);
    lines += entry(s.igstLedger, igst, true);
    // Balance: whatever the debits are short of total goes to round-off as a debit
    // (or credit when negative) so the voucher always balances and imports cleanly.
    if (Math.abs(diff) >= 0.01) lines += entry(s.roundOffLedger, Math.abs(diff), diff > 0);
  } else {
    // Sales: party debited with total; income + output GST credited
    lines += entry(party, total, true, true);
    lines += entry(s.salesLedger, taxable, false);
    lines += entry(s.cgstLedger, cgst, false);
    lines += entry(s.sgstLedger, sgst, false);
    lines += entry(s.igstLedger, igst, false);
    if (Math.abs(diff) >= 0.01) lines += entry(s.roundOffLedger, Math.abs(diff), diff < 0);
  }

  const narration = `${isPurchase ? "Purchase" : "Sales"} against invoice ${vchNo} dt ${row.Invoice_Date}${row.Supplier_Name ? ` — ${row.Supplier_Name}` : ""} (imported via NumberIQ)`;

  const xml = `
  <TALLYMESSAGE xmlns:UDF="TallyUDF">
   <VOUCHER VCHTYPE="${s.voucherType}" ACTION="Create">
    <DATE>${date}</DATE>
    <EFFECTIVEDATE>${date}</EFFECTIVEDATE>
    <VOUCHERTYPENAME>${s.voucherType}</VOUCHERTYPENAME>
    <VOUCHERNUMBER>${xmlEsc(vchNo)}</VOUCHERNUMBER>
    <REFERENCE>${xmlEsc(vchNo)}</REFERENCE>
    <REFERENCEDATE>${date}</REFERENCEDATE>
    <PARTYLEDGERNAME>${xmlEsc(party)}</PARTYLEDGERNAME>
    <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
    <NARRATION>${xmlEsc(narration)}</NARRATION>${lines}
   </VOUCHER>
  </TALLYMESSAGE>`;
  return { xml, warn };
};

export const buildEnvelope = (inner: string, company: string, report: "Vouchers" | "All Masters") => `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>${report}</REPORTNAME>${company ? `
    <STATICVARIABLES>
     <SVCURRENTCOMPANY>${xmlEsc(company)}</SVCURRENTCOMPANY>
    </STATICVARIABLES>` : ""}
   </REQUESTDESC>
   <REQUESTDATA>${inner}
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;

// ---- Tally ledger-name matching (local fuzzy logic, no AI) ----

// Normalize a party name for comparison: lowercase, drop punctuation and the
// company-suffix noise that makes "ABC Traders Pvt. Ltd." ≠ "ABC Traders Private Limited".
export const normName = (s: string) =>
  String(s || "").toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(private|pvt|limited|ltd|llp|co|company|india|enterprises|enterprise|traders|trading|corporation|corp|inc)\b/g, " ")
    .replace(/\s+/g, " ").trim();

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
};

// Best existing Tally ledger for a supplier name, or null. Threshold is deliberately
// conservative — a wrong auto-match posts to the wrong supplier account, which is worse
// than creating a fresh ledger.
export const findLedgerMatch = (supplier: string, ledgers: string[]): { name: string; kind: "exact" | "fuzzy" } | null => {
  if (!ledgers.length || !supplier) return null;
  const target = normName(supplier);
  if (!target) return null;
  for (const l of ledgers) {
    if (normName(l) === target) return { name: l, kind: "exact" };
  }
  let best: string | null = null, bestScore = 0;
  for (const l of ledgers) {
    const n = normName(l);
    if (!n) continue;
    const maxLen = Math.max(target.length, n.length);
    let score = maxLen ? 1 - levenshtein(target, n) / maxLen : 0;
    if (n.includes(target) || target.includes(n)) score = Math.max(score, 0.85);
    if (score > bestScore) { bestScore = score; best = l; }
  }
  return bestScore >= 0.8 && best ? { name: best, kind: "fuzzy" } : null;
};

// Ledger masters for parties so a fresh Tally company imports without "ledger does not exist"
// errors. Parties already present in `existingLedgers` are skipped to avoid duplicates.
export const buildMastersXml = (rows: TallyRow[], s: VoucherSettings, existingLedgers: string[] = []) => {
  const isPurchase = s.voucherType === "Purchase";
  const seen = new Set<string>();
  const existing = new Set(existingLedgers.map(normName));
  let skipped = 0;
  let inner = "";
  rows.forEach(r => {
    const party = (r.Party_Ledger || r.Supplier_Name || "").trim();
    if (!party || seen.has(party.toLowerCase())) return;
    if (existing.size && existing.has(normName(party))) { skipped++; return; }
    seen.add(party.toLowerCase());
    const gstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test((r.Supplier_GSTIN || "").toUpperCase())
      ? r.Supplier_GSTIN.toUpperCase() : "";
    inner += `
  <TALLYMESSAGE xmlns:UDF="TallyUDF">
   <LEDGER NAME="${xmlEsc(party)}" ACTION="Create">
    <NAME.LIST><NAME>${xmlEsc(party)}</NAME></NAME.LIST>
    <PARENT>${isPurchase ? "Sundry Creditors" : "Sundry Debtors"}</PARENT>
    <ISBILLWISEON>Yes</ISBILLWISEON>
    <COUNTRYNAME>India</COUNTRYNAME>${gstin ? `
    <PARTYGSTIN>${gstin}</PARTYGSTIN>
    <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>` : ""}
   </LEDGER>
  </TALLYMESSAGE>`;
  });
  return { xml: buildEnvelope(inner, s.company, "All Masters"), count: seen.size, skipped };
};

// Heuristic parse of raw invoice text (same approach as the Invoice Compliance tool,
// trimmed to the fields a voucher needs).
export const parseInvoiceHeuristic = (text: string, fileName: string, ownGstin: string) => {
  const T = text.replace(/\r/g, "");
  const lines = T.split("\n").map(x => x.trim()).filter(Boolean);
  const flat = T.replace(/\s+/g, " ");
  const U = T.toUpperCase();
  const MONEY = "(?:[0-9]{1,3}(?:,[0-9]{2,3})+(?:\\.[0-9]{1,2})?|[0-9]+\\.[0-9]{2})";
  const r: any = { File_Name: fileName };

  // GSTINs: prefer the one that is NOT our own as the supplier
  const gstRe = /\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/g;
  const own = ownGstin.split(/[,\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
  const gstins = [...new Set([...U.matchAll(gstRe)].map(m => m[0]))];
  r.Supplier_GSTIN = gstins.find(g => !own.includes(g)) || "";

  // Invoice number
  let inv = "";
  const invG = /(?:tax\s*invoice|invoice|inv|bill)\s*(?:no|number|num|#)\s*[:#\-\.]?\s*([A-Za-z0-9][A-Za-z0-9\/\-]{1,28})/ig;
  let g;
  while ((g = invG.exec(flat))) {
    const c = g[1].replace(/[.,;:]+$/, "");
    if (/\d/.test(c) && !/^date|^dated/i.test(c)) { inv = c; break; }
  }
  r.Invoice_Number = inv;

  // Date near a "date" label first, else first date-looking token
  let date = "";
  const monRe = /\b(\d{1,2}[-\/. ](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\/. ]\d{2,4})\b/i;
  const numRe = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/;
  for (const ln of lines) {
    if (/date|dated/i.test(ln) && !/due\s*date/i.test(ln)) {
      const mm = ln.match(numRe) || ln.match(monRe);
      if (mm) { date = mm[1]; break; }
    }
  }
  if (!date) { const mm = flat.match(numRe) || flat.match(monRe); if (mm) date = mm[1]; }
  r.Invoice_Date = date;

  const lastMoney = (sx: string) => {
    const a = [...sx.matchAll(new RegExp(MONEY, "g"))].map(x => x[0]);
    return a.length ? a[a.length - 1].replace(/,/g, "") : null;
  };
  const amtWith = (keys: RegExp, excl?: RegExp) => {
    for (const ln of lines) {
      if (excl && excl.test(ln)) continue;
      if (keys.test(ln)) { const v = lastMoney(ln); if (v) return v; }
    }
    return null;
  };
  const amtWithMax = (keys: RegExp, excl?: RegExp) => {
    let best: number | null = null, bestStr: string | null = null;
    for (const ln of lines) {
      if (excl && excl.test(ln)) continue;
      if (keys.test(ln)) {
        const v = lastMoney(ln);
        if (v == null) continue;
        const n = parseFloat(v);
        if (!isNaN(n) && (best === null || n > best)) { best = n; bestStr = v; }
      }
    }
    return bestStr;
  };

  r.CGST_Amount = amtWith(/\bCGST\b/i, /cess/i) || "0";
  r.SGST_Amount = amtWith(/\b(SGST|UTGST)\b/i, /cess/i) || "0";
  r.IGST_Amount = amtWith(/\bIGST\b/i, /cess/i) || "0";
  r.Taxable_Amount = amtWith(/taxable\s*(value|amount)|sub\s*total|amount\s*before\s*tax|net\s*(amount|total|value)/i) || "";
  let tot = amtWithMax(/grand\s*total|total\s*amount|invoice\s*total|amount\s*payable|net\s*payable|amount\s*chargeable|total\s*value/i, /sub\s*total|taxable/i);
  if (!tot) tot = amtWithMax(/^total\b/i, /sub\s*total|taxable/i);
  r.Total_Amount = tot || "";

  // Supplier name: first plausible line at the top that isn't boilerplate
  let sup = "";
  const skip = /^(tax\s*invoice|invoice|e-?invoice|original|duplicate|triplicate|gst\s*tax\s*invoice|irn\b|ack\s*no|ack\s*date|for\s*recipient|gstin)/i;
  for (const ln of lines.slice(0, 8)) {
    if (skip.test(ln)) continue;
    if (ln.length < 4 || !/[A-Za-z]{3}/.test(ln)) continue;
    const name = ln.split(/\b(?:Invoice\s*No|Dated|e-?Way\s*Bill|Delivery\s*Note|Mode\/Terms|Reference\s*No)\b/i)[0].trim().replace(/[\s,.:-]+$/, "");
    if (name.length >= 4) { sup = name; break; }
  }
  r.Supplier_Name = sup;

  let quality = 0;
  ["Invoice_Number", "Invoice_Date", "Supplier_GSTIN", "Total_Amount", "Supplier_Name"].forEach(k => { if (r[k]) quality++; });
  r.__quality = quality;
  return r;
};

// A heuristic parse is only trusted when its values are *correct*, not merely present —
// a regex can grab the wrong number and still fill every field. Failing any of these
// checks escalates the file to the AI tier (when a key is available).
export const isTrustworthyParse = (h: any): boolean => {
  if (!h || (h.__quality ?? 0) < 4) return false;
  if (!toTallyDate(h.Invoice_Date || "")) return false;
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test((h.Supplier_GSTIN || "").toUpperCase())) return false;
  const tax = num(h.Taxable_Amount), total = num(h.Total_Amount);
  if (isNaN(tax) || isNaN(total) || total <= 0) return false;
  const sum = tax + (num(h.CGST_Amount) || 0) + (num(h.SGST_Amount) || 0) + (num(h.IGST_Amount) || 0);
  return Math.abs(total - sum) <= Math.max(1, total * 0.001);
};
