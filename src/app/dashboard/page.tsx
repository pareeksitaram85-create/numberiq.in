"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Shield, 
  ExternalLink, 
  Activity, 
  Table, 
  Lock,
  FileCode2,
  Database,
  Cpu,
  Clock,
  Globe,
  Sparkles,
  Scale,
  Building2,
  Coins,
  Receipt,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Zap,
  MapPin,
  KeyRound,
  CheckCircle2
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import React, { useEffect, useState } from "react";

interface Submodule {
  name: string;
  href: string | null;
}

interface BoardroomModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string | null;
  icon: React.ReactElement<{ size?: number }>;
  aiTag?: string;
  accent: string;
  features: { icon: React.ReactNode; label: string }[];
  submodules: Submodule[];
}

const MODULES: BoardroomModule[] = [
  {
    id: "gst-reco-analytics",
    name: "GST Reco Analytics Studio",
    tagline: "Multi-Year 2A vs Books Audit Engine",
    description:
      "Executive boardroom module for FY 2025-26 & FY 2026-27 GST reconciliation — supplier risk exposure scorecards, unbooked credit notes liability, Section 16(4) prior-year ITC tracker, RCM and ISD control, state-wise GSTIN filters across all 19 registrations, and continuous browser Excel upload.",
    // The wrapper page, not the raw /api/module route. The wrapper carries the
    // "back to Boardroom" chrome; the API route serves the bare HTML shell.
    href: "/dashboard/gst-reco-analytics",
    icon: <ShieldCheck size={36} />,
    aiTag: "MULTI-YEAR RECO",
    accent: "#6366F1",
    features: [
      { icon: <ShieldCheck size={14} />, label: "Vendor Risk Scorecard" },
      { icon: <Clock size={14} />, label: "Section 16(4) Tracker" },
      { icon: <Table size={14} />, label: "19 GSTIN Filters" },
    ],
    submodules: [],
  },
  {
    id: "uaemis",
    name: "UAE MIS Executive Board",
    tagline: "Executive Performance Dashboard",
    description:
      "Live Board KPI summary, consolidation metrics, and monthly financial ledger reports. Connects directly to your Supabase ledger storage.",
    href: "/api/module/uaemis",
    icon: <Globe size={36} />,
    aiTag: "ANALYTICS ENGINE",
    accent: "#3B82F6",
    features: [
      { icon: <TrendingUp size={14} />, label: "Interactive Charts" },
      { icon: <Table size={14} />, label: "Financial Matrices" },
      { icon: <Activity size={14} />, label: "Real-time Sync" },
    ],
    submodules: [],
  },
  {
    id: "invoice-to-tally",
    name: "Invoice → Tally Converter",
    tagline: "Automated Voucher Entry",
    description:
      "Read supplier invoices (PDF/scan), match party names against your Tally ledger list, and download import-ready Tally XML vouchers, ledger masters and Excel registers. Up to 500 invoices per batch.",
    href: "/api/module/invoice-to-tally",
    icon: <BrainCircuit size={36} />,
    aiTag: "AI VISION & XML",
    accent: "#8B5CF6",
    features: [
      { icon: <FileCode2 size={14} />, label: "Tally XML Vouchers" },
      { icon: <Table size={14} />, label: "Ledger Auto-Match" },
      { icon: <Sparkles size={14} />, label: "AI Invoice Reader" },
    ],
    submodules: [],
  },
  {
    id: "invoice-to-tally-uae",
    name: "UAE Invoice → Tally (AED)",
    tagline: "Automated VAT Voucher Entry",
    description:
      "AI reads UAE tax invoices (PDF/scan) — TRN, taxable value and 5% VAT — matches party names against your Tally ledger list, and downloads AED voucher XML, ledger masters and Excel registers. Up to 500 invoices per batch.",
    href: "/api/module/invoice-to-tally-uae",
    icon: <Coins size={36} />,
    aiTag: "AED VAT ENGINE",
    accent: "#F59E0B",
    features: [
      { icon: <Receipt size={14} />, label: "AED Tally Vouchers" },
      { icon: <Table size={14} />, label: "TRN & VAT Checks" },
      { icon: <Zap size={14} />, label: "AI Invoice Reader" },
    ],
    submodules: [],
  },
  {
    id: "tax-compliance",
    name: "Tax Notice & Litigation Tracker",
    tagline: "Issue to Final Disposal",
    description:
      "CA-firm grade tracker for Income Tax, GST and TDS/TCS notices, assessments and appeals — master notice register, department-wise case sheets with statutory stage workflows, appeals & limitation tracking, hearing calendar, client/officer masters and a 10-sheet Excel workbook export.",
    href: "/api/module/tax-compliance",
    icon: <Scale size={36} />,
    aiTag: "LITIGATION AI",
    accent: "#EF4444",
    features: [
      { icon: <ShieldCheck size={14} />, label: "Master Notice Tracker" },
      { icon: <Activity size={14} />, label: "Appeals & Hearing Calendar" },
      { icon: <Table size={14} />, label: "10-Sheet Excel Workbook" },
    ],
    submodules: [],
  },
  {
    id: "jc-gst-abop-tracker",
    name: "JC GST & ABOP Tracker",
    tagline: "Address & Registration Monitor",
    description:
      "All Branch/Office Premises (ABOP) operational status, address bifurcation updates, and automated GSTN registration certificate reader for Join Commerce (JC).",
    href: "/api/module/jc-gst-abop-tracker",
    icon: <Building2 size={36} />,
    aiTag: "GSTN CERT OCR",
    accent: "#10B981",
    features: [
      { icon: <MapPin size={14} />, label: "ABOP Dashboard" },
      { icon: <Table size={14} />, label: "Address Bifurcation" },
      { icon: <Sparkles size={14} />, label: "GSTN Cert Reader" },
    ],
    submodules: [],
  },
];

