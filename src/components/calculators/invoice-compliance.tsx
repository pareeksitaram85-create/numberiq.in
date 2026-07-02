"use client";

import React, { useState, useEffect } from "react";
import { 
  Upload, 
  ShieldCheck, 
  Trash2, 
  Play, 
  Square, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Calculator, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Building,
  Globe
} from "lucide-react";

// Types
interface InvoiceRow {
  File_Name: string;
  Invoice_Number: string;
  Invoice_Date: string;
  Supplier_Name: string;
  Supplier_GSTIN: string;
  Buyer_Name: string;
  Buyer_GSTIN: string;
  Supplier_Address: string;
  HSN_SAC: string;
  Taxable_Amount: string;
  CGST_Amount: string;
  SGST_Amount: string;
  IGST_Amount: string;
  Total_Amount: string;
  IRN_Present: string;
  RCM_Applicable: string;
  Sec_17_5_Blocked: string;
  Math_Check_Pass: string;
  Compliance_Status: string;
  _sg?: { valid: boolean; reason: string };
  _bg?: { valid: boolean; reason: string };
  _mc?: { pass: boolean | null; diff: number | null; text: string };
  _src?: string;
  _PO?: string;
  _Qty?: string;
}

interface UaeInvoiceRow {
  File_Name: string;
  Invoice_Type: string;
  Invoice_Number: string;
  Invoice_Date: string;
  Supplier_Name: string;
  Supplier_TRN: string;
  Recipient_Name: string;
  Recipient_TRN: string;
  Currency: string;
  Taxable_Amount: string;
  VAT_Rate: string;
  VAT_Amount: string;
  Total_Amount: string;
  Supply_Classification: string;
  RCM_Applicable: string;
  VAT_Math_Pass: string;
  Compliance_Status: string;
  _sT?: { valid: boolean; reason: string };
  _rT?: { valid: boolean; reason: string };
  _mc?: { pass: boolean | null; diff: number | null; text: string };
  _src?: string;
}

interface QueueItem {
  file: File;
  status: "queued" | "proc" | "done" | "err";
  error?: string;
  row?: any;
}

const HEADERS = [
  "File_Name", "Invoice_Number", "Invoice_Date", "Supplier_Name", "Supplier_GSTIN", 
  "Buyer_Name", "Buyer_GSTIN", "Supplier_Address", "HSN_SAC", "Taxable_Amount", 
  "CGST_Amount", "SGST_Amount", "IGST_Amount", "Total_Amount", "IRN_Present", 
  "RCM_Applicable", "Sec_17_5_Blocked", "Math_Check_Pass", "Compliance_Status"
];

const UAE_HEADERS = [
  "File_Name", "Invoice_Type", "Invoice_Number", "Invoice_Date", "Supplier_Name", 
  "Supplier_TRN", "Recipient_Name", "Recipient_TRN", "Currency", "Taxable_Amount", 
  "VAT_Rate", "VAT_Amount", "Total_Amount", "Supply_Classification", "RCM_Applicable", 
  "VAT_Math_Pass", "Compliance_Status"
];

