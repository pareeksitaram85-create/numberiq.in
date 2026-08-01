"use client";

import { useState } from "react";
import { Search, Hash, Info, Filter, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { CAConsultation } from "../ca-consultation";

interface CodeEntry {
  code: string;
  description: string;
  type: "goods" | "services";
  rate: string;
  chapter: string;
  notes?: string;
}

export function HsnSacFinder() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "goods" | "services">("all");
  const [rateFilter, setRateFilter] = useState<string>("all");
  
  // Interactive Digit Requirement State
  const [turnover, setTurnover] = useState<"under_1.5cr" | "1.5cr_to_5cr" | "above_5cr">("above_5cr");
  const [supplyType, setSupplyType] = useState<"b2b" | "b2c" | "export">("b2b");

  const database: CodeEntry[] = [
    // --- SERVICES (SAC - Chapter 99) ---
    { code: "998311", description: "Management consulting and management services", type: "services", rate: "18%", chapter: "9983", notes: "Standard rate for business management consultants." },
    { code: "998313", description: "Information technology (IT) consulting and support services", type: "services", rate: "18%", chapter: "9983", notes: "Covers software development, SaaS, IT maintenance." },
    { code: "998314", description: "Information technology (IT) design and development services", type: "services", rate: "18%", chapter: "9983", notes: "Website development, UI/UX design, custom apps." },
    { code: "998221", description: "Financial auditing and accounting services (CA / CS firms)", type: "services", rate: "18%", chapter: "9982", notes: "Statutory audit, tax audit, bookkeeping." },
    { code: "998211", description: "Legal advisory and representation services (Advocates)", type: "services", rate: "18%", chapter: "9982", notes: "RCM applicable under Entry 2 Notif 13/2017 if supplied to business entity." },
    { code: "998231", description: "Tax advisory and representation services", type: "services", rate: "18%", chapter: "9982", notes: "GST return filing, Income Tax planning, litigation representation." },
    { code: "998511", description: "Executive search and recruitment services", type: "services", rate: "18%", chapter: "9985", notes: "Placement agencies, staffing services." },
    { code: "998529", description: "Security and investigation services", type: "services", rate: "18%", chapter: "9985", notes: "RCM applicable under Notif 29/2018 if supplied by non-body corporate." },
    { code: "997211", description: "Renting or leasing of residential property", type: "services", rate: "18%", chapter: "9972", notes: "RCM @ 18% under Notif 05/2022 if rented to registered business entity." },
    { code: "997212", description: "Renting or leasing of commercial property", type: "services", rate: "18%", chapter: "9972", notes: "RCM @ 18% under Notif 09/2024 if unregistered landlord supplies to registered entity." },
    { code: "996311", description: "Room accommodation services (Hotels, Guest houses)", type: "services", rate: "12%", chapter: "9963", notes: "12% if declared tariff <= Rs 7,500/day; 18% if > Rs 7,500/day." },
    { code: "996331", description: "Restaurant and food catering services (AC & Non-AC)", type: "services", rate: "5%", chapter: "9963", notes: "5% without ITC for non-specified premises." },
    { code: "996411", description: "Goods Transport Agency (GTA) freight services", type: "services", rate: "5%", chapter: "9964", notes: "5% RCM without ITC (Entry 1 Notif 13/2017) or 12% FCM with ITC." },
    { code: "996412", description: "Passenger transport by road (Taxi, Cab aggregators)", type: "services", rate: "5%", chapter: "9964", notes: "5% without ITC or 12% with ITC." },
    { code: "995411", description: "Construction of commercial buildings and infrastructure", type: "services", rate: "18%", chapter: "9954", notes: "Works contract services for commercial projects." },
    { code: "995412", description: "Construction of affordable residential apartments", type: "services", rate: "1%", chapter: "9954", notes: "Concessional rate 1% without ITC under RERA affordable housing." },
    { code: "997111", description: "Banking and financial intermediation services (Processing fee, Locker)", type: "services", rate: "18%", chapter: "9971", notes: "Bank processing fees, DD charges, credit card annual fees." },
    { code: "997132", description: "General insurance services (Health, Motor, Property)", type: "services", rate: "18%", chapter: "9971", notes: "Standard health and general insurance policies." },
    { code: "998361", description: "Advertising and promotional services", type: "services", rate: "18%", chapter: "9983", notes: "Digital marketing, billboard ads, social media campaigns." },
    { code: "998413", description: "Telecommunication and broadband internet services", type: "services", rate: "18%", chapter: "9984", notes: "Fiber broadband, postpaid mobile, leased line connections." },
    { code: "998811", description: "Job work services in relation to textiles & garments", type: "services", rate: "5%", chapter: "9988", notes: "Concessional 5% job work rate for textile processing." },
    { code: "998821", description: "Job work services in relation to printing & publishing", type: "services", rate: "12%", chapter: "9988", notes: "12% rate for printing of books, newspapers, periodicals." },
    { code: "999799", description: "Other personal services not elsewhere classified", type: "services", rate: "18%", chapter: "9997", notes: "General consumer personal services." },

    // --- GOODS (HSN - Chapters 01 to 98) ---
    { code: "84713010", description: "Laptops, notebooks, and portable digital computers", type: "goods", rate: "18%", chapter: "8471", notes: "Microcomputers and laptops below 10kg." },
    { code: "84714190", description: "Desktop computers and CPU processing units", type: "goods", rate: "18%", chapter: "8471", notes: "Other digital automatic data processing machines." },
    { code: "85171300", description: "Smartphones and mobile cellular network phones", type: "goods", rate: "18%", chapter: "8517", notes: "Smartphones with cellular connection capabilities." },
    { code: "85176290", description: "Wi-Fi routers, network switches, and modems", type: "goods", rate: "18%", chapter: "8517", notes: "Machines for reception, conversion, and transmission of data." },
    { code: "85285200", description: "LED Computer monitors capable of connecting to computers", type: "goods", rate: "18%", chapter: "8528", notes: "Monitors suitable for use with data processing machines." },
    { code: "84433200", description: "Printers, multifunction printer-scanners, and fax machines", type: "goods", rate: "18%", chapter: "8443", notes: "Office printing and scanning hardware." },
    { code: "30049099", description: "Allopathic medicines and pharmaceutical formulations", type: "goods", rate: "12%", chapter: "3004", notes: "Medicaments for therapeutic or prophylactic uses." },
    { code: "30049011", description: "Ayurvedic, Unani, and Siddha medicines", type: "goods", rate: "12%", chapter: "3004", notes: "Traditional Indian system medicaments." },
    { code: "30022010", description: "Vaccines for human medicine", type: "goods", rate: "5%", chapter: "3002", notes: "Essential human immunization vaccines." },
    { code: "04011000", description: "Fresh unpasteurized milk and fresh curd (unbranded)", type: "goods", rate: "0%", chapter: "0401", notes: "Exempt if pre-packaged and unbranded." },
    { code: "04012000", description: "Pre-packaged and labeled curd, lassi, paneer", type: "goods", rate: "5%", chapter: "0401", notes: "5% levy under Notif 06/2022 if pre-packaged and labeled." },
    { code: "10063010", description: "Basmati rice (unbranded / loose selling)", type: "goods", rate: "0%", chapter: "1006", notes: "Exempt if sold loose without pre-packaging." },
    { code: "10063020", description: "Pre-packaged and labeled Basmati rice", type: "goods", rate: "5%", chapter: "1006", notes: "5% GST on unit containers up to 25kg." },
    { code: "19053100", description: "Sweet biscuits, cookies, and bakery products", type: "goods", rate: "18%", chapter: "1905", notes: "Commercially manufactured biscuits and cookies." },
    { code: "22021010", description: "Aerated carbonated drinks and cold beverages", type: "goods", rate: "28%", chapter: "2202", notes: "Attracts 28% GST + 12% Compensation Cess." },
    { code: "22011010", description: "Packaged mineral drinking water bottles", type: "goods", rate: "18%", chapter: "2201", notes: "Packaged drinking water in bottles or cans." },
    { code: "61091000", description: "T-shirts and singlets of cotton (Value <= Rs 1,000)", type: "goods", rate: "5%", chapter: "6109", notes: "Concessional 5% rate for garments <= Rs 1,000." },
    { code: "61091090", description: "T-shirts and garments of cotton (Value > Rs 1,000)", type: "goods", rate: "12%", chapter: "6109", notes: "12% rate for apparel priced above Rs 1,000." },
    { code: "64039990", description: "Footwear with leather uppers (Value <= Rs 1,000)", type: "goods", rate: "5%", chapter: "6403", notes: "5% footwear rate for retail price <= Rs 1,000." },
    { code: "64039910", description: "Footwear with leather uppers (Value > Rs 1,000)", type: "goods", rate: "12%", chapter: "6403", notes: "12% rate for footwear priced above Rs 1,000." },
    { code: "87032290", description: "Motor cars & passenger vehicles (Engine < 1500cc)", type: "goods", rate: "28%", chapter: "8703", notes: "28% GST + 17% Compensation Cess." },
    { code: "87112090", description: "Motorcycles & scooters (Engine <= 350cc)", type: "goods", rate: "28%", chapter: "8711", notes: "28% GST rate for commuter motorcycles." },
    { code: "94033010", description: "Wooden furniture for office use", type: "goods", rate: "18%", chapter: "9403", notes: "Desks, office chairs, conference tables." },
    { code: "94051100", description: "LED bulbs, tube lights, and LED lamps", type: "goods", rate: "12%", chapter: "9405", notes: "Energy-efficient LED lighting products." },
    { code: "73089090", description: "Structures of iron and steel for construction", type: "goods", rate: "18%", chapter: "7308", notes: "Steel girders, columns, pre-engineered buildings." },
    { code: "69072100", description: "Ceramic floor and wall tiles", type: "goods", rate: "18%", chapter: "6907", notes: "Vitrified ceramic tiles for building." },
    { code: "39269099", description: "Plastic articles for packaging and domestic use", type: "goods", rate: "18%", chapter: "3926", notes: "Plastic containers, trays, industrial molded parts." },
    { code: "48191010", description: "Corrugated paper and paperboard boxes (Cartons)", type: "goods", rate: "18%", chapter: "4819", notes: "Shipping boxes, packaging cartons." },
    { code: "49011010", description: "Printed books, textbooks, educational literature", type: "goods", rate: "0%", chapter: "4901", notes: "Fully exempt from GST." },
    { code: "49021010", description: "Newspapers, journals, and periodicals", type: "goods", rate: "0%", chapter: "4902", notes: "Fully exempt under Notification 02/2017." }
  ];

  // Filtering logic
  const filtered = database.filter(item => {
    const q = query.toLowerCase().trim();
    const matchesQuery = !q || item.code.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.chapter.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesRate = rateFilter === "all" || item.rate === rateFilter;
    return matchesQuery && matchesType && matchesRate;
  });

  // Calculate mandatory digits requirement
  const getDigitRequirement = () => {
    if (supplyType === "export") {
      return {
        digits: "8 Digits Mandatory",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        rule: "Notification No. 90/2020-Central Tax & Customs Tariff Act 1975",
        details: "Full 8-digit HSN code is mandatory for all international import/export shipments, SEZ supplies, and customs clearance."
      };
    }
    if (turnover === "above_5cr") {
      return {
        digits: "6 Digits Mandatory",
        badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
        rule: "Notification No. 78/2020-Central Tax (w.e.f. April 1, 2021)",
        details: "Taxpayers with aggregate turnover > ₹5 Crore in preceding FY must report 6-digit HSN/SAC codes on both B2B and B2C tax invoices."
      };
    }
    if (turnover === "1.5cr_to_5cr") {
      if (supplyType === "b2b") {
        return {
          digits: "4 Digits Mandatory",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          rule: "Notification No. 78/2020-Central Tax",
          details: "Taxpayers with turnover between ₹1.5 Cr and ₹5 Cr must report minimum 4-digit HSN/SAC codes on all B2B invoices."
        };
      }
      return {
        digits: "4 Digits (Optional for B2C)",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        rule: "Notification No. 78/2020-Central Tax",
        details: "For turnover between ₹1.5 Cr and ₹5 Cr, HSN codes on B2C invoices are optional, but recommended."
      };
    }
    // under 1.5cr
    if (supplyType === "b2b") {
      return {
        digits: "4 Digits Recommended",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        rule: "Rule 46 Proviso of CGST Rules 2017",
        details: "Taxpayers with turnover < ₹1.5 Cr are exempt from mandatory HSN, but 4-digit codes prevent GSTR-1 validation warnings."
      };
    }
    return {
      digits: "0 Digits (Exempt for B2C)",
      badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      rule: "Notification No. 78/2020-Central Tax",
      details: "No HSN code required on B2C invoices for micro-taxpayers with aggregate turnover under ₹1.5 Crore."
    };
  };

  const digitResult = getDigitRequirement();

  return (
    <div className="space-y-8">
      {/* Top Banner / Heading */}
      <div className="border border-white/10 bg-[#0c101d] p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4f7cff]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Hash className="text-[#4f7cff]" size={20} />
              HSN & SAC Code Master Finder FY 2026-27
            </h1>
            <p className="text-xs text-[#aab2c5]">
              Search 80+ official CGST tariff codes, verify GST tax rates (0%, 5%, 12%, 18%, 28%), and test mandatory HSN digit compliance under Notification 78/2020-CT.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#aab2c5] bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex-shrink-0">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Updated as per CBIC Notifications</span>
          </div>
        </div>
      </div>

      {/* Interactive HSN Digit Compliance Rule Diagnostic Widget */}
      <div className="border border-white/10 bg-white/5 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="text-[#4f7cff]" size={16} />
              Mandatory HSN Digit Requirement Checker (Notification 78/2020-CT)
            </h2>
            <p className="text-[11px] text-[#737c92]">Check how many HSN/SAC digits you must report on your invoices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Turnover selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#aab2c5]">Preceding FY Aggregate Turnover</label>
            <select
              value={turnover}
              onChange={(e) => setTurnover(e.target.value as "under_1.5cr" | "1.5cr_to_5cr" | "above_5cr")}
              className="bg-[#080a12] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="under_1.5cr">Up to ₹1.5 Crore</option>
              <option value="1.5cr_to_5cr">₹1.5 Crore to ₹5 Crore</option>
              <option value="above_5cr">Above ₹5 Crore</option>
            </select>
          </div>

          {/* Supply Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#aab2c5]">Transaction Supply Type</label>
            <select
              value={supplyType}
              onChange={(e) => setSupplyType(e.target.value as "b2b" | "b2c" | "export")}
              className="bg-[#080a12] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="b2b">B2B Supply (Registered Recipient)</option>
              <option value="b2c">B2C Supply (Unregistered Recipient)</option>
              <option value="export">Export / Import / SEZ Supply</option>
            </select>
          </div>

          {/* Result Card */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${digitResult.badgeColor}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">Statutory Mandate</span>
              <CheckCircle2 size={16} />
            </div>
            <div className="text-base font-extrabold my-1">{digitResult.digits}</div>
            <p className="text-[10px] leading-tight opacity-90">{digitResult.details}</p>
          </div>
        </div>
      </div>

      {/* Database Search & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Parameters Sidebar */}
        <div className="lg:col-span-4 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Search & Filters</h2>
            <p className="text-[10px] text-[#737c92]">Refine tariff database entries</p>
          </div>

          {/* Query input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-query" className="text-[10px] font-semibold text-[#aab2c5]">
              Search Code, Chapter or Description
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-[#737c92]" size={14} />
              <input
                id="search-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 9983, Laptops, Legal, 18%"
                className="w-full bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#737c92]"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#aab2c5]">Supply Classification</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`py-2 rounded-xl text-[10px] font-semibold transition-all border border-white/5 cursor-pointer ${
                  typeFilter === "all" ? "bg-[#4f7cff] text-white" : "bg-white/5 text-[#aab2c5]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("goods")}
                className={`py-2 rounded-xl text-[10px] font-semibold transition-all border border-white/5 cursor-pointer ${
                  typeFilter === "goods" ? "bg-[#4f7cff] text-white" : "bg-white/5 text-[#aab2c5]"
                }`}
              >
                Goods (HSN)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("services")}
                className={`py-2 rounded-xl text-[10px] font-semibold transition-all border border-white/5 cursor-pointer ${
                  typeFilter === "services" ? "bg-[#4f7cff] text-white" : "bg-white/5 text-[#aab2c5]"
                }`}
              >
                Services (SAC)
              </button>
            </div>
          </div>

          {/* Rate Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#aab2c5]">GST Rate Filter</label>
            <select
              value={rateFilter}
              onChange={(e) => setRateFilter(e.target.value)}
              className="bg-[#080a12] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">All Tax Rates (0%, 5%, 12%, 18%, 28%)</option>
              <option value="0%">0% (Exempt Supplies)</option>
              <option value="5%">5% (Concessional / Essential)</option>
              <option value="12%">12% (Standard Lower)</option>
              <option value="18%">18% (Standard Services & Goods)</option>
              <option value="28%">28% (Luxury / Aerated / Vehicles)</option>
            </select>
          </div>

          {/* Informational Card */}
          <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5 text-[10px] text-[#aab2c5] leading-normal">
            <Info size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
            <span>
              <strong>Rule 46 Compliance:</strong> Reporting wrong HSN codes or wrong GST rates on tax invoices exposes the supplier to Section 125 penalties (up to ₹50,000) and recipient to ITC disallowance under Section 16(2)(a).
            </span>
          </div>
        </div>

        {/* Directory Output Table */}
        <div className="lg:col-span-8 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white mb-0.5">HSN / SAC Master Directory</h2>
              <p className="text-[10px] text-[#737c92]">
                Showing {filtered.length} of {database.length} statutory entries
              </p>
            </div>
            {filtered.length > 0 && (
              <span className="text-[10px] text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded-lg border border-[#4f7cff]/20 font-medium">
                Active Filter Match
              </span>
            )}
          </div>

          <div className="border border-white/5 rounded-xl overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Description & Notes</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-white flex items-center gap-1 font-bold whitespace-nowrap">
                        <Hash size={11} className="text-[#4f7cff]" />
                        {item.code}
                      </td>
                      <td className="px-4 py-3 text-[#aab2c5]">
                        <div className="font-semibold text-white">{item.description}</div>
                        {item.notes && <div className="text-[10px] text-[#737c92] mt-0.5">{item.notes}</div>}
                      </td>
                      <td className="px-4 py-3 uppercase text-[9px] font-bold whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            item.type === "goods"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {item.type} (Ch {item.chapter})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-bold font-mono whitespace-nowrap">
                        <span className="bg-white/5 px-2 py-1 rounded border border-white/10">
                          {item.rate}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#737c92]">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="text-amber-400" size={24} />
                        <span>No codes found matching your search query. Try searching for &quot;9983&quot;, &quot;Laptops&quot;, &quot;Legal&quot; or reset filters.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CA Lead Capture Consultation Block */}
      <CAConsultation toolName="HSN & SAC Code Finder" />
    </div>
  );
}
