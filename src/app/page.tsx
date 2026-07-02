"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import {
  Calculator,
  FileText,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Layers,
  BookOpen,
  Award,
  IndianRupee,
  TrendingUp,
  Sparkles,
} from "lucide-react";

/* ---------- Count-up stat ---------- */
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center px-6">
      <div className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-b from-white to-[#8f9ab5] bg-clip-text text-transparent">
        {display}
        {suffix}
      </div>
      <div className="text-[11px] uppercase tracking-widest text-[#737c92] mt-1 font-semibold">{label}</div>
    </div>
  );
}

/* ---------- 3D tilt card wrapper ---------- */
function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 18 });
  const sry = useSpring(ry, { stiffness: 180, damping: 18 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", perspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Floating hero 3D scene ---------- */
function HeroScene() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });

  const rotY = useTransform(smx, [-0.5, 0.5], [-8, 8]);
  const rotX = useTransform(smy, [-0.5, 0.5], [6, -6]);
  const chip1x = useTransform(smx, [-0.5, 0.5], [-18, 18]);
  const chip2x = useTransform(smx, [-0.5, 0.5], [22, -22]);
  const chip3y = useTransform(smy, [-0.5, 0.5], [-14, 14]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const float = (delay: number) =>
    reduce
      ? {}
      : {
          y: [0, -10, 0],
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay },
        };

  return (
    <div
      onMouseMove={onMove}
      className="relative w-full h-[420px] sm:h-[480px] select-none"
      style={{ perspective: 1200 }}
      aria-hidden="true"
    >
      {/* Glow base */}
      <div className="absolute inset-x-8 bottom-4 h-24 bg-[#4f7cff]/20 blur-[70px] rounded-full" />

      {/* Main calculator card */}
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[340px]"
      >
        <motion.div
          animate={float(0)}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#11141d] to-[#0a0d15] shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(79,124,255,0.12)] p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4f7cff]/15 border border-[#4f7cff]/25 flex items-center justify-center text-[#4f7cff]">
                <Calculator size={15} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-none">GST Interest — S.50</div>
                <div className="text-[9px] text-[#737c92] mt-1">Net cash liability basis</div>
              </div>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          {[
            ["Tax liability (3B)", "₹ 4,80,000"],
            ["ITC utilised", "₹ 3,10,000"],
            ["Delay", "47 days"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-[10px] text-[#737c92]">{k}</span>
              <span className="text-[11px] font-semibold text-[#dfe4f0] font-mono">{v}</span>
            </div>
          ))}

          <div className="mt-4 rounded-xl bg-[#4f7cff]/10 border border-[#4f7cff]/25 px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#9db4ff] uppercase tracking-wider">Interest @18%</span>
            <span className="text-base font-bold text-white font-mono">₹ 3,940</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating chip — rupee coin */}
      <motion.div style={{ x: chip1x, transformStyle: "preserve-3d" }} className="absolute left-[4%] top-[12%]">
        <motion.div
          animate={float(0.6)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f5b74a] to-[#b9812e] shadow-[0_16px_40px_rgba(245,183,74,0.25)] border border-[#ffd98a]/40 flex items-center justify-center"
        >
          <IndianRupee size={22} className="text-[#3c2a05]" strokeWidth={2.6} />
        </motion.div>
      </motion.div>

      {/* Floating chip — TDS */}
      <motion.div style={{ x: chip2x, transformStyle: "preserve-3d" }} className="absolute right-[2%] top-[22%]">
        <motion.div
          animate={float(1.2)}
          className="rounded-2xl border border-white/10 bg-[#11141d]/90 backdrop-blur px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="text-[9px] uppercase tracking-widest text-[#737c92] font-bold mb-0.5">TDS Contractors · S.393(1)</div>
          <div className="text-sm font-bold text-white font-mono">1% / 2%</div>
        </motion.div>
      </motion.div>

      {/* Floating chip — filed */}
      <motion.div style={{ y: chip3y, transformStyle: "preserve-3d" }} className="absolute left-[8%] bottom-[14%]">
        <motion.div
          animate={float(1.8)}
          className="rounded-2xl border border-[#34d399]/25 bg-[#0c1512]/90 backdrop-blur px-4 py-2.5 flex items-center gap-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        >
          <CheckCircle2 size={14} className="text-[#34d399]" />
          <span className="text-[11px] font-semibold text-[#c9f5e4]">GSTR-3B reconciled</span>
        </motion.div>
      </motion.div>

      {/* Floating chip — trend */}
      <motion.div style={{ x: chip2x, transformStyle: "preserve-3d" }} className="absolute right-[8%] bottom-[8%]">
        <motion.div
          animate={float(2.4)}
          className="rounded-2xl border border-white/10 bg-[#11141d]/90 backdrop-blur px-4 py-2.5 flex items-center gap-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        >
          <TrendingUp size={14} className="text-[#9a6bff]" />
          <span className="text-[11px] font-semibold text-[#e2d9ff]">Income-tax Act 2025 aligned</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Home() {
  const [activeTab, setActiveTab] = useState("gst");

  const suites = {
    gst: {
      title: "Goods & Services Tax Suite",
      description:
        "Automate input reconciliation, interest calculations, and compliance checks with Section 47 & 50 intelligence.",
      color: "from-[#4f7cff] to-[#22d3ee]",
      tools: [
        { name: "GST Interest Calculator (S.50)", desc: "Verify interest on net cash liability." },
        { name: "GST Late Fee Calculator (S.47)", desc: "Instant calculations for GSTR-1 & 3B." },
        { name: "ITC Utilization Engine (S.49)", desc: "Optimize credit distribution mapping rules." },
        { name: "Reconciliation Studio (IMS)", desc: "Match purchase registers with auto GSTR-2B." },
      ],
    },
    tax: {
      title: "Direct & Corporate Taxation",
      description:
        "Compute advance tax liability, navigate presumptive taxation, and manage capital gains with section-wise accuracy.",
      color: "from-[#9a6bff] to-[#ff5c7a]",
      tools: [
        { name: "Income Tax Calculator (FY26-27)", desc: "Regime comparison under the Income-tax Act 2025." },
        { name: "Advance Tax Estimator", desc: "Installments with interest on shortfall and deferment." },
        { name: "Capital Gains Studio", desc: "LTCG and STCG computations with indexation." },
        { name: "TDS Rate Chart (S.393)", desc: "FY 2026-27 rates mapped to new ITA 2025 sections." },
      ],
    },
    mis: {
      title: "Corporate Finance & MIS Suite",
      description:
        "Track working capital, monitor MSME payment timelines, and analyse depreciation blocks for audit-ready MIS.",
      color: "from-[#f5b74a] to-[#b9812e]",
      tools: [
        { name: "MSME Payment Tracker", desc: "Monitor payment timelines and avoid disallowances." },
        { name: "Depreciation Block Analyzer", desc: "Block-of-assets depreciation, ITA 2025 aligned." },
        { name: "LRS TCS Calculator", desc: "Foreign remittance TCS thresholds and rates." },
        { name: "Compliance Due-Date Calendar", desc: "GST, TDS, ROC timelines in one view." },
      ],
    },
  };

  const pillars = [
    {
      icon: <Award size={20} />,
      color: "text-[#f5b74a]",
      title: "Built by a CA, for CAs",
      desc: "Designed by a practising Chartered Accountant with DIIT (ICAI) — not a generic dev shop. Every tool mirrors real working-paper logic.",
    },
    {
      icon: <Shield size={20} />,
      color: "text-[#34d399]",
      title: "Section-wise Accuracy",
      desc: "Built on the CGST Act 2017 and the new Income-tax Act 2025, with current FY 2026-27 rates and section references on every output.",
    },
    {
      icon: <Zap size={20} />,
      color: "text-[#4f7cff]",
      title: "Zero Data Lag",
      desc: "Calculations execute client-side in microseconds. Your figures never leave the browser on calculator pages.",
    },
    {
      icon: <Layers size={20} />,
      color: "text-[#9a6bff]",
      title: "Practice-Ready Output",
      desc: "Results formatted for working papers, client emails, and department replies — copy straight into your files.",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#05060a]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f7cff]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#9a6bff]/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-[#22d3ee]/5 blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* ---------- HERO ---------- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f5b74a]/25 bg-[#f5b74a]/10 text-xs font-bold text-[#ffd98a] mb-6 shadow-[0_0_24px_rgba(245,183,74,0.12)]"
            >
              <Award size={13} />
              Built by CA, for CAs
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.08] bg-gradient-to-b from-white via-[#eef1f8] to-[#737c92] bg-clip-text text-transparent"
            >
              Financial Intelligence.
              <br />
              <span className="bg-gradient-to-r from-[#4f7cff] via-[#8f9dff] to-[#9a6bff] bg-clip-text text-transparent">
                Calculated in Real-Time.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-[#aab2c5] max-w-xl leading-relaxed mb-8"
            >
              A unified tax and finance workspace for Chartered Accountants, corporate finance teams, and
              practitioners across India — GST, direct tax, TDS, and MIS tools with section-wise precision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link
                href="/tools"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-7 py-3 rounded-full bg-[#4f7cff] hover:bg-[#3d66dd] text-sm font-semibold transition-all shadow-[0_0_28px_rgba(79,124,255,0.35)] cursor-pointer"
              >
                Access 16 Calculators
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/insights"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-7 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-sm font-medium text-[#aab2c5] hover:text-white transition-all cursor-pointer"
              >
                <BookOpen size={15} />
                Read Tax Insights
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden md:block"
          >
            <HeroScene />
          </motion.div>
        </section>

        {/* ---------- STATS STRIP ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-24 border border-white/5 bg-white/[0.03] backdrop-blur rounded-3xl py-8 grid grid-cols-2 md:grid-cols-4 gap-y-8 divide-x-0 md:divide-x divide-white/5"
        >
          <StatCounter value={16} suffix="" label="Live Calculators" />
          <StatCounter value={100} suffix="+" label="Tax Insight Articles" />
          <StatCounter value={50} suffix="+" label="Glossary Terms" />
          <StatCounter value={3} suffix="" label="Practice Suites" />
        </motion.section>

        {/* ---------- SUITE TABS ---------- */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#4f7cff]">Modules</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2">
              Three suites. One workspace.
            </h2>
          </div>

          <div className="flex justify-center gap-1 mb-8 border border-white/5 bg-white/5 p-1 rounded-full max-w-md mx-auto">
            {Object.keys(suites).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex-1 py-2 text-xs font-semibold rounded-full capitalize transition-all cursor-pointer ${
                  activeTab === key ? "text-white" : "text-[#737c92] hover:text-[#aab2c5]"
                }`}
              >
                {activeTab === key && (
                  <motion.span
                    layoutId="active-suite-tab"
                    className="absolute inset-0 bg-[#4f7cff] rounded-full shadow-[0_0_10px_rgba(79,124,255,0.2)]"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <span className="relative z-10">{key} Suite</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch"
            >
              {/* Suite detail panel */}
              <TiltCard className="lg:col-span-1">
                <div className="h-full border border-white/5 bg-white/5 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${
                      suites[activeTab as keyof typeof suites].color
                    } opacity-20 blur-xl`}
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20 mb-4 inline-block">
                      Suite Overview
                    </span>
                    <h3 className="font-display text-2xl font-bold text-white mb-4">
                      {suites[activeTab as keyof typeof suites].title}
                    </h3>
                    <p className="text-sm text-[#aab2c5] leading-relaxed">
                      {suites[activeTab as keyof typeof suites].description}
                    </p>
                  </div>
                  <Link
                    href="/tools"
                    className="mt-8 flex items-center gap-1 text-xs font-semibold text-[#4f7cff] hover:underline"
                  >
                    Launch all {activeTab.toUpperCase()} tools
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </TiltCard>

              {/* Tool cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suites[activeTab as keyof typeof suites].tools.map((tool, idx) => (
                  <TiltCard key={idx}>
                    <div className="h-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#4f7cff]/20 p-6 rounded-2xl transition-colors group flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#4f7cff] mb-4 group-hover:bg-[#4f7cff]/10 transition-colors">
                          <Calculator size={16} />
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1.5">{tool.name}</h4>
                        <p className="text-xs text-[#737c92] leading-relaxed">{tool.desc}</p>
                      </div>
                      <Link
                        href="/tools"
                        className="mt-6 inline-flex items-center gap-1 text-[11px] font-bold text-[#aab2c5] group-hover:text-white transition-colors"
                      >
                        Launch
                        <ArrowRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                        />
                      </Link>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ---------- TRUST PILLARS ---------- */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#f5b74a]">Why NumberIQ</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2">
              Built by a CA. Trusted by practitioners.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <TiltCard>
                  <div className="h-full border border-white/5 bg-white/5 p-7 rounded-3xl flex flex-col">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${p.color} mb-5`}>
                      {p.icon}
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{p.title}</h4>
                    <p className="text-xs text-[#737c92] leading-relaxed">{p.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------- WEEKLY TAX RADAR ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mb-24 relative overflow-hidden border border-white/5 bg-white/[0.03] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="absolute top-[-60%] right-[-5%] w-[40%] h-[200%] bg-[#34d399]/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-start gap-4 relative">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center text-[#34d399]">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg font-bold text-white">Tax & Compliance Radar</h3>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 px-2 py-0.5 rounded-full">
                  Updated every Saturday
                </span>
              </div>
              <p className="text-xs text-[#737c92] leading-relaxed max-w-md">
                The week&apos;s important CBDT, CBIC and MCA updates — notifications, circulars and due-date
                changes — curated for practitioners, refreshed every Saturday.
              </p>
            </div>
          </div>
          <Link
            href="/updates"
            className="relative shrink-0 flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 hover:bg-[#34d399]/20 text-sm font-semibold text-[#7ee9c0] transition-all"
          >
            View this week&apos;s updates
            <ArrowRight size={15} />
          </Link>
        </motion.section>

        {/* ---------- CTA BAND ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden border border-[#4f7cff]/20 bg-gradient-to-br from-[#0b1226] to-[#0a0d18] rounded-3xl px-8 py-14 text-center"
        >
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[60%] h-[120%] bg-[#4f7cff]/10 blur-[90px] rounded-full pointer-events-none" />
          <Sparkles size={22} className="text-[#9db4ff] mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3 relative">
            Your working papers, minus the manual math.
          </h2>
          <p className="text-sm text-[#aab2c5] max-w-lg mx-auto mb-8 relative">
            Free, section-referenced tax tools — built by a Chartered Accountant who files the same returns you do.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
            <Link
              href="/tools"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-7 py-3 rounded-full bg-[#4f7cff] hover:bg-[#3d66dd] text-sm font-semibold transition-all shadow-[0_0_28px_rgba(79,124,255,0.35)]"
            >
              Start Calculating
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/glossary"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-7 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-sm font-medium text-[#aab2c5] hover:text-white transition-all"
            >
              <FileText size={15} />
              Browse the Glossary
            </Link>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