export function InvoiceCompliance() {
  const [activeTab, setActiveTab] = useState("dash"); // dash, india-inv, india-grn, uae-inv, uae-grn, pay-reco
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState("");

  // API Key & Configuration Settings
  const [anthropicKey, setAnthropicKey] = useState("");
  const [keyMasked, setKeyMasked] = useState(false);
  const [ocrKey, setOcrKey] = useState("");
  const [ocrMasked, setOcrMasked] = useState(false);
  const [ownGstinInput, setOwnGstinInput] = useState("27AAFCJ3816P1Z3");
  const [ownTrnInput, setOwnTrnInput] = useState("104073509200003");
  const [keyPassword, setKeyPassword] = useState("");
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [aiModeSetting, setAiModeSetting] = useState<"ai-first" | "fallback" | "offline">("fallback");

  // Engine state
  const [engineOk, setEngineOk] = useState<boolean | null>(null);
  const [checkingEngine, setCheckingEngine] = useState(false);

  // India Invoice States
  const [invMode, setInvMode] = useState<"ocr" | "csv">("ocr");
  const [invQueue, setInvQueue] = useState<QueueItem[]>([]);
  const [invConcurrency, setInvConcurrency] = useState(3);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invRunning, setInvRunning] = useState(false);
  const [invAbort, setInvAbort] = useState(false);
  const [invProgress, setInvProgress] = useState({ done: 0, total: 0, text: "", pct: 0 });

  // India GRN States
  const [indiaGrnRaw, setIndiaGrnRaw] = useState<any[]>([]);
  const [indiaGrnFileName, setIndiaGrnFileName] = useState("");
  const [grnValTol, setGrnValTol] = useState(1.0);
  const [grnResults, setGrnResults] = useState<any[]>([]);
  const [grnSearch, setGrnSearch] = useState("");

  // UAE Invoice States
  const [uaeQueue, setUaeQueue] = useState<QueueItem[]>([]);
  const [uaeConcurrency, setUaeConcurrency] = useState(3);
  const [uaeInvoices, setUaeInvoices] = useState<UaeInvoiceRow[]>([]);
  const [uaeRunning, setUaeRunning] = useState(false);
  const [uaeAbort, setUaeAbort] = useState(false);
  const [uaeProgress, setUaeProgress] = useState({ done: 0, total: 0, text: "", pct: 0 });
  const [uaeInvMode, setUaeInvMode] = useState<"ocr" | "csv">("ocr");

  // UAE GRN States
  const [uaeGrnRaw, setUaeGrnRaw] = useState<any[]>([]);
  const [uaeGrnFileName, setUaeGrnFileName] = useState("");
  const [ugrnTol, setUgrnTol] = useState(1.0);
  const [ugrnResults, setUgrnResults] = useState<any[]>([]);
  const [ugrnSearch, setUgrnSearch] = useState("");
  const [derivedUaeRate, setDerivedUaeRate] = useState<number | null>(null);

  // Bank & Payment Reco States
  const [bankRaw, setBankRaw] = useState<any[]>([]);
  const [bankFileName, setBankFileName] = useState("");
  const [payTol, setPayTol] = useState(1.0);
  const [payDays, setPayDays] = useState(90);
  const [payUseParty, setPayUseParty] = useState(true);
  const [payResults, setPayResults] = useState<any[]>([]);
  const [unmatchedBank, setUnmatchedBank] = useState<any[]>([]);

  // Heuristics cache for lazy worker loading
  const [tessLoading, setTessLoading] = useState(false);
  const [tessWorker, setTessWorker] = useState<any>(null);

  // Load external scripts dynamically
  useEffect(() => {
    const loadCDNScripts = async () => {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
        
        // Setup PDF.js worker with cross-origin Blob bypass
        if ((window as any).pdfjsLib) {
          try {
            const workerCode = "importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');";
            const blob = new Blob([workerCode], { type: "application/javascript" });
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
          } catch (e) {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
        }
        setScriptsLoaded(true);
      } catch (err: any) {
        setLoadingError("Could not load document analysis engines. Check your internet connection.");
      }
    };

    loadCDNScripts();

    // Load credentials from localStorage
    try {
      const savedKey = localStorage.getItem("anthropic_api_key") || "";
      if (savedKey) {
        setAnthropicKey(savedKey.length > 12 ? `${savedKey.slice(0, 7)}…${savedKey.slice(-4)}` : savedKey);
        setKeyMasked(true);
      }
      const savedOcr = localStorage.getItem("ocrspace_key") || "";
      if (savedOcr) {
        setOcrKey(savedOcr.length > 6 ? `${savedOcr.slice(0, 3)}…${savedOcr.slice(-3)}` : savedOcr);
        setOcrMasked(true);
      }
      const savedGstin = localStorage.getItem("own_gstins") || "27AAFCJ3816P1Z3";
      setOwnGstinInput(savedGstin);
      const savedTrn = localStorage.getItem("own_trns") || "104073509200003";
      setOwnTrnInput(savedTrn);
      const savedAiMode = localStorage.getItem("ai_mode_setting") || "fallback";
      setAiModeSetting(savedAiMode as any);
    } catch (e) {}
  }, []);

  // Run engine health checks when key changes
  useEffect(() => {
    if (activeTab === "dash") {
      checkEngineHealth();
    }
  }, [activeTab]);

  const loadScript = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${url}`));
      document.head.appendChild(script);
    });
  };

  // Helper utils
  const esc = (s: any) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || ""));
  const num = (v: any) => {
    if (v == null) return NaN;
    if (typeof v === "number") return v;
    const c = String(v).replace(/[₹$,\s]/g, "").replace(/[^0-9.\-]/g, "");
    if (c === "") return NaN;
    const n = parseFloat(c);
    return isNaN(n) ? NaN : n;
  };
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const fINR = (n: any) => {
    if (n == null || isNaN(n)) return "—";
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const isMissing = (v: any) => v == null || v === "" || /^missing$/i.test(String(v).trim());

  // GSTIN checksum validation
  const validateGSTIN = (g: string) => {
    if (isMissing(g)) return { valid: false, reason: "missing" };
    g = String(g).trim().toUpperCase();
    if (g.length !== 15) return { valid: false, reason: "length" };
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
    if (!re.test(g)) return { valid: false, reason: "format" };
    const cp = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", mod = 36;
    let factor = 2, sum = 0;
    for (let i = 13; i >= 0; i--) {
      let d = factor * cp.indexOf(g[i]);
      factor = factor === 2 ? 1 : 2;
      d = Math.floor(d / mod) + (d % mod);
      sum += d;
    }
    const check = cp[(mod - (sum % mod)) % mod];
    return { valid: check === g[14], reason: check === g[14] ? "ok" : "checksum" };
  };

  // TRN validation
  const validateTRN = (t: string) => {
    if (isMissing(t)) return { valid: false, reason: "missing" };
    t = String(t).replace(/\s/g, "");
    if (t.length !== 15) return { valid: false, reason: "length" };
    if (!/^\d{15}$/.test(t)) return { valid: false, reason: "format" };
    return { valid: true, reason: "ok" };
  };

  // Indian tax math check
  const mathCheck = (r: any) => {
    const tax = num(r.Taxable_Amount), cgst = num(r.CGST_Amount), sgst = num(r.SGST_Amount), igst = num(r.IGST_Amount), total = num(r.Total_Amount);
    if (isNaN(tax) || isNaN(total)) return { pass: null, diff: null, text: "Skipped (no amounts)" };
    const taxComp = (!isNaN(igst) && igst > 0) ? igst : ((isNaN(cgst) ? 0 : cgst) + (isNaN(sgst) ? 0 : sgst));
    const computed = round2(tax + taxComp);
    const diff = round2(total - computed);
    const pass = Math.abs(diff) <= 1.0;
    return { pass, diff, text: pass ? "Pass" : `Fail (₹${fINR(Math.abs(diff))})` };
  };

  // UAE tax math check
  const uaeMathCheck = (r: any) => {
    const tx = num(r.Taxable_Amount), vat = num(r.VAT_Amount), total = num(r.Total_Amount);
    if (isNaN(tx) || isNaN(total)) return { pass: null, diff: null, text: "Skipped (no amounts)" };
    const v = isNaN(vat) ? 0 : vat;
    const diff = round2(total - (tx + v));
    const sumPass = Math.abs(diff) <= 1.0;
    let note = "";
    if (!isNaN(vat) && vat > 0 && !/Zero|Exempt/.test(r.Supply_Classification)) {
      const exp = round2(tx * 0.05);
      if (Math.abs(exp - vat) > Math.max(1.0, tx * 0.005)) {
        note = " · VAT≠5% of taxable (mixed rates?)";
      }
    }
    return { pass: sumPass, diff, text: sumPass ? `Pass${note}` : `Fail (AED ${fINR(Math.abs(diff))})` };
  };

  // Indian Compliance Check status logic
  const complianceStatus = (r: any, sg: any, bg: any, mc: any) => {
    const miss: string[] = [];
    if (isMissing(r.Invoice_Number)) miss.push("Invoice_Number");
    if (isMissing(r.Invoice_Date)) miss.push("Invoice_Date");
    if (!sg.valid) miss.push(sg.reason === "missing" ? "Supplier_GSTIN" : "Supplier_GSTIN(invalid)");
    if (!bg.valid) miss.push(bg.reason === "missing" ? "Buyer_GSTIN" : "Buyer_GSTIN(invalid)");
    if (mc.pass === false) miss.push("Math");
    return miss.length === 0 ? "Compliant" : `Non-Compliant (Missing: ${miss.join(", ")})`;
  };

  // UAE Compliance Check status logic
  const uaeComplianceStatus = (r: any, sT: any, rT: any, mc: any) => {
    if (r.Invoice_Type === "Not a Tax Invoice") return "Not a Tax Invoice (no input VAT)";
    const miss: string[] = [];
    if (isMissing(r.Invoice_Number)) miss.push("Invoice_Number");
    if (isMissing(r.Invoice_Date)) miss.push("Invoice_Date");
    if (!sT.valid) miss.push(sT.reason === "missing" ? "Supplier_TRN" : "Supplier_TRN(format)");
    const recRequired = r.Invoice_Type === "Tax Invoice (Full)";
    if (recRequired && !rT.valid) miss.push(rT.reason === "missing" ? "Recipient_TRN" : "Recipient_TRN(format)");
    if (mc.pass === false) miss.push("VAT_Math");
    return miss.length === 0 ? "Compliant" : `Non-Compliant (Missing: ${miss.join(", ")})`;
  };

  // Get keys from local storage helper
  const getRawKey = (keyName: string) => {
    try {
      return localStorage.getItem(keyName) || "";
    } catch (e) {
      return "";
    }
  };

  const getActiveKey = () => {
    const saved = getRawKey("anthropic_api_key");
    if (!saved) return "";
    return saved;
  };

  // Check engine status
  const checkEngineHealth = async () => {
    const k = getActiveKey();
    if (!k) {
      setEngineOk(false);
      return;
    }
    setCheckingEngine(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": k,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 8,
          messages: [{ role: "user", content: "ping" }]
        })
      });
      const ok = (res.ok || res.status === 400);
      setEngineOk(ok && res.status !== 401 && res.status !== 403);
    } catch (e) {
      setEngineOk(false);
    } finally {
      setCheckingEngine(false);
    }
  };

  // Tesseract Worker Manager
  const getTessWorkerInstance = async () => {
    if (tessWorker) return tessWorker;
    if (tessLoading) return null;
    setTessLoading(true);
    try {
      if (!(window as any).Tesseract) {
        await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
      }
      const worker = await (window as any).Tesseract.createWorker("eng");
      setTessWorker(worker);
      setTessLoading(false);
      return worker;
    } catch (e) {
      setTessLoading(false);
      return null;
    }
  };

  // PDF Text Extractor
  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error("PDF processing engine unavailable");
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    const maxP = Math.min(pdf.numPages, 15);
    for (let p = 1; p <= maxP; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      let prevY: number | null = null;
      for (const it of tc.items) {
        const y = it.transform ? it.transform[5] : null;
        if (prevY !== null && y !== null && Math.abs(y - prevY) > 3) out += "\n";
        out += it.str + (it.hasEOL ? "\n" : " ");
        prevY = y;
      }
      out += "\n";
    }
    return out;
  };

  // Local Tesseract OCR
  const ocrRecognize = async (srcOrCanvas: any): Promise<string> => {
    const worker = await getTessWorkerInstance();
    if (!worker) throw new Error("OCR engine initialization failed");
    const { data } = await worker.recognize(srcOrCanvas);
    return (data && data.text) || "";
  };

  // Render PDF pages to canvas and run OCR
  const ocrPdfPages = async (file: File): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error("PDF processing engine unavailable");
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    const maxP = Math.min(pdf.numPages, 10);
    for (let p = 1; p <= maxP; p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 2 });
      const cv = document.createElement("canvas");
      cv.width = Math.ceil(vp.width);
      cv.height = Math.ceil(vp.height);
      const renderContext = {
        canvasContext: cv.getContext("2d")!,
        viewport: vp
      };
      await page.render(renderContext).promise;
      out += await ocrRecognize(cv) + "\n";
    }
    return out;
  };

  // Bounded JPEG downscaler for OCR.space
  const imgToBoundedJpeg = async (srcFileOrCanvas: any): Promise<string> => {
    let cv: HTMLCanvasElement;
    if (srcFileOrCanvas instanceof HTMLCanvasElement) {
      cv = srcFileOrCanvas;
    } else {
      const img: HTMLImageElement = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = URL.createObjectURL(srcFileOrCanvas);
      });
      cv = document.createElement("canvas");
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      cv.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
    }
    let scale = Math.min(1, 1800 / Math.max(cv.width, cv.height));
    for (let a = 0; a < 6; a++) {
      const c2 = document.createElement("canvas");
      c2.width = Math.max(1, Math.round(cv.width * scale));
      c2.height = Math.max(1, Math.round(cv.height* scale));
      c2.getContext("2d")!.drawImage(cv, 0, 0, c2.width, c2.height);
      const durl = c2.toDataURL("image/jpeg", 0.7);
      if (durl.length * 0.75 < 1000000 || scale < 0.25) return durl;
      scale *= 0.75;
    }
    return cv.toDataURL("image/jpeg", 0.5);
  };

  // OCR.space API Call
  const ocrSpaceImage = async (dataUrl: string): Promise<string> => {
    const key = getRawKey("ocrspace_key") || "donotchange";
    const body = new URLSearchParams();
    body.set("apikey", key);
    body.set("base64Image", dataUrl);
    body.set("language", "eng");
    body.set("OCREngine", "2");
    body.set("scale", "true");
    body.set("isTable", "true");
    const resp = await fetch("https://api.ocr.space/parse/image", { method: "POST", body });
    const j = await resp.json();
    if (j.IsErroredOnProcessing) {
      throw new Error((j.ErrorMessage && j.ErrorMessage[0]) || "OCR.space error");
    }
    return (j.ParsedResults || []).map((r: any) => r.ParsedText || "").join("\n");
  };

  const ocrSpaceText = async (file: File): Promise<string> => {
    const isPdf = (file.type || "").includes("pdf") || /\.pdf$/i.test(file.name);
    if (isPdf) {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF engine unavailable");
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let out = "";
      const maxP = Math.min(pdf.numPages, 5);
      for (let p = 1; p <= maxP; p++) {
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: 2 });
        const cv = document.createElement("canvas");
        cv.width = Math.ceil(vp.width);
        cv.height = Math.ceil(vp.height);
        await page.render({ canvasContext: cv.getContext("2d")!, viewport: vp }).promise;
        out += await ocrSpaceImage(await imgToBoundedJpeg(cv)) + "\n";
      }
      return out;
    }
    return await ocrSpaceImage(await imgToBoundedJpeg(file));
  };

  const freeOcrText = async (file: File): Promise<string> => {
    const isPdf = (file.type || "").includes("pdf") || /\.pdf$/i.test(file.name);
    const key = getRawKey("ocrspace_key");
    if (key) {
      try {
        const t = await ocrSpaceText(file);
        if (t && t.replace(/\s/g, "").length >= 20) return t;
      } catch (e) {
        console.warn("OCR.space failed, falling back to Tesseract:", e);
      }
    }
    return isPdf ? await ocrPdfPages(file) : await ocrRecognize(file);
  };

  // Indian offline text parsing heuristics
  const parseInvoiceText = (text: string, fileName: string) => {
    const T = text.replace(/\r/g, "");
    const lines = T.split("\n").map(s => s.trim()).filter(Boolean);
    const flat = T.replace(/\s+/g, " ");
    const U = T.toUpperCase();
    const r: any = { File_Name: fileName };
    const MONEY = "(?:[0-9]{1,3}(?:,[0-9]{2,3})+(?:\\.[0-9]{1,2})?|[0-9]+\\.[0-9]{2})";

    const gstRe = /\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z][0-9A-Z2Z7][0-9A-Z]\b/g;
    const found: any[] = [];
    let m;
    while ((m = gstRe.exec(U))) found.push({ g: m[0], i: m.index });
    const uniq: any[] = [...new Map(found.map(o => [o.g, o])).values()];

    const labelNear = (pos: number) => {
      const ctx = U.slice(Math.max(0, pos - 160), pos);
      if (/BILL\s*TO|BILLED\s*TO|BUYER|RECIPIENT|CONSIGNEE|CUSTOMER|SHIP\s*TO/.test(ctx)) return "buyer";
      if (/SELLER|SUPPLIER|VENDOR/.test(ctx)) return "supplier";
      return "";
    };

    let supG = "", buyG = "";
    const ownGstins = ownGstinInput.split(/[,\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
    const ownHit = uniq.find(o => ownGstins.includes(o.g));
    if (ownHit) {
      buyG = ownHit.g;
      const o = uniq.find(x => x.g !== buyG);
      if (o) supG = o.g;
    }
    if (!supG || !buyG) {
      for (const o of uniq) {
        const lab = labelNear(o.i);
        if (lab === "buyer" && !buyG) buyG = o.g;
        else if (lab === "supplier" && !supG) supG = o.g;
      }
      if (!supG) {
        const o = uniq.find(x => x.g !== buyG);
        if (o) supG = o.g;
        else if (uniq[0]) supG = uniq[0].g;
      }
      if (!buyG) {
        const o = uniq.find(x => x.g !== supG);
        if (o) buyG = o.g;
      }
    }
    r.Supplier_GSTIN = supG || "Missing";
    r.Buyer_GSTIN = buyG || "Missing";

    const monD = "(?:\\d{1,2}[-\\/. ](?:\\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\\/. ]\\d{2,4})";
    let inv = "Missing", date = "Missing";
    const pair = new RegExp("([A-Za-z0-9][A-Za-z0-9\\/\\-]{2,28})\\s+(" + monD + ")", "ig");
    let pm;
    while ((pm = pair.exec(flat))) {
      const c = pm[1].replace(/[.,;:]+$/, "");
      if (/\d/.test(c) && /[\/\-]/.test(c) && !/^\d{1,2}[\/\-]\d{1,2}$/.test(c) && !/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(c)) {
        inv = c;
        date = pm[2];
        break;
      }
    }
    if (inv === "Missing") {
      const invG = /(?:tax\s*invoice|invoice|inv|bill)\s*(?:no|number|num|#)\s*[:#\-\.]?\s*([A-Za-z0-9][A-Za-z0-9\/\-]{2,28})/ig;
      let g;
      while ((g = invG.exec(flat))) {
        const c = g[1].replace(/[.,;:]+$/, "");
        if (/\d/.test(c) && !/^date|^dated/i.test(c)) {
          inv = c;
          break;
        }
      }
    }
    if (date === "Missing") {
      const monRe = /\b(\d{1,2}[-\/. ](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\/. ]\\d{2,4})\b/i;
      const numRe = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/;
      for (const ln of lines) {
        if (/date|dated/i.test(ln) && !/due\s*date/i.test(ln)) {
          const mm = ln.match(monRe) || ln.match(numRe);
          if (mm) {
            date = mm[1];
            break;
          }
        }
      }
      if (date === "Missing") {
        const mm = flat.match(monRe) || flat.match(numRe);
        if (mm) date = mm[1];
      }
    }
    r.Invoice_Number = inv;
    r.Invoice_Date = date;

    const lastMoney = (s: string) => {
      const a = [...s.matchAll(new RegExp(MONEY, "g"))].map(x => x[0]);
      return a.length ? a[a.length - 1].replace(/,/g, "") : null;
    };
    const amtWith = (keys: RegExp, excl?: RegExp) => {
      for (const ln of lines) {
        if (excl && excl.test(ln)) continue;
        if (keys.test(ln)) {
          const v = lastMoney(ln);
          if (v) return v;
        }
      }
      return null;
    };

    r.CGST_Amount = amtWith(/\bCGST\b/i, /cess/i) || "0";
    r.SGST_Amount = amtWith(/\b(SGST|UTGST)\b/i, /cess/i) || "0";
    r.IGST_Amount = amtWith(/\bIGST\b/i, /cess/i) || "0";
    r.Taxable_Amount = amtWith(/taxable\s*(value|amount)|sub\s*total|amount\s*before\s*tax|net\s*(amount|total|value)/i) || "Missing";
    let tot = amtWith(/grand\s*total|total\s*amount|invoice\s*total|amount\s*payable|net\s*payable|amount\s*chargeable|total\s*value/i, /sub\s*total|taxable/i);
    if (!tot) tot = amtWith(/^total\b/i, /sub\s*total|taxable/i);
    r.Total_Amount = tot || "Missing";

    let hsn = "Missing";
    const hm = flat.match(/\b(?:HSN|SAC)\s*(?:\/?\s*SAC)?\s*(?:code)?\s*[:#\-]?\s*([0-9]{4,8})\b/i);
    if (hm) hsn = hm[1];
    r.HSN_SAC = hsn;

    let sup = "Missing";
    const skip = /^(tax\s*invoice|invoice|e-?invoice|original|duplicate|triplicate|gst\s*tax\s*invoice|irn\b|ack\s*no|ack\s*date|for\s*recipient|gstin)/i;
    for (const ln of lines.slice(0, 8)) {
      if (skip.test(ln)) continue;
      if (ln.length < 4 || !/[A-Za-z]{3}/.test(ln)) continue;
      let name = ln.split(/\b(?:Invoice\s*No|Dated|e-?Way\s*Bill|Delivery\s*Note|Mode\/Terms|Reference\s*No)\b/i)[0].trim();
      name = name.replace(/[\s,.:-]+$/, "");
      if (name.length >= 4) {
        sup = name;
        break;
      }
    }
    r.Supplier_Name = sup;
    r.Buyer_Name = "Missing";
    r.Supplier_Address = "Missing";

    r.IRN_Present = /\bIRN\b|invoice\s*reference\s*number|e-?invoice|ack\s*no/i.test(T) ? "Yes" : "No";
    r.RCM_Applicable = (/reverse\s*charge/i.test(T) && !/not\s*applicable|reverse\s*charge\s*[:\-]?\s*no\b/i.test(T) && /reverse\s*charge[^.\n]{0,40}(yes|applicable|payable)/i.test(T)) ? "Yes" : "No";
    let blk = "No";
    const bm = T.match(/food|beverage|catering|restaurant|hotel\s*stay|motor\s*vehicle|car\s*hire|rent.?a.?cab|club\s*member|health\s*club|fitness|construction\s*of\s*immovable/i);
    if (bm) blk = "Yes (" + bm[0].toLowerCase() + ")";
    r.Sec_17_5_Blocked = blk;

    let q = 0;
    ["Supplier_GSTIN", "Invoice_Number", "Invoice_Date", "Taxable_Amount", "Total_Amount"].forEach(k => {
      if (r[k] && r[k] !== "Missing") q++;
    });
    r.__quality = q;
    return r;
  };

  // UAE offline text parsing heuristics
  const parseUaeInvoiceText = (text: string, fileName: string) => {
    const T = text.replace(/\r/g, "");
    const lines = T.split("\n").map(s => s.trim()).filter(Boolean);
    const flat = T.replace(/\s+/g, " ");
    const r: any = { File_Name: fileName };
    const MON = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
    const MONEY = "(?:[0-9]{1,3}(?:,[0-9]{3})+(?:\\.[0-9]{1,2})?|[0-9]+\\.[0-9]{1,2}|[0-9]{1,9})";
    const isTaxInvoice = /tax\s*invoice/i.test(T);

    const trnRe = /\b\d(?:\s*-?\s*\d){14}\b/g;
    const found: any[] = [];
    let m;
    while ((m = trnRe.exec(T))) found.push({ t: m[0].replace(/[\s-]/g, ""), i: m.index });
    const uniq = [...new Map(found.map(o => [o.t, o])).values()];
    const ownTrns = ownTrnInput.split(/[,\s]+/).map(x => x.replace(/\D/g, "")).filter(x => x.length === 15);
    
    let supT = "", recT = "";
    const ownHit = uniq.find(o => ownTrns.includes(o.t));
    if (ownHit) {
      recT = ownHit.t;
      const o = uniq.find(x => x.t !== recT);
      if (o) supT = o.t;
    }
    if (!supT) {
      const o = uniq.find(x => x.t !== recT);
      if (o) supT = o.t;
    }
    r.Supplier_TRN = supT || "Missing";
    r.Recipient_TRN = recT || "Missing";

    let inv = "Missing";
    const invG = /(?:tax\s*invoice|invoice|inv|bill)\s*(?:no|number|num|#|\.)?\s*[:#\-\.]*\s*([A-Za-z0-9][A-Za-z0-9\/\-]{1,28})/ig;
    let g;
    while ((g = invG.exec(flat))) {
      const c = g[1].replace(/[.,;:]+$/, "");
      if (/\d/.test(c) && !/^(date|dated|no|number)$/i.test(c)) {
        inv = c;
        break;
      }
    }
    r.Invoice_Number = inv;

    let date = "Missing";
    const monRe = new RegExp("\\b(\\d{1,2}[-\\/. ](?:" + MON + ")[a-z]*[-\\/. ]\\d{2,4})\\b", "i");
    const numRe = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/;
    const txtRe = new RegExp("\\b((?:" + MON + ")[a-z]*\\s+\\d{1,2},?\\s+\\d{4})\\b", "i");
    for (const ln of lines) {
      if (/date|dated/i.test(ln) && !/due\s*date|po\s*date|delivery|valid/i.test(ln)) {
        const mm = ln.match(numRe) || ln.match(monRe) || ln.match(txtRe);
        if (mm) {
          date = mm[1];
          break;
        }
      }
    }
    if (date === "Missing") {
      const mm = flat.match(numRe) || flat.match(monRe) || flat.match(txtRe);
      if (mm) date = mm[1];
    }
    r.Invoice_Date = date;
    r.Currency = (/\bAED\b|dirham|د\.إ/i.test(T)) ? "AED" : (/\bUSD\b|\$/.test(T) ? "USD" : (/\bEUR\b|€/.test(T) ? "EUR" : "AED"));

    const lastMoney = (s: string) => {
      const a = [...s.matchAll(new RegExp(MONEY, "g"))].map(x => x[0]);
      for (let k = a.length - 1; k >= 0; k--) {
        const val = a[k].replace(/,/g, "");
        if (/[.,]/.test(a[k]) || parseFloat(val) >= 5) return val;
      }
      return a.length ? a[a.length - 1].replace(/,/g, "") : null;
    };
    const amtWith = (keys: RegExp, excl?: RegExp) => {
      for (const ln of lines) {
        if (excl && excl.test(ln)) continue;
        if (keys.test(ln)) {
          const v = lastMoney(ln);
          if (v) return v;
        }
      }
      return null;
    };

    r.Taxable_Amount = amtWith(/sub\s*total|taxable\s*(value|amount|amt)|total\s*without\s*vat|net\s*total|amount\s*before\s*vat/i) || "Missing";
    r.VAT_Amount = amtWith(/\bvat\b|v\.a\.t/i, /sub\s*total|total\s*without|taxable/i);
    if (r.VAT_Amount === null) r.VAT_Amount = (/\bvat\b/i.test(T)) ? "0" : "Missing";
    let tot = amtWith(/total\s*amount\s*\(?\s*incl|total\s*with\s*vat|grand\s*total|invoice\s*total|balance\s*due|amount\s*due|total\s*payable|amount\s*payable|net\s*payable|amount\s*chargeable|^total\b/i, /sub\s*total|without\s*vat|before\s*vat|taxable|received|balance\s*b\/f/i);
    if (!tot) tot = amtWith(/\bbalance\b|\btotal\b/i, /sub\s*total|without\s*vat|taxable/i);
    r.Total_Amount = tot || "Missing";

    // Amount derivation
    const tx = num(r.Taxable_Amount), v = num(r.VAT_Amount), tot2 = num(r.Total_Amount);
    const zeroOrExempt = /zero[\s\-]*rated|\bexempt\b/i.test(T);
    if (isMissing(r.Taxable_Amount) && !isNaN(tot2) && !isNaN(v)) {
      r.Taxable_Amount = round2(tot2 - v).toFixed(2);
    } else if (isMissing(r.VAT_Amount) && !isNaN(tot2) && !isNaN(tx) && (tot2 - tx) > 0.01 && !zeroOrExempt) {
      r.VAT_Amount = round2(tot2 - tx).toFixed(2);
    } else if (isMissing(r.Total_Amount) && !isNaN(tx) && !isNaN(v)) {
      r.Total_Amount = round2(tx + v).toFixed(2);
    }

    let cls = "Standard (5%)", rate = "5%";
    const rm = flat.match(/vat\s*[@(]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i);
    if (/zero[\s\-]*rated/i.test(T)) {
      cls = "Zero-rated (0%)";
      rate = "0%";
    } else if (/\bexempt\b/i.test(T)) {
      cls = "Exempt";
      rate = "—";
    } else if (rm) {
      rate = rm[1] + "%";
    }
    r.VAT_Rate = rate;
    r.Supply_Classification = cls;
    r.RCM_Applicable = (/reverse\s*charge/i.test(T) || /recipient\s+(?:to|shall|must)\s+account/i.test(T)) ? "Yes" : "No";

    let sup = "Missing";
    const skip = /^(tax\s*invoice|invoice|original|duplicate|simplified|bill\s*to|issued\s*to|customer|trn|tax\s*reg|date|phone|tel|email|address)/i;
    for (const ln of lines.slice(0, 7)) {
      if (skip.test(ln)) continue;
      if (ln.length < 4 || !/[A-Za-z]{3}/.test(ln)) continue;
      sup = ln.replace(/\s*(TRN|tax\s*reg).*$/i, "").replace(/[\s,.:-]+$/, "").trim();
      break;
    }
    r.Supplier_Name = sup;

    let rec = "Missing";
    const rl = lines.findIndex(l => /bill\s*to|issued\s*to|customer\s*name|^customer\b|buyer/i.test(l));
    if (rl >= 0) {
      let same = lines[rl].replace(/.*?(bill\s*to|issued\s*to|customer\s*name|customer|buyer)\s*[:\-]?\s*/i, "").trim();
      rec = same.length >= 3 ? same : ((lines[rl + 1] || "").trim() || "Missing");
    }
    r.Recipient_Name = rec || "Missing";

    const totN = num(r.Total_Amount);
    let type;
    if (!isTaxInvoice && (isMissing(r.Supplier_TRN) || r.VAT_Amount === "0" || r.VAT_Amount === "Missing")) {
      type = "Not a Tax Invoice";
    } else if (!isMissing(r.Recipient_TRN) || (!isNaN(totN) && totN > 10000)) {
      type = "Tax Invoice (Full)";
    } else {
      type = "Simplified Tax Invoice";
    }
    r.Invoice_Type = type;

    let q = 0;
    ["Supplier_TRN", "Invoice_Number", "Invoice_Date", "Taxable_Amount", "Total_Amount"].forEach(k => {
      if (r[k] && r[k] !== "Missing") q++;
    });
    r.__quality = q;
    return r;
  };

  // OCR/Heuristics Extraction Orchestrator (India)
  const runOfflineExtract = async (file: File) => {
    const isPdf = (file.type || "").includes("pdf") || /\.pdf$/i.test(file.name);
    if (!isPdf) return null;
    let text = "";
    try {
      text = await extractPdfText(file);
    } catch (e) {
      return null;
    }
    if (!text || text.replace(/\s/g, "").length < 80) return null;
    return parseInvoiceText(text, file.name);
  };

  const runOcrExtract = async (file: File) => {
    let text = "";
    try {
      text = await freeOcrText(file);
    } catch (e) {
      return null;
    }
    if (!text || text.replace(/\s/g, "").length < 40) return null;
    return parseInvoiceText(text, file.name);
  };

  // UAE Extraction Orchestrator
  const runOfflineExtractUae = async (file: File) => {
    const isPdf = (file.type || "").includes("pdf") || /\.pdf$/i.test(file.name);
    if (!isPdf) return null;
    let text = "";
    try {
      text = await extractPdfText(file);
    } catch (e) {
      return null;
    }
    if (!text || text.replace(/\s/g, "").length < 60) return null;
    return parseUaeInvoiceText(text, file.name);
  };

  const runOcrExtractUae = async (file: File) => {
    let text = "";
    try {
      text = await freeOcrText(file);
    } catch (e) {
      return null;
    }
    if (!text || text.replace(/\s/g, "").length < 40) return null;
    return parseUaeInvoiceText(text, file.name);
  };

  // AI-Tier Extraction (Anthropic API call)
  const callAnthropicAPI = async (file: File, isUae: boolean): Promise<any> => {
    const key = getActiveKey();
    if (!key) throw new Error("No API key set");
    if (!keyUnlocked) throw new Error("API Key Locked. Unlock it first using password");

    const fileReader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        const result = String(fileReader.result);
        resolve(result.slice(result.indexOf(",") + 1));
      };
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file);
    });
    const b64 = await base64Promise;

    const t = (file.type || "").toLowerCase();
    let block: any;
    if (t.includes("pdf") || /\.pdf$/i.test(file.name)) {
      block = { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } };
    } else {
      let mt = t.startsWith("image/") ? t : "image/png";
      if (/\.jpe?g$/i.test(file.name)) mt = "image/jpeg";
      else if (/\.webp$/i.test(file.name)) mt = "image/webp";
      block = { type: "image", source: { type: "base64", media_type: mt, data: b64 } };
    }

    const ocrPromptText = isUae ? [
      "You are an expert UAE VAT (FTA) consultant and a precise OCR data-extraction engine.",
      "Read the attached UAE invoice (Tax Invoice / Simplified Tax Invoice / handwritten receipt). Transcribe carefully, including handwriting.",
      "Return ONLY a single minified JSON object — no markdown, no code fences — with EXACTLY these keys:",
      '"File_Name","Invoice_Type","Invoice_Number","Invoice_Date","Supplier_Name","Supplier_TRN","Recipient_Name","Recipient_TRN","Currency","Taxable_Amount","VAT_Rate","VAT_Amount","Total_Amount","Supply_Classification","RCM_Applicable".',
      "Rules:",
      "- Absent field => \"Missing\".",
      "- TRN: 15-digit Tax Registration Number (labels: TRN, Tax Reg. No, Tax Registration Number). Supplier_TRN = the issuer's TRN; Recipient_TRN = the 'Bill To'/customer TRN only if printed.",
      "- Amount fields (Taxable_Amount, VAT_Amount, Total_Amount): plain number STRING, no currency symbol, no thousands separators, two decimals (e.g. \"105.00\"). Taxable_Amount = value before VAT (Sub Total / Total Without VAT / Net Total). VAT_Amount = VAT charged. Total_Amount = total incl. VAT. If a head does not apply, \"0\". Use amounts exactly as printed.",
      "- Currency: 'AED' unless another currency is clearly shown.",
      "- VAT_Rate: '5%', '0%' (zero-rated), or '—' (exempt).",
      "- Supply_Classification: 'Standard (5%)', 'Zero-rated (0%)', or 'Exempt'.",
      "- Invoice_Type: 'Tax Invoice (Full)' if total > AED 10,000 or a recipient TRN is shown; 'Simplified Tax Invoice' if total <= AED 10,000; 'Not a Tax Invoice' if the words 'Tax Invoice' are absent or there is no VAT and no supplier TRN.",
      "- Invoice_Date: output as DD-MM-YYYY if determinable, else as printed.",
      "- RCM_Applicable: 'Yes' if reverse charge applies / 'recipient to account for VAT', else 'No'.",
      "Output the JSON object now."
    ].join("\n") : [
      "You are an expert Indian Chartered Accountant and a precise OCR data-extraction engine.",
      "Read the attached invoice image/PDF (it may be a tax invoice, bill of supply, or a handwritten receipt). Transcribe carefully, including handwriting.",
      "Return ONLY a single minified JSON object — no markdown, no code fences, no commentary — with EXACTLY these keys:",
      '"File_Name","Invoice_Number","Invoice_Date","Supplier_Name","Supplier_GSTIN","Buyer_Name","Buyer_GSTIN","Supplier_Address","HSN_SAC","Taxable_Amount","CGST_Amount","SGST_Amount","IGST_Amount","Total_Amount","IRN_Present","RCM_Applicable","Sec_17_5_Blocked".',
      "Rules:",
      "- If a field is absent on the document, use the string \"Missing\".",
      "- Amount fields (Taxable_Amount, CGST_Amount, SGST_Amount, IGST_Amount, Total_Amount): output a plain number as a STRING with no currency symbol, no thousands separators (e.g. \"10000.00\"). If a tax head does not apply, use \"0\". Use the amounts exactly as printed; do not recompute.",
      "- Invoice_Date: output as DD-MM-YYYY if determinable, else as printed.",
      "- HSN_SAC: the primary/first HSN or SAC code; if multiple line items, give the dominant one.",
      "- IRN_Present: \"Yes\" if an Invoice Reference Number (IRN) and/or e-invoice QR code is present, else \"No\".",
      "- RCM_Applicable: \"Yes\" if reverse charge applies (e.g. invoice states RCM/\"tax payable under reverse charge\", or service type is GTA, legal/advocate, etc.), else \"No\".",
      "- Sec_17_5_Blocked: \"Yes (reason)\" if the supply likely falls under blocked ITC u/s 17(5) (F&B, vehicles, rent-a-cab, works contract for immovable properties etc.), else \"No\".",
      "Output the JSON object now."
    ].join("\n");

    const body = {
      model: "claude-sonnet-5",
      max_tokens: 1000,
      messages: [{ 
        role: "user", 
        content: [ 
          block, 
          { type: "text", text: ocrPromptText + "\n\nThis file's name is: " + file.name } 
        ] 
      }]
    };

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      let d = "";
      try { d = (await resp.json()).error?.message || ""; } catch (e) {}
      throw new Error(`AI Engine error: ${resp.status}${d ? " - " + d : ""}`);
    }
    const data = await resp.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = clean.indexOf("{"), end = clean.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("No JSON payload received");
    return JSON.parse(clean.slice(start, end + 1));
  };

  // Build Final Rows
  const finalizeRow = (raw: any, fileName: string): InvoiceRow => {
    const r: any = {};
    HEADERS.forEach(h => r[h] = (raw && raw[h] != null && raw[h] !== "") ? String(raw[h]) : "Missing");
    r.File_Name = fileName || (raw && raw.File_Name) || "Missing";
    const sg = validateGSTIN(r.Supplier_GSTIN);
    const bg = validateGSTIN(r.Buyer_GSTIN);
    const mc = mathCheck(r);
    r.Math_Check_Pass = mc.pass === null ? "Skipped" : (mc.pass ? "Pass" : mc.text);
    r.Compliance_Status = complianceStatus(r, sg, bg, mc);
    r._sg = sg;
    r._bg = bg;
    r._mc = mc;
    return r;
  };

  const finalizeUaeRow = (raw: any, fileName: string): UaeInvoiceRow => {
    const r: any = {};
    UAE_HEADERS.forEach(h => r[h] = (raw && raw[h] != null && raw[h] !== "") ? String(raw[h]) : "Missing");
    r.File_Name = fileName || (raw && raw.File_Name) || "Missing";
    const sT = validateTRN(r.Supplier_TRN);
    const rT = validateTRN(r.Recipient_TRN);
    const mc = uaeMathCheck(r);
    r.VAT_Math_Pass = mc.pass === null ? "Skipped" : (mc.pass ? "Pass" : mc.text);
    r.Compliance_Status = uaeComplianceStatus(r, sT, rT, mc);
    r._sT = sT;
    r._rT = rT;
    r._mc = mc;
    return r;
  };

  // Run India Extraction Queue
  const runExtraction = async () => {
    if (invRunning) return;
    const hasImages = invQueue.some(q => q.status !== "done" && !((q.file.type || "").includes("pdf") || /\.pdf$/i.test(q.file.name)));
    const key = getActiveKey();
    if (hasImages && !key) {
      if (!confirm("Scanned/image invoices will be read by the free in-browser OCR engine. The engine (~5 MB) downloads on first use. Continue?")) return;
    }
    setInvRunning(true);
    setInvAbort(false);
    const pending = invQueue.filter(q => q.status !== "done");
    let done = 0;
    const total = pending.length;
    setInvProgress({ done: 0, total, text: "Starting extraction pool...", pct: 0 });

    let idx = 0;
    const worker = async () => {
      while (idx < pending.length && !invAbort) {
        const currentIdx = idx++;
        const q = pending[currentIdx];
        q.status = "proc";
        setInvQueue([...invQueue]);
        try {
          let raw: any = null;
          let src = "";
          let lastErr: any = null;

          // Tier 1 & 2: Offline Extraction (skipped if AI-First is set)
          if (aiModeSetting !== "ai-first") {
            try {
              const off = await runOfflineExtract(q.file);
              if (off) {
                raw = off;
                src = off.__quality >= 4 ? "offline" : "offline-low";
              }
            } catch (e) {}

            if (!raw || (raw.__quality !== undefined && raw.__quality < 4)) {
              try {
                const oc = await runOcrExtract(q.file);
                if (oc && (!raw || (oc.__quality || 0) > (raw.__quality || 0))) {
                  raw = oc;
                  src = oc.__quality >= 4 ? "ocr" : "ocr-low";
                }
              } catch (e) {
                lastErr = e;
              }
            }
          }

          // Tier 3: Anthropic AI Fallback
          const needApi = aiModeSetting === "ai-first" || 
                          (aiModeSetting === "fallback" && (!raw || (raw.__quality !== undefined && raw.__quality < 5))) && 
                          key && keyUnlocked;

          if (needApi && key && keyUnlocked) {
            try {
              const ar = await callAnthropicAPI(q.file, false);
              if (ar) {
                raw = ar;
                src = "AI";
              }
            } catch (e) {
              lastErr = e;
            }
          }

          if (!raw) {
            throw lastErr || new Error("File unreadable by local OCR engine");
          }

          q.row = finalizeRow(raw, q.file.name);
          q.row._src = src;
          q.status = "done";
        } catch (e: any) {
          q.status = "err";
          q.row = finalizeRow({ File_Name: q.file.name }, q.file.name);
          q.row.Compliance_Status = `Extraction error: ${e.message || "unknown"}`;
          q.row._src = "error";
        }
        done++;
        setInvProgress({
          done,
          total,
          pct: Math.round((done / total) * 100),
          text: `Extracted ${done}/${total} invoices`
        });
        setInvQueue([...invQueue]);
      }
    };

    const pool = Array.from({ length: Math.min(invConcurrency, pending.length) }, worker);
    await Promise.all(pool);

    setInvRunning(false);
    const finalInvs = invQueue.filter(q => q.row).map(q => q.row);
    setInvoices(finalInvs);
  };

  // Run UAE Extraction Queue
  const runUaeExtraction = async () => {
    if (uaeRunning) return;
    const hasImages = uaeQueue.some(q => q.status !== "done" && !((q.file.type || "").includes("pdf") || /\.pdf$/i.test(q.file.name)));
    const key = getActiveKey();
    if (hasImages && !key) {
      if (!confirm("Scanned/image invoices will be read by the free in-browser OCR engine. Continue?")) return;
    }
    setUaeRunning(true);
    setUaeAbort(false);
    const pending = uaeQueue.filter(q => q.status !== "done");
    let done = 0;
    const total = pending.length;
    setUaeProgress({ done: 0, total, text: "Starting UAE extraction pool...", pct: 0 });

    let idx = 0;
    const worker = async () => {
      while (idx < pending.length && !uaeAbort) {
        const currentIdx = idx++;
        const q = pending[currentIdx];
        q.status = "proc";
        setUaeQueue([...uaeQueue]);
        try {
          let raw: any = null;
          let src = "";
          let lastErr: any = null;

          // Tier 1 & 2: Offline UAE Extraction (skipped if AI-First is set)
          if (aiModeSetting !== "ai-first") {
            try {
              const off = await runOfflineExtractUae(q.file);
              if (off) {
                raw = off;
                src = off.__quality >= 4 ? "offline" : "offline-low";
              }
            } catch (e) {}

            if (!raw || (raw.__quality !== undefined && raw.__quality < 4)) {
              try {
                const oc = await runOcrExtractUae(q.file);
                if (oc && (!raw || (oc.__quality || 0) > (raw.__quality || 0))) {
                  raw = oc;
                  src = oc.__quality >= 4 ? "ocr" : "ocr-low";
                }
              } catch (e) {
                lastErr = e;
              }
            }
          }

          // Tier 3: Anthropic UAE AI Fallback
          const needApi = aiModeSetting === "ai-first" || 
                          (aiModeSetting === "fallback" && (!raw || (raw.__quality !== undefined && raw.__quality < 5))) && 
                          key && keyUnlocked;

          if (needApi && key && keyUnlocked) {
            try {
              const ar = await callAnthropicAPI(q.file, true);
              if (ar) {
                raw = ar;
                src = "AI";
              }
            } catch (e) {
              lastErr = e;
            }
          }

          if (!raw) throw lastErr || new Error("File unreadable by local OCR engine");

          q.row = finalizeUaeRow(raw, q.file.name);
          q.row._src = src;
          q.status = "done";
        } catch (e: any) {
          q.status = "err";
          q.row = finalizeUaeRow({ File_Name: q.file.name }, q.file.name);
          q.row.Compliance_Status = `Extraction error: ${e.message || "unknown"}`;
          q.row._src = "error";
        }
        done++;
        setUaeProgress({
          done,
          total,
          pct: Math.round((done / total) * 100),
          text: `Extracted ${done}/${total} UAE invoices`
        });
        setUaeQueue([...uaeQueue]);
      }
    };

    const pool = Array.from({ length: Math.min(uaeConcurrency, pending.length) }, worker);
    await Promise.all(pool);

    setUaeRunning(false);
    const finalUaeInvs = uaeQueue.filter(q => q.row).map(q => q.row);
    setUaeInvoices(finalUaeInvs);
  };

  // Re-run unmatched items
  const reRunUnmatchedUae = () => {
    if (!uaeGrnRaw.length) {
      alert("Upload a UAE GRN sheet first.");
      return;
    }
    const bad = new Set(ugrnResults.filter(r => r.Status !== "Matched" && r.Reg_Inv_No).map(r => invKey(r.Reg_Inv_No)));
    let n = 0;
    uaeQueue.forEach(q => {
      const k = q.row ? invKey(q.row.Invoice_Number) : "";
      const unmatched = !q.row || q.status === "err" || (q.row && (isMissing(q.row.Invoice_Number) || q.row._src === "error")) || (k && bad.has(k));
      if (unmatched) {
        q.status = "queued";
        q.row = null;
        n++;
      }
    });
    if (n === 0) {
      alert("All invoices are already matched.");
      return;
    }
    setUaeQueue([...uaeQueue]);
    runUaeExtraction().then(() => runUaeGrnMatch());
  };

  const reRunUnmatchedIndia = () => {
    if (!indiaGrnRaw.length) {
      alert("Upload an India GRN sheet first.");
      return;
    }
    const bad = new Set(grnResults.filter(r => r.Match_Status !== "Matched" && r.Reg_Inv_No).map(r => invKey(r.Reg_Inv_No)));
    let n = 0;
    invQueue.forEach(q => {
      const k = q.row ? invKey(q.row.Invoice_Number) : "";
      const unmatched = !q.row || q.status === "err" || (q.row && (isMissing(q.row.Invoice_Number) || q.row._src === "error")) || (k && bad.has(k));
      if (unmatched) {
        q.status = "queued";
        q.row = null;
        n++;
      }
    });
    if (n === 0) {
      alert("All invoices are already matched.");
      return;
    }
    setInvQueue([...invQueue]);
    runExtraction().then(() => runIndiaGrnMatch());
  };

  // GRN sheet parser helper
  const readGrnFile = async (file: File): Promise<any[]> => {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".csv") || (file.type || "").includes("csv")) {
      return new Promise((res, rej) => {
        (window as any).Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (r: any) => res(r.data),
          error: (e: any) => rej(e)
        });
      });
    }
    const XLSX = (window as any).XLSX;
    if (!XLSX) throw new Error("Excel reader library unavailable");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  };

  const grnField = (row: any, aliases: string[]) => {
    for (const k of Object.keys(row)) {
      const nk = k.trim().toLowerCase().replace(/\s+/g, " ");
      if (aliases.includes(nk)) return String(row[k]).trim();
    }
    return "";
  };

  const normGrnRow = (row: any) => {
    return {
      GRN_No: grnField(row, ["grn no", "grn_no", "grn"]),
      PO_No: grnField(row, ["po no", "po_no", "po"]),
      Vendor: grnField(row, ["vendor name", "supplier name", "vendor", "vendor_name"]),
      Vendor_TRN: grnField(row, ["vendor trn", "vendor gstin", "supplier gstin", "trn", "gstin"]),
      Invoice_No: grnField(row, ["invoice no", "invoice_no", "invoice number", "inv no"]),
      Invoice_Date: grnField(row, ["invoice date", "invoice_date"]),
      Item: grnField(row, ["name", "item", "item name", "description", "item description"]),
      Rec_Qty: grnField(row, ["rec qty", "received qty", "qty received", "qty"]),
      Good_Qty: grnField(row, ["good qty", "good_qty", "accepted qty"]),
      Rate: grnField(row, ["rate", "unit rate"]),
      Taxable: grnField(row, ["taxeble amount", "taxable amount", "taxable", "taxeble"]),
      Tax_Pct: grnField(row, ["tax", "tax %", "vat %", "gst %"]),
      VAT_Amt: grnField(row, ["gst amount", "vat amount", "tax amount"]),
      Line_Total: grnField(row, ["invoice total amount", "total amount incl logistic", "total amount", "line total"]),
      Status: grnField(row, ["status"])
    };
  };

  const invKey = (s: string) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const median = (arr: number[]) => {
    if (!arr.length) return null;
    const a = [...arr].sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };
  const ugrnKeys = (s: string) => {
    const full = invKey(s);
    const digits = (String(s || "").match(/\d+/g) || []).join("");
    const numc = digits.replace(/^0+/, "") || digits;
    return { full, num: numc };
  };

  // Run India GRN Match
  const runIndiaGrnMatch = () => {
    const tolPct = grnValTol / 100;
    const groups: any[] = [];
    const byFull = new Map();

    indiaGrnRaw.forEach(g => {
      const fk = invKey(g.Invoice_No);
      if (!fk) return;
      let a = byFull.get(fk);
      if (!a) {
        a = {
          Invoice_No: g.Invoice_No,
          Vendor: g.Vendor,
          Vendor_GSTIN: g.Vendor_TRN,
          GRNs: new Set(),
          Qty: 0,
          Taxable: 0,
          VAT: 0,
          Total: 0,
          lines: 0,
          keys: ugrnKeys(g.Invoice_No),
          matched: false
        };
        byFull.set(fk, a);
        groups.push(a);
      }
      if (g.GRN_No) a.GRNs.add(g.GRN_No);
      a.Qty += num(g.Good_Qty) || num(g.Rec_Qty) || 0;
      a.Taxable += num(g.Taxable) || 0;
      a.VAT += num(g.VAT_Amt) || 0;
      a.Total += num(g.Line_Total) || ((num(g.Taxable) || 0) + (num(g.VAT_Amt) || 0));
      a.lines++;
      if (!a.Vendor && g.Vendor) a.Vendor = g.Vendor;
      if (!a.Vendor_GSTIN && g.Vendor_TRN) a.Vendor_GSTIN = g.Vendor_TRN;
    });

    const invs = invoices.map(r => ({
      raw: r,
      no: r.Invoice_Number,
      val: num(r.Total_Amount),
      keys: ugrnKeys(r.Invoice_Number),
      matched: false
    }));

    const out: any[] = [];
    groups.forEach(a => {
      let inv = invs.find(v => !v.matched && v.keys.full === a.keys.full) ||
                (a.keys.num ? invs.find(v => !v.matched && v.keys.num === a.keys.num) : null);
      let byNumber = !!inv;
      if (!inv) {
        inv = invs.find(v => {
          if (v.matched || isNaN(v.val) || v.val <= 0) return false;
          return Math.abs(v.val - a.Total) <= Math.max(1, v.val * tolPct);
        });
      }
      if (inv) inv.matched = true;
      const grnV = round2(a.Total), invV = inv ? inv.val : NaN;
      let status, diff = null;
      if (inv) {
        if (!isNaN(invV)) {
          diff = round2(grnV - invV);
          const band = byNumber ? 0.15 : tolPct;
          status = Math.abs(diff) <= Math.max(1, invV * band) ? "Matched" : "Amount mismatch";
        } else {
          status = "Matched";
        }
      } else {
        status = "GRN — no invoice";
      }
      out.push({
        Invoice_No: a.Invoice_No,
        GRN_Inv_No: a.Invoice_No,
        Reg_Inv_No: inv ? inv.no : "",
        Vendor: a.Vendor,
        Vendor_GSTIN: a.Vendor_GSTIN,
        GRN_No: [...a.GRNs].filter(Boolean).join(", "),
        GRN_Qty: round2(a.Qty),
        GRN_Taxable: round2(a.Taxable),
        GRN_VAT: round2(a.VAT),
        GRN_Value: grnV,
        Inv_Value: inv ? invV : "",
        Diff: diff != null ? diff : "",
        Match_Status: status
      });
    });

    invs.filter(v => !v.matched).forEach(v => {
      out.push({
        Invoice_No: v.no,
        GRN_Inv_No: "",
        Reg_Inv_No: v.no,
        Vendor: v.raw.Supplier_Name,
        Vendor_GSTIN: v.raw.Supplier_GSTIN,
        GRN_No: "",
        GRN_Qty: "",
        GRN_Taxable: "",
        GRN_VAT: "",
        GRN_Value: "",
        Inv_Value: isNaN(v.val) ? "" : v.val,
        Diff: "",
        Match_Status: "Invoice — no GRN"
      });
    });

    const ord: any = { "Amount mismatch": 0, "GRN — no invoice": 1, "Invoice — no GRN": 2, "Matched": 3 };
    out.sort((x, y) => (ord[x.Match_Status] ?? 9) - (ord[y.Match_Status] ?? 9));
    setGrnResults(out);
  };

  // Run UAE GRN Match
  const runUaeGrnMatch = () => {
    const tolPct = ugrnTol / 100;
    const groups: any[] = [];
    const byFull = new Map();

    uaeGrnRaw.forEach(g => {
      const fk = invKey(g.Invoice_No);
      if (!fk) return;
      let a = byFull.get(fk);
      if (!a) {
        a = {
          Invoice_No: g.Invoice_No,
          Vendor: g.Vendor,
          Vendor_TRN: g.Vendor_TRN,
          GRNs: new Set(),
          Qty: 0,
          Taxable: 0,
          VAT: 0,
          Total: 0,
          lines: 0,
          keys: ugrnKeys(g.Invoice_No),
          matched: false
        };
        byFull.set(fk, a);
        groups.push(a);
      }
      if (g.GRN_No) a.GRNs.add(g.GRN_No);
      a.Qty += num(g.Good_Qty) || num(g.Rec_Qty) || 0;
      a.Taxable += num(g.Taxable) || 0;
      a.VAT += num(g.VAT_Amt) || 0;
      a.Total += num(g.Line_Total) || ((num(g.Taxable) || 0) + (num(g.VAT_Amt) || 0));
      a.lines++;
      if (!a.Vendor && g.Vendor) a.Vendor = g.Vendor;
      if (!a.Vendor_TRN && g.Vendor_TRN) a.Vendor_TRN = g.Vendor_TRN;
    });

    const invs = uaeInvoices.map(r => ({
      raw: r,
      no: r.Invoice_Number,
      aed: num(r.Total_Amount),
      keys: ugrnKeys(r.Invoice_Number),
      matched: false,
      _rused: false
    }));

    const rates: number[] = [];
    groups.forEach(a => {
      const inv = invs.find(v => !v._rused && (v.keys.full === a.keys.full || (a.keys.num && v.keys.num === a.keys.num)));
      if (inv) {
        if (!isNaN(inv.aed) && inv.aed > 0 && a.Total > 0) {
          rates.push(a.Total / inv.aed);
          inv._rused = true;
        }
      }
    });

    let rate = median(rates);
    const derived = rates.length > 0;
    if (!rate && invs.length && groups.length) {
      rate = 22.472; // Default AED to INR exchange rate fallback
    }
    setDerivedUaeRate(rate);

    const out: any[] = [];
    groups.forEach(a => {
      let inv = invs.find(v => !v.matched && v.keys.full === a.keys.full) ||
                (a.keys.num ? invs.find(v => !v.matched && v.keys.num === a.keys.num) : null);
      if (!inv && rate) {
        inv = invs.find(v => {
          if (v.matched || isNaN(v.aed) || v.aed <= 0) return false;
          const conv = v.aed * rate!;
          return Math.abs(conv - a.Total) <= Math.max(1, conv * tolPct);
        });
      }
      if (inv) inv.matched = true;
      const grnINR = round2(a.Total);
      const aed = inv ? inv.aed : NaN;
      const invINR = (inv && rate && !isNaN(aed)) ? round2(aed * rate) : null;
      let status, diff = null;

      if (inv) {
        if (invINR != null) {
          diff = round2(grnINR - invINR);
          const band = inv.keys.full === a.keys.full ? 0.15 : tolPct;
          status = Math.abs(diff) <= Math.max(1, invINR * band) ? "Matched" : "Amount mismatch";
        } else {
          status = "Matched";
        }
      } else {
        status = "GRN — no invoice";
      }

      out.push({
        Invoice_No: a.Invoice_No,
        GRN_Inv_No: a.Invoice_No,
        Reg_Inv_No: inv ? inv.no : "",
        Vendor: a.Vendor,
        Vendor_TRN: a.Vendor_TRN,
        GRN_No: [...a.GRNs].filter(Boolean).join(", "),
        GRN_Lines: a.lines,
        GRN_Qty: round2(a.Qty),
        GRN_Taxable_INR: round2(a.Taxable),
        GRN_VAT_INR: round2(a.VAT),
        GRN_Total_INR: grnINR,
        Invoice_AED: inv ? aed : "",
        Invoice_INR: invINR != null ? invINR : "",
        Diff_INR: diff != null ? diff : "",
        Status: status
      });
    });

    invs.filter(v => !v.matched).forEach(v => {
      out.push({
        Invoice_No: v.no,
        GRN_Inv_No: "",
        Reg_Inv_No: v.no,
        Vendor: v.raw.Supplier_Name,
        Vendor_TRN: v.raw.Supplier_TRN,
        GRN_No: "",
        GRN_Lines: "",
        GRN_Qty: "",
        GRN_Taxable_INR: "",
        GRN_VAT_INR: "",
        GRN_Total_INR: "",
        Invoice_AED: isNaN(v.aed) ? "" : v.aed,
        Invoice_INR: (rate && !isNaN(v.aed)) ? round2(v.aed * rate) : "",
        Diff_INR: "",
        Status: "Invoice — no GRN"
      });
    });

    const ord: any = { "Amount mismatch": 0, "GRN — no invoice": 1, "Invoice — no GRN": 2, "Matched": 3 };
    out.sort((x, y) => (ord[x.Status] ?? 9) - (ord[y.Status] ?? 9));
    setUgrnResults(out);
  };

  // Run Bank Payment Reconciliation
  const runPayReco = () => {
    if (invoices.length === 0) {
      alert("Process or import India invoices first.");
      return;
    }

    const normStr = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const parseDate = (s: string) => {
      if (!s) return null;
      s = String(s).trim();
      const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (m) {
        let y = +m[3];
        if (y < 100) y += 2000;
        return new Date(y, (+m[2]) - 1, +m[1]);
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };

    const bank = bankRaw.map((b, idx) => ({
      idx,
      used: false,
      debit: num(b.Debit),
      credit: num(b.Credit),
      date: parseDate(b.Txn_Date || b.Value_Date || b.Date),
      party: b.Party_Name || b.Description || "",
      ref: b.UTR_No || b.Reference_No || "",
      raw: b
    }));

    const out = invoices.map(inv => {
      const total = num(inv.Total_Amount);
      const idate = parseDate(inv.Invoice_Date);
      const sup = normStr(inv.Supplier_Name);
      let best: any = null;
      let bestScore = -1;

      bank.forEach(b => {
        if (b.used || isNaN(b.debit)) return;
        if (isNaN(total) || Math.abs(b.debit - total) > payTol) return;
        let score = 2;
        if (payDays > 0 && idate && b.date) {
          const dd = (b.date.getTime() - idate.getTime()) / 86400000;
          if (dd < -1 || dd > payDays) return;
          score += (dd >= 0 ? 1 : 0);
        }
        if (payUseParty && sup) {
          const ps = normStr(b.party);
          if (ps.includes(sup) || sup.includes(ps.slice(0, Math.max(4, sup.length)))) {
            score += 2;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          best = b;
        }
      });

      let status, bref = "", bdate = "";
      if (best) {
        best.used = true;
        bref = best.ref || "";
        bdate = best.date ? best.date.toLocaleDateString("en-IN") : "";
        const partyOk = !payUseParty || !sup || normStr(best.party).includes(sup);
        status = partyOk ? "Matched" : "Probable (amount only)";
      } else {
        status = isNaN(total) ? "No invoice total" : "Unmatched";
      }

      return {
        Invoice_Number: inv.Invoice_Number,
        Supplier_Name: inv.Supplier_Name,
        Invoice_Date: inv.Invoice_Date,
        Total_Amount: isNaN(total) ? "" : total,
        Bank_Ref: bref,
        Bank_Date: bdate,
        Reco_Status: status
      };
    });

    const unmatched = bank.filter(b => !b.used && !isNaN(b.debit) && b.debit > 0)
      .map(b => ({
        Txn_Date: b.raw.Txn_Date || b.raw.Date || "",
        Description: b.party,
        Debit: b.debit,
        Ref: b.ref
      }));

    setPayResults(out);
    setUnmatchedBank(unmatched);
  };

  // Import Invoice register CSV
  const handleRegisterCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const Papa = (window as any).Papa;
    if (!Papa) return;

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res: any) => {
        const rows = res.data.map((d: any, i: number) => {
          const r: any = {};
          HEADERS.forEach(h => r[h] = (d[h] != null && d[h] !== "") ? String(d[h]) : "Missing");
          r.File_Name = d.File_Name || d.file_name || `register_row_${i + 1}`;
          r._PO = d.PO_No || d.PO || d.po_no || "";
          r._Qty = d.Qty || d.Quantity || d.qty || "";
          const fr = finalizeRow(r, r.File_Name);
          fr._PO = r._PO;
          fr._Qty = r._Qty;
          return fr;
        });
        setInvQueue([]);
        setInvoices(rows);
        alert(`${rows.length} invoices imported from CSV register.`);
      }
    });
  };

  // Import UAE Invoice register CSV
  const handleRegisterCSVUae = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const Papa = (window as any).Papa;
    if (!Papa) return;

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res: any) => {
        const rows = res.data.map((d: any, i: number) => {
          const r: any = {};
          UAE_HEADERS.forEach(h => r[h] = (d[h] != null && d[h] !== "") ? String(d[h]) : "Missing");
          r.File_Name = d.File_Name || d.file_name || `uae_row_${i + 1}`;
          const fr = finalizeUaeRow(r, r.File_Name);
          return fr;
        });
        setUaeQueue([]);
        setUaeInvoices(rows);
        alert(`${rows.length} UAE invoices imported from CSV register.`);
      }
    });
  };

  // Upload handlers
  const handleIndiaGrnUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIndiaGrnFileName(`Reading ${file.name}...`);
    try {
      const data = await readGrnFile(file);
      const normalized = data.map(normGrnRow).filter(r => r.Invoice_No || r.GRN_No || r.Item);
      setIndiaGrnRaw(normalized);
      setIndiaGrnFileName(`${file.name} (${normalized.length} lines)`);
    } catch (err: any) {
      setIndiaGrnFileName(`Error: ${err.message || err}`);
    }
  };

  const handleUaeGrnUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUaeGrnFileName(`Reading ${file.name}...`);
    try {
      const data = await readGrnFile(file);
      const normalized = data.map(normGrnRow).filter(r => r.Invoice_No || r.GRN_No || r.Item);
      setUaeGrnRaw(normalized);
      setUaeGrnFileName(`${file.name} (${normalized.length} lines)`);
    } catch (err: any) {
      setUaeGrnFileName(`Error: ${err.message || err}`);
    }
  };

  const handleBankUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBankFileName(`Reading ${file.name}...`);
    const Papa = (window as any).Papa;
    if (!Papa) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: any) => {
        setBankRaw(res.data);
        setBankFileName(`${file.name} (${res.data.length} transactions)`);
      },
      error: (err: any) => {
        setBankFileName(`Error: ${err.message || err}`);
      }
    });
  };

  // Download utilities
  const triggerCSVDownload = (filename: string, headers: string[], rows: any[]) => {
    const q = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvContent = headers.join(",") + "\n" + rows.map(r => headers.map(h => q(r[h])).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  // Key configurations management
  const handleSaveKey = () => {
    const key = anthropicKey.trim();
    if (!key || keyMasked) {
      alert("Please enter a valid API key.");
      return;
    }
    localStorage.setItem("anthropic_api_key", key);
    setAnthropicKey(`${key.slice(0, 7)}…${key.slice(-4)}`);
    setKeyMasked(true);
    checkEngineHealth();
  };

  const handleClearKey = () => {
    localStorage.removeItem("anthropic_api_key");
    setAnthropicKey("");
    setKeyMasked(false);
    setEngineOk(null);
  };

  const handleSaveOcrKey = () => {
    const key = ocrKey.trim();
    if (!key || ocrMasked) {
      alert("Please enter an OCR.space key.");
      return;
    }
    localStorage.setItem("ocrspace_key", key);
    setOcrKey(`${key.slice(0, 3)}…${key.slice(-3)}`);
    setOcrMasked(true);
  };

  const handleClearOcrKey = () => {
    localStorage.removeItem("ocrspace_key");
    setOcrKey("");
    setOcrMasked(false);
  };

  const handleSaveGstin = () => {
    localStorage.setItem("own_gstins", ownGstinInput.trim().toUpperCase());
    alert("Buyer GSTIN saved.");
  };

  const handleSaveTrn = () => {
    localStorage.setItem("own_trns", ownTrnInput.trim());
    alert("Recipient TRN saved.");
  };

  const unlockKeyWithPassword = () => {
    if (keyPassword === "runkey") {
      setKeyUnlocked(true);
      alert("Anthropic AI operations unlocked successfully.");
    } else {
      alert("Incorrect password. API operations locked.");
    }
  };

  // Render Dashboard Roll-up KPIs
  const getDashboardStats = () => {
    let inComp = 0;
    let inTax = 0;
    let inBlocked = 0;
    invoices.forEach(r => {
      if (r.Compliance_Status === "Compliant") inComp++;
      const t = (num(r.CGST_Amount) || 0) + (num(r.SGST_Amount) || 0) + (num(r.IGST_Amount) || 0);
      inTax += t;
      if (/^yes/i.test(r.Sec_17_5_Blocked)) inBlocked += t;
    });

    let uComp = 0;
    let uVat = 0;
    uaeInvoices.forEach(r => {
      if (r.Compliance_Status === "Compliant") uComp++;
      const v = num(r.VAT_Amount);
      if (!isNaN(v)) uVat += v;
    });

    const inGrnMatched = grnResults.filter(o => o.Match_Status === "Matched").length;
    const uGrnTotal = ugrnResults.filter(o => o.GRN_Total_INR !== "").length;
    const uGrnMatched = ugrnResults.filter(o => o.Status === "Matched").length;

    return {
      invoicesCount: invoices.length,
      inCompliantRate: invoices.length ? Math.round((inComp / invoices.length) * 100) : null,
      eligibleItc: inTax - inBlocked,
      blockedItc: inBlocked,
      uaeCount: uaeInvoices.length,
      uaeCompliantRate: uaeInvoices.length ? Math.round((uComp / uaeInvoices.length) * 100) : null,
      uaeVat: uVat,
      inGrnMatched,
      inGrnTotal: grnResults.length,
      uGrnMatched,
      uGrnTotal
    };
  };

  const stats = getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      {loadingError && (
        <div className="border border-red-500/20 bg-red-500/10 p-4 rounded-xl text-xs text-red-400 font-bold flex items-center gap-2">
          <AlertTriangle size={16} />
          {loadingError}
        </div>
      )}
      {/* Settings Bar */}
      <div className="border border-white/5 bg-white/5 p-5 rounded-2xl flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Settings size={14} className="text-[#4f7cff]" />
            Control Parameters
          </h3>
          <p className="text-[10px] text-[#737c92]">Configure API credentials, passwords, and entity parameters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row flex-wrap gap-4 w-full lg:w-auto">
          {/* Anthropic Key */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[#aab2c5]">Anthropic Key (sk-ant-)</label>
            <div className="flex gap-1.5">
              <input
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => {
                  setAnthropicKey(e.target.value);
                  setKeyMasked(false);
                }}
                disabled={keyMasked}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-white w-36"
              />
              {keyMasked ? (
                <button onClick={handleClearKey} className="px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer font-bold">Clear</button>
              ) : (
                <button onClick={handleSaveKey} className="px-2.5 py-1 text-[10px] bg-[#4f7cff] hover:bg-[#3d66dd] text-white rounded-lg transition-colors cursor-pointer font-bold">Save</button>
              )}
            </div>
          </div>

          {/* Unlock Pass */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[#aab2c5]">Lock Password</label>
            <div className="flex gap-1.5">
              <input
                type="password"
                placeholder="Enter password..."
                value={keyPassword}
                onChange={(e) => setKeyPassword(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-white w-28"
              />
              {keyUnlocked ? (
                <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Unlock size={10} /> Active
                </span>
              ) : (
                <button onClick={unlockKeyWithPassword} className="px-2.5 py-1 text-[10px] bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1">
                  <Lock size={10} /> Unlock
                </button>
              )}
            </div>
          </div>

          {/* Buyer GSTIN */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[#aab2c5]">Buyer GSTIN</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={ownGstinInput}
                onChange={(e) => setOwnGstinInput(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-white w-32 font-mono uppercase"
              />
              <button onClick={handleSaveGstin} className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors cursor-pointer font-semibold border border-white/10">Save</button>
            </div>
          </div>

          {/* Recipient TRN */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[#aab2c5]">Recipient TRN (UAE)</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={ownTrnInput}
                onChange={(e) => setOwnTrnInput(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-white w-32 font-mono"
              />
              <button onClick={handleSaveTrn} className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors cursor-pointer font-semibold border border-white/10">Save</button>
            </div>
          </div>

          {/* AI Extraction Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[#aab2c5]">AI Extraction Mode</label>
            <select
              value={aiModeSetting}
              onChange={(e) => {
                const val = e.target.value as any;
                setAiModeSetting(val);
                localStorage.setItem("ai_mode_setting", val);
              }}
              className="bg-[#0f111a] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-white w-36 font-semibold"
            >
              <option value="fallback">Smart Fallback</option>
              <option value="ai-first">AI-First (Max Accuracy)</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {[
          { id: "dash", label: "Dashboard" },
          { id: "india-inv", label: "🇮🇳 India Invoices" },
          { id: "india-grn", label: "🇮🇳 India GRN Match" },
          { id: "uae-inv", label: "🇦🇪 UAE Invoices" },
          { id: "uae-grn", label: "🇦🇪 UAE GRN Match" },
          { id: "pay-reco", label: "💰 Payment Reco" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
              activeTab === tab.id
                ? "bg-[#4f7cff] text-white border-[#4f7cff] shadow-[0_0_12px_rgba(79,124,255,0.25)]"
                : "bg-white/5 text-[#aab2c5] border-white/5 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {activeTab === "dash" && (
        <div className="flex flex-col gap-6">
          {/* General Stats */}
          {invoices.length === 0 && uaeInvoices.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center max-w-xl mx-auto w-full flex flex-col items-center justify-center gap-4">
              <Building size={32} className="text-[#737c92]" />
              <div>
                <h3 className="text-sm font-bold text-white">No Data Captured</h3>
                <p className="text-xs text-[#737c92] mt-1">Upload India or UAE invoices in their respective tabs to populate this dashboard tower.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-white/5 bg-white/5 p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] text-[#737c92] uppercase font-bold tracking-wider">India Invoices</span>
                <span className="text-2xl font-bold text-white font-display">{stats.invoicesCount} <span className="text-xs font-normal text-[#737c92]">processed</span></span>
                {stats.inCompliantRate !== null && (
                  <span className={`text-[10px] font-bold ${stats.inCompliantRate === 100 ? "text-green-400" : "text-yellow-400"}`}>
                    {stats.inCompliantRate}% Compliance Pass Rate
                  </span>
                )}
              </div>

              <div className="border border-white/5 bg-white/5 p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] text-[#737c92] uppercase font-bold tracking-wider">Eligible ITC (India)</span>
                <span className="text-2xl font-bold text-white font-display">₹{fINR(stats.eligibleItc)}</span>
                {stats.blockedItc > 0 && (
                  <span className="text-[9px] text-red-400 font-bold bg-red-400/5 border border-red-400/10 px-2 py-0.5 rounded-md self-start">
                    Blocked ITC: ₹{fINR(stats.blockedItc)}
                  </span>
                )}
              </div>

              <div className="border border-white/5 bg-white/5 p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] text-[#737c92] uppercase font-bold tracking-wider">UAE VAT Register</span>
                <span className="text-2xl font-bold text-white font-display">{stats.uaeCount} <span className="text-xs font-normal text-[#737c92]">processed</span></span>
                {stats.uaeCompliantRate !== null && (
                  <span className={`text-[10px] font-bold ${stats.uaeCompliantRate === 100 ? "text-green-400" : "text-yellow-400"}`}>
                    {stats.uaeCompliantRate}% VAT Compliance Pass
                  </span>
                )}
              </div>

              <div className="border border-white/5 bg-white/5 p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] text-[#737c92] uppercase font-bold tracking-wider">Recoverable VAT (UAE)</span>
                <span className="text-2xl font-bold text-white font-display">AED {fINR(stats.uaeVat)}</span>
              </div>
            </div>
          )}

          {/* Rollup Detailed Analysis */}
          {(invoices.length > 0 || uaeInvoices.length > 0) && (
            <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Roll-Up Notes</h3>
              <div className="text-xs text-[#aab2c5] leading-relaxed flex flex-col gap-3">
                <div className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff] mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">🇮🇳 India Ledger Status:</span>{" "}
                    {invoices.length > 0 ? (
                      <span>
                        {invoices.length} invoices analyzed. Total tax eligible for reconciliation is ₹{fINR(stats.eligibleItc)}. 
                        {stats.inGrnTotal > 0 ? ` 3-way GRN match status: ${stats.inGrnMatched} of ${stats.inGrnTotal} matches confirmed.` : " GRN reconciliation has not been run."}
                      </span>
                    ) : (
                      <span className="text-[#737c92]">No India invoices loaded. Go to the India Invoices tab to scan documents.</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff] mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">🇦🇪 UAE Ledger Status:</span>{" "}
                    {uaeInvoices.length > 0 ? (
                      <span>
                        {uaeInvoices.length} VAT invoices analyzed. Input VAT amount claims derived: AED {fINR(stats.uaeVat)}.
                        {stats.uGrnTotal > 0 ? ` 3-way UAE GRN match status: ${stats.uGrnMatched} of ${stats.uGrnTotal} verified.` : " UAE GRN reconciliation has not been run."}
                      </span>
                    ) : (
                      <span className="text-[#737c92]">No UAE invoices loaded. Go to the UAE Invoices tab to run extraction.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* India Invoices View */}
      {activeTab === "india-inv" && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">India Purchase Invoices</h2>
              <p className="text-[10px] text-[#737c92]">Scan PDF/scanned purchase invoices to assess GST compliance, blocked credits, and CGST/SGST/IGST divisions.</p>
            </div>

            {/* Mode switch */}
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
              <button 
                onClick={() => setInvMode("ocr")} 
                className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${invMode === "ocr" ? "bg-[#4f7cff] text-white" : "text-[#737c92] hover:text-white"}`}
              >
                Scan Files
              </button>
              <button 
                onClick={() => setInvMode("csv")} 
                className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${invMode === "csv" ? "bg-[#4f7cff] text-white" : "text-[#737c92] hover:text-white"}`}
              >
                Import CSV Register
              </button>
            </div>
          </div>

          {invMode === "ocr" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Upload panel */}
              <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
                <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2.5 transition-colors">
                  <Upload size={24} className="text-[#737c92]" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Drop invoices here</span>
                    <span className="text-[10px] text-[#737c92] block mt-0.5">Accepts PDF, JPG, PNG files</span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-colors mt-2">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const queueItems = files.map(f => ({ file: f, status: "queued" as const }));
                        setInvQueue([...invQueue, ...queueItems]);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Queue list */}
                {invQueue.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#aab2c5] uppercase tracking-wider">Upload Queue ({invQueue.length})</span>
                      <button 
                        onClick={() => setInvQueue([])} 
                        disabled={invRunning}
                        className="text-[10px] font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5">
                      {invQueue.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 text-xs">
                          <span className="text-white truncate max-w-xs">{item.file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#737c92]">{(item.file.size / 1024).toFixed(0)} KB</span>
                            {item.status === "queued" && <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">Queued</span>}
                            {item.status === "proc" && <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded animate-pulse">Reading</span>}
                            {item.status === "done" && <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Done</span>}
                            {item.status === "err" && <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded" title={item.error}>Error</span>}
                            <button 
                              onClick={() => {
                                const q = [...invQueue];
                                q.splice(idx, 1);
                                setInvQueue(q);
                              }}
                              disabled={invRunning}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {invRunning && (
                      <div className="flex flex-col gap-1.5 border border-[#4f7cff]/10 bg-[#4f7cff]/5 p-3 rounded-xl">
                        <div className="flex justify-between text-[10px] font-semibold text-white">
                          <span>{invProgress.text}</span>
                          <span>{invProgress.pct}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className="bg-[#4f7cff] h-1.5 rounded-full transition-all duration-300" style={{ width: `${invProgress.pct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-3">
                      {invRunning ? (
                        <button 
                          onClick={() => setInvAbort(true)} 
                          className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Square size={12} /> Stop Extraction
                        </button>
                      ) : (
                        <button 
                          onClick={runExtraction} 
                          className="flex-1 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,124,255,0.2)]"
                        >
                          <Play size={12} /> Run Extraction
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Extraction results */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {invoices.length > 0 ? (
                  <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reconciled Invoice Register ({invoices.length} rows)</h3>
                      <button 
                        onClick={() => triggerCSVDownload(`india_invoices_${stamp()}.csv`, HEADERS, invoices)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors"
                      >
                        <Download size={13} /> Export to CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
                      <table className="w-full border-collapse text-left min-w-[900px]">
                        <thead>
                          <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                            <th className="px-4 py-3">File Name</th>
                            <th className="px-4 py-3">Inv Number</th>
                            <th className="px-4 py-3">Inv Date</th>
                            <th className="px-4 py-3">Supplier GSTIN</th>
                            <th className="px-4 py-3 text-right">Taxable</th>
                            <th className="px-4 py-3 text-right">CGST</th>
                            <th className="px-4 py-3 text-right">SGST</th>
                            <th className="px-4 py-3 text-right">IGST</th>
                            <th className="px-4 py-3 text-right">Total Amount</th>
                            <th className="px-4 py-3">Math</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((item, idx) => {
                            const isMathPass = item.Math_Check_Pass === "Pass";
                            const isCompliant = item.Compliance_Status === "Compliant";
                            return (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-3 text-white truncate max-w-xs" title={item.File_Name}>{item.File_Name}</td>
                                <td className="px-4 py-3 text-[#aab2c5] font-mono">{item.Invoice_Number}</td>
                                <td className="px-4 py-3 text-[#aab2c5]">{item.Invoice_Date}</td>
                                <td className={`px-4 py-3 font-mono ${item._sg?.valid ? "text-green-400" : "text-red-400"}`} title={item._sg?.reason}>
                                  {item.Supplier_GSTIN}
                                </td>
                                <td className="px-4 py-3 text-right text-white">₹{fINR(num(item.Taxable_Amount))}</td>
                                <td className="px-4 py-3 text-right text-[#aab2c5]">₹{fINR(num(item.CGST_Amount))}</td>
                                <td className="px-4 py-3 text-right text-[#aab2c5]">₹{fINR(num(item.SGST_Amount))}</td>
                                <td className="px-4 py-3 text-right text-[#aab2c5]">₹{fINR(num(item.IGST_Amount))}</td>
                                <td className="px-4 py-3 text-right text-white font-bold">₹{fINR(num(item.Total_Amount))}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMathPass ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                                    {item.Math_Check_Pass}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCompliant ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                                    {item.Compliance_Status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 p-12 text-center rounded-2xl text-xs text-[#737c92]">
                    No invoices extracted yet. Select files and click Run Extraction.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // CSV Register Import Panel
            <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">CSV Data Register Intake</h3>
                <p className="text-[10px] text-[#737c92] mt-0.5">Upload a CSV file containing pre-compiled purchase register columns.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => triggerCSVDownload("purchase_register_template.csv", [
                    "Invoice_Number", "Invoice_Date", "Supplier_Name", "Supplier_GSTIN", 
                    "Buyer_Name", "Buyer_GSTIN", "Supplier_Address", "HSN_SAC", 
                    "Taxable_Amount", "CGST_Amount", "SGST_Amount", "IGST_Amount", 
                    "Total_Amount", "PO_No", "Qty"
                  ], [])}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={13} className="text-[#34d399]" />
                  Download Header CSV Template
                </button>

                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]">
                  Upload CSV Register
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleRegisterCSV}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* India GRN Reconciliation View */}
      {activeTab === "india-grn" && (
        <div className="flex flex-col gap-6">
          <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">India 3-Way GRN Match</h2>
              <p className="text-[10px] text-[#737c92]">Upload purchase GRN (Goods Receipt Note) register sheets and compare them against extracted invoices.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors">
                <Upload size={13} />
                Upload GRN (CSV/Excel)
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleIndiaGrnUpload}
                  className="hidden"
                />
              </label>

              {indiaGrnFileName && (
                <span className="text-xs font-mono text-white bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  {indiaGrnFileName}
                </span>
              )}

              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <label className="text-[10px] text-[#737c92] font-semibold uppercase">Value Tolerance</label>
                <input 
                  type="number" 
                  value={grnValTol} 
                  onChange={(e) => setGrnValTol(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2 py-0.5 text-xs text-white w-14 text-center font-bold" 
                />
                <span className="text-xs text-white">%</span>
              </div>

              <button 
                onClick={runIndiaGrnMatch}
                disabled={indiaGrnRaw.length === 0}
                className="px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]"
              >
                Run Matcher
              </button>

              <button 
                onClick={reRunUnmatchedIndia}
                disabled={indiaGrnRaw.length === 0}
                className="px-4 py-2 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Re-process Unmatched Invoices
              </button>
            </div>

            {grnResults.length > 0 && (
              <div className="flex flex-col gap-6">
                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-bold border border-green-500/10">
                      Matched: {grnResults.filter(r => r.Match_Status === "Matched").length}
                    </span>
                    <span className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold border border-red-500/10">
                      Mismatches: {grnResults.filter(r => r.Match_Status === "Amount mismatch").length}
                    </span>
                    <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-[10px] font-bold border border-yellow-500/10">
                      Unmatched: {grnResults.filter(r => r.Match_Status !== "Matched" && r.Match_Status !== "Amount mismatch").length}
                    </span>
                  </div>

                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737c92]" size={14} />
                    <input
                      type="text"
                      placeholder="Filter by Vendor / Invoice / Status..."
                      value={grnSearch}
                      onChange={(e) => setGrnSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-[#737c92] transition-colors"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
                  <table className="w-full border-collapse text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                        <th className="px-4 py-3">Invoice No</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3 text-right">Invoice Value</th>
                        <th className="px-4 py-3 text-right">GRN Value</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnResults
                        .filter(r => {
                          const query = grnSearch.toLowerCase();
                          return String(r.Invoice_No).toLowerCase().includes(query) ||
                                 String(r.Vendor).toLowerCase().includes(query) ||
                                 String(r.Match_Status).toLowerCase().includes(query);
                        })
                        .map((r, idx) => {
                          const isMatched = r.Match_Status === "Matched";
                          const isMismatch = r.Match_Status === "Amount mismatch";
                          return (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-4 py-3 font-mono text-white">{r.Invoice_No}</td>
                              <td className="px-4 py-3 text-[#aab2c5] truncate max-w-xs">{r.Vendor || "—"}</td>
                              <td className="px-4 py-3 text-right text-white">₹{r.Inv_Value !== "" ? fINR(num(r.Inv_Value)) : "—"}</td>
                              <td className="px-4 py-3 text-right text-white font-bold">₹{r.GRN_Value !== "" ? fINR(num(r.GRN_Value)) : "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isMatched ? "bg-green-400/10 text-green-400" :
                                  isMismatch ? "bg-red-400/10 text-red-400" : "bg-yellow-400/10 text-yellow-400"
                                }`}>
                                  {r.Match_Status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UAE Invoices View */}
      {activeTab === "uae-inv" && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">UAE Purchase Invoices</h2>
              <p className="text-[10px] text-[#737c92]">Capture and audit simplified or full UAE VAT invoices u/s Article 59 compliance rules.</p>
            </div>

            {/* Mode switch */}
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
              <button 
                onClick={() => setUaeInvMode("ocr")} 
                className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${uaeInvMode === "ocr" ? "bg-[#4f7cff] text-white" : "text-[#737c92] hover:text-white"}`}
              >
                Scan Files
              </button>
              <button 
                onClick={() => setUaeInvMode("csv")} 
                className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${uaeInvMode === "csv" ? "bg-[#4f7cff] text-white" : "text-[#737c92] hover:text-white"}`}
              >
                Import CSV Register
              </button>
            </div>
          </div>

          {uaeInvMode === "ocr" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Upload panel */}
              <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
                <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2.5 transition-colors">
                  <Upload size={24} className="text-[#737c92]" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Drop UAE invoices here</span>
                    <span className="text-[10px] text-[#737c92] block mt-0.5">Accepts PDF, JPG, PNG files</span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-colors mt-2">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const queueItems = files.map(f => ({ file: f, status: "queued" as const }));
                        setUaeQueue([...uaeQueue, ...queueItems]);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Queue list */}
                {uaeQueue.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#aab2c5] uppercase tracking-wider">Upload Queue ({uaeQueue.length})</span>
                      <button 
                        onClick={() => setUaeQueue([])} 
                        disabled={uaeRunning}
                        className="text-[10px] font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5">
                      {uaeQueue.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 text-xs">
                          <span className="text-white truncate max-w-xs">{item.file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#737c92]">{(item.file.size / 1024).toFixed(0)} KB</span>
                            {item.status === "queued" && <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">Queued</span>}
                            {item.status === "proc" && <span className="text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded animate-pulse">Reading</span>}
                            {item.status === "done" && <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Done</span>}
                            {item.status === "err" && <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded" title={item.error}>Error</span>}
                            <button 
                              onClick={() => {
                                const q = [...uaeQueue];
                                q.splice(idx, 1);
                                setUaeQueue(q);
                              }}
                              disabled={uaeRunning}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {uaeRunning && (
                      <div className="flex flex-col gap-1.5 border border-[#4f7cff]/10 bg-[#4f7cff]/5 p-3 rounded-xl">
                        <div className="flex justify-between text-[10px] font-semibold text-white">
                          <span>{uaeProgress.text}</span>
                          <span>{uaeProgress.pct}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className="bg-[#4f7cff] h-1.5 rounded-full transition-all duration-300" style={{ width: `${uaeProgress.pct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-3">
                      {uaeRunning ? (
                        <button 
                          onClick={() => setUaeAbort(true)} 
                          className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Square size={12} /> Stop UAE Extraction
                        </button>
                      ) : (
                        <button 
                          onClick={runUaeExtraction} 
                          className="flex-1 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,124,255,0.2)]"
                        >
                          <Play size={12} /> Run UAE Extraction
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* UAE Extraction results */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {uaeInvoices.length > 0 ? (
                  <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">UAE VAT Invoice Register ({uaeInvoices.length} rows)</h3>
                      <button 
                        onClick={() => triggerCSVDownload(`uae_invoices_${stamp()}.csv`, UAE_HEADERS, uaeInvoices)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors"
                      >
                        <Download size={13} /> Export to CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
                      <table className="w-full border-collapse text-left min-w-[900px]">
                        <thead>
                          <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                            <th className="px-4 py-3">File Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Inv Number</th>
                            <th className="px-4 py-3">Inv Date</th>
                            <th className="px-4 py-3">Supplier TRN</th>
                            <th className="px-4 py-3">Currency</th>
                            <th className="px-4 py-3 text-right">Taxable</th>
                            <th className="px-4 py-3 text-right">VAT Amount</th>
                            <th className="px-4 py-3 text-right">Total Amount</th>
                            <th className="px-4 py-3">VAT Math</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uaeInvoices.map((item, idx) => {
                            const isMathPass = item.VAT_Math_Pass.includes("Pass");
                            const isCompliant = item.Compliance_Status === "Compliant";
                            return (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-3 text-white truncate max-w-xs" title={item.File_Name}>{item.File_Name}</td>
                                <td className="px-4 py-3 text-[#aab2c5] font-semibold">{item.Invoice_Type}</td>
                                <td className="px-4 py-3 text-[#aab2c5] font-mono">{item.Invoice_Number}</td>
                                <td className="px-4 py-3 text-[#aab2c5]">{item.Invoice_Date}</td>
                                <td className={`px-4 py-3 font-mono ${item._sT?.valid ? "text-green-400" : "text-red-400"}`} title={item._sT?.reason}>
                                  {item.Supplier_TRN}
                                </td>
                                <td className="px-4 py-3 text-[#aab2c5]">{item.Currency}</td>
                                <td className="px-4 py-3 text-right text-white">{item.Currency} {fINR(num(item.Taxable_Amount))}</td>
                                <td className="px-4 py-3 text-right text-[#aab2c5]">{item.Currency} {fINR(num(item.VAT_Amount))}</td>
                                <td className="px-4 py-3 text-right text-white font-bold">{item.Currency} {fINR(num(item.Total_Amount))}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMathPass ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`} title={item.VAT_Math_Pass}>
                                    {isMathPass ? "Pass" : "Fail"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCompliant ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                                    {item.Compliance_Status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 p-12 text-center rounded-2xl text-xs text-[#737c92]">
                    No UAE invoices extracted yet. Select files and click Run UAE Extraction.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // UAE CSV Register Import Panel
            <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">UAE CSV Data Register Intake</h3>
                <p className="text-[10px] text-[#737c92] mt-0.5">Upload a CSV file containing pre-compiled UAE VAT purchase register columns.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => triggerCSVDownload("uae_purchase_register_template.csv", [
                    "Invoice_Number", "Invoice_Date", "Supplier_Name", "Supplier_TRN", 
                    "Recipient_Name", "Recipient_TRN", "Currency", "Taxable_Amount", 
                    "VAT_Amount", "Total_Amount"
                  ], [])}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={13} className="text-[#34d399]" />
                  Download Header CSV Template
                </button>

                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]">
                  Upload CSV Register
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleRegisterCSVUae}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UAE GRN Reconciliation View */}
      {activeTab === "uae-grn" && (
        <div className="flex flex-col gap-6">
          <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">UAE 3-Way GRN Match</h2>
              <p className="text-[10px] text-[#737c92]">Upload UAE GRN data files and compare them against extracted UAE invoices using currency conversions.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors">
                <Upload size={13} />
                Upload UAE GRN (CSV/Excel)
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleUaeGrnUpload}
                  className="hidden"
                />
              </label>

              {uaeGrnFileName && (
                <span className="text-xs font-mono text-white bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  {uaeGrnFileName}
                </span>
              )}

              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <label className="text-[10px] text-[#737c92] font-semibold uppercase">Value Tolerance</label>
                <input 
                  type="number" 
                  value={ugrnTol} 
                  onChange={(e) => setUgrnTol(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2 py-0.5 text-xs text-white w-14 text-center font-bold" 
                />
                <span className="text-xs text-white">%</span>
              </div>

              <button 
                onClick={runUaeGrnMatch}
                disabled={uaeGrnRaw.length === 0}
                className="px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]"
              >
                Run Matcher
              </button>

              <button 
                onClick={reRunUnmatchedUae}
                disabled={uaeGrnRaw.length === 0}
                className="px-4 py-2 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Re-process Unmatched Invoices
              </button>
            </div>

            {ugrnResults.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center text-xs text-[#737c92]">
                  <span>Derived Conversion Rate: <b className="text-white">{derivedUaeRate ? derivedUaeRate.toFixed(3) : "—"} INR/AED</b></span>
                </div>

                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-bold border border-green-500/10">
                      Matched: {ugrnResults.filter(r => r.Status === "Matched").length}
                    </span>
                    <span className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold border border-red-500/10">
                      Mismatches: {ugrnResults.filter(r => r.Status === "Amount mismatch").length}
                    </span>
                    <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-[10px] font-bold border border-yellow-500/10">
                      Unmatched: {ugrnResults.filter(r => r.Status !== "Matched" && r.Status !== "Amount mismatch").length}
                    </span>
                  </div>

                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737c92]" size={14} />
                    <input
                      type="text"
                      placeholder="Filter results..."
                      value={ugrnSearch}
                      onChange={(e) => setUgrnSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-[#737c92] transition-colors"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
                  <table className="w-full border-collapse text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                        <th className="px-4 py-3">Invoice No</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3 text-right">GRN Value (INR)</th>
                        <th className="px-4 py-3 text-right">Invoice Value (AED)</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ugrnResults
                        .filter(r => {
                          const query = ugrnSearch.toLowerCase();
                          return String(r.Invoice_No).toLowerCase().includes(query) ||
                                 String(r.Vendor).toLowerCase().includes(query) ||
                                 String(r.Status).toLowerCase().includes(query);
                        })
                        .map((r, idx) => {
                          const isMatched = r.Status === "Matched";
                          const isMismatch = r.Status === "Amount mismatch";
                          return (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-4 py-3 font-mono text-white">{r.Invoice_No}</td>
                              <td className="px-4 py-3 text-[#aab2c5] truncate max-w-xs">{r.Vendor || "—"}</td>
                              <td className="px-4 py-3 text-right text-white">₹{r.GRN_Total_INR !== "" ? fINR(num(r.GRN_Total_INR)) : "—"}</td>
                              <td className="px-4 py-3 text-right text-white font-bold">AED {r.Invoice_AED !== "" ? fINR(num(r.Invoice_AED)) : "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isMatched ? "bg-green-400/10 text-green-400" :
                                  isMismatch ? "bg-red-400/10 text-red-400" : "bg-yellow-400/10 text-yellow-400"
                                }`}>
                                  {r.Status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Reconciliation View */}
      {activeTab === "pay-reco" && (
        <div className="flex flex-col gap-6">
          <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">Bank Statement Reconciliation</h2>
              <p className="text-[10px] text-[#737c92]">Match bank debit transactions against purchase invoices to ensure payments match invoices and UTR records are logged.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors">
                <Upload size={13} />
                Upload Bank Statement CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBankUpload}
                  className="hidden"
                />
              </label>

              {bankFileName && (
                <span className="text-xs font-mono text-white bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  {bankFileName}
                </span>
              )}

              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <label className="text-[10px] text-[#737c92] font-semibold uppercase">Amount Tolerance</label>
                <input 
                  type="number" 
                  value={payTol} 
                  onChange={(e) => setPayTol(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2 py-0.5 text-xs text-white w-14 text-center font-bold" 
                />
                <span className="text-xs text-white">₹</span>
              </div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <label className="text-[10px] text-[#737c92] font-semibold uppercase">Date Window</label>
                <input 
                  type="number" 
                  value={payDays} 
                  onChange={(e) => setPayDays(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-2 py-0.5 text-xs text-white w-14 text-center font-bold" 
                />
                <span className="text-xs text-white">days</span>
              </div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <label className="text-[10px] text-[#737c92] font-semibold uppercase flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={payUseParty} 
                    onChange={(e) => setPayUseParty(e.target.checked)}
                    className="accent-[#4f7cff]" 
                  />
                  Use party-name matching
                </label>
              </div>

              <button 
                onClick={runPayReco}
                disabled={bankRaw.length === 0}
                className="px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]"
              >
                Reconcile
              </button>
            </div>

            {payResults.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Matched Panel */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Invoice Matching Status</h3>
                  <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                          <th className="px-4 py-3">Invoice No</th>
                          <th className="px-4 py-3">Supplier</th>
                          <th className="px-4 py-3 text-right">Invoice Amount</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payResults.map((r, idx) => {
                          const isMatched = r.Reco_Status === "Matched";
                          const isProbable = r.Reco_Status.includes("Probable");
                          return (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-4 py-3 font-mono text-white">{r.Invoice_Number}</td>
                              <td className="px-4 py-3 text-[#aab2c5] truncate max-w-xs">{r.Supplier_Name}</td>
                              <td className="px-4 py-3 text-right text-white">₹{fINR(num(r.Total_Amount))}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isMatched ? "bg-green-400/10 text-green-400" :
                                  isProbable ? "bg-yellow-400/10 text-yellow-400" : "bg-red-400/10 text-red-400"
                                }`}>
                                  {r.Reco_Status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Unmatched Bank debits */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Unmatched Bank Debits</h3>
                  <div className="overflow-x-auto text-xs border border-white/5 rounded-xl">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Debit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unmatchedBank.length > 0 ? (
                          unmatchedBank.map((b, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-4 py-3 text-[#aab2c5]">{b.Txn_Date}</td>
                              <td className="px-4 py-3 text-[#aab2c5] truncate max-w-xs" title={b.Description}>{b.Description}</td>
                              <td className="px-4 py-3 text-right text-white font-bold">₹{fINR(num(b.Debit))}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-[#737c92]">All bank debits matched successfully.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function stamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
