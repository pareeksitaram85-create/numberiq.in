"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calculator, ArrowRight, Sparkles, Zap } from "lucide-react";

interface ToolItem {
  slug: string;
  name: string;
  desc: string;
  category: string;
  featured: boolean;
  tier: "free" | "pro";
  flagship: boolean;
}

interface ToolsIndexClientProps {
  tools: ToolItem[];
}

export function ToolsIndexClient({ tools }: ToolsIndexClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tier, setTier] = useState<"all" | "free" | "pro">("all");

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                          tool.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || tool.category === category;
    const matchesTier = tier === "all" || tool.tier === tier;
    return matchesSearch && matchesCategory && matchesTier;
  });

  const flagship = tools.find((t) => t.flagship);
  const proCount = tools.filter((t) => t.tier === "pro").length;
  const freeCount = tools.length - proCount;

  return (
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

      {/* Flagship Pro tool — the one thing here no competitor offers. */}
      {flagship && (
        <div className="mb-10 rounded-3xl border border-[#00d68f]/25 bg-gradient-to-br from-[#00d68f]/10 via-[#4f7cff]/5 to-transparent p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00d68f] bg-[#00d68f]/10 border border-[#00d68f]/25 px-2.5 py-1 rounded-full mb-3">
                <Zap size={11} /> Pro · Flagship
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                {flagship.name}
              </h2>
              <p className="text-sm text-[#aab2c5] leading-relaxed">
                Stop typing invoices into Tally. Upload the PDF, let the AI read the vendor, GSTIN,
                CGST/SGST/IGST and line items, review what it found, then take the voucher straight
                into Tally Prime. Built for firms processing hundreds of purchase invoices a month.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href={`/tools/${flagship.slug}`}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl bg-[#00d68f] hover:bg-[#00b377] text-black transition-all cursor-pointer"
              >
                Try it free <ArrowRight size={13} />
              </Link>
              <Link
                href="/pricing"
                className="text-[10px] text-center text-[#737c92] hover:text-[#aab2c5] transition-colors"
              >
                See Pro plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Free vs Pro */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { id: "all", label: `All tools (${tools.length})` },
          { id: "free", label: `Free calculators (${freeCount})` },
          { id: "pro", label: `Pro · AI & automation (${proCount})` },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTier(opt.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
              tier === opt.id
                ? opt.id === "pro"
                  ? "bg-[#00d68f] text-black border-[#00d68f]"
                  : "bg-[#4f7cff] text-white border-[#4f7cff]"
                : "bg-white/5 text-[#aab2c5] border-white/5 hover:bg-white/10 hover:border-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-[#737c92] mb-8 leading-relaxed">
        Every calculator is free, forever, with no sign-in.{" "}
        <span className="text-[#00d68f] font-semibold">Pro</span> tools are the AI and automation
        ones — they are <span className="text-white">free to use during the beta</span> while we
        finish building them.{" "}
        <Link href="/pricing" className="text-[#4f7cff] hover:underline">
          Join early access
        </Link>{" "}
        to lock in your price when paid plans open.
      </p>

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
            className={`relative group border p-6 rounded-2xl flex flex-col justify-between transition-all ${
              tool.tier === "pro"
                ? "border-[#00d68f]/25 bg-[#00d68f]/[0.04] hover:bg-[#00d68f]/[0.08] hover:border-[#00d68f]/40"
                : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#ffffff]/15"
            }`}
          >
            {tool.tier === "pro" ? (
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[9px] font-bold text-[#00d68f] bg-[#00d68f]/10 border border-[#00d68f]/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles size={9} /> Pro
              </span>
            ) : tool.featured ? (
              <span className="absolute top-4 right-4 text-[9px] font-bold text-[#4f7cff] bg-[#4f7cff]/10 border border-[#4f7cff]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Featured
              </span>
            ) : null}
            <div>
              <div
                className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4 transition-colors ${
                  tool.tier === "pro"
                    ? "text-[#00d68f] group-hover:bg-[#00d68f]/10"
                    : "text-[#4f7cff] group-hover:bg-[#4f7cff]/10"
                }`}
              >
                {tool.tier === "pro" ? <Zap size={15} /> : <Calculator size={15} />}
              </div>
              <h3
                className={`text-sm font-semibold text-white mb-2 transition-colors ${
                  tool.tier === "pro" ? "group-hover:text-[#00d68f]" : "group-hover:text-[#4f7cff]"
                }`}
              >
                {tool.name}
              </h3>
              <p className="text-xs text-[#737c92] leading-relaxed mb-6">
                {tool.desc}
              </p>
            </div>

            <Link
              href={`/tools/${tool.slug}`}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-white/5 text-[#aab2c5] justify-center transition-all cursor-pointer ${
                tool.tier === "pro"
                  ? "group-hover:bg-[#00d68f] group-hover:text-black"
                  : "group-hover:bg-[#4f7cff] group-hover:text-white"
              }`}
            >
              {tool.tier === "pro" ? "Open tool — free in beta" : "Launch Calculator"}
              <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
