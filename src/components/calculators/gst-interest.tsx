"use client";

import { useState } from "react";
import { Calculator, Copy, Check, Printer, Shield, Upload, Download, FileSpreadsheet, AlertTriangle } from "lucide-react";

export function GSTInterestCalculator() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Mode State
  const [taxAmount, setTaxAmount] = useState("");
  const [rate, setRate] = useState("18"); // 18% standard rate
  const [dueDate, setDueDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Bulk Mode State
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState("");

  const calculateInterestVal = (taxAmtStr: string, dueDateStr: string, paymentDateStr: string, rateStr: string) => {
    const amt = parseFloat(taxAmtStr);
    const intRate = parseFloat(rateStr);

    if (isNaN(amt) || amt <= 0 || !dueDateStr || !paymentDateStr) return null;

    const due = new Date(dueDateStr);
    const paid = new Date(paymentDateStr);

    due.setHours(0,0,0,0);
    paid.setHours(0,0,0,0);

    const diffTime = paid.getTime() - due.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return { amt, rate: intRate, days: 0, interest: 0, totalPayable: amt, isDelayed: false };
    }

    const interest = (amt * intRate * days) / (100 * 365);
    const totalPayable = amt + interest;

    return {
      amt,
      rate: intRate,
      days,
      interest,
      totalPayable,
      isDelayed: true
    };
  };

  const handleCalculateSingle = () => {
    setError("");
    setResult(null);

    const amt = parseFloat(taxAmount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid tax amount.");
      return;
    }
    if (!dueDate || !paymentDate) {
      setError("Please select both the due date and the payment date.");
      return;
    }

    const interestRes = calculateInterestVal(taxAmount, dueDate, paymentDate, rate);
    setResult(interestRes);
  };

  // CSV Template Download
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Tax Amount,Due Date (YYYY-MM-DD),Payment Date (YYYY-MM-DD),Interest Rate (18/24)\n150000,2026-06-20,2026-06-25,18\n50000,2026-06-20,2026-06-20,24\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gst_interest_template.csv");
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
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          if (cols.length < 3) continue;

          const tax = cols[0]?.trim();
          const due = cols[1]?.trim();
          const paid = cols[2]?.trim();
          const rateVal = cols[3]?.trim() || "18";

          const interestRes = calculateInterestVal(tax, due, paid, rateVal);
          if (interestRes) {
            calculated.push({
              index: i,
              tax,
              dueDate: due,
              paymentDate: paid,
              ...interestRes
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
    let csvContent = "data:text/csv;charset=utf-8,Sr No,Tax Amount,Due Date,Payment Date,Rate,Delay (Days),Interest Accrued,Total Payable\n";
    bulkRows.forEach((row, i) => {
      csvContent += `${i + 1},${row.amt},${row.dueDate},${row.paymentDate},${row.rate},${row.days},${row.interest.toFixed(2)},${row.totalPayable.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gst_interest_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyResult = () => {
    if (!result) return;
    const text = `GST Interest Calculation u/s 50 (NumberIQ):
Net Tax Liability: ₹${result.amt.toLocaleString("en-IN")}
Interest Rate: ${result.rate}% p.a.
Delay Days: ${result.days} days
Interest Accrued: ₹${result.interest.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
Total Payable: ₹${result.totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
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
          {/* Inputs Form */}
          <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl backdrop-blur-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Calculator Inputs</h2>
              <p className="text-xs text-[#737c92]">Specify interest metrics u/s 50 of the CGST Act.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#aab2c5]">Net Tax Liability Paid in Cash (₹)</label>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2 text-sm text-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#aab2c5]">Interest Rate (% p.a.)</label>
                <select
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer transition-colors"
                >
                  <option value="18" className="bg-[#080a12]">18% p.a. (Filing delay u/s 50(1))</option>
                  <option value="24" className="bg-[#080a12]">24% p.a. (Excess ITC claimed u/s 50(3))</option>
                </select>
              </div>

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
                  <label className="text-xs font-semibold text-[#aab2c5]">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
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
                Calculate Interest
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {result ? (
              <div className="border border-white/5 bg-white/5 p-6 rounded-2xl backdrop-blur-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Calculation Output</h3>
                    <p className="text-[10px] text-[#737c92]">Proportional interest based on delays u/s 50.</p>
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
                        Interest Payable
                      </span>
                      <div className="text-3xl font-display font-bold text-white mt-1.5">
                        ₹{result.interest.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="border border-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <tbody>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Net Cash Tax Amount</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">₹{result.amt.toLocaleString("en-IN")}</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Interest rate</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">{result.rate}% p.a.</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-[#aab2c5]">Days delayed</td>
                            <td className="px-4 py-3 text-white font-semibold text-right">{result.days} days</td>
                          </tr>
                          <tr className="border-b border-white/5 bg-white/5 font-semibold">
                            <td className="px-4 py-3 text-white">Interest Accrued</td>
                            <td className="px-4 py-3 text-[#ff5d73] text-right">₹{result.interest.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                          </tr>
                          <tr className="hover:bg-white/5 font-bold">
                            <td className="px-4 py-3 text-white">Total Cash Liability (Tax + Int)</td>
                            <td className="px-4 py-3 text-white text-right">₹{result.totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <Check size={32} className="text-[#34d399] bg-[#34d399]/10 p-1.5 rounded-full" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">No Interest Accrued</h4>
                      <p className="text-xs text-[#737c92] max-w-xs mt-1">
                        Tax was paid on or before the due date. No Section 50 interest applies.
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
                    Fill out the tax details in the inputs panel and click calculate.
                  </p>
                </div>
              </div>
            )}

            {/* Legal Callout */}
            <div className="border border-white/5 bg-[#080a12]/50 p-6 rounded-2xl flex flex-col gap-4 text-xs text-[#aab2c5] leading-relaxed">
              <h4 className="font-semibold text-white flex items-center gap-1">
                <Shield size={14} className="text-[#4f7cff]" />
                Section 50 Net Cash Interest Regulation
              </h4>
              <p>
                Under Section 50(1) of the CGST Act (retrospective amendment from July 1, 2017), interest is payable **only on the net cash liability** discharged through electronic cash ledger, provided the return is filed after the due date.
              </p>
              <p>
                Interest is calculated as `(Net Tax × Rate × Days delayed) ÷ 365` where the standard interest rate is **18% p.a.** for late filing and **24% p.a.** for wrong availment and utilization of ITC.
              </p>
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
                <p className="text-xs text-[#737c92]">Upload your compiled CSV. The portal will compute interest for all entries instantly.</p>
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
                      <th className="px-4 py-3">Tax Amount</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Payment Date</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Delay (Days)</th>
                      <th className="px-4 py-3 text-right">Interest Accrued</th>
                      <th className="px-4 py-3 text-right">Total Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-[#737c92]">{i + 1}</td>
                        <td className="px-4 py-3 text-white font-mono">₹{row.amt.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-white font-mono">{row.dueDate}</td>
                        <td className="px-4 py-3 text-white font-mono">{row.paymentDate}</td>
                        <td className="px-4 py-3 text-white text-right font-mono">{row.rate}%</td>
                        <td className="px-4 py-3 text-white font-semibold text-right font-mono">{row.days}</td>
                        <td className="px-4 py-3 text-[#ff5d73] text-right font-mono">₹{row.interest.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-[#34d399] font-bold text-right font-mono">₹{row.totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
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
                  Download the sample template, add your records (Tax Amount, due dates and payment dates), and upload it above to compute interest instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
