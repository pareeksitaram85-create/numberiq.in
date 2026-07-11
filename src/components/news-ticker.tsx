"use client";

import Link from "next/link";
import updatesData from "../../content/updates.json";

interface UpdateItem {
  date: string;
  source: string;
  title: string;
  summary: string;
  link: string;
}

interface WeekGroup {
  weekOf: string;
  items: UpdateItem[];
}

const SOURCE_COLORS: Record<string, string> = {
  CBDT: "#fb7185",
  CBIC: "#818cf8",
  GSTN: "#fbbf24",
  RBI: "#34d399",
  MCA: "#38bdf8",
  SEBI: "#c084fc",
};

/**
 * Left-to-right scrolling flash strip showing the latest weekly
 * tax & compliance updates (GST, Income Tax, TP, International Tax,
 * ODI/FLA timelines). Curated every Saturday in content/updates.json.
 */
export function NewsTicker() {
  const groups = updatesData as WeekGroup[];
  const items = (groups[0]?.items || []).slice(0, 10);
  if (items.length === 0) return null;

  // Duplicate the list so the loop is seamless
  const loop = [...items, ...items];

  return (
    <div className="relative border-b border-white/5 bg-[#080a12] overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <Link
          href="/updates"
          className="relative z-10 shrink-0 flex items-center gap-2 px-5 py-3 bg-[#0b0e18] border-r border-white/10 hover:bg-[#101426] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
          <span className="text-[11px] font-bold font-mono uppercase tracking-widest text-[#f43f5e]">
            Tax Radar
          </span>
        </Link>

        {/* Scrolling strip */}
        <div className="flex-1 overflow-hidden group">
          <div className="ticker-track flex items-center gap-12 whitespace-nowrap py-3 group-hover:[animation-play-state:paused]">
            {loop.map((it, i) => (
              <Link
                key={i}
                href="/updates"
                className="flex items-center gap-2.5 text-[13px] font-medium text-[#aab2c5] hover:text-white transition-colors"
              >
                <span
                  className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border"
                  style={{
                    color: SOURCE_COLORS[it.source.toUpperCase()] || "#737c92",
                    borderColor: `${SOURCE_COLORS[it.source.toUpperCase()] || "#737c92"}33`,
                    backgroundColor: `${SOURCE_COLORS[it.source.toUpperCase()] || "#737c92"}15`,
                  }}
                >
                  {it.source}
                </span>
                {it.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticker-track {
          animation: ticker-rtl 50s linear infinite;
        }
        @keyframes ticker-rtl {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
