"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Search, Calculator, Shield, BookOpen, Clock, Calendar, ArrowRight } from "lucide-react";

const toolsList = [
  {
    slug: "gst-late-fee-calculator",
    name: "GST Late Fee Calculator (S.47)",
    desc: "Calculate Section 47 late fee liability for GSTR-1, 3B, and GSTR-9 returns with FY 2026-27 limits.",
    category: "gst",
    featured: true
  },
  {
    slug: "gst-interest-calculator",
    name: "GST Interest Calculator (S.50)",
    desc: "Compute interest on delayed filing of GSTR-3B on net cash liability at 18% p.a. under Section 50.",
    category: "gst",
    featured: true
  },
  {
    slug: "itc-utilization-calculator",
    name: "ITC Utilization Engine",
    desc: "Optimize utilization of IGST, CGST, and SGST credits according to legal ordering rules.",
    category: "gst",
    featured: false
  },
  {
    slug: "GST_ReCO_Studio_IMS_FIXED",
    name: "GST Input Reconciliation Studio",
    desc: "Match purchase registers with auto-drafted GSTR-2B statement to identify missing ITCs.",
    category: "gst",
    featured: true
  },
  {
    slug: "Invoice-Compliance",
    name: "GST Invoice Compliance Checker",
    desc: "Verify invoice data fields against standard CGST compliance parameters.",
    category: "gst",
    featured: false
  },
  {
    slug: "HSN_SAC_Finder",
    name: "HSN/SAC Finder & Rate Chart",
    desc: "Search standard HSN/SAC codes and corresponding tax rates for goods & services.",
    category: "gst",
    featured: false
  },
  {
    slug: "income-tax-calculator-fy2026-27",
    name: "Income Tax Calculator (FY 2026-27)",
    desc: "Compare old vs new tax regime slabs for individuals, senior citizens, and HUFs.",
    category: "tax",
    featured: true
  },
  {
    slug: "advance-tax-calculator",
    name: "Advance Tax Estimator",
    desc: "Estimate quarterly advance tax installments due on 15th June, Sep, Dec, and March.",
    category: "tax",
    featured: true
  },
  {
    slug: "interest-234abc-calculator",
    name: "Section 234A/B/C Interest Calculator",
    desc: "Calculate interest on default in furnishing ITR or payment/deferment of advance tax.",
    category: "tax",
    featured: false
  },
  {
    slug: "capital-gains-tax-calculator",
    name: "Capital Gains Tax Studio",
    desc: "Calculate LTCG & STCG tax for property, shares, and equity mutual funds with indexation.",
    category: "tax",
    featured: true
  },
  {
    slug: "numberiq-tds-chart-fy2026-27",
    name: "TDS Rate Chart (FY 2026-27)",
    desc: "Comprehensive lookup for Section 194C, 194J, 194I, 194IA TDS thresholds and rates.",
    category: "tax",
    featured: false
  },
  {
    slug: "tds-interest-calculator",
    name: "TDS Non-Deduction Interest Calculator",
    desc: "Calculate interest on non-deduction (1% p.m.) or non-payment (1.5% p.m.) of TDS.",
    category: "tax",
    featured: false
  },
  {
    slug: "msme-payment-tracker-calculator",
    name: "MSME Payment Tracker (S.43B)",
    desc: "Track Section 43B(h) due dates (15/45 days) to avoid tax disallowance on supplier payments.",
    category: "mis",
    featured: true
  },
  {
    slug: "depreciation-block-assets-calculator",
    name: "Block Assets Depreciation Calculator",
    desc: "Calculate written down value (WDV) and depreciation for building, machinery, and software blocks.",
    category: "mis",
    featured: false
  },
  {
    slug: "lrs-tcs-calculator",
    name: "LRS TCS Remittance Calculator",
    desc: "Track TCS rates (5%, 20%) on foreign remittances, education, and tour packages under LRS.",
    category: "mis",
    featured: false
  },
  {
    slug: "due-date-calendar",
    name: "Compliance Due Date Calendar",
    desc: "Track monthly statutory due dates for GST returns, TDS deposits, and ITR filings.",
    category: "mis",
    featured: true
  }
];

export default function ToolsIndex() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredTools = toolsList.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                          tool.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || tool.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-[#9a6bff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Calculators & Tools
            </h1>
            <p className="text-sm text-[#aab2c5] max-w-xl">
              Instant, client-side verified financial calculators matching Indian tax regulations and corporate finance standards.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737c92]" size={16} />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#ffffff]/5 border border-[#ffffff]/10 hover:border-[#ffffff]/20 focus:border-[#4f7cff] focus:outline-none rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-[#737c92] transition-colors"
            />
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/5">
          {["all", "gst", "tax", "mis"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                category === cat
                  ? "bg-[#4f7cff] text-white border-[#4f7cff]"
                  : "bg-white/5 text-[#aab2c5] border-white/5 hover:bg-white/10 hover:border-white/10"
              }`}
            >
              {cat === "all" ? "All Suites" : cat === "gst" ? "GST Suite" : cat === "tax" ? "Direct Tax" : "MIS & Corporate"}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.slug}
              className="relative group border border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#ffffff]/15 p-6 rounded-2xl flex flex-col justify-between transition-all"
            >
              {tool.featured && (
                <span className="absolute top-4 right-4 text-[9px] font-bold text-[#4f7cff] bg-[#4f7cff]/10 border border-[#4f7cff]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Featured
                </span>
              )}
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#4f7cff] mb-4 group-hover:bg-[#4f7cff]/10 transition-colors">
                  <Calculator size={15} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-[#4f7cff] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-[#737c92] leading-relaxed mb-6">
                  {tool.desc}
                </p>
              </div>

              <Link
                href={`/tools/${tool.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-white/5 text-[#aab2c5] group-hover:bg-[#4f7cff] group-hover:text-white justify-center transition-all cursor-pointer"
              >
                Launch Calculator
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
