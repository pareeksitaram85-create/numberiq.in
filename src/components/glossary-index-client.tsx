"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { categoryMeta } from "@/components/category-meta";

export interface GlossaryItem {
  slug: string;
  term: string;
  category: string;
  definition: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Terms are authored as SEO questions ("What is Advance Tax?"); the index needs the bare noun
// so that alphabetical grouping doesn't collapse every entry under "W".
function displayTerm(term: string) {
  return term.replace(/^\s*what\s+(?:is|are)\s+/i, "").replace(/\?\s*$/, "").trim() || term;
}

function initial(term: string) {
  const ch = displayTerm(term).charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

export function GlossaryIndexClient({ terms }: { terms: GlossaryItem[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [letter, setLetter] = useState("all");

  const sorted = useMemo(
    () => [...terms].sort((a, b) => displayTerm(a.term).localeCompare(displayTerm(b.term), "en")),
    [terms]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of sorted) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sorted]);

  const availableLetters = useMemo(
    () => new Set(sorted.map((t) => initial(t.term))),
    [sorted]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (letter !== "all" && initial(t.term) !== letter) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        displayTerm(t.term).toLowerCase().includes(q) ||
        (t.definition ?? "").toLowerCase().includes(q) ||
        categoryMeta(t.category).label.toLowerCase().includes(q)
      );
    });
  }, [sorted, search, category, letter]);

  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryItem[]>();
    for (const t of filtered) {
      const k = initial(t.term);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setLetter("all");
  };

  return (
    <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#f4b740] bg-[#f4b740]/10 px-2.5 py-1 rounded border border-[#f4b740]/20">
            Glossary
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 mb-3">
            Tax &amp; Finance Glossary
          </h1>
          <p className="text-sm text-[#aab2c5] max-w-xl leading-relaxed">
            {terms.length} statutory terms and legal definitions under the CGST Rules and the
            Income-tax Act — explained in plain English.
          </p>
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737c92]" size={16} />
          <input
            type="search"
            aria-label="Search glossary terms"
            placeholder="Search a term…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#f4b740] focus:outline-none rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#737c92] transition-colors"
          />
        </div>
      </div>

      {/* A–Z jump bar */}
      <div className="flex flex-wrap gap-1.5 mb-6" role="group" aria-label="Filter by first letter">
        <button
          onClick={() => setLetter("all")}
          aria-pressed={letter === "all"}
          className={`px-3 h-8 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            letter === "all"
              ? "bg-[#f4b740] border-[#f4b740] text-[#05060a]"
              : "bg-white/5 border-white/8 text-[#aab2c5] hover:bg-white/10"
          }`}
        >
          All
        </button>
        {ALPHABET.map((ch) => {
          const has = availableLetters.has(ch);
          const active = letter === ch;
          return (
            <button
              key={ch}
              disabled={!has}
              onClick={() => setLetter(ch)}
              aria-pressed={active}
              className={`w-8 h-8 rounded-lg text-[11px] font-bold border transition-all ${
                active
                  ? "bg-[#f4b740] border-[#f4b740] text-[#05060a] cursor-pointer"
                  : has
                    ? "bg-white/5 border-white/8 text-[#aab2c5] hover:bg-white/10 hover:text-white cursor-pointer"
                    : "bg-transparent border-white/5 text-[#2f3543] cursor-not-allowed"
              }`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-10 border-b border-white/5">
        <Chip active={category === "all"} tone="#f4b740" onClick={() => setCategory("all")}>
          All · {terms.length}
        </Chip>
        {categories.map(([key, count]) => {
          const meta = categoryMeta(key);
          return (
            <Chip key={key} active={category === key} tone={meta.tone} onClick={() => setCategory(key)}>
              {meta.label} · {count}
            </Chip>
          );
        })}
      </div>

      {/* Grouped terms */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <Search className="text-[#737c92] mb-4" size={28} />
          <p className="text-sm font-semibold text-white mb-1">No terms match that search</p>
          <p className="text-xs text-[#737c92] mb-6">Try a different keyword or clear the filters.</p>
          <button
            onClick={clearAll}
            className="px-5 py-2 rounded-full border border-[#f4b740]/30 bg-[#f4b740]/10 text-[#f4b740] text-xs font-bold uppercase tracking-wider hover:bg-[#f4b740]/20 transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {grouped.map(([group, items]) => (
            <section key={group}>
              <div className="flex items-center gap-4 mb-5">
                <h2 className="font-display text-2xl font-black text-[#f4b740]">{group}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#f4b740]/25 to-transparent" />
                <span className="text-[10px] font-mono text-[#737c92]">{items.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((t) => {
                  const meta = categoryMeta(t.category);
                  return (
                    <Link key={t.slug} href={`/glossary/${t.slug}`} className="block group">
                      <div
                        className="h-full relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#07091a] to-[#050810] p-6 flex flex-col justify-between transition-all duration-300"
                        style={{ borderColor: `${meta.tone}22` }}
                      >
                        <div
                          className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background: `${meta.tone}18` }}
                        />
                        <div className="relative z-10">
                          <span
                            className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border mb-3"
                            style={{ color: meta.tone, background: `${meta.tone}14`, borderColor: `${meta.tone}33` }}
                          >
                            {meta.label}
                          </span>
                          <h3
                            className="text-sm font-bold text-white mb-2 transition-colors group-hover:text-[color:var(--tone)]"
                            style={{ ["--tone" as string]: meta.tone }}
                          >
                            {displayTerm(t.term)}
                          </h3>
                          <p className="text-xs text-[#737c92] leading-relaxed line-clamp-3">
                            {t.definition}
                          </p>
                        </div>
                        <span
                          className="relative z-10 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mt-6"
                          style={{ color: meta.tone }}
                        >
                          View Definition
                          <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function Chip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer"
      style={
        active
          ? { background: tone, borderColor: tone, color: "#05060a" }
          : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", color: "#aab2c5" }
      }
    >
      {children}
    </button>
  );
}
