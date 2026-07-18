"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Shield, 
  ExternalLink, 
  Activity, 
  Table, 
  BarChart3, 
  Megaphone, 
  Globe2, 
  Lock, 
  ChevronRight, 
  FileSpreadsheet, 
  FileCode2, 
  Clock, 
  Database, 
  Cpu 
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

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
  icon: React.ReactNode;
  accent: string;
  features: { icon: React.ReactNode; label: string }[];
  submodules: Submodule[];
}

const MODULES: BoardroomModule[] = [
  {
    id: "uaemis",
    name: "UAE MIS",
    tagline: "Executive Performance Dashboard",
    description:
      "Live Board KPI summary, consolidation metrics, and monthly financial ledger reports. Connects directly to your Supabase ledger storage.",
    href: "/api/module/uaemis",
    icon: <BarChart3 size={20} />,
    accent: "#4F7EFF",
    features: [
      { icon: <BarChart3 size={13} />, label: "Interactive Charts" },
      { icon: <Table size={13} />, label: "Financial Matrices" },
      { icon: <Activity size={13} />, label: "Real-time Sync" },
    ],
    submodules: [],
  },
  {
    id: "marketing-tracker",
    name: "Marketing Tracker",
    tagline: "Campaign & Spend Analytics",
    description:
      "Track campaign performance, marketing spend effectiveness, channel ROI and lead attribution across business units.",
    href: null,
    icon: <Megaphone size={20} />,
    accent: "#FFB547",
    features: [
      { icon: <Activity size={13} />, label: "Campaign ROI" },
      { icon: <BarChart3 size={13} />, label: "Channel Analytics" },
      { icon: <Table size={13} />, label: "Spend Ledger" },
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
    icon: <FileSpreadsheet size={20} />,
    accent: "#A66BFF",
    features: [
      { icon: <FileCode2 size={13} />, label: "Tally XML Vouchers" },
      { icon: <Table size={13} />, label: "Ledger Auto-Match" },
      { icon: <Activity size={13} />, label: "AI Invoice Reading" },
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
    icon: <FileSpreadsheet size={20} />,
    accent: "#FFB547",
    features: [
      { icon: <FileCode2 size={13} />, label: "AED Tally Vouchers" },
      { icon: <Table size={13} />, label: "TRN & VAT Checks" },
      { icon: <Activity size={13} />, label: "AI Invoice Reading" },
    ],
    submodules: [],
  },
  {
    id: "international-business",
    name: "International Business",
    tagline: "Cross-Border Operations MIS",
    description:
      "Consolidated view of international entities — revenue, compliance calendar, transfer pricing data and country-wise P&L.",
    href: "/api/module/international-business",
    icon: <Globe2 size={20} />,
    accent: "#00D68F",
    features: [
      { icon: <Globe2 size={13} />, label: "Entity Consolidation" },
      { icon: <Table size={13} />, label: "Country P&L" },
      { icon: <Activity size={13} />, label: "Compliance Calendar" },
    ],
    submodules: [],
  },
  {
    id: "tax-compliance",
    name: "Tax Compliance & Litigation",
    tagline: "Group Tax Command Center",
    description:
      "Enterprise command center for group-wide tax compliance, notice workflows, litigation hierarchies, and due date calendars across 7 companies and 70+ retail stores.",
    href: "/api/module/tax-compliance",
    icon: <Shield size={20} />,
    accent: "#ef4444",
    features: [
      { icon: <Shield size={13} />, label: "Notice & Appeal Kanban" },
      { icon: <Clock size={13} />, label: "Due Date & Alert Center" },
      { icon: <Activity size={13} />, label: "Govt Portal Sync Logs" },
    ],
    submodules: [],
  },
  {
    id: "jc-gst-abop-tracker",
    name: "JC GST & ABOP Tracker",
    tagline: "Address & Registration Monitor",
    description:
      "All Branch/Office Premises (ABOP) operational status, address bifurcation updates, and automated GSTN registration certificate reader for Join Ventures.",
    href: "/api/module/jc-gst-abop-tracker",
    icon: <Shield size={20} />,
    accent: "#00D68F",
    features: [
      { icon: <Shield size={13} />, label: "ABOP Dashboard" },
      { icon: <Table size={13} />, label: "Address Bifurcation" },
      { icon: <Activity size={13} />, label: "GSTN Cert Reader" },
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
      ease: [0.16, 1, 0.3, 1] as const, // Custom Apple Vision Pro easing
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

function BoardroomCard({ m }: { m: BoardroomModule }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse movement to 3D rotation angles (-6deg to 6deg)
  const rotateX = useTransform(y, [-150, 150], [6, -6]);
  const rotateY = useTransform(x, [-150, 150], [-6, 6]);

  // Center radial glow coordinates
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
    ([cx, cy]) => `radial-gradient(350px circle at ${cx}px ${cy}px, ${m.accent}12, transparent 65%)`
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
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="group relative border border-white/5 hover:border-white/10 bg-[#0E121B]/60 backdrop-blur-md rounded-3xl p-7 flex flex-col gap-5 overflow-hidden transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
    >
      {/* Cursor tracking glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: backgroundGlow }}
      />

      {/* Static corner colored gradient */}
      <div
        className="absolute top-0 right-0 w-[120px] h-[120px] blur-3xl pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `linear-gradient(to bottom right, ${m.accent}44, transparent)` }}
      />

      {/* Diagonal gloss sweep line */}
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

      {/* Icon & Live status */}
      <div className="flex items-center justify-between" style={{ transform: "translateZ(30px)" }}>
        <motion.div
          className="w-12 h-12 rounded-2xl border flex items-center justify-center relative overflow-hidden"
          style={{ color: m.accent, borderColor: `${m.accent}33`, backgroundColor: `${m.accent}12` }}
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: "spring", stiffness: 450, damping: 15 }}
        >
          <div className="absolute inset-0 bg-current opacity-[0.04] blur-[6px]" />
          {m.icon}
        </motion.div>

        {live ? (
          <span className="flex items-center gap-1.5 text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-mono px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.02] text-[#737c92]">
            <Lock size={9} />
            COMING SOON
          </span>
        )}
      </div>

      {/* Module info */}
      <div className="flex flex-col gap-1" style={{ transform: "translateZ(20px)" }}>
        <h2 className="text-lg font-display font-bold text-white tracking-tight group-hover:text-[#4F7EFF] transition-colors duration-300">
          {m.name}
        </h2>
        <p className="text-[10px] font-mono tracking-wider uppercase font-semibold" style={{ color: m.accent }}>
          {m.tagline}
        </p>
      </div>

      <p className="text-xs text-[#737c92] leading-relaxed flex-1" style={{ transform: "translateZ(10px)" }}>
        {m.description}
      </p>

      {/* Features list */}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-4" style={{ transform: "translateZ(15px)" }}>
        {m.features.map((f) => (
          <div key={f.label} className="flex items-center gap-2.5 text-[11px] text-[#aab2c5] group-hover:text-white transition-colors duration-300">
            <span className="opacity-80" style={{ color: m.accent }}>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      {/* Submodules */}
      {m.submodules.length > 0 && (
        <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5" style={{ transform: "translateZ(10px)" }}>
          <p className="text-[9px] uppercase tracking-widest text-[#737c92] font-bold">Submodules</p>
          {m.submodules.map((s) =>
            s.href ? (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-[#aab2c5] hover:text-white transition-colors"
              >
                <ChevronRight size={11} style={{ color: m.accent }} />
                {s.name}
              </a>
            ) : (
              <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-[#4a5164]">
                <ChevronRight size={11} />
                {s.name} · soon
              </span>
            )
          )}
        </div>
      )}

      {/* Launch CTA */}
      <div className="mt-2" style={{ transform: "translateZ(25px)" }}>
        {live ? (
          <motion.a
            href={m.href!}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden group/btn w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-3 rounded-xl text-white transition-all duration-300 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.35)] border border-white/5 hover:border-white/10"
            style={{
              background: `linear-gradient(135deg, ${m.accent}, ${m.accent}cc)`
            }}
          >
            {/* Sweep light animation */}
            <span className="absolute inset-0 w-[60%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-[150%] group-hover/btn:animate-shine-sweep pointer-events-none" />
            <span>Launch Module</span>
            <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </motion.a>
        ) : (
          <span className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold px-5 py-3 rounded-xl bg-white/[0.01] border border-white/5 text-[#4a5164] cursor-not-allowed select-none">
            <Lock size={12} />
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

  return (
    <div className="relative min-h-screen flex flex-col bg-[#06080D] overflow-hidden">
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
          50% { transform: translate(30px, -45px) scale(1.1); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-40px, 30px) scale(0.95); }
        }
        @keyframes float-slow-3 {
          0%, 100% { transform: translate(0px, 0px) scale(0.95); }
          50% { transform: translate(25px, 35px) scale(1.05); }
        }
        .animate-float-1 {
          animation: float-slow-1 22s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-slow-2 28s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-slow-3 32s ease-in-out infinite;
        }
      `}} />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* Radial soft ambient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#06080D_95%)] pointer-events-none z-0" />

      {/* Floating Colored Glassmorphic Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-20 left-[10%] w-[380px] h-[380px] rounded-full bg-[#4F7EFF]/8 blur-[120px] animate-float-1"
        />
        <motion.div
          className="absolute bottom-20 right-[15%] w-[420px] h-[420px] rounded-full bg-[#A66BFF]/8 blur-[130px] animate-float-2"
        />
        <motion.div
          className="absolute top-[40%] right-[30%] w-[320px] h-[320px] rounded-full bg-[#00D68F]/6 blur-[110px] animate-float-3"
        />
      </div>

      <Navbar />

      <main className="flex-1 pt-28 pb-16 px-6 max-w-[1200px] mx-auto w-full relative z-10 flex flex-col gap-10">
        
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
              className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F7EFF]/20 to-[#A66BFF]/20 border border-white/10 flex items-center justify-center text-[#4F7EFF] shadow-[0_0_15px_rgba(79,126,255,0.15)]">
                  <Shield size={18} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white uppercase tracking-wider font-display">
                    Boardroom Executive Dashboard
                  </h1>
                  <p className="text-[10px] text-[#737c92] mt-0.5 font-mono">
                    SECURE CORPORATE SYSTEM · PER-MODULE AUTHENTICATION
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-[#00D68F] bg-[#00D68F]/10 border border-[#00D68F]/20 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(0,214,143,0.12)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse" />
                  SECURED EXECUTIVE SESSION
                </span>
              </div>
            </motion.div>

            {/* Performance Metrics Section */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Stat 1 */}
              <div className="bg-[#0E121B]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#4F7EFF]/20 to-transparent" />
                <div className="flex items-center justify-between text-[#737c92]">
                  <span className="text-[9px] uppercase tracking-wider font-bold">Vouchers Synced</span>
                  <Database size={13} className="text-[#4F7EFF] opacity-75 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mt-2 font-display">
                  <AnimatedNumber value={148920} />
                </div>
                <div className="text-[9px] text-[#00D68F] mt-1 flex items-center gap-1 font-semibold">
                  <span className="leading-none">↑</span> +12.4% vs last month
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-[#0E121B]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#A66BFF]/20 to-transparent" />
                <div className="flex items-center justify-between text-[#737c92]">
                  <span className="text-[9px] uppercase tracking-wider font-bold">AI Extraction Accuracy</span>
                  <Cpu size={13} className="text-[#A66BFF] opacity-75 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mt-2 font-display">
                  <AnimatedNumber value={99.8} decimals={1} suffix="%" />
                </div>
                <div className="text-[9px] text-[#737c92] mt-1 font-semibold">
                  Cognitive validation active
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-[#0E121B]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D68F]/20 to-transparent" />
                <div className="flex items-center justify-between text-[#737c92]">
                  <span className="text-[9px] uppercase tracking-wider font-bold">Active Sync Channels</span>
                  <Activity size={13} className="text-[#00D68F] opacity-75 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mt-2 font-display">
                  <AnimatedNumber value={18} />
                </div>
                <div className="text-[9px] text-[#00D68F] mt-1 flex items-center gap-1 font-semibold">
                  <span className="w-1 h-1 rounded-full bg-[#00D68F] inline-block animate-pulse" /> Channel sync online
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-[#0E121B]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FFB547]/20 to-transparent" />
                <div className="flex items-center justify-between text-[#737c92]">
                  <span className="text-[9px] uppercase tracking-wider font-bold">Mean Response Time</span>
                  <Clock size={13} className="text-[#FFB547] opacity-75 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mt-2 font-display">
                  <AnimatedNumber value={1.42} decimals={2} suffix="s" />
                </div>
                <div className="text-[9px] text-[#00D68F] mt-1 flex items-center gap-1 font-semibold">
                  Fastest tier latency
                </div>
              </div>
            </motion.div>

            {/* Modules Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {MODULES.map((m) => (
                <BoardroomCard key={m.id} m={m} />
              ))}
            </motion.div>

            {/* Dynamic Access Model Notice */}
            <motion.div 
              variants={itemVariants}
              className="border border-white/5 bg-[#0E121B]/40 backdrop-blur-sm rounded-2xl p-5 text-[11px] text-[#737c92] leading-relaxed relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#4F7EFF] to-[#A66BFF]" />
              <span className="text-[#aab2c5] font-semibold">Access Model Policy:</span> Every boardroom module has independent authorization criteria. Granting permission for one dashboard module does not open others. Authorized team members utilize single sign-on credentials across all active modules.
            </motion.div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
