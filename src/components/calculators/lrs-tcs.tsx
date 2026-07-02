"use client";

import { useState } from "react";
import { Info, Calculator, FileDown, RefreshCw } from "lucide-react";

export function LrsTcsCalculator() {
  const [remittanceType, setRemittanceType] = useState("others"); // education-loan, education-own, medical, others
  const [isTourPackage, setIsTourPackage] = useState(false);
  const [amount, setAmount] = useState<number>(1000000); // Default 10 Lakhs
  const [tcsAmount, setTcsAmount] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);

  const calculateTcs = () => {
    const threshold = 700000; // 7 Lakhs threshold
    let tcsRate = 0;
    let applicableAmount = 0;
    let tcs = 0;
    let note = "";

    if (isTourPackage) {
      // Overseas tour packages: 5% up to 7L, 20% above 7L (no exemption threshold)
      if (amount <= threshold) {
        tcsRate = 5;
        tcs = amount * 0.05;
        note = "TCS rate of 5% applies on overseas tour packages up to ₹7,000,000.";
      } else {
        const baseTcs = threshold * 0.05;
        const excessTcs = (amount - threshold) * 0.20;
        tcs = baseTcs + excessTcs;
        tcsRate = (tcs / amount) * 100;
        note = "TCS u/s 206C(1G) applies: 5% on the first ₹7 Lakhs, and 20% on the remaining amount.";
      }
      applicableAmount = amount;
    } else {
      // Other remittances (LRS)
      if (amount <= threshold) {
        tcs = 0;
        tcsRate = 0;
        note = "Remittances under LRS up to ₹7 Lakhs are exempt from TCS (except tour packages).";
      } else {
        applicableAmount = amount - threshold;
        if (remittanceType === "education-loan") {
          tcsRate = 0.5;
          tcs = applicableAmount * 0.005;
          note = "Concessional rate of 0.5% applies on education remittances funded by financial loans exceeding ₹7 Lakhs.";
        } else if (remittanceType === "education-own" || remittanceType === "medical") {
          tcsRate = 5;
          tcs = applicableAmount * 0.05;
          note = "TCS of 5% applies on education/medical remittances exceeding ₹7 Lakhs.";
        } else {
          tcsRate = 20;
          tcs = applicableAmount * 0.20;
          note = "TCS of 20% applies on general LRS remittances (others) exceeding ₹7 Lakhs.";
        }
      }
    }

    setTcsAmount(tcs);
    setBreakdown({
      amount,
      threshold: isTourPackage ? 0 : threshold,
      applicableAmount,
      rate: tcsRate.toFixed(2),
      note
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input panel */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">LRS TCS Parameters</h2>
          <p className="text-[10px] text-[#737c92]">Liberalised Remittance Scheme u/s 206C(1G)</p>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#aab2c5]">Remittance Amount (INR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white"
          />
        </div>

        {/* Tour Package Toggle */}
        <div className="flex items-center justify-between border border-white/5 bg-[#080a12]/50 p-4 rounded-xl">
          <div>
            <span className="text-xs font-semibold text-white">Overseas Tour Package</span>
            <p className="text-[9px] text-[#737c92] mt-0.5">Purchasing flight + hotel package tour</p>
          </div>
          <input
            type="checkbox"
            checked={isTourPackage}
            onChange={(e) => setIsTourPackage(e.target.checked)}
            className="w-4 h-4 accent-[#4f7cff] cursor-pointer"
          />
        </div>

        {/* Remittance Type */}
        {!isTourPackage && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#aab2c5]">Purpose of Remittance</label>
            <select
              value={remittanceType}
              onChange={(e) => setRemittanceType(e.target.value)}
              className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white cursor-pointer"
            >
              <option value="education-loan" className="bg-[#05060a]">Education (funded by Education Loan)</option>
              <option value="education-own" className="bg-[#05060a]">Education (Self-Funded)</option>
              <option value="medical" className="bg-[#05060a]">Medical Treatment Overseas</option>
              <option value="others" className="bg-[#05060a]">Others (Investment, Maintenance, Gift)</option>
            </select>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={calculateTcs}
          className="w-full py-2.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,124,255,0.2)]"
        >
          <Calculator size={14} />
          Calculate TCS
        </button>
      </div>

      {/* Output Panel */}
      <div className="lg:col-span-7 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col justify-between gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">TCS Assessment Summary</h2>
          <p className="text-[10px] text-[#737c92]">Applicable Tax Collected at Source liability</p>
        </div>

        {tcsAmount !== null && breakdown ? (
          <div className="flex flex-col gap-6">
            {/* Huge Number */}
            <div className="p-6 border border-[#4f7cff]/10 bg-[#4f7cff]/5 rounded-xl text-center">
              <span className="text-[10px] font-bold text-[#4f7cff] uppercase tracking-wider block mb-1">Total TCS Payable</span>
              <span className="text-3xl font-bold text-white font-display">₹{tcsAmount.toLocaleString("en-IN")}</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
                <span className="text-[10px] text-[#737c92] block">Effective TCS Rate</span>
                <span className="text-sm font-bold text-white mt-1 block">{breakdown.rate}%</span>
              </div>
              <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
                <span className="text-[10px] text-[#737c92] block">LRS Threshold Exempted</span>
                <span className="text-sm font-bold text-white mt-1 block">₹{breakdown.threshold.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Note banner */}
            <div className="border border-white/5 bg-white/5 p-4 rounded-xl flex items-start gap-2.5 text-xs text-[#aab2c5]">
              <Info size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
              <div>{breakdown.note}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl">
            <RefreshCw className="text-[#737c92] animate-spin mb-3" size={24} />
            <p className="text-xs text-[#737c92]">Specify remittance values and click Calculate.</p>
          </div>
        )}

        {/* Footer info */}
        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4">
          TCS collected u/s 206C(1G) is available as credit in Form 26AS/AIS and can be claimed against final income tax liability.
        </div>
      </div>
    </div>
  );
}
