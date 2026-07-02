"use client";

import { useState } from "react";
import { Calculator, Calendar, Copy, Check, Printer, Share2, Shield, Upload, Download, FileSpreadsheet, AlertTriangle } from "lucide-react";

export function GSTLateFeeCalculator() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  
  // Single Mode State
  const [returnType, setReturnType] = useState("taxable");
  const [turnover, setTurnover] = useState("2000"); // maps to max cap
  const [dueDate, setDueDate] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Bulk Mode State
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState("");

  const calculateLateFee = (dueDateStr: string, filingDateStr: string, type: string, capStr: string) => {
    if (!dueDateStr || !filingDateStr) return null;
    
    const due = new Date(dueDateStr);
    const filed = new Date(filingDateStr);
    
    due.setHours(0,0,0,0);
    filed.setHours(0,0,0,0);

    const diffTime = filed.getTime() - due.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return { days: 0, perDay: 0, gross: 0, cap: 0, payable: 0, cgst: 0, sgst: 0, isDelayed: false };
    }

    const perDay = type === "nil" ? 20 : 50;
    const cap = type === "nil" ? 500 : parseInt(capStr) || 2000;
    const gross = days * perDay;
    const payable = Math.min(gross, cap);
    const half = payable / 2;

    return {
      days,
      perDay,
      gross,
      cap,
      payable,
      cgst: half,
      sgst: half,
      isDelayed: true
    };
  };

  const handleCalculateSingle = () => {
    setError("");
    setResult(null);

    if (!dueDate || !filingDate) {
      setError("Please select both the due date and the actual filing date.");
      return;
    }

    const fee = calculateLateFee(dueDate, filingDate, returnType, turnover);
    setResult(fee);
  };

  // CSV Template Download
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Due Date (YYYY-MM-DD),Filing Date (YYYY-MM-DD),Return Type (nil/taxable),Turnover Cap (2000/5000/10000)\n2026-06-20,2026-06-25,taxable,2000\n2026-06-20,2026-06-20,nil,500\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gst_late_fee_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Parse & Calculate
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          setBulkError("CSV file is empty or missing headers.");
          return;
        }

        const calculated: any[] = [];
        // Start from index 1 (skip headers)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          if (cols.length < 3) continue;

          const due = cols[0]?.trim();
          const filed = cols[1]?.trim();
          const type = cols[2]?.trim().toLowerCase() === "nil" ? "nil" : "taxable";
          const cap = cols[3]?.trim() || "2000";

          const feeResult = calculateLateFee(due, filed, type, cap);
          if (feeResult) {
            calculated.push({
              index: i,
              dueDate: due,
              filingDate: filed,
              type: type === "nil" ? "Nil" : "Taxable",
              ...feeResult
            });
          }
        }

        setBulkRows(calculated);
      } catch (err) {
        setBulkError("Failed to parse CSV file. Please use the template.");
      }
    };
    reader.readAsText(file);
  };

  // Export Results to CSV
  const exportBulkResults = () => {
    if (bulkRows.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Sr No,Due Date,Filing Date,Return Type,Delay (Days),Rate Per Day, statutory Cap,CGST,SGST,Net Late Fee\n";
    bulkRows.forEach((row, i) => {
      csvContent += `${i + 1},${row.dueDate},${row.filingDate},${row.type},${row.days},${row.perDay},${row.cap},${row.cgst},${row.sgst},${row.payable}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gst_late_fee_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyResult = () => {
    if (!result) return;
    const text = `GST Late Fee Calculation (NumberIQ):
Return Type: ${returnType === "nil" ? "Nil Return" : "Taxable Return"}
Days Delayed: ${result.days} days
Late Fee Payable: ₹${result.payable.toLocaleString("en-IN")} (CGST: ₹${result.cgst.toLocaleString("en-IN")}, SGST: ₹${result.sgst.toLocaleString("en-IN")})
Calculated on: ${new Date().toLocaleDateString()}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "single"
              ? "border-[#4f7cff] text-[#4f7cff]"
              : "border-transparent text-[#737c92] hover:text-white"
          }`}
        >
          Single Mode
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "bulk"
              ? "border-[#4f7cff] text-[#4f7cff]"
              : "border-transparent text-[#737c92] hover:text-white"
          }`}
        >
          Bulk Upload Mode
        </button>
      </div>

      {activeTab === "single" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl backdrop-blur-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Calculator Inputs</h2>
              <p className="text-xs text-[#737c92]">Specify return details u/s 47 of the CGST Act.</p>
            </div>

            {/* Input Fields */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#aab2c5]">Return Type</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer transition-colors"
                >
                  <option value="taxable" className="bg-[#080a12]">Taxable Return (Outward Supply/Liability)</option>
                  <option value="nil" className="bg-[#080a12]">Nil Return (No transactions)</option>
                </select>
              </div>

              {returnType === "taxable" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#aab2c5]">Annual Turnover in Preceding FY</label>
                  <select
                    value={turnover}
                    onChange={(e) => setTurnover(e.target.value)}
                    className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer transition-colors"
                  >
                    <option value="2000" className="bg-[#080a12]">Up to ₹1.5 Crore (Max cap: ₹2,000)</option>
                    <option value="5000" className="bg-[#080a12]">₹1.5 Crore to ₹5 Crore (Max cap: ₹5,000)</option>
                    <option value="10000" className="bg-[#080a12]">Above ₹5 Crore (Max cap: ₹10,000)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#aab2c5]">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2 text-sm text-white transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#aab2c5]">Actual Filing Date</label>
                  <input
                    type="date"
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                    className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2 text-sm text-white transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-[#ff5d73] bg-[#ff5d73]/10 border border-[#ff5d73]/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                onClick={handleCalculateSingle}
                className="w-full py-2.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(79,124,255,0.2)] hover:shadow-[0_0_20px_rgba(79,124,255,0.35)] cursor-pointer"
              >
                Calculate Late Fee
              </button>
            </div>
          </div>

          {/* Right Column: Result Panel */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {result ? (
              <div className="border border-white/5 bg-white/5 p-6 rounded-2xl backdrop-blur-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Calculation Output</h3>
                    <p className="text-[10px] text-[#737c92]">Computed based on standard CGST/SGST rules.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyResult}
                      className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 text-[#aab2c5] hover:text-white transition-all cursor-pointer"
                      title="Copy results"
                    >
                      {copied ? <Check size={14} className="text-[#34d399]" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 text-[#aab2c5] hover:text-white transition-all cursor-pointer"
                      title="Print PDF"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>

                {result.isDelayed ? (
                  <div className="flex flex-col gap-6">
                    <div className="text-center py-6 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff5d73]">
                        Late Fee Payable
                      </span>
                      <div className="text-3xl font-display font-bold text-white mt-1.5">
                        ₹{result.payable.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="border border-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <tbody>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Days delayed</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">{result.days} days</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Combined rate per day</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">₹{result.perDay} / day</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Gross accrued fee</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">₹{result.gross.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Maximum statutory cap</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">₹{result.cap.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-white/5 bg-white/5 font-semibold">
                            <td className="px-4 py-3 text-white">Net Late Fee (lower of gross or cap)</td>
                            <td className="px-4 py-3 text-white text-right">₹{result.payable.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5] pl-6">— CGST Portion (50%)</td>
                            <td className="px-4 py-3 text-[#aab2c5] text-right">₹{result.cgst.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5] pl-6">— SGST/UTGST Portion (50%)</td>
                            <td className="px-4 py-3 text-[#aab2c5] text-right">₹{result.sgst.toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <Check size={32} className="text-[#34d399] bg-[#34d399]/10 p-1.5 rounded-full" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">No Late Fee Applicable</h4>
                      <p className="text-xs text-[#737c92] max-w-xs mt-1">
                        The return was filed on or before the due date. No Section 47 charges apply.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-white/10 p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
                <Calculator size={32} className="text-[#737c92]" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Awaiting Calculation</h4>
                  <p className="text-xs text-[#737c92] max-w-xs mt-1">
                    Fill out the return details in the inputs panel and click calculate.
                  </p>
                </div>
              </div>
            )}

            {/* Legal Reference & Education */}
            <div className="border border-white/5 bg-[#080a12]/50 p-6 rounded-2xl flex flex-col gap-4 text-xs text-[#aab2c5] leading-relaxed">
              <h4 className="font-semibold text-white flex items-center gap-1">
                <Shield size={14} className="text-[#4f7cff]" />
                Section 47 Statutory Limits Reference
              </h4>
              <p>
                Late fees under Section 47 are split equally between CGST and SGST. For regular taxpayers, standard late fee rates are capped as follows:
              </p>
              <ul className="list-disc pl-4 flex flex-col gap-1.5 text-[#737c92]">
                <li><b>Nil outward liability</b>: ₹20 per day (₹10 CGST + ₹10 SGST) capped at a maximum of <b>₹500</b>.</li>
                <li><b>Taxable returns (turnover ≤ ₹1.5 Cr)</b>: ₹50 per day (₹25 CGST + ₹25 SGST) capped at <b>₹2,000</b>.</li>
                <li><b>Taxable returns (turnover ₹1.5 Cr – ₹5 Cr)</b>: ₹50 per day (₹25 CGST + ₹25 SGST) capped at <b>₹5,000</b>.</li>
                <li><b>Taxable returns (turnover &gt; ₹5 Cr)</b>: ₹50 per day (₹25 CGST + ₹25 SGST) capped at <b>₹10,000</b>.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-fadeIn">
          {/* Top Panel: Template & File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Download Template Card */}
            <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">1. Download Bulk Template</h3>
                <p className="text-xs text-[#737c92]">Download the sample CSV file to format your calculation entries correctly.</p>
              </div>
              <div>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/10 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet size={14} className="text-[#34d399]" />
                  Download CSV Template
                </button>
              </div>
            </div>

            {/* File Upload Card */}
            <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">2. Upload & Calculate</h3>
                <p className="text-xs text-[#737c92]">Upload your compiled CSV. The portal will compute late fees for all entries instantly.</p>
              </div>
              <div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-[0_0_15px_rgba(79,124,255,0.2)]">
                  <Upload size={14} />
                  Choose CSV File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {bulkError && (
            <div className="flex items-center gap-2 border border-[#ff5d73]/20 bg-[#ff5d73]/10 px-4 py-3 rounded-xl text-xs text-[#ff5d73]">
              <AlertTriangle size={16} />
              {bulkError}
            </div>
          )}

          {/* Results Table */}
          {bulkRows.length > 0 ? (
            <div className="border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Bulk Computation Output</h3>
                  <p className="text-[10px] text-[#737c92]">Results compiled from CSV file.</p>
                </div>
                <div>
                  <button
                    onClick={exportBulkResults}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34d399]/10 border border-[#34d399]/20 hover:bg-[#34d399]/20 text-[#34d399] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Download size={14} />
                    Export to CSV
                  </button>
                </div>
              </div>

              <div className="border border-white/5 rounded-xl overflow-hidden overflow-x-auto max-h-[400px]">
                <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-[#aab2c5] font-semibold">
                      <th className="px-4 py-3">Sr No</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Filing Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Delay (Days)</th>
                      <th className="px-4 py-3 text-right">CGST</th>
                      <th className="px-4 py-3 text-right">SGST</th>
                      <th className="px-4 py-3 text-right">Total Late Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-[#737c92]">{i + 1}</td>
                        <td className="px-4 py-3 text-white font-mono">{row.dueDate}</td>
                        <td className="px-4 py-3 text-white font-mono">{row.filingDate}</td>
                        <td className="px-4 py-3 text-[#aab2c5]">{row.type}</td>
                        <td className="px-4 py-3 text-white font-semibold text-right font-mono">{row.days}</td>
                        <td className="px-4 py-3 text-[#aab2c5] text-right font-mono">₹{row.cgst.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-[#aab2c5] text-right font-mono">₹{row.sgst.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-[#34d399] font-bold text-right font-mono">₹{row.payable.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 p-16 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
              <FileSpreadsheet size={36} className="text-[#737c92]" />
              <div>
                <h4 className="text-sm font-semibold text-white">No CSV File Uploaded</h4>
                <p className="text-xs text-[#737c92] max-w-sm mt-1 mx-auto leading-relaxed">
                  Download the sample template, add your records (multiple due dates and filing dates), and upload it above to compute fees instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
