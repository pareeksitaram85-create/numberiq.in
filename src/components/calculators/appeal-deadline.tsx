"use client";

import { useState } from "react";
import { Info, RefreshCw, CalendarClock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { calculateAppealDeadline, APPEAL_FORUMS, type AppealForum } from "@/lib/appeal-math";
import { formatInr } from "@/lib/tools-math";

export function AppealDeadlineCalculator() {
  const today = new Date().toISOString().slice(0, 10);
  const [forum, setForum] = useState<AppealForum>("cit-appeals");
  const [triggerDate, setTriggerDate] = useState(today);
  const [income, setIncome] = useState<number>(900000);

  const r = calculateAppealDeadline(forum, triggerDate, income, today);
  const rule = APPEAL_FORUMS[forum];
  const needsIncome = forum === "cit-appeals" || forum === "itat";

  const tone =
    r.status === "in-time" ? "#34d399" : r.status === "condonation-needed" ? "#f4b740" : r.status === "time-barred" ? "#f87171" : "#737c92";

  const StatusIcon =
    r.status === "in-time" ? CheckCircle2 : r.status === "condonation-needed" ? AlertTriangle : r.status === "time-barred" ? XCircle : CalendarClock;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Appeal Details</h2>
          <p className="text-[10px] text-[#737c92]">Computed in your browser — nothing is transmitted</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="forum" className="text-[10px] font-semibold text-[#aab2c5]">
            Appellate forum
          </label>
          <select
            id="forum"
            value={forum}
            onChange={(e) => setForum(e.target.value as AppealForum)}
            className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white cursor-pointer"
          >
            {(Object.keys(APPEAL_FORUMS) as AppealForum[]).map((k) => (
              <option key={k} value={k} className="bg-[#05060a]">
                {APPEAL_FORUMS[k].label}
              </option>
            ))}
          </select>
          <span className="text-[9px] text-[#737c92]">
            {rule.form} · {rule.statute}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="trigger" className="text-[10px] font-semibold text-[#aab2c5]">
            {rule.dateLabel}
          </label>
          <input
            id="trigger"
            type="date"
            value={triggerDate}
            onChange={(e) => setTriggerDate(e.target.value)}
            className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white [color-scheme:dark]"
          />
          <span className="text-[9px] text-[#737c92]">
            Take this from the acknowledgement of service, not the date printed on the order.
          </span>
        </div>

        {needsIncome && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="income" className="text-[10px] font-semibold text-[#aab2c5]">
              Assessed total income
            </label>
            <input
              id="income"
              type="number"
              min={0}
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="bg-white/5 border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white"
            />
            <span className="text-[9px] text-[#737c92]">Determines the filing fee slab</span>
          </div>
        )}

        <button
          onClick={() => {
            setForum("cit-appeals");
            setTriggerDate(today);
            setIncome(900000);
          }}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          Reset
        </button>

        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4 leading-relaxed">
          Limitation is jurisdictional — an appeal filed late is not merely irregular, it cannot be
          admitted without the delay first being condoned. Confirm the date of service from the
          record before you rely on it.
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Limitation & Fee</h2>
          <p className="text-[10px] text-[#737c92]">
            {r.forum} · {r.form}
          </p>
        </div>

        {/* Verdict */}
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: `${tone}40`, background: `${tone}14` }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <StatusIcon style={{ color: tone }} size={20} />
            <span className="text-lg font-bold font-display" style={{ color: tone }}>
              {r.status === "in-time"
                ? "In time"
                : r.status === "condonation-needed"
                  ? "Condonation required"
                  : r.status === "time-barred"
                    ? "Time-barred"
                    : "Enter a date"}
            </span>
          </div>
          <p className="text-[11px] text-[#aab2c5] leading-relaxed">{r.headline}</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Cell label="Last date to file" value={fmt(r.dueDate)} tone="#4f7cff" />
          <Cell
            label={r.condonableUnlimited ? "Condonation" : "Absolute outer limit"}
            value={r.condonableUnlimited ? "No outer limit" : fmt(r.condonationLastDate)}
            tone={r.condonableUnlimited ? "#34d399" : "#f4b740"}
          />
          <Cell
            label="Filing fee"
            value={r.fee === null ? "Not a rupee fee" : r.fee === 0 ? "Nil" : formatInr(r.fee)}
          />
          <Cell
            label="Days remaining"
            value={r.daysRemaining === null ? "—" : String(r.daysRemaining)}
            tone={r.daysRemaining !== null && r.daysRemaining < 0 ? "#f87171" : "#ffffff"}
          />
        </div>

        {/* Fee basis */}
        <div className="border border-white/5 bg-[#080a12]/50 p-4 rounded-xl flex items-start gap-2.5">
          <Info size={14} className="text-[#4f7cff] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#aab2c5] leading-relaxed">{r.feeBasis}</div>
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
          Indicative only. Limitation can be affected by facts this tool does not know — the date
          of actual service, a rectification or revision that resets the clock, or an order
          communicated only on the portal. Verify against the record before filing.
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
