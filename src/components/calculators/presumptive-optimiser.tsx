"use client";

import { useState } from "react";
import { Info, RefreshCw, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { calculatePresumptive, formatInr, type PresumptiveScheme } from "@/lib/tools-math";

export function PresumptiveOptimiser() {
  const [scheme, setScheme] = useState<PresumptiveScheme>("44AD");
  const [digital, setDigital] = useState<number>(4000000);
  const [cash, setCash] = useState<number>(200000);
  const [actual, setActual] = useState<number>(600000);

  const r = calculatePresumptive(scheme, digital, cash, actual);
  const turnover = r.turnover;

  const reset = () => {
    setScheme("44AD");
    setDigital(4000000);
    setCash(200000);
    setActual(600000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Business Parameters</h2>
          <p className="text-[10px] text-[#737c92]">Presumptive taxation under s.44AD / s.44ADA</p>
        </div>

        {/* Scheme toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-[#aab2c5]">Scheme</span>
          <div className="grid grid-cols-2 gap-2">
            {(["44AD", "44ADA"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScheme(s)}
                aria-pressed={scheme === s}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  scheme === s
                    ? "bg-[#4f7cff] border-[#4f7cff] text-white"
                    : "bg-white/5 border-white/10 text-[#aab2c5] hover:bg-white/10"
                }`}
              >
                {s}
                <span className="block text-[9px] font-medium opacity-70 mt-0.5">
                  {s === "44AD" ? "Business" : "Profession"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <MoneyInput
          id="digital"
          label="Receipts via banking / digital modes"
          hint={scheme === "44AD" ? "Presumed at 6%" : "Presumed at 50%"}
          value={digital}
          onChange={setDigital}
        />
        <MoneyInput
          id="cash"
          label="Cash receipts"
          hint={scheme === "44AD" ? "Presumed at 8%" : "Presumed at 50%"}
          value={cash}
          onChange={setCash}
        />
        <MoneyInput
          id="actual"
          label="Actual profit as per books"
          hint="Used to compare against the presumed figure"
          value={actual}
          onChange={setActual}
        />

        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-[#737c92]">Gross turnover / receipts</span>
            <span className="text-sm font-bold text-white">{formatInr(turnover)}</span>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-[10px] text-[#737c92]">Cash share</span>
            <span
              className={`text-sm font-bold ${r.cashSharePct <= 5 ? "text-[#34d399]" : "text-[#f4b740]"}`}
            >
              {r.cashSharePct.toFixed(1)}%
            </span>
          </div>
        </div>

        <button
          onClick={reset}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          Reset Parameters
        </button>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Presumptive Assessment</h2>
          <p className="text-[10px] text-[#737c92]">Eligibility, presumed income and audit exposure</p>
        </div>

        {/* Headline */}
        <div className="p-6 border border-[#4f7cff]/10 bg-[#4f7cff]/5 rounded-xl text-center">
          <span className="text-[10px] font-bold text-[#4f7cff] uppercase tracking-wider block mb-1">
            Presumed Income under {r.scheme}
          </span>
          <span className="text-3xl font-bold text-white font-display">
            {formatInr(r.presumptiveIncome)}
          </span>
          <span className="text-[10px] text-[#737c92] block mt-1">
            {r.effectiveRatePct.toFixed(2)}% of gross receipts
          </span>
        </div>

        {/* Eligibility */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-2.5 ${
            r.eligible ? "border-[#34d399]/20 bg-[#34d399]/5" : "border-[#f4b740]/20 bg-[#f4b740]/5"
          }`}
        >
          {r.eligible ? (
            <CheckCircle2 size={15} className="text-[#34d399] mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle size={15} className="text-[#f4b740] mt-0.5 flex-shrink-0" />
          )}
          <div>
            <span className={`text-xs font-bold block ${r.eligible ? "text-[#34d399]" : "text-[#f4b740]"}`}>
              {turnover === 0
                ? "Enter receipts to check eligibility"
                : r.eligible
                  ? `Eligible for ${r.scheme}`
                  : `Not eligible for ${r.scheme}`}
            </span>
            <span className="text-[10px] text-[#aab2c5] mt-0.5 block">{r.limitReason}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Metric label="Turnover ceiling" value={formatInr(r.turnoverLimit)} />
          <Metric label="Actual profit (books)" value={formatInr(r.actualIncome)} />
          <Metric
            label="Difference"
            value={formatInr(r.incomeDifference)}
            tone={r.declaredIncomeBelowPresumptive ? "#f4b740" : "#34d399"}
            sub={r.declaredIncomeBelowPresumptive ? "Books are lower" : "Books are higher or equal"}
          />
          <Metric
            label="Tax audit"
            value={r.auditRequired ? "Required" : "Not triggered"}
            tone={r.auditRequired ? "#f87171" : "#34d399"}
          />
        </div>

        {/* Verdict */}
        {turnover > 0 && (
          <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5">
            <TrendingUp size={15} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
            <div className="text-xs text-[#aab2c5] leading-relaxed">
              {!r.eligible ? (
                <>Turnover is above the ceiling, so regular books and audit provisions apply regardless of the presumed figure.</>
              ) : r.declaredIncomeBelowPresumptive ? (
                <>
                  Your books show {formatInr(r.actualIncome)} against a presumed{" "}
                  {formatInr(r.presumptiveIncome)}. Declaring the lower figure means maintaining books
                  and getting them audited; declaring the presumed figure costs tax on the extra{" "}
                  {formatInr(r.incomeDifference)} but avoids the audit.
                </>
              ) : (
                <>
                  Your books show {formatInr(r.actualIncome)} against a presumed{" "}
                  {formatInr(r.presumptiveIncome)}. Opting for the presumptive scheme lets you declare
                  the lower presumed figure and skip the audit — a difference of{" "}
                  {formatInr(r.incomeDifference)} in declared income.
                </>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {r.notes.length > 0 && (
          <ul className="flex flex-col gap-2">
            {r.notes.map((n) => (
              <li key={n} className="flex items-start gap-2.5 text-xs text-[#aab2c5]">
                <Info size={13} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4 leading-relaxed">
          Indicative only. Presumptive income is computed on receipts; your actual liability also
          depends on chapter VI-A deductions, the regime you choose, and other heads of income.
        </div>
      </div>
    </div>
  );
}

function MoneyInput({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
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
      <span className="text-[9px] text-[#737c92]">{hint}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone = "#ffffff",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
      <span className="text-[10px] text-[#737c92] block">{label}</span>
      <span className="text-sm font-bold mt-1 block" style={{ color: tone }}>
        {value}
      </span>
      {sub && <span className="text-[9px] text-[#737c92] mt-0.5 block">{sub}</span>}
    </div>
  );
}
