"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Trash2,
  Play,
  FileSpreadsheet,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileCode2,
  BookOpen
} from "lucide-react";

// One extracted invoice = one Tally voucher row (all amounts kept as strings for editing)
interface TallyRow {
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

interface QueueItem {
  file: File;
  status: "queued" | "proc" | "done" | "err";
  error?: string;
}

const ROW_HEADERS = [
  "File_Name", "Invoice_Number", "Invoice_Date", "Supplier_Name", "Supplier_GSTIN",
  "Taxable_Amount", "CGST_Amount", "SGST_Amount", "IGST_Amount", "Total_Amount", "Party_Ledger"
];

const FREE_BATCH_LIMIT = 10;

let nextRowId = 1;

// ---------- Pure helpers (kept at module level so they are testable) ----------

const num = (v: any) => {
  if (v == null || v === "") return NaN;
  const n = parseFloat(String(v).replace(/[,₹\s]/g, ""));
  return isNaN(n) ? NaN : n;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const xmlEsc = (s: any) =>
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

// ---------- Component ----------

export function InvoiceToTally() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [rows, setRows] = useState<TallyRow[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [apiKey, setApiKey] = useState("");
  const [keyMasked, setKeyMasked] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [ledgerNames, setLedgerNames] = useState<string[]>([]);
  const [settings, setSettings] = useState<VoucherSettings & { ownGstin: string }>({
    company: "",
    voucherType: "Purchase",
    purchaseLedger: "Purchase A/c",
    salesLedger: "Sales A/c",
    cgstLedger: "Input CGST",
    sgstLedger: "Input SGST",
    igstLedger: "Input IGST",
    roundOffLedger: "Round Off",
    ownGstin: ""
  });

  // Settings and the uploaded ledger list survive page reloads — losing them on every
  // visit would force the user to re-configure ledger names each session.
  useEffect(() => {
    try {
      const s = localStorage.getItem("i2t_settings");
      if (s) setSettings(prev => ({ ...prev, ...JSON.parse(s) }));
      const l = localStorage.getItem("i2t_ledgers");
      if (l) setLedgerNames(JSON.parse(l));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("i2t_settings", JSON.stringify(settings)); } catch {}
  }, [settings]);
  useEffect(() => {
    try { localStorage.setItem("i2t_ledgers", JSON.stringify(ledgerNames)); } catch {}
  }, [ledgerNames]);

  useEffect(() => {
    const loadScript = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => res();
      el.onerror = () => rej(new Error(`Failed to load ${src}`));
      document.head.appendChild(el);
    });
    (async () => {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          try {
            const blob = new Blob(["importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');"], { type: "application/javascript" });
            pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
          } catch {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
        }
        setScriptsLoaded(true);
      } catch (e: any) {
        setLoadingError(e.message || "Engine failed to load");
      }
    })();
    try {
      const saved = localStorage.getItem("anthropic_api_key") || "";
      if (saved) {
        setApiKey(saved.length > 12 ? `${saved.slice(0, 7)}…${saved.slice(-4)}` : saved);
        setKeyMasked(true);
      }
    } catch {}
  }, []);

  const getRawKey = () => {
    try { return localStorage.getItem("anthropic_api_key") || ""; } catch { return ""; }
  };

  const saveKey = () => {
    const k = apiKey.trim();
    if (!k || keyMasked) return;
    try { localStorage.setItem("anthropic_api_key", k); } catch {}
    setApiKey(`${k.slice(0, 7)}…${k.slice(-4)}`);
    setKeyMasked(true);
  };

  const clearKey = () => {
    try { localStorage.removeItem("anthropic_api_key"); } catch {}
    setApiKey("");
    setKeyMasked(false);
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error("PDF engine unavailable");
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    const maxP = Math.min(pdf.numPages, 10);
    for (let p = 1; p <= maxP; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      let lastY: number | null = null, line = "";
      for (const item of tc.items) {
        const y = item.transform ? item.transform[5] : 0;
        if (lastY !== null && Math.abs(y - lastY) > 2) { out += line + "\n"; line = ""; }
        line += (line ? " " : "") + (item.str || "");
        lastY = y;
      }
      out += line + "\n";
    }
    return out;
  };

  const callAI = async (file: File): Promise<any> => {
    const key = getRawKey();
    if (!key) throw new Error("No AI key set — scanned/image invoices need an Anthropic API key (Settings)");
    const b64: string = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const s = String(fr.result); res(s.slice(s.indexOf(",") + 1)); };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const t = (file.type || "").toLowerCase();
    const isPdf = t.includes("pdf") || /\.pdf$/i.test(file.name);
    const block: any = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
      : { type: "image", source: { type: "base64", media_type: t.startsWith("image/") ? t : "image/png", data: b64 } };
    const prompt = [
      "You are a precise OCR data-extraction engine for Indian GST invoices.",
      "Read the attached invoice and return ONLY a minified JSON object with EXACTLY these keys:",
      '"Invoice_Number","Invoice_Date","Supplier_Name","Supplier_GSTIN","Taxable_Amount","CGST_Amount","SGST_Amount","IGST_Amount","Total_Amount".',
      "Rules: absent field => empty string \"\". Amounts: plain number string, no commas/symbols, two decimals. If a tax head does not apply use \"0\". Invoice_Date as DD-MM-YYYY. Use amounts exactly as printed.",
      "Output the JSON now."
    ].join("\n");
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 800,
        messages: [{ role: "user", content: [block, { type: "text", text: prompt }] }]
      })
    });
    if (!resp.ok) {
      let d = "";
      try { d = (await resp.json()).error?.message || ""; } catch {}
      throw new Error(`AI error ${resp.status}${d ? ": " + d : ""}`);
    }
    const data = await resp.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("No JSON from AI");
    return JSON.parse(text.slice(start, end + 1));
  };

  const toRow = (raw: any, fileName: string, src: string): TallyRow => {
    const gstinOk = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test((raw.Supplier_GSTIN || "").toUpperCase());
    const warns: string[] = [];
    if (src === "offline-low") warns.push("rough read — verify all fields (add an AI key for accurate reading of this invoice)");
    if (!toTallyDate(raw.Invoice_Date || "")) warns.push("date?");
    if (!num(raw.Total_Amount)) warns.push("total?");
    if (!gstinOk && raw.Supplier_GSTIN) warns.push("gstin?");
    return {
      id: nextRowId++,
      File_Name: fileName,
      Invoice_Number: raw.Invoice_Number || "",
      Invoice_Date: raw.Invoice_Date || "",
      Supplier_Name: raw.Supplier_Name || "",
      Supplier_GSTIN: (raw.Supplier_GSTIN || "").toUpperCase(),
      Taxable_Amount: String(raw.Taxable_Amount ?? ""),
      CGST_Amount: String(raw.CGST_Amount ?? "0"),
      SGST_Amount: String(raw.SGST_Amount ?? "0"),
      IGST_Amount: String(raw.IGST_Amount ?? "0"),
      Total_Amount: String(raw.Total_Amount ?? ""),
      Party_Ledger: raw.Supplier_Name || "",
      _src: src,
      _warn: warns.join(" ")
    };
  };

  const runExtraction = async () => {
    if (running) return;
    const pending = queue.filter(q => q.status !== "done");
    if (!pending.length) return;
    if (rows.length + pending.length > FREE_BATCH_LIMIT) {
      alert(`Free version processes up to ${FREE_BATCH_LIMIT} invoices per batch. For unlimited bulk processing, contact us via the Contact page.`);
      return;
    }
    setRunning(true);
    let done = 0;
    setProgress({ done: 0, total: pending.length });
    const newRows: TallyRow[] = [];
    for (const q of pending) {
      q.status = "proc";
      setQueue([...queue]);
      try {
        const isPdf = (q.file.type || "").includes("pdf") || /\.pdf$/i.test(q.file.name);
        let raw: any = null, src = "";
        let offlineTry: any = null;
        if (isPdf) {
          try {
            const text = await extractPdfText(q.file);
            if (text.replace(/\s/g, "").length >= 80) {
              offlineTry = parseInvoiceHeuristic(text, q.file.name, settings.ownGstin);
              // Only trust the free offline read when its values pass correctness
              // checks — otherwise a misparse would silently enter Tally.
              if (isTrustworthyParse(offlineTry)) { raw = offlineTry; src = "offline"; }
            }
          } catch {}
        }
        if (!raw && getRawKey()) { raw = await callAI(q.file); src = "AI"; }
        if (!raw && offlineTry) { raw = offlineTry; src = "offline-low"; } // no AI key — keep the rough read, flagged for review
        if (!raw) { raw = await callAI(q.file); src = "AI"; } // non-PDF with no key: surfaces the "needs key" error
        newRows.push(toRow(raw, q.file.name, src));
        q.status = "done";
      } catch (e: any) {
        q.status = "err";
        q.error = e.message || "unreadable";
        newRows.push({ ...toRow({}, q.file.name, "error"), _warn: e.message || "extraction failed" });
      }
      done++;
      setProgress({ done, total: pending.length });
    }
    setRows(prev => [...prev, ...newRows]);
    setRunning(false);
  };

  // CSV / Excel register import (accepts the Invoice Compliance tool's export headers too)
  const handleRegisterFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const XLSX = (window as any).XLSX;
    if (!XLSX) { alert("Excel engine still loading — try again in a moment."); return; }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const pick = (o: any, ...names: string[]) => {
      for (const n of names) {
        const k = Object.keys(o).find(x => x.trim().toLowerCase().replace(/[\s_]/g, "") === n.toLowerCase().replace(/[\s_]/g, ""));
        if (k && o[k] !== "") return o[k];
      }
      return "";
    };
    const imported = data.map(o => toRow({
      Invoice_Number: pick(o, "Invoice_Number", "Invoice No", "InvNo", "Bill No"),
      Invoice_Date: pick(o, "Invoice_Date", "Date", "Bill Date"),
      Supplier_Name: pick(o, "Supplier_Name", "Supplier", "Vendor", "Party", "Party Name"),
      Supplier_GSTIN: pick(o, "Supplier_GSTIN", "GSTIN", "Vendor GSTIN"),
      Taxable_Amount: pick(o, "Taxable_Amount", "Taxable", "Taxable Value"),
      CGST_Amount: pick(o, "CGST_Amount", "CGST") || "0",
      SGST_Amount: pick(o, "SGST_Amount", "SGST") || "0",
      IGST_Amount: pick(o, "IGST_Amount", "IGST") || "0",
      Total_Amount: pick(o, "Total_Amount", "Total", "Invoice Value", "Grand Total")
    }, pick(o, "File_Name", "File") || file.name, "csv")).filter(r => r.Invoice_Number || r.Total_Amount);
    if (!imported.length) { alert("No usable rows found — check the column headers."); return; }
    setRows(prev => [...prev, ...imported]);
  };

  const addManualRow = () => {
    setRows(prev => [...prev, toRow({ CGST_Amount: "0", SGST_Amount: "0", IGST_Amount: "0" }, "manual", "manual")]);
  };

  // Tally ledger list upload (export from Tally: Chart of Accounts → Ledgers → Alt+E)
  const handleLedgerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const XLSX = (window as any).XLSX;
    if (!XLSX) { alert("Excel engine still loading — try again in a moment."); return; }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const names = new Set<string>();
    wb.SheetNames.forEach((sn: string) => {
      const aoa: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "" });
      let nameCol = -1;
      for (const row of aoa.slice(0, 10)) {
        row.forEach((c, i) => { if (nameCol < 0 && /^(ledger\s*)?name|particulars|ledgers?$/i.test(String(c).trim())) nameCol = i; });
        if (nameCol >= 0) break;
      }
      aoa.forEach(row => {
        const cells = nameCol >= 0 ? [row[nameCol]] : row;
        cells.forEach(c => {
          const v = String(c == null ? "" : c).trim();
          if (v.length >= 3 && /[A-Za-z]{2}/.test(v) && !/^\d[\d,.\-\/\s]*$/.test(v) &&
              !/^(ledger\s*)?name$|^particulars$|^ledgers?$|^list of (accounts|ledgers)$|^closing balance$|^opening balance$|^debit$|^credit$/i.test(v)) names.add(v);
        });
      });
    });
    const list = [...names];
    if (!list.length) { alert("No ledger names found in that file — export from Tally: Chart of Accounts → Ledgers → Alt+E → Excel/CSV."); return; }
    setLedgerNames(list);
    if (rows.length) applyLedgerMatching(list);
  };

  const applyLedgerMatching = (ledgers: string[] = ledgerNames) => {
    if (!ledgers.length) { alert("First upload your Tally ledger list (settings panel).\n\nExport it from Tally: Chart of Accounts → Ledgers → Alt+E → Excel/CSV."); return; }
    let exact = 0, fuzzy = 0, fresh = 0;
    setRows(prev => prev.map(r => {
      const m = findLedgerMatch(r.Party_Ledger || r.Supplier_Name, ledgers);
      if (m) {
        m.kind === "exact" ? exact++ : fuzzy++;
        return { ...r, Party_Ledger: m.name, _ledger: m.kind };
      }
      fresh++;
      return { ...r, _ledger: "new" as const };
    }));
    setTimeout(() => alert(`Ledger matching done:\n✓ ${exact} exact match(es)\n≈ ${fuzzy} close match(es) (name replaced with your Tally spelling — please verify)\n＋ ${fresh} new supplier(s) — will be created via Ledger Masters XML`), 50);
  };

  const updateRow = (id: number, field: keyof TallyRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const upd: TallyRow = { ...r, [field]: value };
      if (field === "Supplier_Name" && (!r.Party_Ledger || r.Party_Ledger === r.Supplier_Name)) upd.Party_Ledger = value;
      if ((field === "Party_Ledger" || field === "Supplier_Name") && ledgerNames.length) {
        const m = findLedgerMatch(upd.Party_Ledger, ledgerNames);
        upd._ledger = m && normName(m.name) === normName(upd.Party_Ledger) ? m.kind : "new";
      }
      const warns: string[] = [];
      if (!toTallyDate(upd.Invoice_Date)) warns.push("date?");
      if (!num(upd.Total_Amount)) warns.push("total?");
      upd._warn = warns.join(" ");
      return upd;
    }));
  };

  const deleteRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));

  const downloadText = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  const stamp = () => new Date().toISOString().slice(0, 10);

  const exportVouchersXml = () => {
    let inner = "", skipped: string[] = [], warned: string[] = [];
    rows.forEach(r => {
      const { xml, warn } = buildVoucherXml(r, settings);
      if (!xml) skipped.push(`${r.Invoice_Number || r.File_Name}: ${warn}`);
      else { inner += xml; if (warn) warned.push(`${r.Invoice_Number}: ${warn}`); }
    });
    if (!inner) { alert("No valid rows to export.\n" + skipped.join("\n")); return; }
    if (skipped.length || warned.length) {
      alert(`Exported with notes:\n${[...skipped, ...warned].join("\n")}`);
    }
    downloadText(`tally_vouchers_${stamp()}.xml`, buildEnvelope(inner, settings.company, "Vouchers"), "text/xml;charset=utf-8");
  };

  const exportMastersXml = () => {
    const { xml, count, skipped } = buildMastersXml(rows, settings, ledgerNames);
    if (!count) {
      alert(skipped ? `All ${skipped} part(ies) already exist in your Tally — no masters needed. Import only the Vouchers XML.` : "No party ledgers to create.");
      return;
    }
    if (skipped) alert(`${skipped} part(ies) already exist in your Tally and were skipped — only ${count} new ledger(s) will be created.`);
    downloadText(`tally_ledger_masters_${stamp()}.xml`, xml, "text/xml;charset=utf-8");
  };

  const exportExcel = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { alert("Excel engine still loading — try again in a moment."); return; }
    const NUMERIC = new Set(["Taxable_Amount", "CGST_Amount", "SGST_Amount", "IGST_Amount", "Total_Amount"]);
    const aoa = [ROW_HEADERS, ...rows.map(r => ROW_HEADERS.map(h => {
      const v = (r as any)[h];
      if (v == null || v === "") return "";
      if (NUMERIC.has(h)) { const n = Number(v); return isNaN(n) ? String(v) : n; }
      return String(v);
    }))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = ROW_HEADERS.map(h => ({ wch: Math.min(40, Math.max(10, h.length + 2)) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Register");
    XLSX.writeFile(wb, `invoice_register_${stamp()}.xlsx`);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-[#737c92] transition-colors";
  const cellCls = "w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#4f7cff] focus:bg-white/5 focus:outline-none rounded px-1.5 py-1 text-[11px] text-white transition-colors";
  const labelCls = "text-[9px] font-bold text-[#aab2c5] uppercase tracking-wider";

  if (loadingError) {
    return (
      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex items-center gap-2">
        <AlertTriangle size={16} /> {loadingError} — check your connection and reload.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Settings */}
      <div className="border border-white/5 bg-white/5 rounded-2xl">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between p-4 cursor-pointer"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Settings size={14} /> Company & Ledger Mapping
          </span>
          <span className="text-[10px] text-[#737c92]">{showSettings ? "Hide" : "Show"}</span>
        </button>
        {showSettings && (
          <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Tally Company Name (optional — blank = currently open company)</label>
              <input className={inputCls} value={settings.company} placeholder="e.g. ABC Traders Pvt Ltd"
                onChange={e => setSettings({ ...settings, company: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Voucher Type</label>
              <select className={inputCls} value={settings.voucherType}
                onChange={e => setSettings({ ...settings, voucherType: e.target.value as "Purchase" | "Sales" })}>
                <option value="Purchase">Purchase (supplier invoices)</option>
                <option value="Sales">Sales (your invoices)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Your GSTIN (excluded from supplier detection)</label>
              <input className={inputCls} value={settings.ownGstin} placeholder="27XXXXX0000X1Z5"
                onChange={e => setSettings({ ...settings, ownGstin: e.target.value })} />
            </div>
            {settings.voucherType === "Purchase" ? (
              <div>
                <label className={labelCls}>Purchase Ledger</label>
                <input className={inputCls} value={settings.purchaseLedger}
                  onChange={e => setSettings({ ...settings, purchaseLedger: e.target.value })} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Sales Ledger</label>
                <input className={inputCls} value={settings.salesLedger}
                  onChange={e => setSettings({ ...settings, salesLedger: e.target.value })} />
              </div>
            )}
            <div>
              <label className={labelCls}>CGST Ledger</label>
              <input className={inputCls} value={settings.cgstLedger}
                onChange={e => setSettings({ ...settings, cgstLedger: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>SGST Ledger</label>
              <input className={inputCls} value={settings.sgstLedger}
                onChange={e => setSettings({ ...settings, sgstLedger: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>IGST Ledger</label>
              <input className={inputCls} value={settings.igstLedger}
                onChange={e => setSettings({ ...settings, igstLedger: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Round-off Ledger</label>
              <input className={inputCls} value={settings.roundOffLedger}
                onChange={e => setSettings({ ...settings, roundOffLedger: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Anthropic AI Key (for scanned/image invoices — optional)</label>
              <div className="flex gap-2">
                <input className={inputCls} type={keyMasked ? "text" : "password"} value={apiKey} placeholder="sk-ant-…"
                  readOnly={keyMasked}
                  onChange={e => { setApiKey(e.target.value); setKeyMasked(false); }} />
                {keyMasked ? (
                  <button onClick={clearKey} className="px-3 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white cursor-pointer whitespace-nowrap">Clear</button>
                ) : (
                  <button onClick={saveKey} className="px-3 rounded-lg bg-[#4f7cff] text-[10px] text-white font-semibold cursor-pointer whitespace-nowrap">Save</button>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Tally Ledger List (export: Chart of Accounts → Ledgers → Alt+E → Excel/CSV)</label>
              <div className="flex gap-2 items-center">
                <label className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-[10px] font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">
                  📥 Upload Ledger List
                  <input type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={handleLedgerFile} />
                </label>
                <span className={`text-[10px] ${ledgerNames.length ? "text-green-400" : "text-[#737c92]"}`}>
                  {ledgerNames.length ? `${ledgerNames.length} ledger names loaded ✓ — party fields auto-suggest; names auto-match` : "not loaded — supplier names won't be matched to your Tally"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <datalist id="dlLedgers">
        {ledgerNames.map(n => <option key={n} value={n} />)}
      </datalist>

      {/* Intake */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="border border-dashed border-white/15 hover:border-[#4f7cff]/50 bg-white/5 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors">
          <Upload size={18} className="text-[#4f7cff]" />
          <span className="text-xs font-semibold text-white">Upload Invoices (PDF / Image)</span>
          <span className="text-[10px] text-[#737c92]">Text PDFs read free in-browser; scans use AI</span>
          <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" disabled={!scriptsLoaded}
            onChange={e => {
              const files = Array.from(e.target.files || []);
              e.target.value = "";
              if (files.length) setQueue(prev => [...prev, ...files.map(f => ({ file: f, status: "queued" as const }))]);
            }} />
        </label>
        <label className="border border-dashed border-white/15 hover:border-[#4f7cff]/50 bg-white/5 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors">
          <FileSpreadsheet size={18} className="text-[#1d7d4f]" />
          <span className="text-xs font-semibold text-white">Import Register (CSV / Excel)</span>
          <span className="text-[10px] text-[#737c92]">Works with the Invoice Compliance tool export</span>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" disabled={!scriptsLoaded} onChange={handleRegisterFile} />
        </label>
        <button onClick={addManualRow}
          className="border border-dashed border-white/15 hover:border-[#4f7cff]/50 bg-white/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
          <Plus size={18} className="text-[#aab2c5]" />
          <span className="text-xs font-semibold text-white">Add Manual Row</span>
          <span className="text-[10px] text-[#737c92]">Type an invoice yourself</span>
        </button>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="border border-white/5 bg-white/5 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{queue.length} file(s) queued
              {running && <span className="text-[#737c92] font-normal"> — extracting {progress.done}/{progress.total}</span>}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setQueue([])} disabled={running}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white cursor-pointer disabled:opacity-40">
                <Trash2 size={11} className="inline mr-1" />Clear
              </button>
              <button onClick={runExtraction} disabled={running || !scriptsLoaded}
                className="px-4 py-1.5 rounded-lg bg-[#4f7cff] hover:bg-[#3d66dd] text-[10px] font-semibold text-white cursor-pointer disabled:opacity-40">
                <Play size={11} className="inline mr-1" />{running ? "Extracting…" : "Extract Data"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {queue.map((q, i) => (
              <span key={i} title={q.error} className={`px-2 py-0.5 rounded text-[10px] border ${
                q.status === "done" ? "bg-green-500/10 text-green-400 border-green-500/10" :
                q.status === "err" ? "bg-red-500/10 text-red-400 border-red-500/10" :
                q.status === "proc" ? "bg-[#4f7cff]/10 text-[#4f7cff] border-[#4f7cff]/20" :
                "bg-white/5 text-[#aab2c5] border-white/10"}`}>
                {q.file.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Review grid */}
      {rows.length > 0 && (
        <div className="border border-white/5 bg-white/5 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Review & Edit — {rows.length} voucher(s) <span className="text-[#737c92] normal-case font-normal">(click any cell to correct it)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => applyLedgerMatching()}
                title="Match supplier names to your uploaded Tally ledger list"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-semibold text-white cursor-pointer transition-colors">
                🔗 Match Ledgers
              </button>
              <button onClick={exportVouchersXml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4f7cff] hover:bg-[#3d66dd] rounded-xl text-[11px] font-semibold text-white cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]">
                <FileCode2 size={13} /> Download Tally XML ({settings.voucherType} Vouchers)
              </button>
              <button onClick={exportMastersXml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-semibold text-white cursor-pointer transition-colors">
                <BookOpen size={13} /> Ledger Masters XML
              </button>
              <button onClick={exportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1d7d4f]/20 hover:bg-[#1d7d4f]/30 border border-[#1d7d4f]/40 rounded-xl text-[11px] font-semibold text-white cursor-pointer transition-colors">
                <Download size={13} /> Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
            <table className="w-full border-collapse text-left min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                  <th className="px-2 py-2">Inv No</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Supplier</th>
                  <th className="px-2 py-2">GSTIN</th>
                  <th className="px-2 py-2 text-right">Taxable</th>
                  <th className="px-2 py-2 text-right">CGST</th>
                  <th className="px-2 py-2 text-right">SGST</th>
                  <th className="px-2 py-2 text-right">IGST</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2">Party Ledger</th>
                  <th className="px-2 py-2">Src</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Duplicate detection: same invoice number appearing twice means the same
                  // bill would post twice in Tally — flag before export, not after.
                  const counts: Record<string, number> = {};
                  rows.forEach(r => { const k = (r.Invoice_Number || "").trim().toLowerCase(); if (k) counts[k] = (counts[k] || 0) + 1; });
                  return rows.map(r => {
                  const balanced = Math.abs((num(r.Total_Amount) || 0) - ((num(r.Taxable_Amount) || 0) + (num(r.CGST_Amount) || 0) + (num(r.SGST_Amount) || 0) + (num(r.IGST_Amount) || 0))) <= 1;
                  const isDup = !!(r.Invoice_Number || "").trim() && counts[(r.Invoice_Number || "").trim().toLowerCase()] > 1;
                  return (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-1 py-1 w-28"><input className={cellCls} value={r.Invoice_Number} onChange={e => updateRow(r.id, "Invoice_Number", e.target.value)} /></td>
                      <td className="px-1 py-1 w-24"><input className={cellCls} value={r.Invoice_Date} placeholder="DD-MM-YYYY" onChange={e => updateRow(r.id, "Invoice_Date", e.target.value)} /></td>
                      <td className="px-1 py-1"><input className={cellCls} value={r.Supplier_Name} onChange={e => updateRow(r.id, "Supplier_Name", e.target.value)} /></td>
                      <td className="px-1 py-1 w-36"><input className={`${cellCls} font-mono`} value={r.Supplier_GSTIN} onChange={e => updateRow(r.id, "Supplier_GSTIN", e.target.value.toUpperCase())} /></td>
                      <td className="px-1 py-1 w-20"><input className={`${cellCls} text-right`} value={r.Taxable_Amount} onChange={e => updateRow(r.id, "Taxable_Amount", e.target.value)} /></td>
                      <td className="px-1 py-1 w-16"><input className={`${cellCls} text-right`} value={r.CGST_Amount} onChange={e => updateRow(r.id, "CGST_Amount", e.target.value)} /></td>
                      <td className="px-1 py-1 w-16"><input className={`${cellCls} text-right`} value={r.SGST_Amount} onChange={e => updateRow(r.id, "SGST_Amount", e.target.value)} /></td>
                      <td className="px-1 py-1 w-16"><input className={`${cellCls} text-right`} value={r.IGST_Amount} onChange={e => updateRow(r.id, "IGST_Amount", e.target.value)} /></td>
                      <td className="px-1 py-1 w-20"><input className={`${cellCls} text-right font-semibold`} value={r.Total_Amount} onChange={e => updateRow(r.id, "Total_Amount", e.target.value)} /></td>
                      <td className="px-1 py-1"><input className={cellCls} list="dlLedgers" value={r.Party_Ledger} onChange={e => updateRow(r.id, "Party_Ledger", e.target.value)} /></td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {r._warn ? (
                          <span title={r._warn} className="inline-flex items-center gap-1 text-[9px] text-yellow-400"><AlertTriangle size={10} />{r._src}</span>
                        ) : balanced ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-green-400"><CheckCircle2 size={10} />{r._src}</span>
                        ) : (
                          <span title="Total ≠ taxable + taxes (difference goes to Round Off)" className="inline-flex items-center gap-1 text-[9px] text-yellow-400"><AlertTriangle size={10} />{r._src}</span>
                        )}
                        {isDup && <span title="Same invoice number appears more than once — this bill would post twice in Tally" className="text-[9px] text-red-400 ml-1">·dup!</span>}
                        {r._ledger === "exact" && <span title="Party ledger exists in your Tally" className="text-[9px] text-green-400 ml-1">·in Tally</span>}
                        {r._ledger === "fuzzy" && <span title="Close match from your Tally ledger list — verify the name" className="text-[9px] text-yellow-400 ml-1">·matched≈</span>}
                        {r._ledger === "new" && <span title="Not in your Tally — will be created via Ledger Masters XML" className="text-[9px] text-yellow-400 ml-1">·new</span>}
                      </td>
                      <td className="px-1 py-1 w-8">
                        <button onClick={() => deleteRow(r.id)} className="text-[#737c92] hover:text-red-400 cursor-pointer p-1"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  );
                  });
                })()}
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-[#737c92] leading-relaxed border border-white/5 bg-white/[0.03] rounded-xl p-3">
            <b className="text-[#aab2c5]">How to import in Tally Prime:</b> 1) If parties are new, first import the <i>Ledger Masters XML</i> (Gateway of Tally → Import → Masters). 2) Make sure the ledgers named above (e.g. “{settings.voucherType === "Purchase" ? settings.purchaseLedger : settings.salesLedger}”, “{settings.cgstLedger}”, “{settings.sgstLedger}”, “{settings.igstLedger}”, “{settings.roundOffLedger}”) exist in your company. 3) Import the <i>Vouchers XML</i> (Gateway of Tally → Import → Transactions). 4) Verify in Day Book. Always take a company backup before importing.
          </div>
        </div>
      )}
    </div>
  );
}
