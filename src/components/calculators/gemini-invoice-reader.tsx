"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Sparkles,
  RefreshCw,
  Eye,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Layers,
  ShieldCheck,
} from "lucide-react";

export interface ExtractedInvoiceData {
  date: string;
  billNumber: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalBillAmount: number;
  vendorName?: string;
  gstin?: string;
  confidence?: "high" | "medium" | "low";
}

export interface InvoiceItem {
  id: string;
  srNo: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string;
  status: "queued" | "processing" | "completed" | "error";
  errorMessage?: string;
  data: ExtractedInvoiceData;
  isEdited?: boolean;
}

function formatTallyDate(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.trim();
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    let day = parts[0].padStart(2, "0");
    let month = parts[1].padStart(2, "0");
    let year = parts[2];
    if (year.length === 2) year = "20" + year;
    if (day.length === 4) {
      return `${parts[0]}-${month}-${parts[2].padStart(2, "0")}`;
    }
    return `${year}-${month}-${day}`;
  }
  return clean;
}

function exportToTallyExcel(invoices: InvoiceItem[]) {
  if (!invoices || invoices.length === 0) return;

  const tallyRows = invoices.map((item, index) => {
    const data = item.data;
    const vendor = data.vendorName && data.vendorName !== "N/A" ? data.vendorName : "Sundry Creditors / Vendor";
    const billNo = data.billNumber && data.billNumber !== "N/A" ? data.billNumber : `BILL-${index + 1}`;
    const formattedDate = formatTallyDate(data.date);
    const gstin = data.gstin || "";

    const taxable = Number(data.taxableAmount) || 0;
    const cgst = Number(data.cgst) || 0;
    const sgst = Number(data.sgst) || 0;
    const igst = Number(data.igst) || 0;
    const total = Number(data.totalBillAmount) || taxable + cgst + sgst + igst;
    const isInterstate = igst > 0;

    return {
      "Voucher Date": formattedDate,
      "Voucher Type": "Purchase",
      "Supplier Invoice No": billNo,
      "Supplier Invoice Date": formattedDate,
      "Party Ledger Name": vendor,
      "Supplier GSTIN": gstin,
      "Purchase Ledger": isInterstate ? "Interstate Purchase - Taxable" : "Local Purchase - Taxable",
      "Taxable Amount": Number(taxable.toFixed(2)),
      "CGST Ledger": cgst > 0 ? "Input CGST" : "",
      "CGST Amount": Number(cgst.toFixed(2)),
      "SGST Ledger": sgst > 0 ? "Input SGST" : "",
      "SGST Amount": Number(sgst.toFixed(2)),
      "IGST Ledger": igst > 0 ? "Input IGST" : "",
      "IGST Amount": Number(igst.toFixed(2)),
      "Total Voucher Amount": Number(total.toFixed(2)),
      "Narration": `Being purchase invoice no ${billNo} from ${vendor}`,
      "Tally Import Ready": item.status === "completed" ? "YES" : "CHECK DATA",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(tallyRows);
  worksheet["!cols"] = [
    { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 20 },
    { wch: 32 }, { wch: 18 }, { wch: 28 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 45 }, { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tally Purchase Vouchers");
  XLSX.writeFile(workbook, `Tally_Purchase_Import_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportToStandardExcel(invoices: InvoiceItem[]) {
  if (!invoices || invoices.length === 0) return;

  const rows = invoices.map((item, index) => ({
    "Sr No": item.srNo || index + 1,
    Date: item.data.date || "",
    "Bill Number": item.data.billNumber || "",
    "Vendor Name": item.data.vendorName || "",
    "Taxable Amount": Number(item.data.taxableAmount) || 0,
    CGST: Number(item.data.cgst) || 0,
    SGST: Number(item.data.sgst) || 0,
    IGST: Number(item.data.igst) || 0,
    "Total Bill Amount": Number(item.data.totalBillAmount) || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Invoices");
  XLSX.writeFile(workbook, `Numbiriq_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function GeminiInvoiceReader() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExtractedInvoiceData | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceItem | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const processSingleInvoice = async (
    file: File,
    dataUrl: string
  ): Promise<ExtractedInvoiceData> => {
    const res = await fetch("/api/extract-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Data: dataUrl,
        mimeType: file.type || "image/png",
        fileName: file.name,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Extraction failed");
    }
    return json.data as ExtractedInvoiceData;
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsProcessing(true);
    setGlobalError(null);

    const startSrNo = invoices.length + 1;
    const newItems: InvoiceItem[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const dataUrl = await fileToDataUrl(file);

      const item: InvoiceItem = {
        id,
        srNo: startSrNo + index,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "image/png",
        fileDataUrl: dataUrl,
        status: "processing",
        data: {
          date: "",
          billNumber: "",
          taxableAmount: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalBillAmount: 0,
        },
      };

      setInvoices((prev) => [...prev, item]);

      try {
        const extracted = await processSingleInvoice(file, dataUrl);
        setInvoices((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: "completed", data: extracted } : i))
        );
      } catch (err: any) {
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: "error", errorMessage: err.message || "Failed" } : i
          )
        );
      }
    }

    setIsProcessing(false);
    e.target.value = "";
  };

  const completedInvoices = invoices.filter((i) => i.status === "completed");
  const totalTaxable = completedInvoices.reduce((s, i) => s + (Number(i.data.taxableAmount) || 0), 0);
  const totalCgst = completedInvoices.reduce((s, i) => s + (Number(i.data.cgst) || 0), 0);
  const totalSgst = completedInvoices.reduce((s, i) => s + (Number(i.data.sgst) || 0), 0);
  const totalIgst = completedInvoices.reduce((s, i) => s + (Number(i.data.igst) || 0), 0);
  const grandTotal = completedInvoices.reduce((s, i) => s + (Number(i.data.totalBillAmount) || 0), 0);

  const formatNumber = (num: number) =>
    (Number(num) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 text-slate-100">
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900/80 border border-cyan-500/30 p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                POWERED BY GOOGLE GEMINI 3.6 FLASH
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                100% FREE & UNLIMITED
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Gemini AI Bulk Invoice Extractor & Tally Exporter
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-2xl">
              Upload multiple invoice PDFs or images. Gemini AI extracts bill dates, numbers, taxable subtotal, CGST, SGST, IGST & vendor names automatically, with instant 1-click **Tally Prime Excel Export**.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => exportToStandardExcel(completedInvoices)}
              disabled={completedInvoices.length === 0}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Standard Excel
            </button>
            <button
              onClick={() => exportToTallyExcel(completedInvoices)}
              disabled={completedInvoices.length === 0}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-xl shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Tally Format (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 mb-8 text-center relative hover:border-cyan-500/40 transition-all duration-300">
        <label className="cursor-pointer flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 shadow-xl">
            <UploadCloud className="w-8 h-8 text-cyan-400 animate-bounce" />
          </div>
          <span className="text-base font-extrabold text-white mb-1">
            Click or Drag & Drop Invoices / Bills Here
          </span>
          <span className="text-xs text-slate-400 mb-4">
            Supports PDF Documents, PNG, JPG, and WEBP Images
          </span>
          <span className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition">
            Browse Computer Files
          </span>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      </div>

      {/* High Level Metrics Cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl bg-slate-900/70 border border-cyan-500/20 p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Invoices Processed</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{completedInvoices.length} / {invoices.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 border border-blue-500/20 p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Taxable Value</p>
            <p className="text-xl font-black text-slate-100 mt-1">₹ {formatNumber(totalTaxable)}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total GST (C+S+I)</p>
            <p className="text-xl font-black text-amber-300 mt-1">₹ {formatNumber(totalCgst + totalSgst + totalIgst)}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/30 p-5">
            <p className="text-[11px] font-bold text-emerald-400 uppercase">Grand Total</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">₹ {formatNumber(grandTotal)}</p>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {invoices.length > 0 && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl overflow-hidden mb-12">
          <div className="p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Gemini Extracted Invoice Ledger & Tally Readiness
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <th className="py-3 px-4 text-center">Sr No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Tally Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-center font-bold text-cyan-400">{index + 1}</td>
                    <td className="py-3.5 px-4 font-mono">{item.data.date || "—"}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{item.data.billNumber || "—"}</td>
                    <td className="py-3.5 px-4 text-slate-300">{item.data.vendorName || "—"}</td>
                    <td className="py-3.5 px-4 text-right font-mono">₹ {formatNumber(item.data.taxableAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">₹ {formatNumber(item.data.cgst)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">₹ {formatNumber(item.data.sgst)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">₹ {formatNumber(item.data.igst)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300">₹ {formatNumber(item.data.totalBillAmount)}</td>
                    <td className="py-3.5 px-4 text-center">
                      {item.status === "completed" ? (
                        <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tally Ready
                        </span>
                      ) : (
                        <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Processing...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
