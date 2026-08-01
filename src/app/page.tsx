"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { NewsTicker } from "@/components/news-ticker";
import { Footer } from "@/components/footer";

import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Compass,
} from "lucide-react";

/* ---------- 3D tilt card wrapper ----------
   Matches the Boardroom dashboard's card treatment: axis tilt on the pointer,
   a radial glow that follows the cursor, and a lifted hover state. */
function TiltCard({
  children,
  className,
  accent = "#4f7cff",
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });

  // Cursor position, used to place the radial glow inside the card.
  const gx = useMotionValue(-200);
  const gy = useMotionValue(-200);
  const glow = useTransform(
    [gx, gy],
    ([cx, cy]) => `radial-gradient(340px circle at ${cx}px ${cy}px, ${accent}1f, transparent 68%)`
  );

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    gx.set(e.clientX - r.left);
    gy.set(e.clientY - r.top);
    if (reduce) return;
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    gx.set(-200);
    gy.set(-200);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={reduce ? undefined : { y: -6, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", perspective: 1000 }}
      className={`group relative ${className ?? ""}`}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"
        style={{ background: glow }}
      />
      {children}
    </motion.div>
  );
}

/* ---------- App/Page Home ---------- */
export default function Home() {

  const practicePillars = [
    {
      name: "GST",
      tag: "Goods & Services Tax",
      desc: "GSTR-1/3B filing, ITC reconciliation with GSTR-2B, Section 50 net-cash interest, GST audits, refunds, and notices.",
      tone: "#4f7cff",
      href: "/tools",
      icon: "GST",
      chips: ["GSTR", "ITC", "Refunds"],
    },
    {
      name: "Income Tax",
      tag: "ITA 2025",
      desc: "Corporate and personal tax planning, advance tax, capital gains, assessment support, and regime optimisation.",
      tone: "#34d399",
      href: "/tools",
      icon: "IT",
      chips: ["Returns", "Capital Gains", "Assessments"],
    },
    {
      name: "International Tax",
      tag: "DTAA & FEMA",
      desc: "Cross-border structuring, DTAA treaty positions, FEMA/RBI compliance, POEM analysis, BEPS, and expatriate tax.",
      tone: "#38e1d6",
      href: "/practice/international-tax",
      icon: "IX",
      chips: ["DTAA", "FEMA", "BEPS"],
    },
    {
      name: "Transfer Pricing",
      tag: "OECD / Rule 10B",
      desc: "Arm's-length benchmarking, Form 3CEB, TP study documentation, APA support, Master File, CbCR, and MAP advisory.",
      tone: "#f4b740",
      href: "/practice/transfer-pricing",
      icon: "TP",
      chips: ["3CEB", "APA", "CbCR"],
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#050505] text-white">
      {/* Background radial cosmic glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-gradient-to-br from-[#3b82f6]/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-[#10b981]/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#a855f7]/5 to-transparent blur-[140px] pointer-events-none" />

      {/* Ambient background particles lines grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      {/* Weekly Tax Radar flash strip (curated every Saturday) */}
      <div className="relative z-10 mt-16 sm:mt-20">
        <NewsTicker />
      </div>

      <main className="flex-1 pt-8 sm:pt-8 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        
        {/* ==================== HERO SECTION ==================== */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[85vh] py-10">
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4f7cff]/25 bg-[#4f7cff]/8 text-[10px] uppercase font-bold tracking-widest text-[#a0b8ff] mb-6 shadow-[0_0_30px_rgba(79,124,255,0.12)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff] animate-pulse" />
              NumberIQ · Live Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-7xl font-black tracking-tight mb-6 leading-[1.05] bg-gradient-to-b from-white via-[#eef1f8] to-gray-500 bg-clip-text text-transparent"
            >
              Built by CAs.
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#f5b74a] bg-clip-text text-transparent">
                Powered by AI.
              </span>
              <br />
              Trusted by Businesses.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#c3cad9] max-w-2xl leading-relaxed mb-10"
            >
              Free calculators, compliance tools and practical guides for GST, Income Tax,
              Transfer Pricing and International Tax — built for Indian professionals and businesses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link
                href="/tools"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-xs font-bold uppercase tracking-wider text-white hover:opacity-95 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer"
              >
                Explore Free Tools
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 h-[440px] lg:h-[520px] w-full relative flex items-center justify-center"
          >
            {/* Outer glow rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[420px] h-[420px] rounded-full border border-[#00f5ff]/10 animate-[spin_18s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[380px] h-[380px] rounded-full border border-[#cc88ff]/15 animate-[spin_12s_linear_infinite_reverse]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[340px] h-[340px] rounded-full border border-[#00ffb3]/10 animate-[spin_22s_linear_infinite]" />
            </div>

            {/* Multi-color ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[360px] h-[360px] rounded-full bg-gradient-to-br from-[#00f5ff]/12 via-[#cc88ff]/8 to-[#00ffb3]/10 blur-3xl" />
            </div>

            {/* Universe iframe — circular clip */}
            <div
              className="relative rounded-full overflow-hidden shadow-[0_0_80px_rgba(0,245,255,0.18),0_0_40px_rgba(204,136,255,0.15),inset_0_0_0_1px_rgba(0,245,255,0.2)]"
              style={{ width: 330, height: 330 }}
            >
              <iframe
                src="/tools/universe.html?embed=true"
                title="NumberIQ Tax Intelligence Universe"
                className="border-0"
                style={{
                  width: 660,
                  height: 660,
                  transform: "scale(0.5)",
                  transformOrigin: "0 0",
                  pointerEvents: "none",
                  display: "block",
                }}
                loading="lazy"
                scrolling="no"
              />
            </div>

            {/* Explore Universe button */}
            <a
              href="/universe"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00f5ff] border border-[#00f5ff]/25 bg-[#00f5ff]/8 hover:bg-[#00f5ff]/15 hover:border-[#00f5ff]/50 transition-all shadow-[0_0_20px_rgba(0,245,255,0.1)] backdrop-blur-sm"
              style={{ whiteSpace: "nowrap" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" />
              Explore Universe
            </a>
          </motion.div>
        </section>

        {/* ==================== TRUST BAND ==================== */}
        <section className="relative py-10 border-t border-white/5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: "26", suffix: "+", label: "Free calculators", tone: "#4f7cff" },
              { value: "106", suffix: "", label: "CA-reviewed guides", tone: "#34d399" },
              { value: "58", suffix: "", label: "Statutory definitions", tone: "#f4b740" },
              { value: "0", suffix: "", label: "Figures leaving your browser", tone: "#38e1d6" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group nq-glass nq-glass-hover backdrop-blur-xl relative overflow-hidden rounded-2xl p-6 border transition-all duration-300"
                style={{ borderColor: `${s.tone}26` }}
              >
                <span aria-hidden className="nq-sheen rounded-2xl" />
                <div
                  aria-hidden
                  className="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity duration-500"
                  style={{ background: `${s.tone}22` }}
                />
                <div className="relative z-10">
                  <span
                    className="font-display text-3xl sm:text-4xl font-black block tracking-tight"
                    style={{ color: s.tone }}
                  >
                    {s.value}
                    <span className="text-xl align-top">{s.suffix}</span>
                  </span>
                  <span className="text-[11px] text-[#aab2c5] mt-2 block leading-snug">
                    {s.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ==================== PLATFORM PILLARS (moved: below Hero, above Dashboard) ==================== */}
        <section className="py-16 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#4f7cff]/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(79,124,255,0.04)_0%,transparent_70%)] pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20">
              Platform Pillars
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
              Everything You Need, In One Place
            </h2>
            <p className="text-sm text-[#aab2c5] mt-4">
              Four integrated modules — from live calculators to curated market intelligence.
            </p>
          </div>

          {/* Primary row — 3 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

            {/* LIVE TOOLS */}
            <TiltCard accent="#4f7cff">
              <Link href="/tools" className="block h-full group">
                <div className="h-full min-h-[220px] relative nq-glass nq-glass-hover backdrop-blur-xl rounded-3xl overflow-hidden border border-[#4f7cff]/25 p-7 flex flex-col justify-between transition-all duration-300 group-hover:border-[#4f7cff]/40 group-hover:shadow-[0_0_40px_rgba(79,124,255,0.1)]">
                  <span aria-hidden className="nq-sheen rounded-3xl" />
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#4f7cff]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#4f7cff]/15 border border-[#4f7cff]/25 flex items-center justify-center mb-4 text-base group-hover:bg-[#4f7cff]/25 transition-colors">⚡</div>
                    <span className="text-[8px] font-bold font-mono uppercase tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2 py-0.5 rounded border border-[#4f7cff]/20 mb-2 inline-block">Live · Free</span>
                    <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-[#4f7cff] transition-colors">Finance Tools</h3>
                    <p className="text-[13px] text-[#aab2c5] leading-relaxed">50+ calculators — GST interest, TDS, capital gains, MSME lookup.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4f7cff]/60 group-hover:text-[#4f7cff] transition-colors mt-4">
                    Open Tools <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </TiltCard>

            {/* INSIGHTS */}
            <TiltCard accent="#34d399">
              <Link href="/insights" className="block h-full group">
                <div className="h-full min-h-[220px] relative nq-glass nq-glass-hover backdrop-blur-xl rounded-3xl overflow-hidden border border-[#34d399]/25 p-7 flex flex-col justify-between transition-all duration-300 group-hover:border-[#34d399]/40 group-hover:shadow-[0_0_40px_rgba(52,211,153,0.08)]">
                  <span aria-hidden className="nq-sheen rounded-3xl" />
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#34d399]/8 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#34d399]/15 border border-[#34d399]/25 flex items-center justify-center mb-4 text-base group-hover:bg-[#34d399]/25 transition-colors">📰</div>
                    <span className="text-[8px] font-bold font-mono uppercase tracking-widest text-[#34d399] bg-[#34d399]/10 px-2 py-0.5 rounded border border-[#34d399]/20 mb-2 inline-block">Updated Weekly</span>
                    <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-[#34d399] transition-colors">Insights</h3>
                    <p className="text-[13px] text-[#aab2c5] leading-relaxed">CA analysis on GST circulars, ITA 2025, and compliance timelines.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#34d399]/60 group-hover:text-[#34d399] transition-colors mt-4">
                    Read Insights <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </TiltCard>

            {/* GLOSSARY */}
            <TiltCard accent="#f4b740">
              <Link href="/glossary" className="block h-full group">
                <div className="h-full min-h-[220px] relative nq-glass nq-glass-hover backdrop-blur-xl rounded-3xl overflow-hidden border border-[#f4b740]/25 p-7 flex flex-col justify-between transition-all duration-300 group-hover:border-[#f4b740]/40 group-hover:shadow-[0_0_40px_rgba(244,183,64,0.08)]">
                  <span aria-hidden className="nq-sheen rounded-3xl" />
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#f4b740]/8 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#f4b740]/15 border border-[#f4b740]/25 flex items-center justify-center mb-4 text-base group-hover:bg-[#f4b740]/25 transition-colors">📖</div>
                    <span className="text-[8px] font-bold font-mono uppercase tracking-widest text-[#f4b740] bg-[#f4b740]/10 px-2 py-0.5 rounded border border-[#f4b740]/20 mb-2 inline-block">CA · Glossary</span>
                    <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-[#f4b740] transition-colors">Glossary</h3>
                    <p className="text-[13px] text-[#aab2c5] leading-relaxed">200+ statutory terms — GST to FEMA, explained in plain English.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#f4b740]/60 group-hover:text-[#f4b740] transition-colors mt-4">
                    Browse Terms <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </TiltCard>
          </div>

        </section>

        {/* ==================== SERVICES: GST · INCOME TAX · TRANSFER PRICING · INTERNATIONAL TAX ==================== */}
        <section id="services" className="py-24 border-t border-white/5 relative overflow-hidden">
          {/* ambient glow */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-[#4f7cff]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[50%] bg-[#34d399]/4 blur-[120px] rounded-full pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20">
              Practice Areas
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
              Precision Across Every<br />
              <span className="bg-gradient-to-r from-[#4f7cff] via-[#34d399] to-[#f4b740] bg-clip-text text-transparent">Tax Dimension</span>
            </h2>
            <p className="text-sm sm:text-base text-[#aab2c5] mt-5 max-w-xl mx-auto leading-relaxed">
              Deeply specialised advice across India&apos;s four most complex tax domains — backed by statutory references and real-world CA experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {practicePillars.map((pillar) => (
              <TiltCard key={pillar.name} className="h-full" accent={pillar.tone}>
                <Link href={pillar.href} className="block h-full group">
                  <div
                    className="nq-glass nq-glass-hover backdrop-blur-xl h-full min-h-[300px] relative rounded-3xl overflow-hidden border p-7 flex flex-col justify-between transition-all duration-500"
                    style={{ borderColor: `${pillar.tone}40` }}
                  >
                    <span aria-hidden className="nq-sheen rounded-3xl" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `${pillar.tone}18` }} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <div
                          className="w-12 h-12 rounded-2xl border flex items-center justify-center text-xs font-black font-mono transition-colors"
                          style={{ color: pillar.tone, background: `${pillar.tone}18`, borderColor: `${pillar.tone}4d` }}
                        >
                          {pillar.icon}
                        </div>
                        <span
                          className="text-[8px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border text-right"
                          style={{ color: pillar.tone, background: `${pillar.tone}14`, borderColor: `${pillar.tone}33` }}
                        >
                          {pillar.tag}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-black text-white mb-3 transition-colors">
                        {pillar.name}
                      </h3>
                      <p className="text-sm text-[#c3cad9] leading-relaxed">
                        {pillar.desc}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-5">
                        {pillar.chips.map((chip) => (
                          <span
                            key={chip}
                            className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border"
                            style={{ color: `${pillar.tone}cc`, background: `${pillar.tone}10`, borderColor: `${pillar.tone}30` }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
