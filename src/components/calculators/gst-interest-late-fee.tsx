"use client";

import { useState } from "react";
import { Calculator, Copy, Check, Printer, Info, FileText } from "lucide-react";
import { calculateGstInterestAndLateFee, GstInterestAndLateFeeResult } from "@/lib/calculator-math";

export function GSTInterestLateFeeCalculator() {
  // Calculator Form State
  const [returnType, setReturnType] = useState<"GSTR-3B" | "GSTR-1">("GSTR-3B");
  const [isNilReturn, setIsNilReturn] = useState(false);
  const [taxAmount, setTaxAmount] = useState<number | "">(100000);
  const [dueDate, setDueDate] = useState("2026-06-20");
  const [filingDate, setFilingDate] = useState("2026-07-15");
  const [isQrmp, setIsQrmp] = useState(false);
  const [interestRate, setInterestRate] = useState<number>(18);
  const [turnoverCap, setTurnoverCap] = useState<string>("2000");
  const [copied, setCopied] = useState(false);

  // Compute results client-side reactively
  let result: GstInterestAndLateFeeResult | null = null;
  let validationError = "";

  if (!dueDate || !filingDate) {
    validationError = "Please select both statutory Due Date and Actual Filing Date.";
  } else if (!isNilReturn && taxAmount !== "" && (isNaN(Number(taxAmount)) || Number(taxAmount) < 0)) {
    validationError = "Please enter a valid non-negative tax liability amount.";
  } else {
    result = calculateGstInterestAndLateFee(
      returnType,
      isNilReturn ? 0 : taxAmount === "" ? 0 : taxAmount,
      dueDate,
      filingDate,
      isQrmp,
      isNilReturn,
      interestRate,
      turnoverCap
    );
  }

  const handleCopySummary = () => {
    if (!result) return;
    const summaryText = `GST Interest & Late Fee Computation (Section 50 & 47) - NumberIQ:
Return Type: ${result.returnType} ${result.isNilReturn ? "(Nil Return)" : ""}
Statutory Due Date: ${result.dueDate}
Actual Filing Date: ${result.filingDate}
Days of Delay: ${result.daysDelayed} days
Net Cash Tax Liability: ₹${result.taxAmount.toLocaleString("en-IN")}
Interest u/s 50 (${result.interestRate}% p.a.): ₹${result.interestAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
Late Fee u/s 47 (₹${result.lateFeePerDay}/day): ₹${result.lateFeePayable.toLocaleString("en-IN")} (CGST: ₹${result.lateFeeCgst}, SGST: ₹${result.lateFeeSgst})
Total Statutory Payable: ₹${result.totalStatutoryPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
Computed on: ${new Date().toLocaleDateString("en-IN")}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Calculator Header / Control Card */}
      <div className="bg-[#121624] border border-[#23293e] rounded-2xl p-5 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#23293e] pb-6 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-[#4f7cff]" />
              GST Interest & Late Fee Calculator
            </h2>
            <p className="text-sm text-[#8a95ad] mt-1">
              Sec 50 Interest (18%/24% on net cash) + Sec 47 Late Fee for GSTR-3B & GSTR-1 (FY 2026-27 rules)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopySummary}
              disabled={!result}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1a2138] hover:bg-[#252f50] text-[#4f7cff] border border-[#4f7cff]/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Summary"}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1a2138] hover:bg-[#252f50] text-gray-300 border border-[#23293e] transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Input Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Return Type */}
          <div>
            <label htmlFor="return-type-select" className="block text-xs font-semibold text-[#8a95ad] uppercase tracking-wider mb-2">
              Return Type
            </label>
            <select
              id="return-type-select"
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as "GSTR-3B" | "GSTR-1")}
              className="w-full bg-[#1a2138] border border-[#23293e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff]"
            >
              <option value="GSTR-3B">GSTR-3B (Summary Return & Tax Payment)</option>
              <option value="GSTR-1">GSTR-1 (Outward Supplies Statement)</option>
            </select>
          </div>

          {/* Nil Return Toggle */}
          <div className="flex items-center pt-6">
            <label htmlFor="nil-return-checkbox" className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="nil-return-checkbox"
                checked={isNilReturn}
                onChange={(e) => setIsNilReturn(e.target.checked)}
                className="w-5 h-5 rounded bg-[#1a2138] border-[#23293e] text-[#4f7cff] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-white block">Nil Return Filing</span>
                <span className="text-xs text-[#8a95ad]">No tax liability or outward turnover</span>
              </div>
            </label>
          </div>

          {/* Net Cash Tax Liability */}
          <div>
            <label htmlFor="tax-amount-input" className="block text-xs font-semibold text-[#8a95ad] uppercase tracking-wider mb-2">
              Net Cash Tax Liability (₹)
            </label>
            <input
              type="number"
              id="tax-amount-input"
              disabled={isNilReturn}
              value={isNilReturn ? 0 : taxAmount}
              onChange={(e) => setTaxAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 100000"
              className="w-full bg-[#1a2138] border border-[#23293e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[11px] text-[#6b768e] mt-1 block">Interest applies strictly on Net Cash portion (Electronic Cash Ledger).</span>
          </div>

          {/* Statutory Due Date */}
          <div>
            <label htmlFor="due-date-input" className="block text-xs font-semibold text-[#8a95ad] uppercase tracking-wider mb-2">
              Statutory Due Date
            </label>
            <input
              type="date"
              id="due-date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#1a2138] border border-[#23293e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff]"
            />
          </div>

          {/* Actual Filing Date */}
          <div>
            <label htmlFor="filing-date-input" className="block text-xs font-semibold text-[#8a95ad] uppercase tracking-wider mb-2">
              Actual Filing / Payment Date
            </label>
            <input
              type="date"
              id="filing-date-input"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
              className="w-full bg-[#1a2138] border border-[#23293e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff]"
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="interest-rate-select" className="block text-xs font-semibold text-[#8a95ad] uppercase tracking-wider mb-2">
              Applicable Interest Rate (Sec 50)
            </label>
            <select
              id="interest-rate-select"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full bg-[#1a2138] border border-[#23293e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff]"
            >
              <option value={18}>18% p.a. — Delayed tax payment (Sec 50(1))</option>
              <option value={24}>24% p.a. — Undue/excess ITC claimed & utilized (Sec 50(3))</option>
            </select>
          </div>

          {/* Annual Turnover Category */}
          <div>
            <label htmlFor="turnover-cap-select" className="block text-xs font-semibold text-[#8a95ad] uppercase tracking-wider mb-2">
              Annual Turnover Category (Late Fee Cap)
            </label>
            <select
              id="turnover-cap-select"
              disabled={isNilReturn}
              value={turnoverCap}
              onChange={(e) => setTurnoverCap(e.target.value)}
              className="w-full bg-[#1a2138] border border-[#23293e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] disabled:opacity-50"
            >
              <option value="2000">Up to ₹1.5 Crore Turnover (Max Cap: ₹2,000)</option>
              <option value="5000">₹1.5 Crore to ₹5 Crore Turnover (Max Cap: ₹5,000)</option>
              <option value="10000">Above ₹5 Crore Turnover (Statutory Cap: ₹10,000)</option>
            </select>
          </div>

          {/* QRMP Toggle */}
          <div className="flex items-center pt-2">
            <label htmlFor="qrmp-checkbox" className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="qrmp-checkbox"
                checked={isQrmp}
                onChange={(e) => setIsQrmp(e.target.checked)}
                className="w-5 h-5 rounded bg-[#1a2138] border-[#23293e] text-[#4f7cff] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-white block">QRMP Scheme Taxpayer</span>
                <span className="text-xs text-[#8a95ad]">Quarterly filing (Due: 22nd/24th of post-quarter month)</span>
              </div>
            </label>
          </div>
        </div>

        {validationError && (
          <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <Info className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Results Output Cards & Breakup Table */}
      {result && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121624] border border-[#23293e] rounded-xl p-5">
              <span className="text-xs font-semibold text-[#8a95ad] uppercase tracking-wider block">Delay Period</span>
              <div className="text-2xl font-bold text-white mt-1">
                {result.daysDelayed} <span className="text-sm font-normal text-[#8a95ad]">days</span>
              </div>
              <span className="text-xs text-[#6b768e] mt-1 block">From day after due date to filing date</span>
            </div>

            <div className="bg-[#121624] border border-[#23293e] rounded-xl p-5">
              <span className="text-xs font-semibold text-[#8a95ad] uppercase tracking-wider block">Sec 50 Interest (@{result.interestRate}%)</span>
              <div className="text-2xl font-bold text-[#4f7cff] mt-1">
                ₹{result.interestAmount.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-[#6b768e] mt-1 block">Computed on ₹{result.taxAmount.toLocaleString("en-IN")} cash</span>
            </div>

            <div className="bg-[#121624] border border-[#23293e] rounded-xl p-5">
              <span className="text-xs font-semibold text-[#8a95ad] uppercase tracking-wider block">Sec 47 Late Fee</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                ₹{result.lateFeePayable.toLocaleString("en-IN")}
              </div>
              <span className="text-xs text-[#6b768e] mt-1 block">CGST ₹{result.lateFeeCgst} + SGST ₹{result.lateFeeSgst}</span>
            </div>

            <div className="bg-gradient-to-br from-[#1b254b] to-[#121624] border border-[#4f7cff]/40 rounded-xl p-5">
              <span className="text-xs font-semibold text-[#4f7cff] uppercase tracking-wider block">Total Statutory Payable</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                ₹{result.totalStatutoryPayable.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-[#8a95ad] mt-1 block">Tax + Interest + Late Fee</span>
            </div>
          </div>

          {/* Full Breakup & Statutory Formula Table */}
          <div className="bg-[#121624] border border-[#23293e] rounded-2xl p-5 md:p-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4f7cff]" />
              Detailed Computation Breakup & Statutory Formulas
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm text-[#c3cbe0] border-collapse">
                <thead>
                  <tr className="border-b border-[#23293e] bg-[#1a2138]/60">
                    <th className="py-3 px-4 text-[#8a95ad] font-semibold uppercase">Component</th>
                    <th className="py-3 px-4 text-[#8a95ad] font-semibold uppercase">Statutory Basis & Formula</th>
                    <th className="py-3 px-4 text-[#8a95ad] font-semibold uppercase text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23293e]">
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Net Cash Tax Liability</td>
                    <td className="py-3 px-4 text-[#8a95ad]">Tax payable through Electronic Cash Ledger</td>
                    <td className="py-3 px-4 text-right font-mono text-white">₹{result.taxAmount.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Days of Delay</td>
                    <td className="py-3 px-4 text-[#8a95ad]">
                      {result.dueDate} to {result.filingDate} ({result.daysDelayed} days)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">{result.daysDelayed} Days</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Section 50 Interest</td>
                    <td className="py-3 px-4 text-[#8a95ad]">
                      <span className="font-mono text-xs text-[#4f7cff] bg-[#1a2138] px-2 py-1 rounded">
                        ({result.taxAmount} × {result.interestRate}% × {result.daysDelayed}) ÷ 365
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#4f7cff] font-semibold">
                      ₹{result.interestAmount.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Section 47 Daily Late Fee</td>
                    <td className="py-3 px-4 text-[#8a95ad]">
                      {result.isNilReturn ? "Nil Return: ₹20/day (₹10 CGST + ₹10 SGST)" : "Taxable Return: ₹50/day (₹25 CGST + ₹25 SGST)"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300">
                      ₹{result.lateFeeGross.toLocaleString("en-IN")} gross
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Statutory Late Fee Cap</td>
                    <td className="py-3 px-4 text-[#8a95ad]">
                      Turnover rationalized cap under CBIC Notification: ₹{result.lateFeeCap.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300 font-semibold">
                      Max ₹{result.lateFeeCap.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr className="bg-[#1a2138]/40">
                    <td className="py-3 px-4 font-medium text-white">Net CGST Late Fee</td>
                    <td className="py-3 px-4 text-[#8a95ad]">50% of capped late fee</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300">₹{result.lateFeeCgst.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#1a2138]/40">
                    <td className="py-3 px-4 font-medium text-white">Net SGST Late Fee</td>
                    <td className="py-3 px-4 text-[#8a95ad]">50% of capped late fee</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300">₹{result.lateFeeSgst.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#1b254b]/80 border-t-2 border-[#4f7cff]">
                    <td className="py-4 px-4 font-bold text-white">Total Amount Required to Clear Liability</td>
                    <td className="py-4 px-4 font-medium text-[#4f7cff]">Net Cash Tax + Interest + Total Late Fee</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 text-base">
                      ₹{result.totalStatutoryPayable.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
