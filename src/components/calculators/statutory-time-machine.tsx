"use client";

import { useMemo, useState } from "react";
import { Info, RefreshCw, CalendarClock, ArrowRight, Search } from "lucide-react";
import {
  lawInForceOn,
  financialYearOf,
  assessmentYearOf,
  isIta2025,
  ITA_SECTION_MAP,
} from "@/lib/tools-math";

const PRESETS = [
  { label: "Today", value: new Date().toISOString().slice(0, 10) },
  { label: "FY 2026-27 start", value: "2026-04-01" },
  { label: "FY 2025-26", value: "2025-09-15" },
  { label: "GST rollout", value: "2017-07-01" },
  { label: "Pre-GST", value: "2016-08-10" },
];

export function StatutoryTimeMachine() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sectionQuery, setSectionQuery] = useState("");

  const facts = lawInForceOn(date);
  const fy = financialYearOf(date);
  const ay = assessmentYearOf(date);
  const newAct = isIta2025(date);

  const sections = useMemo(() => {
    const q = sectionQuery.trim().toLowerCase();
    const all = Object.entries(ITA_SECTION_MAP);
    if (!q) return all;
    return all.filter(
      ([oldSec, v]) =>
        oldSec.toLowerCase().includes(q) ||
        v.new.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q)
    );
  }, [sectionQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Transaction Date</h2>
          <p className="text-[10px] text-[#737c92]">
            Find which statute governed a transaction on the day it happened
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="txn-date" className="text-[10px] font-semibold text-[#aab2c5]">
            Date of transaction or event
          </label>
          <input
            id="txn-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white [color-scheme:dark]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#aab2c5]">Jump to</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setDate(p.value)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  date === p.value
                    ? "bg-[#4f7cff] border-[#4f7cff] text-white"
                    : "border-white/10 bg-white/5 text-[#aab2c5] hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
            <span className="text-[10px] text-[#737c92] block">Financial Year</span>
            <span className="text-sm font-bold text-white mt-1 block">{fy ?? "—"}</span>
          </div>
          <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
            <span className="text-[10px] text-[#737c92] block">Assessment Year</span>
            <span className="text-sm font-bold text-white mt-1 block">{ay ?? "—"}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setDate(new Date().toISOString().slice(0, 10));
            setSectionQuery("");
          }}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          Reset to today
        </button>

        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4 leading-relaxed">
          Useful when drafting a reply to a notice for an earlier year — cite the section as it stood
          on the transaction date, not the section in force today.
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Law In Force</h2>
          <p className="text-[10px] text-[#737c92]">
            {date
              ? new Date(date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Pick a date"}
          </p>
        </div>

        {facts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border border-dashed border-white/10 rounded-xl">
            <CalendarClock className="text-[#737c92] mb-3" size={24} />
            <p className="text-xs text-[#737c92]">Pick a valid date to see the governing statute.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {facts.map((f) => (
              <div
                key={f.domain}
                className="p-5 rounded-xl border"
                style={{ borderColor: `${f.tone}33`, background: `${f.tone}0d` }}
              >
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border inline-block"
                  style={{ color: f.tone, background: `${f.tone}14`, borderColor: `${f.tone}33` }}
                >
                  {f.domain}
                </span>
                <h3 className="text-base font-bold text-white mt-3 font-display">{f.regime}</h3>
                <p className="text-xs text-[#aab2c5] mt-1.5 leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Section mapping */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Section Renumbering</h3>
              <p className="text-[10px] text-[#737c92] mt-0.5">
                {newAct
                  ? "Cite the Income-tax Act 2025 numbering for this date."
                  : "Cite the Income-tax Act 1961 numbering for this date."}
              </p>
            </div>
            <div className="relative w-full sm:max-w-[180px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737c92]"
                size={13}
              />
              <input
                type="search"
                aria-label="Search sections"
                placeholder="e.g. 194J"
                value={sectionQuery}
                onChange={(e) => setSectionQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg py-2 pl-8 pr-3 text-[11px] text-white placeholder-[#737c92]"
              />
            </div>
          </div>

          {sections.length === 0 ? (
            <p className="text-xs text-[#737c92] py-6 text-center border border-dashed border-white/10 rounded-xl">
              No section matches that search.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {sections.map(([oldSec, v]) => {
                const cite = newAct ? v.new : oldSec;
                return (
                  <div
                    key={oldSec}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#080a12]/50 border border-white/5"
                  >
                    <span
                      className={`text-[11px] font-mono font-bold w-16 flex-shrink-0 ${
                        newAct ? "text-[#737c92] line-through" : "text-[#4f7cff]"
                      }`}
                    >
                      {oldSec}
                    </span>
                    <ArrowRight size={11} className="text-[#737c92] flex-shrink-0" />
                    <span
                      className={`text-[11px] font-mono font-bold w-16 flex-shrink-0 ${
                        newAct ? "text-[#34d399]" : "text-[#737c92]"
                      }`}
                    >
                      {v.new}
                    </span>
                    <span className="text-[10px] text-[#aab2c5] truncate">{v.label}</span>
                    <span
                      className="ml-auto text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{
                        color: newAct ? "#34d399" : "#4f7cff",
                        background: newAct ? "#34d3991a" : "#4f7cff1a",
                        borderColor: newAct ? "#34d39933" : "#4f7cff33",
                      }}
                    >
                      cite {cite}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5">
          <Info size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#aab2c5] leading-relaxed">
            The Income-tax Act 2025 applies from 1 April 2026. Assessments and appeals for earlier
            years continue to be governed by the Income-tax Act 1961, so a notice for FY 2024-25
            should still cite the old numbering.
          </div>
        </div>

        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4 leading-relaxed">
          Covers the principal renumbered provisions and the major regime changes. Always confirm
          against the bare Act before relying on a citation in a filing.
        </div>
      </div>
    </div>
  );
}
