"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Calendar, Clock, Sparkles } from "lucide-react";
import { categoryMeta } from "@/components/category-meta";

export interface InsightItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime?: string | null;
  createdAt: string;
}

const PAGE_SIZE = 24;

export function InsightsIndexClient({ posts }: { posts: InsightItem[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [posts]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of sorted) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sorted]);

  const featured = sorted[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.excerpt ?? "").toLowerCase().includes(q) ||
        categoryMeta(p.category).label.toLowerCase().includes(q)
      );
    });
  }, [sorted, search, category]);

  const shown = filtered.slice(0, visible);
  const isBrowsing = search.trim() !== "" || category !== "all";

  const resetPaging = () => setVisible(PAGE_SIZE);

  return (
    <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20">
            Insights
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 mb-3">
            Finance &amp; Tax Insights
          </h1>
          <p className="text-sm text-[#aab2c5] max-w-xl leading-relaxed">
            {posts.length} Chartered Accountant-reviewed guides covering compliance, statutory
            updates, and strategic tax planning under Indian law.
          </p>
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737c92]" size={16} />
          <input
            type="search"
            aria-label="Search insights"
            placeholder="Search 100+ articles…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPaging();
            }}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#737c92] transition-colors"
          />
        </div>
      </div>

      {/* Featured article — only when browsing the unfiltered feed */}
      {featured && !isBrowsing && (
        <Link href={`/insights/${featured.slug}`} className="block group mb-12">
          <article className="relative overflow-hidden rounded-3xl border border-[#4f7cff]/20 bg-gradient-to-br from-[#0a0f1e] to-[#050810] p-8 sm:p-10 transition-all duration-300 group-hover:border-[#4f7cff]/40 group-hover:shadow-[0_0_50px_rgba(79,124,255,0.1)]">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#4f7cff]/10 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 border border-[#4f7cff]/25 px-2.5 py-1 rounded-full">
                <Sparkles size={10} />
                Latest
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-white mt-5 mb-4 leading-tight group-hover:text-[#4f7cff] transition-colors">
                {featured.title}
              </h2>
              <p className="text-sm text-[#aab2c5] leading-relaxed line-clamp-3 mb-6">
                {featured.excerpt}
              </p>
              <Meta post={featured} />
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4f7cff] mt-6">
                Read Article
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </article>
        </Link>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/5">
        <FilterChip
          active={category === "all"}
          tone="#4f7cff"
          onClick={() => {
            setCategory("all");
            resetPaging();
          }}
        >
          All · {posts.length}
        </FilterChip>
        {categories.map(([key, count]) => {
          const meta = categoryMeta(key);
          return (
            <FilterChip
              key={key}
              active={category === key}
              tone={meta.tone}
              onClick={() => {
                setCategory(key);
                resetPaging();
              }}
            >
              {meta.label} · {count}
            </FilterChip>
          );
        })}
      </div>

      {/* Feed */}
      {shown.length === 0 ? (
        <EmptyState
          onClear={() => {
            setSearch("");
            setCategory("all");
            resetPaging();
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((post) => {
              const meta = categoryMeta(post.category);
              return (
                <Link key={post.slug} href={`/insights/${post.slug}`} className="block group">
                  <article
                    className="h-full relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#07091a] to-[#050810] p-6 flex flex-col justify-between transition-all duration-300"
                    style={{ borderColor: `${meta.tone}22` }}
                  >
                    <div
                      className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `${meta.tone}18` }}
                    />
                    <div className="relative z-10">
                      <Meta post={post} />
                      <h3 className="text-sm font-bold text-white mt-4 mb-2 leading-snug transition-colors group-hover:text-[color:var(--tone)]"
                        style={{ ["--tone" as string]: meta.tone }}
                      >
                        {post.title}
                      </h3>
                      <p className="text-xs text-[#737c92] leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                    <span
                      className="relative z-10 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mt-6 transition-colors"
                      style={{ color: meta.tone }}
                    >
                      Read Article
                      <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </article>
                </Link>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div className="flex justify-center mt-12">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
              >
                Load more · {filtered.length - visible} remaining
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Meta({ post }: { post: InsightItem }) {
  const meta = categoryMeta(post.category);
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
      <span
        className="px-2 py-0.5 rounded-full border"
        style={{ color: meta.tone, background: `${meta.tone}14`, borderColor: `${meta.tone}33` }}
      >
        {meta.label}
      </span>
      <span className="text-[#737c92] flex items-center gap-1 normal-case font-medium">
        <Calendar size={11} />
        {new Date(post.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
      </span>
      {post.readingTime && (
        <span className="text-[#737c92] flex items-center gap-1 normal-case font-medium">
          <Clock size={11} />
          {post.readingTime}
        </span>
      )}
    </div>
  );
}

function FilterChip({
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

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-2xl">
      <Search className="text-[#737c92] mb-4" size={28} />
      <p className="text-sm font-semibold text-white mb-1">No articles match that search</p>
      <p className="text-xs text-[#737c92] mb-6">Try a different keyword or clear the filters.</p>
      <button
        onClick={onClear}
        className="px-5 py-2 rounded-full border border-[#4f7cff]/30 bg-[#4f7cff]/10 text-[#4f7cff] text-xs font-bold uppercase tracking-wider hover:bg-[#4f7cff]/20 transition-colors cursor-pointer"
      >
        Clear filters
      </button>
    </div>
  );
}
