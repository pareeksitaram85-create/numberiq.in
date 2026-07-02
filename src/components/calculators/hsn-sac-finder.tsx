"use client";

import { useState } from "react";
import { Search, Hash, Info, Percent } from "lucide-react";

export function HsnSacFinder() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all, goods, services

  const database = [
    { code: "9983", description: "Information Technology (IT) Design & Development Services", type: "services", rate: "18%" },
    { code: "9982", description: "Legal and Accounting Services (Advocates, CA, CS firms)", type: "services", rate: "18%" },
    { code: "9985", description: "Support Services (Recruitment, Security, Travel agencies)", type: "services", rate: "18%" },
    { code: "8471", description: "Computers, Laptops, CPU units, and hardware peripherals", type: "goods", rate: "18%" },
    { code: "8517", description: "Smartphones, Telecommunication modules, and routers", type: "goods", rate: "18%" },
    { code: "3004", description: "Medicines, Pharmaceutical formulations (Allopathic, Ayurvedic)", type: "goods", rate: "12%" },
    { code: "1905", description: "Biscuits, Cakes, pastry, and other bakery products", type: "goods", rate: "18%" },
    { code: "2202", description: "Carbonated beverages, aerated water (Cold drinks)", type: "goods", rate: "28%" },
    { code: "9963", description: "Restaurant Food services (AC / Non-AC hotels)", type: "services", rate: "5%" },
    { code: "9964", description: "Passenger transport services (Cab operators, flight tickets)", type: "services", rate: "5%" }
  ];

  const filtered = database.filter(item => {
    const matchesQuery = item.code.includes(query) || item.description.toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesQuery && matchesType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Parameters sidebar */}
      <div className="lg:col-span-4 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Search Parameters</h2>
          <p className="text-[10px] text-[#737c92]">Configure lookup settings</p>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#aab2c5]">Search Code or Description</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#737c92]" size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 9983 or Computers"
              className="w-full bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#737c92]"
            />
          </div>
        </div>

        {/* Category toggles */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#aab2c5]">Filing Category</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`py-2 rounded-xl text-[10px] font-semibold transition-all border border-white/5 cursor-pointer ${
                typeFilter === "all" ? "bg-[#4f7cff] text-white" : "bg-white/5 text-[#aab2c5]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("goods")}
              className={`py-2 rounded-xl text-[10px] font-semibold transition-all border border-white/5 cursor-pointer ${
                typeFilter === "goods" ? "bg-[#4f7cff] text-white" : "bg-white/5 text-[#aab2c5]"
              }`}
            >
              Goods (HSN)
            </button>
            <button
              onClick={() => setTypeFilter("services")}
              className={`py-2 rounded-xl text-[10px] font-semibold transition-all border border-white/5 cursor-pointer ${
                typeFilter === "services" ? "bg-[#4f7cff] text-white" : "bg-white/5 text-[#aab2c5]"
              }`}
            >
              Services (SAC)
            </button>
          </div>
        </div>

        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5 text-[10px] text-[#aab2c5] leading-normal">
          <Info size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <span>GST invoicing requires entering HSN codes (for items) or SAC codes (for services) on tax invoices u/s CGST Rules.</span>
        </div>
      </div>

      {/* Lookup table output */}
      <div className="lg:col-span-8 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Lookup Directory</h2>
          <p className="text-[10px] text-[#737c92]">Search results from standard GST Tariff Schedules</p>
        </div>

        <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Tax Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-white flex items-center gap-1.5 font-bold">
                      <Hash size={11} className="text-[#4f7cff]" />
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-[#aab2c5] font-semibold">{item.description}</td>
                    <td className="px-4 py-3 uppercase text-[9px] font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        item.type === "goods" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-bold font-mono">
                      {item.rate}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#737c92]">
                    No codes found matching your query. Try searching for "Computers" or "99".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
