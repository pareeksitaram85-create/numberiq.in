"use client";

import { useState } from "react";
import { Info, RefreshCw, Scale, TrendingDown } from "lucide-react";
import {
  calculateLitigationCost,
  formatInr,
  LITIGATION_FORUMS,
  type LitigationForum,
} from "@/lib/tools-math";

export function LitigationCostCalculator() {
  const [forum, setForum] = useState<LitigationForum>("gst-appellate-authority");
  const [tax, setTax] = useState<number>(1000000);
  const [penalty, setPenalty] = useState<number>(100000);
  const [interestNow, setInterestNow] = useState<number>(180000);
  const [years, setYears] = useState<number>(2);
  const [winPct, setWinPct] = useState<number>(50);
  const [fees, setFees] = useState<number>(75000);

  const r = calculateLitigationCost(forum, tax, penalty, interestNow, years, winPct, fees);

  const reset = () => {
    setForum("gst-appellate-authority");
    setTax(1000000);
    setPenalty(100000);
    setInterestNow(180000);
    setYears(2);
    setWinPct(50);
    setFees(75000);
  };

  const max = Math.max(r.settleNowTotal, r.contestAndLoseTotal, r.expectedCost, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Demand & Appeal Assumptions</h2>
          <p className="text-[10px] text-[#737c92]">Everything stays in your browser</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="forum" className="text-[10px] font-semibold text-[#aab2c5]">
            Appellate forum
          </label>
          <select
            id="forum"
            value={forum}
            onChange={(e) => setForum(e.target.value as LitigationForum)}
            className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white cursor-pointer"
          >
            {(Object.keys(LITIGATION_FORUMS) as LitigationForum[]).map((k) => (
              <option key={k} value={k} className="bg-[#05060a]">
                {LITIGATION_FORUMS[k].label}
              </option>
            ))}
          </select>
          <span className="text-[9px] text-[#737c92]">{LITIGATION_FORUMS[forum].statute}</span>
        </div>

        <Money id="tax" label="Disputed tax demanded" value={tax} onChange={setTax} />
        <Money id="penalty" label="Penalty demanded" value={penalty} onChange={setPenalty} />
        <Money
          id="interest-now"
          label="Interest already demanded"
          value={interestNow}
          onChange={setInterestNow}
        />
        <Money id="fees" label="Professional fees to contest" value={fees} onChange={setFees} />

        {/* Years slider */}
        <Slider
          id="years"
          label="Expected years to disposal"
          value={years}
          min={0}
          max={10}
          step={0.5}
          display={`${years} year${years === 1 ? "" : "s"}`}
          onChange={setYears}
        />

        {/* Win probability slider */}
        <Slider
          id="win"
          label="Your assessment of the chance of success"
          value={winPct}
          min={0}
          max={100}
          step={5}
          display={`${winPct}%`}
          onChange={setWinPct}
        />

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
          <h2 className="text-sm font-bold text-white mb-1">Contest or Settle</h2>
          <p className="text-[10px] text-[#737c92]">{r.forum}</p>
        </div>

        {/* Recommendation */}
        <div
          className={`p-6 rounded-xl border text-center ${
            r.contestIsCheaper
              ? "border-[#34d399]/25 bg-[#34d399]/8"
              : "border-[#f4b740]/25 bg-[#f4b740]/8"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className={r.contestIsCheaper ? "text-[#34d399]" : "text-[#f4b740]"} size={18} />
            <span
              className={`text-lg font-bold font-display ${
                r.contestIsCheaper ? "text-[#34d399]" : "text-[#f4b740]"
              }`}
            >
              {r.contestIsCheaper ? "Contesting is cheaper" : "Settling is cheaper"}
            </span>
          </div>
          <p className="text-[11px] text-[#aab2c5] leading-relaxed">{r.recommendation}</p>
        </div>

        {/* Scenario bars */}
        <div className="flex flex-col gap-3">
          <Bar label="Settle today" amount={r.settleNowTotal} max={max} tone="#f4b740" />
          <Bar label="Contest and win" amount={r.contestAndWinTotal} max={max} tone="#34d399" />
          <Bar label="Contest and lose" amount={r.contestAndLoseTotal} max={max} tone="#f87171" />
          <Bar
            label={`Expected cost at ${winPct}% success`}
            amount={r.expectedCost}
            max={max}
            tone="#4f7cff"
            emphasis
          />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label={`Pre-deposit (${r.preDepositPct}%)`}
            value={formatInr(r.preDeposit)}
            sub={r.preDepositCapped ? "Statutory cap applied" : "Refundable if you win"}
          />
          <Metric
            label={`Interest if you lose (${r.interestRatePct}% p.a.)`}
            value={formatInr(r.interestIfLost)}
            tone="#f87171"
          />
          <Metric label="Cash needed to file" value={formatInr(r.preDeposit + r.professionalFees)} />
          <Metric
            label="Break-even success rate"
            value={`${Math.round(r.breakEvenWinPct)}%`}
            tone="#4f7cff"
            sub="Contest above this"
          />
        </div>

        {/* Break-even callout */}
        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5">
          <TrendingDown size={15} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#aab2c5] leading-relaxed">
            You currently rate your chances at <strong className="text-white">{winPct}%</strong>. The
            break-even point is{" "}
            <strong className="text-white">{Math.round(r.breakEvenWinPct)}%</strong> — above it,
            contesting has the lower expected cost.
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
          A decision aid, not legal advice. It models cost only — it cannot weigh the merits of your
          case, precedent, or the commercial value of certainty. Discuss with your counsel before
          deciding.
        </div>
      </div>
    </div>
  );
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

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-semibold text-[#aab2c5]">
          {label}
        </label>
        <span className="text-[11px] font-bold text-white font-mono">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#4f7cff] cursor-pointer"
      />
    </div>
  );
}

function Bar({
  label,
  amount,
  max,
  tone,
  emphasis,
}: {
  label: string;
  amount: number;
  max: number;
  tone: string;
  emphasis?: boolean;
}) {
  const pct = Math.max(1, (amount / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-[11px] ${emphasis ? "font-bold text-white" : "text-[#aab2c5]"}`}>
          {label}
        </span>
        <span className="text-xs font-bold font-mono" style={{ color: tone }}>
          {formatInr(amount)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
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
