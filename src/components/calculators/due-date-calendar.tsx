"use client";

import { useState } from "react";
import { Calendar, Filter, AlertCircle, Clock, Info } from "lucide-react";

export function DueDateCalendar() {
  const [filter, setFilter] = useState("all"); // all, gst, direct-tax, mca

  const events = [
    {
      id: 1,
      form: "GSTR-1",
      due: "11 July 2026",
      category: "gst",
      description: "Monthly Filing of Outward Supplies (Turnover > 5 Crore or non-QRMP)",
      penalty: "₹50/day (₹20/day for NIL return) up to cap based on annual turnover."
    },
    {
      id: 2,
      form: "GSTR-3B",
      due: "20 July 2026",
      category: "gst",
      description: "Monthly Return & Payment of Tax (Regular Taxpayers)",
      penalty: "Section 47 Late Fee + Section 50 Cash Interest at 18% p.a. on delayed payments."
    },
    {
      id: 3,
      form: "TDS Payment (Challan 281)",
      due: "07 July 2026",
      category: "direct-tax",
      description: "Deposit of TDS/TCS deducted in the preceding month of June.",
      penalty: "Interest u/s 201(1A): 1.5% per month or part of a month from date of deduction."
    },
    {
      id: 4,
      form: "TDS Quarterly Return (Form 26Q/24Q)",
      due: "31 July 2026",
      category: "direct-tax",
      description: "Quarterly statement of TDS deposition for Q1 (April - June).",
      penalty: "Late fee u/s 234E: ₹200/day up to a maximum equal to the TDS amount."
    },
    {
      id: 5,
      form: "GSTR-5",
      due: "13 July 2026",
      category: "gst",
      description: "Monthly filing for Non-Resident Taxable Persons.",
      penalty: "₹50/day (₹20/day for NIL returns)."
    },
    {
      id: 6,
      form: "DPT-3",
      due: "30 June 2026",
      category: "mca",
      description: "Return of deposits or transaction not considered as deposits.",
      penalty: "Additional filing fees based on delay interval + panel interest."
    }
  ];

  const filteredEvents = filter === "all" ? events : events.filter(e => e.category === filter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Category filter sidebar */}
      <div className="lg:col-span-4 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Due Date Filters</h2>
          <p className="text-[10px] text-[#737c92]">Categorise compliance timeline calendars</p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "all" ? "bg-[#4f7cff] text-white" : "text-[#aab2c5] hover:bg-white/5"
            }`}
          >
            All Compliances
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono">{events.length}</span>
          </button>
          <button
            onClick={() => setFilter("gst")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "gst" ? "bg-[#4f7cff] text-white" : "text-[#aab2c5] hover:bg-white/5"
            }`}
          >
            GST Compliance
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono">{events.filter(e => e.category === "gst").length}</span>
          </button>
          <button
            onClick={() => setFilter("direct-tax")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "direct-tax" ? "bg-[#4f7cff] text-white" : "text-[#aab2c5] hover:bg-white/5"
            }`}
          >
            Direct Tax (TDS/IT)
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono">{events.filter(e => e.category === "direct-tax").length}</span>
          </button>
          <button
            onClick={() => setFilter("mca")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "mca" ? "bg-[#4f7cff] text-white" : "text-[#aab2c5] hover:bg-white/5"
            }`}
          >
            MCA & Corporate Law
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono">{events.filter(e => e.category === "mca").length}</span>
          </button>
        </div>

        <div className="border border-[#4f7cff]/10 bg-[#4f7cff]/5 p-4 rounded-xl flex items-start gap-2.5 text-[10px] text-[#aab2c5] leading-normal">
          <Info size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <span>Filing forms late attracts additional compounding penalties. Rescheduling compliance ahead of deadlines is highly advised.</span>
        </div>
      </div>

      {/* Main timeline listing */}
      <div className="lg:col-span-8 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Compliance Timeline Calendar</h2>
          <p className="text-[10px] text-[#737c92]">Upcoming deadlines u/s GST & IT Acts</p>
        </div>

        <div className="flex flex-col gap-4">
          {filteredEvents.map((e) => (
            <div
              key={e.id}
              className="border border-white/5 bg-white/5 p-5 rounded-2xl hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white bg-white/5 border border-white/10 px-2.5 py-0.5 rounded">
                    {e.form}
                  </span>
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    e.category === "gst" 
                      ? "bg-blue-primary/10 text-blue-primary" 
                      : e.category === "direct-tax" 
                      ? "bg-violet-primary/10 text-violet-primary" 
                      : "bg-[#f4b740]/10 text-[#f4b740]"
                  }`}>
                    {e.category}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#aab2c5]">{e.description}</p>
                <div className="flex items-start gap-1 text-[10px] text-[#737c92] bg-black/10 border border-white/5 p-2 rounded-lg mt-2">
                  <AlertCircle size={12} className="text-[#ff5d73] mt-0.5 flex-shrink-0" />
                  <span><b>Late Penalty:</b> {e.penalty}</span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-center gap-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-6 flex-shrink-0">
                <span className="text-[10px] text-[#737c92] flex items-center gap-1">
                  <Clock size={11} />
                  Filing Deadline
                </span>
                <span className="text-xs font-bold text-white">{e.due}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