// Stagger Entrance Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.97, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

function AnimatedNumber({ 
  value, 
  prefix = "", 
  suffix = "", 
  decimals = 0 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1] as const,
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

function BoardroomCard({ 
  m, 
  onUnlockModule 
}: { 
  m: BoardroomModule; 
  onUnlockModule: (mod: BoardroomModule) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-150, 150], [6, -6]);
  const rotateY = useTransform(x, [-150, 150], [-6, 6]);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);

    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    glowX.set(relativeX);
    glowY.set(relativeY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    glowX.set(0);
    glowY.set(0);
  }

  const backgroundGlow = useTransform(
    [glowX, glowY],
    ([cx, cy]) => `radial-gradient(400px circle at ${cx}px ${cy}px, ${m.accent}22, transparent 65%)`
  );

  const live = !!m.href;

  return (
    <motion.div
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="group relative bg-[#0B0F19]/90 backdrop-blur-2xl border border-white/10 hover:border-white/30 rounded-3xl p-8 flex flex-col gap-6 overflow-hidden transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Cursor tracking glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: backgroundGlow }}
      />

      {/* Static corner colored gradient */}
      <div
        className="absolute top-0 right-0 w-[180px] h-[180px] blur-3xl pointer-events-none opacity-35 group-hover:opacity-80 transition-opacity duration-500"
        style={{ background: `linear-gradient(to bottom right, ${m.accent}55, transparent)` }}
      />

      {/* Diagonal gloss sweep line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

      {/* BIG PROMINENT ICON & Live status */}
      <div className="flex items-center justify-between" style={{ transform: "translateZ(35px)" }}>
        <div className="flex items-center gap-4">
          <motion.div
            className="w-20 h-20 rounded-3xl border-2 flex items-center justify-center relative overflow-hidden shadow-2xl"
            style={{ 
              color: m.accent, 
              borderColor: `${m.accent}66`, 
              backgroundColor: `${m.accent}18`,
              boxShadow: `0 10px 30px ${m.accent}25`
            }}
            whileHover={{ scale: 1.1, rotate: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 15 }}
          >
            {/* Glowing background radial blur */}
            <div className="absolute inset-0 bg-current opacity-30 blur-lg pointer-events-none" />
            <div className="relative z-10">{React.cloneElement(m.icon, { size: 36 })}</div>
          </motion.div>

          <div className="flex flex-col gap-1">
            {m.aiTag && (
              <span
                className="text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-lg border uppercase shadow-sm inline-flex items-center gap-1 w-fit"
                style={{
                  color: m.accent,
                  borderColor: `${m.accent}44`,
                  backgroundColor: `${m.accent}14`,
                }}
              >
                <Sparkles size={11} />
                {m.aiTag}
              </span>
            )}
            <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <Lock size={10} className="text-emerald-400" /> Sign-in Required
            </span>
          </div>
        </div>

        {live ? (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE MODULE
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-mono px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[#737c92]">
            <Lock size={10} />
            COMING SOON
          </span>
        )}
      </div>

      {/* Module Title & Tagline */}
      <div className="flex flex-col gap-1.5" style={{ transform: "translateZ(25px)" }}>
        <h2 className="text-xl font-display font-bold text-white tracking-tight group-hover:text-[#4F7EFF] transition-colors duration-300">
          {m.name}
        </h2>
        <p className="text-xs font-mono tracking-wider uppercase font-bold" style={{ color: m.accent }}>
          {m.tagline}
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-[#94A3B8] leading-relaxed flex-1" style={{ transform: "translateZ(15px)" }}>
        {m.description}
      </p>

      {/* Features List */}
      <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4" style={{ transform: "translateZ(20px)" }}>
        {m.features.map((f) => (
          <div key={f.label} className="flex items-center gap-2.5 text-xs text-[#CBD5E1] group-hover:text-white transition-colors duration-300">
            <span className="opacity-90" style={{ color: m.accent }}>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      {/* Launch CTA */}
      <div className="mt-2" style={{ transform: "translateZ(30px)" }}>
        {live ? (
          <motion.button
            onClick={() => onUnlockModule(m)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden group/btn w-full inline-flex items-center justify-center gap-2.5 text-xs font-bold px-6 py-3.5 rounded-2xl text-white transition-all duration-300 cursor-pointer shadow-[0_6px_20px_rgba(0,0,0,0.4)] border border-white/10 hover:border-white/20"
            style={{
              background: `linear-gradient(135deg, ${m.accent}, ${m.accent}dd)`
            }}
          >
            <span className="absolute inset-0 w-[60%] h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 -translate-x-[150%] group-hover/btn:animate-shine-sweep pointer-events-none" />
            <KeyRound size={15} />
            <span>Launch Boardroom Module</span>
            <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </motion.button>
        ) : (
          <span className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold px-6 py-3.5 rounded-2xl bg-white/[0.01] border border-white/5 text-[#4a5164] cursor-not-allowed select-none">
            <Lock size={14} />
            Not Yet Linked
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Launch a boardroom module.
   *
   * THERE IS DELIBERATELY NO PIN HERE. This function used to open a modal that
   * compared `subpassInput === "pareek"` before calling window.open, across all
   * six modules. That was not a gate, for two independent reasons:
   *
   *   1. A literal compared in the browser ships to the browser. The string was
   *      readable in the page's JS bundle by any visitor.
   *   2. It guarded nothing. `mod.href` points at /dashboard/<slug> and
   *      /api/module/<slug>, both of which anyone can open directly - every
   *      module route in this repo serves its HTML shell unauthenticated.
   *
   * Access is enforced where the data actually is: each module signs in against
   * Supabase and checks the user_access table (public/js/gst-reco-gate.js), and
   * Postgres RLS gates every underlying table, so a visitor without a session
   * sees an empty module rather than figures.
   *
   * Do not reintroduce a client-side password. This is the second time it has
   * been removed - see COORDINATION-LOG.md, 2026-08-08 and 2026-08-09.
   */
  const handleLaunchModule = (mod: BoardroomModule) => {
    if (mod.href) window.open(mod.href, "_blank");
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030408] overflow-hidden">
      {/* Inject custom CSS keyframes dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine-sweep {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(150%) skewX(-15deg); }
        }
        .group\\/btn:hover .animate-shine-sweep {
          animation: shine-sweep 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(35px, -50px) scale(1.15); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-45px, 35px) scale(0.9); }
        }
        .animate-float-1 { animation: float-slow-1 22s ease-in-out infinite; }
        .animate-float-2 { animation: float-slow-2 28s ease-in-out infinite; }
      `}} />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-0" />

      {/* Radial soft ambient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030408_95%)] pointer-events-none z-0" />

      {/* Floating Colored Glassmorphic Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div className="absolute top-10 left-[8%] w-[450px] h-[450px] rounded-full bg-[#6366F1]/10 blur-[140px] animate-float-1" />
        <motion.div className="absolute bottom-10 right-[10%] w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/10 blur-[150px] animate-float-2" />
      </div>

      <Navbar />

      <main className="flex-1 pt-28 pb-16 px-6 max-w-[1280px] mx-auto w-full relative z-10 flex flex-col gap-10">
        
        {/* Animated Stagger Entrance Wrap */}
        {mounted && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-10"
          >
            {/* Executive Dashboard Header */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-8 gap-4"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#6366F1]/30 to-[#8B5CF6]/30 border-2 border-white/15 flex items-center justify-center text-[#818CF8] shadow-[0_0_40px_rgba(99,102,241,0.35)]">
                  <Shield size={28} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display bg-gradient-to-r from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
                    Boardroom Executive Dashboard
                  </h1>
                  <p className="text-xs text-[#94A3B8] mt-1 font-mono flex items-center gap-2">
                    <span>🔒 SECURE CORPORATE SUITE</span>
                    <span>•</span>
                    <span>MODULE SIGN-IN REQUIRED</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#34D399] bg-[#10B981]/15 border border-[#10B981]/30 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  AUTHENTICATED EXECUTIVE SESSION
                </span>
              </div>
            </motion.div>

            {/* Performance Metrics Section */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {/* Stat 1 */}
              <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Total Reco Volume</span>
                  <Database size={16} className="text-[#6366F1] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-display">
                  ₹29.39 Cr
                </div>
                <div className="text-[10px] text-[#34D399] mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> FY 25-26 & FY 26-27 Q1
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Audited Vouchers</span>
                  <Cpu size={16} className="text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-display">
                  <AnimatedNumber value={38163} />
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1 font-semibold">
                  Multi-period classification
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] uppercase tracking-wider font-bold">State GSTIN Coverage</span>
                  <Activity size={16} className="text-[#10B981] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-display">
                  18 States
                </div>
                <div className="text-[10px] text-[#34D399] mt-1 font-semibold">
                  Punjab, Delhi, MH, KA, GJ, WB...
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 shadow-xl">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Security Status</span>
                  <Lock size={16} className="text-[#F59E0B] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-white mt-2 font-display">
                  RLS Enforced
                </div>
                <div className="text-[10px] text-[#F59E0B] mt-1 font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} /> Per-user module permissions
                </div>
              </div>
            </motion.div>

            {/* Modules Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {MODULES.map((m) => (
                <BoardroomCard key={m.id} m={m} onUnlockModule={handleLaunchModule} />
              ))}
            </motion.div>

            {/* The Subpass PIN modal that used to sit here has been removed.
                It compared a hardcoded literal in the browser and guarded
                routes that are directly reachable. Each module signs in
                against Supabase and is gated by RLS - see handleLaunchModule. */}

          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
