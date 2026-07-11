"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calculator, ArrowRight } from "lucide-react";

interface ToolItem {
  slug: string;
  name: string;
  desc: string;
  category: string;
  featured: boolean;
}

interface ToolsIndexClientProps {
  tools: ToolItem[];
}

export function ToolsIndexClient({ tools }: ToolsIndexClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                          tool.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || tool.category === category;
    return matchesSearch && matchesCategory;
  });

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
  );
}
