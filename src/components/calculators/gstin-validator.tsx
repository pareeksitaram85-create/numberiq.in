"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Info, RefreshCw, Copy, Check } from "lucide-react";
import { validateGstin } from "@/lib/tools-math";

const SAMPLES = ["27AAPFU0939F1ZV", "29AAGCB7383J1Z4", "24AAACC1206D1ZM"];

export function GstinValidator() {
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const result = validateGstin(value);
  const touched = value.trim() !== "";

  const copyPan = async () => {
    if (!result.pan) return;
    await navigator.clipboard.writeText(result.pan);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input */}
      <div className="lg:col-span-5 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">GSTIN Input</h2>
          <p className="text-[10px] text-[#737c92]">
            Validated offline in your browser — nothing is sent to a server.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gstin" className="text-[10px] font-semibold text-[#aab2c5]">
            15-character GSTIN
          </label>
          <input
            id="gstin"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            placeholder="27AAPFU0939F1ZV"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            className={`bg-white/5 border rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-white focus:outline-none transition-colors ${
              !touched
                ? "border-white/10 focus:border-[#4f7cff]"
                : result.valid
                  ? "border-[#34d399]/50 focus:border-[#34d399]"
                  : "border-[#f87171]/50 focus:border-[#f87171]"
            }`}
          />
          <span className="text-[10px] text-[#737c92] mt-1">
            {result.input.length}/15 characters
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#aab2c5]">Try a sample</span>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => setValue(s)}
                className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[#aab2c5] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setValue("")}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          Clear
        </button>

        <div className="text-[10px] text-[#737c92] border-t border-white/5 pt-4 leading-relaxed">
          A structural check only. It confirms the number is well-formed and the checksum is
          correct — it cannot confirm the registration is active. Verify status on the GST portal.
        </div>
      </div>

      {/* Output */}
      <div className="lg:col-span-7 border border-white/5 bg-white/5 p-6 rounded-2xl flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Structural Analysis</h2>
          <p className="text-[10px] text-[#737c92]">State, PAN, holder type and check digit</p>
        </div>

        {!touched ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border border-dashed border-white/10 rounded-xl">
            <Info className="text-[#737c92] mb-3" size={24} />
            <p className="text-xs text-[#737c92]">Enter a GSTIN to decode it.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Verdict */}
            <div
              className={`p-6 rounded-xl border text-center ${
                result.valid
                  ? "border-[#34d399]/25 bg-[#34d399]/8"
                  : "border-[#f87171]/25 bg-[#f87171]/8"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {result.valid ? (
                  <CheckCircle2 className="text-[#34d399]" size={20} />
                ) : (
                  <XCircle className="text-[#f87171]" size={20} />
                )}
                <span
                  className={`text-lg font-bold font-display ${
                    result.valid ? "text-[#34d399]" : "text-[#f87171]"
                  }`}
                >
                  {result.valid ? "Valid GSTIN" : "Invalid GSTIN"}
                </span>
              </div>
              <p className="text-[10px] text-[#aab2c5]">
                {result.valid
                  ? "Format and checksum are both correct."
                  : `${result.errors.length} problem${result.errors.length === 1 ? "" : "s"} found.`}
              </p>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <ul className="flex flex-col gap-2">
                {result.errors.map((err) => (
                  <li
                    key={err}
                    className="flex items-start gap-2.5 text-xs text-[#aab2c5] border border-[#f87171]/15 bg-[#f87171]/5 p-3 rounded-xl"
                  >
                    <XCircle size={13} className="text-[#f87171] mt-0.5 flex-shrink-0" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Character map */}
            {result.input.length === 15 && (
              <div>
                <span className="text-[10px] font-semibold text-[#aab2c5] block mb-2">
                  Character breakdown
                </span>
                <div className="flex flex-wrap gap-1">
                  {result.input.split("").map((ch, i) => {
                    const tone =
                      i < 2 ? "#4f7cff" : i < 12 ? "#34d399" : i === 12 ? "#f4b740" : i === 13 ? "#a855f7" : "#38e1d6";
                    return (
                      <span
                        key={i}
                        title={
                          i < 2 ? "State code" : i < 12 ? "PAN" : i === 12 ? "Registration count" : i === 13 ? "Default 'Z'" : "Check digit"
                        }
                        className="w-8 h-9 rounded-lg border flex items-center justify-center text-xs font-mono font-bold"
                        style={{ color: tone, background: `${tone}14`, borderColor: `${tone}33` }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[9px] text-[#737c92]">
                  <Legend tone="#4f7cff" label="1–2 State" />
                  <Legend tone="#34d399" label="3–12 PAN" />
                  <Legend tone="#f4b740" label="13 Registration" />
                  <Legend tone="#a855f7" label="14 Default Z" />
                  <Legend tone="#38e1d6" label="15 Checksum" />
                </div>
              </div>
            )}

            {/* Decoded fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="State" value={result.stateName ?? "—"} sub={result.stateCode ? `Code ${result.stateCode}` : undefined} />
              <Field
                label="PAN"
                value={result.pan ?? "—"}
                mono
                action={
                  result.pan ? (
                    <button
                      onClick={copyPan}
                      aria-label="Copy PAN"
                      className="text-[#737c92] hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
                    </button>
                  ) : undefined
                }
              />
              <Field label="Holder type" value={result.entityType ?? "—"} />
              <Field
                label="Registration on this PAN"
                value={result.registrationNumber ?? "—"}
                sub={result.registrationNumber === "1" ? "First registration in the state" : undefined}
              />
              <Field
                label="Check digit"
                value={result.actualCheckDigit ?? "—"}
                mono
                sub={
                  result.expectedCheckDigit && result.expectedCheckDigit !== result.actualCheckDigit
                    ? `Should be ${result.expectedCheckDigit}`
                    : result.expectedCheckDigit
                      ? "Matches"
                      : undefined
                }
              />
              <Field
                label="Registration kind"
                value={result.isNonResident ? "Non-resident taxable person" : result.isTaxDeductor ? "TDS / TCS deductor" : "Regular taxpayer"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm" style={{ background: tone }} />
      {label}
    </span>
  );
}

function Field({
  label,
  value,
  sub,
  mono,
  action,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-white/5 p-3 rounded-xl bg-[#080a12]/50">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#737c92]">{label}</span>
        {action}
      </div>
      <span className={`text-sm font-bold text-white mt-1 block break-all ${mono ? "font-mono tracking-wide" : ""}`}>
        {value}
      </span>
      {sub && <span className="text-[9px] text-[#737c92] mt-0.5 block">{sub}</span>}
    </div>
  );
}
