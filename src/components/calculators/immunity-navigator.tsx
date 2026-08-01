"use client";

import { useState } from "react";
import { Info, RefreshCw, ShieldCheck, XCircle, Scale } from "lucide-react";
import { calculateImmunity } from "@/lib/appeal-math";
import { formatInr } from "@/lib/tools-math";

export function ImmunityNavigator() {
  const today = new Date().toISOString().slice(0, 10);
  const [orderDate, setOrderDate] = useState(today);
  const [tax, setTax] = useState<number>(500000);
  const [interest, setInterest] = useState<number>(90000);
  const [isMisreporting, setIsMisreporting] = useState(false);
  const [taxPaid, setTaxPaid] = useState(true);
  const [wantsToAppeal, setWantsToAppeal] = useState(false);
  const [winPct, setWinPct] = useState<number>(30);

  const r = calculateImmunity(
    orderDate,
    tax,
    interest,
    isMisreporting,
    taxPaid,
    wantsToAppeal,
    winPct,
    today
  );

  const reset = () => {
    setOrderDate(today);
    setTax(500000);
    setInterest(90000);
    setIsMisreporting(false);
    setTaxPaid(true);
    setWantsToAppeal(false);
    setWinPct(30);
  };

  const tone = r.eligible ? "#34d399" : "#f87171";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Assessment Details</h2>
          <p className="text-[10px] text-[#737c92]">Section 270AA immunity from penalty and prosecution</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="order-date" className="text-[10px] font-semibold text-[#aab2c5]">
            Date the assessment order was received
          </label>
          <input
            id="order-date"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white [color-scheme:dark]"
          />
        </div>

        <Money id="tax" label="Tax on the addition" value={tax} onChange={setTax} />
        <Money id="interest" label="Interest demanded" value={interest} onChange={setInterest} />

        <Toggle
          id="misreporting"
          label="Addition treated as misreporting"
          hint="Section 270A(9) — penalty at 200%, and outside the immunity"
          checked={isMisreporting}
          onChange={setIsMisreporting}
        />
        <Toggle
          id="tax-paid"
          label="Tax and interest paid in time"
          hint="A condition of immunity under Section 270AA(1)"
          checked={taxPaid}
          onChange={setTaxPaid}
        />
        <Toggle
          id="wants-appeal"
          label="You intend to appeal the assessment"
          hint="Immunity and an appeal are mutually exclusive"
          checked={wantsToAppeal}
          onChange={setWantsToAppeal}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="win" className="text-[10px] font-semibold text-[#aab2c5]">
              Chance the addition is deleted on appeal
            </label>
            <span className="text-[11px] font-bold text-white font-mono">{winPct}%</span>
          </div>
          <input
            id="win"
            type="range"
            min={0}
            max={100}
            step={5}
            value={winPct}
            onChange={(e) => setWinPct(Number(e.target.value))}
            className="w-full accent-[#4f7cff] cursor-pointer"
          />
        </div>

        <button
          onClick={reset}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Immunity Assessment</h2>
          <p className="text-[10px] text-[#737c92]">Form 68 · Section 270AA, Income-tax Act 1961</p>
        </div>

        {/* Verdict */}
        <div className="p-6 rounded-xl border text-center" style={{ borderColor: `${tone}40`, background: `${tone}14` }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            {r.eligible ? (
              <ShieldCheck className="text-[#34d399]" size={20} />
            ) : (
              <XCircle className="text-[#f87171]" size={20} />
            )}
            <span className="text-lg font-bold font-display" style={{ color: tone }}>
              {r.eligible ? "Immunity appears available" : "Immunity not available"}
            </span>
          </div>
          <p className="text-[11px] text-[#aab2c5]">
            {r.eligible
              ? `File Form 68 by ${fmt(r.formDeadline)}.`
              : `${r.blockers.length} condition${r.blockers.length === 1 ? "" : "s"} not met.`}
          </p>
        </div>

        {/* Blockers */}
        {r.blockers.length > 0 && (
          <ul className="flex flex-col gap-2">
            {r.blockers.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-xs text-[#aab2c5] border border-[#f87171]/15 bg-[#f87171]/5 p-3 rounded-xl"
              >
                <XCircle size={13} className="text-[#f87171] mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Numbers */}
        <div className="grid grid-cols-2 gap-4">
          <Cell label="Form 68 last date" value={fmt(r.formDeadline)} tone="#4f7cff" />
          <Cell
            label="Days left to file"
            value={r.daysToFile === null ? "—" : String(r.daysToFile)}
            tone={r.daysToFile !== null && r.daysToFile < 0 ? "#f87171" : "#ffffff"}
          />
          <Cell
            label={`Penalty exposure (${r.penaltyRatePct}%)`}
            value={formatInr(r.penaltyExposure)}
            tone="#f87171"
          />
          <Cell label="Cost of taking immunity" value={formatInr(r.immunityCost)} tone="#34d399" />
        </div>

        {/* Trade-off */}
        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5">
          <Scale size={15} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#aab2c5] leading-relaxed">{r.recommendation}</div>
        </div>

        {/* The bargain, spelled out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#34d399]/20 bg-[#34d399]/5 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#34d399] block mb-2">
              You give up
            </span>
            <ul className="text-[11px] text-[#aab2c5] leading-relaxed list-disc list-inside space-y-1">
              <li>The right to appeal under Section 246A</li>
              <li>The right to revision under Section 264</li>
              <li>The tax and interest, paid in full</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#4f7cff]/20 bg-[#4f7cff]/5 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f7cff] block mb-2">
              You get
            </span>
            <ul className="text-[11px] text-[#aab2c5] leading-relaxed list-disc list-inside space-y-1">
              <li>Immunity from penalty under Section 270A</li>
              <li>Immunity from prosecution under Sections 276C and 276CC</li>
              <li>Finality — the matter closes</li>
            </ul>
          </div>
        </div>

        {/* Notes */}
        <ul className="flex flex-col gap-2">
          {r.notes.map((n) => (
            <li key={n} className="flex items-start gap-2.5 text-xs text-[#aab2c5]">
              <Info size={13} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
              <span>{n}</span>
            </li>
          ))}
        </ul>

        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4 leading-relaxed">
          A decision aid, not legal advice. Whether an addition is properly characterised as
          under-reporting or misreporting is frequently the real dispute, and it changes both the
          penalty rate and whether immunity is open at all. Take advice before giving up appeal rights.
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Money({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-semibold text-[#aab2c5]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white"
      />
    </div>
  );
}

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border border-white/5 bg-[#080a12]/50 p-4 rounded-xl">
      <label htmlFor={id} className="cursor-pointer">
        <span className="text-xs font-semibold text-white">{label}</span>
        <p className="text-[9px] text-[#737c92] mt-0.5">{hint}</p>
      </label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#4f7cff] cursor-pointer flex-shrink-0"
      />
    </div>
  );
}

function Cell({ label, value, tone = "#ffffff" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
      <span className="text-[10px] text-[#737c92] block">{label}</span>
      <span className="text-sm font-bold mt-1 block" style={{ color: tone }}>
        {value}
      </span>
    </div>
  );
}
