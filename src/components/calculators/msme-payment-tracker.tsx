"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  invoiceDate: string;
  paymentDate: string;
  agreement: "yes" | "no";
  agreedDays: number;
  dueDate: string;
  delayDays: number;
  interest: number;
  status: "Paid (On Time)" | "Paid (Delayed)" | "Disallowed" | "Outstanding";
}

export function MSMEPaymentTracker() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Form inputs
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [agreement, setAgreement] = useState<"yes" | "no">("no");
  const [agreedDays, setAgreedDays] = useState("15");

  // RBI Bank rate standard (e.g., 6.75% * 3 = 20.25% p.a. compounded monthly)
  const BANK_RATE = 0.0675;
  const INTEREST_RATE = BANK_RATE * 3;

  const addInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !amount || !invoiceDate) return;

    const amt = parseFloat(amount);
    const invD = new Date(invoiceDate);
    const payD = paymentDate ? new Date(paymentDate) : null;
    
    invD.setHours(0,0,0,0);
    if (payD) payD.setHours(0,0,0,0);

    // Calculate limit days
    const limit = agreement === "yes" ? Math.min(45, parseInt(agreedDays) || 15) : 15;
    
    // Calculate due date
    const dueD = new Date(invD);
    dueD.setDate(invD.getDate() + limit);

    // Calculations u/s 43B(h) and MSME Act
    let status: Invoice["status"] = "Outstanding";
    let delayDays = 0;
    let interest = 0;

    const targetDate = payD || new Date(); // If unpaid, calculate delay/interest till today
    targetDate.setHours(0,0,0,0);

    const diffTime = targetDate.getTime() - dueD.getTime();
    delayDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    if (payD) {
      if (payD <= dueD) {
        status = "Paid (On Time)";
      } else {
        status = "Paid (Delayed)";
      }
    } else {
      // If unpaid and past due, check if year-end has passed (March 31)
      const currentYear = new Date().getFullYear();
      const yearEnd = new Date(invD.getFullYear() + (invD.getMonth() >= 3 ? 1 : 0), 2, 31); // March 31
      if (new Date() > yearEnd && dueD <= yearEnd) {
        status = "Disallowed";
      } else {
        status = "Outstanding";
      }
    }

    // MSME Interest Calculation (Section 16: Compound interest with monthly rests at 3x bank rate)
    if (delayDays > 0) {
      const months = delayDays / 30; // Approximation of monthly rests
      interest = amt * (Math.pow(1 + INTEREST_RATE / 12, months) - 1);
    }

    const newInv: Invoice = {
      id: Math.random().toString(36).substr(2, 9),
      vendor,
      amount: amt,
      invoiceDate,
      paymentDate,
      agreement,
      agreedDays: limit,
      dueDate: dueD.toISOString().split("T")[0],
      delayDays,
      interest: Math.round(interest * 100) / 100,
      status
    };

    setInvoices([...invoices, newInv]);

    // Reset Form
    setVendor("");
    setAmount("");
    setInvoiceDate("");
    setPaymentDate("");
  };

  const removeInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  // KPIs
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInterest = invoices.reduce((sum, inv) => sum + inv.interest, 0);
  const totalDisallowed = invoices
    .filter((inv) => inv.status === "Disallowed" || inv.status === "Paid (Delayed)")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="border border-white/5 bg-white/5 p-6 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#737c92]">
            Total Outstanding tracked
          </span>
          <div className="text-2xl font-display font-bold text-white mt-1">
            ₹{totalAmount.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="border border-white/5 bg-white/5 p-6 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff5d73]">
            Total Accrued Interest (3x)
          </span>
          <div className="text-2xl font-display font-bold text-[#ff5d73] mt-1">
            ₹{totalInterest.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="border border-white/5 bg-white/5 p-6 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#f4b740]">
            S.43B(h) Risk / Disallowed
          </span>
          <div className="text-2xl font-display font-bold text-[#f4b740] mt-1">
            ₹{totalDisallowed.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={addInvoice} className="lg:col-span-4 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white">Add Invoice</h3>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-[#aab2c5]">Vendor Name</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-[#aab2c5]">Invoice Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#aab2c5]">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-1 text-xs text-white"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#aab2c5]">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-1 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[#aab2c5]">Written Agreement?</label>
              <select
                value={agreement}
                onChange={(e) => setAgreement(e.target.value as "yes" | "no")}
                className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                <option value="no" className="bg-[#080a12]">No (15 days limit)</option>
                <option value="yes" className="bg-[#080a12]">Yes (Max 45 days)</option>
              </select>
            </div>
            {agreement === "yes" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#aab2c5]">Agreed Period (days)</label>
                <input
                  type="number"
                  value={agreedDays}
                  onChange={(e) => setAgreedDays(e.target.value)}
                  placeholder="Max 45"
                  className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-4 flex items-center justify-center gap-1 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus size={14} /> Add to Ledger
          </button>
        </form>

        {/* Ledger panel */}
        <div className="lg:col-span-8 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white">Invoice Ledger</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[#737c92] font-semibold">
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Inv Date</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Interest</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 font-semibold text-white">{inv.vendor}</td>
                      <td className="py-3 text-white">₹{inv.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3 text-[#aab2c5]">{inv.invoiceDate}</td>
                      <td className="py-3 text-[#aab2c5]">{inv.dueDate}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          inv.status === "Paid (On Time)"
                            ? "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20"
                            : inv.status === "Paid (Delayed)"
                            ? "bg-[#f4b740]/10 text-[#f4b740] border-[#f4b740]/20"
                            : inv.status === "Disallowed"
                            ? "bg-[#ff5d73]/10 text-[#ff5d73] border-[#ff5d73]/20"
                            : "bg-[#737c92]/10 text-[#737c92] border-[#737c92]/20"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-white font-semibold">₹{inv.interest.toLocaleString("en-IN")}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => removeInvoice(inv.id)}
                          className="p-1 rounded text-[#737c92] hover:text-[#ff5d73] transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#737c92] italic">
                      No invoices added yet. Use the inputs form to add a purchase invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Statutory Guidance */}
      <div className="border border-white/5 bg-[#080a12]/50 p-6 rounded-2xl flex flex-col gap-4 text-xs text-[#aab2c5] leading-relaxed">
        <h4 className="font-semibold text-white flex items-center gap-1">
          <Shield size={14} className="text-[#4f7cff]" />
          MSME Section 43B(h) and Section 16 Interest Compliance
        </h4>
        <p>
          Under the **MSMED Act 2006** and the newly inserted **Section 43B(h) of the Income Tax Act 1961** (applicable from FY 2024-25 onwards):
        </p>
        <ul className="list-disc pl-4 flex flex-col gap-1.5 text-[#737c92]">
          <li><b>Payment Timeline</b>: Outstandings to registered Micro & Small Enterprises must be paid within **15 days** (if no written agreement exists) or within the agreed period which **cannot exceed 45 days** (even if the agreement stipulates longer days).</li>
          <li><b>Income Tax Disallowance</b>: Any invoice amount unpaid to Micro/Small enterprises within the 15/45-day window as of March 31 **will be added back to taxable income** and disallowed in that financial year, regardless of the mercantile system of accounting. It is deductible only in the year the payment is actually made.</li>
          <li><b>Section 16 Compound Interest</b>: Delays u/s 15 attract compound interest with monthly rests at **3 times the Bank Rate** notified by the RBI (currently compounded monthly at ~20.25% p.a.). This interest is **non-deductible** as business expenditure under the Income Tax Act.</li>
        </ul>
      </div>
    </div>
  );
}
