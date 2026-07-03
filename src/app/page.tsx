"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ThreeDSphere } from "@/components/three-d-sphere";
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
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Layers,
  BookOpen,
  Award,
  TrendingUp,
  Sparkles,
  Building,
  Briefcase,
  Cpu,
  Lock,
  Compass,
  CornerDownRight,
  Star,
  Users
} from "lucide-react";

/* ---------- Stat Counter component ---------- */
function StatCounter({ value, prefix = "", suffix = "", label }: { value: number; prefix?: string; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); // cubic easeOut
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="font-display text-4xl sm:text-5xl font-black bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-[#10b981] mt-2 font-bold font-mono">{label}</div>
    </div>
  );
}

/* ---------- 3D tilt card wrapper ---------- */
function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Interactive 3D Compliance Node Network ---------- */
function ComplianceEcosystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>("Core Advisory");

  const nodes = [
    { id: "core", label: "NumberIQ Core", x: 0, y: 0, size: 28, color: "#ffffff", desc: "Central orchestration hub led by Chartered Accountants." },
    { id: "gst", label: "GST Suite", x: -160, y: -70, size: 18, color: "#3b82f6", desc: "Section 50 net cash interest, GSTR-1/3B filings, and automated ITC reconciliations." },
    { id: "it", label: "Income Tax", x: 160, y: -70, size: 18, color: "#10b981", desc: "Corporate tax returns under New Regime, Section 80-IAC filings, and tax planning." },
    { id: "roc", label: "ROC & MCA", x: -150, y: 80, size: 16, color: "#f5b74a", desc: "Annual filings, director KYC, company incorporations, and statutory records maintenance." },
    { id: "audit", label: "Audit Studio", x: 150, y: 80, size: 16, color: "#a855f7", desc: "Statutory audits, tax audits, internal controls verification, and financial reporting." },
    { id: "cfo", label: "Virtual CFO", x: 0, y: -140, size: 20, color: "#ec4899", desc: "Boardroom representations, cash-flow projections, capital structuring, and investor reporting." },
    { id: "startup", label: "Startup Desk", x: 0, y: 140, size: 20, color: "#06b6d4", desc: "Angel tax compliance, valuations, ESOP design, and venture-ready financial advisory." }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    let animationFrame: number;
    let mouse = { x: 0, y: 0, localX: 0, localY: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.localX = e.clientX - rect.left;
      mouse.localY = e.clientY - rect.top;
      mouse.x = mouse.localX - width / 2;
      mouse.y = mouse.localY - height / 2;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Track click on node to show description
    const handleCanvasClick = () => {
      let hoveredNode = "Core Advisory";
      nodes.forEach(node => {
        const nx = node.x;
        const ny = node.y;
        const dist = Math.hypot(mouse.x - nx, mouse.y - ny);
        if (dist < node.size + 15) {
          hoveredNode = node.label;
        }
      });
      setActiveNode(hoveredNode);
    };

    canvas.addEventListener("click", handleCanvasClick);

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw background grid lines
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw connector lines with animated pulses
      nodes.forEach(node => {
        if (node.id === "core") return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + node.x, cy + node.y);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pulsing dot on connection line
        const pulseRatio = (time * 0.4) % 1;
        const px = cx + node.x * pulseRatio;
        const py = cy + node.y * pulseRatio;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // Draw nodes
      nodes.forEach(node => {
        const nx = cx + node.x;
        const ny = cy + node.y;
        const isHovered = Math.hypot(mouse.x - node.x, mouse.y - node.y) < node.size + 12;

        ctx.save();

        // Outer glow
        ctx.beginPath();
        ctx.arc(nx, ny, node.size + (isHovered ? 8 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? `${node.color}15` : "rgba(255,255,255,0.02)";
        ctx.strokeStyle = isHovered ? node.color : "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Core solid node
        ctx.beginPath();
        ctx.arc(nx, ny, node.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered ? 20 : 10;
        ctx.fill();

        // Label Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = isHovered ? "#ffffff" : "#aab2c5";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.label.toUpperCase(), nx, ny + node.size + 15);

        ctx.restore();
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, []);

  const selectedNodeInfo = nodes.find(n => n.label === activeNode) || nodes[0];

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-5xl mx-auto border border-white/5 bg-white/[0.01] rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
      <div className="lg:col-span-2 relative flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-[380px] sm:h-[420px]" />
      </div>
      <div className="lg:col-span-1 p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md relative z-10">
        <span className="text-[9px] font-bold font-mono tracking-widest text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/25 mb-4 inline-block">
          Interactive Node
        </span>
        <h4 className="font-display text-xl font-bold text-white mb-3" style={{ color: selectedNodeInfo.color }}>
          {selectedNodeInfo.label}
        </h4>
        <p className="text-xs text-[#aab2c5] leading-relaxed mb-4">
          {selectedNodeInfo.desc}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50">
          <Compass size={12} className="animate-spin-slow" />
          Click nodes to explore the ecosystem
        </div>
      </div>
    </div>
  );
}

/* ---------- App/Page Home ---------- */
export default function Home() {
  const [activeTab, setActiveTab] = useState("gst");
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInView = useInView(timelineRef, { once: false, margin: "-100px" });

  const timelineMilestones = [
    {
      phase: "Phase 01",
      title: "Seed & Structuring",
      desc: "Company registration, LLP drafting, shareholder agreements, Section 80-IAC tax exemption planning, and seed-round valuation advisories.",
      icon: <Building size={16} />,
      color: "border-[#3b82f6]"
    },
    {
      phase: "Phase 02",
      title: "Scale & Systemization",
      desc: "Comprehensive GST setup, TDS automation engines, corporate payroll configurations, and Section 43B(h) payment tracker setups to ensure zero compliance gaps.",
      icon: <Cpu size={16} />,
      color: "border-[#10b981]"
    },
    {
      phase: "Phase 03",
      title: "Tax Optimization",
      desc: "Regime diagnostics (Old vs New), Section 115BAA/BAB corporate tax restructuring, capital gains planning with indexation, and automated GSTR-2B ITC reconciliations.",
      icon: <TrendingUp size={16} />,
      color: "border-[#f5b74a]"
    },
    {
      phase: "Phase 04",
      title: "Boardroom Advisory & CFO",
      desc: "Dynamic financial modeling, venture capital readiness reporting, corporate governance audits, and strategic exit structuring.",
      icon: <Briefcase size={16} />,
      color: "border-[#a855f7]"
    }
  ];

  const services = [
    { name: "GST Audit & Filings", desc: "Automated input reconciliation with GSTR-2B/3B, Section 50 interest calculations, and statutory refunds audits.", tag: "S.47 & S.50 Compliance" },
    { name: "Corporate Income Tax", desc: "Filing and assessment representation, advanced regime optimization, and capital gains advisory.", tag: "ITA 2025 Optimized" },
    { name: "MCA & ROC Compliances", desc: "Company formation, annual filings, director KYC, statutory record maintenance, and secretarial audits.", tag: "Corporate Governance" },
    { name: "Venture CFO Services", desc: "Cash flow modeling, VC fundraising preparation, financial dashboard designs, and treasury advisory.", tag: "Startup Scale" },
    { name: "Startup Advisory", desc: "DPIIT registrations, Section 80-IAC tax exemptions, valuation certifications, and ESOP layouts.", tag: "Founder Ecosystem" },
    { name: "Financial Planning", desc: "Working capital optimization, capital budgeting models, statutory auditing, and practice-ready reports.", tag: "Enterprise Grade" }
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

      <main className="flex-1 pt-24 sm:pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        
        {/* ==================== HERO SECTION ==================== */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[85vh] py-10">
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f5b74a]/20 bg-[#f5b74a]/5 text-[10px] uppercase font-bold tracking-widest text-[#ffd98a] mb-6 shadow-[0_0_30px_rgba(245,183,74,0.08)]"
            >
              <Award size={13} className="text-[#f5b74a]" />
              BUILT BY CAs, FOR GROWTH FOUNDERS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-7xl font-black tracking-tight mb-6 leading-[1.05] bg-gradient-to-b from-white via-[#eef1f8] to-gray-500 bg-clip-text text-transparent"
            >
              Financial Intelligence.
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#f5b74a] bg-clip-text text-transparent">
                Redefined in 3D.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-[#aab2c5] max-w-2xl leading-relaxed mb-10"
            >
              NumberIQ is a next-generation Chartered Accountant firm built by CAs to automate compliance,
              optimize corporate tax, and scale business ventures using data-driven intelligence.
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
                Access Terminal
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-[#aab2c5] hover:text-white transition-all cursor-pointer"
              >
                Talk to a Partner
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 h-[400px] lg:h-auto w-full relative flex items-center justify-center"
          >
            <ThreeDSphere />
          </motion.div>
        </section>

        {/* ==================== SECTION 2: AI DASHBOARD ==================== */}
        <section className="py-24 border-t border-white/5 relative">
          <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] bg-[#3b82f6]/5 blur-[100px] pointer-events-none" />
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-2.5 py-1 rounded border border-[#3b82f6]/20">
              Intelligence Interface
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
              Real-time Business Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-[#737c92] mt-3">
              Automated financial boards that translate code sections and filings into high-definition clarity.
            </p>
          </div>

          <TiltCard className="max-w-4xl mx-auto">
            <div className="border border-white/10 bg-black/60 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_50px_rgba(59,130,246,0.06)]">
              {/* Glow header lights */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/40 to-transparent" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#10b981] flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">Partner Boardroom v1.2</h3>
                    <p className="text-[10px] text-[#737c92] mt-1">Live workspace active · Sec 43B(h) / Sec 50 Reconciled</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#10b981] font-mono">SECURE CA-NODE CONNECTED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { title: "Net Cash Flow (Q1)", val: "₹ 84,32,900", change: "+14.8%", color: "text-[#10b981]" },
                  { title: "Indirect Taxes (GST)", val: "₹ 12,41,500", change: "RECONCILED", color: "text-[#3b82f6]" },
                  { title: "Direct Tax Provision", val: "₹ 18,90,000", change: "SEC. 115BAA OPTIMIZED", color: "text-[#f5b74a]" }
                ].map((card, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <div className="text-[9px] uppercase tracking-widest text-[#737c92] font-semibold">{card.title}</div>
                    <div className="text-lg font-bold text-white mt-2 font-mono">{card.val}</div>
                    <div className={`text-[9px] font-bold mt-2 font-mono ${card.color}`}>{card.change}</div>
                  </div>
                ))}
              </div>

              {/* Graphical simulation widget */}
              <div className="mt-6 p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#aab2c5]">Compliance Health Radar</span>
                  <span className="text-[10px] font-bold font-mono text-[#10b981]">99.8% ACCURACY RATE</span>
                </div>
                <div className="h-16 flex items-end gap-1.5 w-full relative">
                  {[40, 60, 45, 80, 55, 90, 75, 95, 85, 100, 70, 92, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-[#3b82f6]/20 to-[#3b82f6] rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </section>

        {/* ==================== SECTION 3: TIMELINE ==================== */}
        <section id="startup" className="py-24 border-t border-white/5 relative">
          <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-[#a855f7]/5 blur-[100px] pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#f5b74a] bg-[#f5b74a]/10 px-2.5 py-1 rounded border border-[#f5b74a]/20">
              Venture Journey
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
              Milestone Navigation Track
            </h2>
            <p className="text-xs sm:text-sm text-[#737c92] mt-3">
              Aligning legal entity structure and tax strategy at every stage of corporate growth.
            </p>
          </div>

          <div ref={timelineRef} className="max-w-4xl mx-auto relative pl-6 sm:pl-0">
            {/* Center line (only on desktop) */}
            <div className="absolute left-[2px] sm:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#3b82f6]/40 via-[#10b981]/40 to-transparent transform sm:-translate-x-1/2" />

            <div className="space-y-16">
              {timelineMilestones.map((m, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className={`relative flex flex-col sm:flex-row items-start sm:items-center ${isEven ? "sm:justify-start" : "sm:justify-end"}`}>
                    
                    {/* Ring Node indicator */}
                    <div className="absolute left-[-24px] sm:left-1/2 top-1 sm:top-auto w-4 h-4 rounded-full bg-black border-2 border-white/60 transform sm:-translate-x-1/2 flex items-center justify-center z-10 transition-colors duration-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>

                    <div className={`w-full sm:w-[45%] ${isEven ? "sm:pr-10" : "sm:pl-10"}`}>
                      <motion.div
                        style={{ transformStyle: "preserve-3d" }}
                        animate={timelineInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.5, delay: idx * 0.15 }}
                        className={`p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative ${m.color}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold font-mono tracking-widest text-white/40">{m.phase}</span>
                          <div className="p-2 rounded-lg bg-white/5 text-[#3b82f6]">{m.icon}</div>
                        </div>
                        <h3 className="font-display text-lg font-bold text-white mb-2">{m.title}</h3>
                        <p className="text-xs text-[#737c92] leading-relaxed">{m.desc}</p>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 4: VALUE TRANSFORMATION ==================== */}
        <section className="py-24 border-t border-white/5 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCounter value={1000} prefix="₹" suffix="Cr+" label="Managed Transactions" />
            <StatCounter value={500} suffix="+" label="Corporate Clients" />
            <StatCounter value={99.8} suffix="%" label="Compliance Accuracy" />
            <StatCounter value={10} suffix="+" label="Years Advisory Experience" />
          </div>
        </section>

        {/* ==================== SECTION 5: 3D ECOSYSTEM ==================== */}
        <section id="services" className="py-24 border-t border-white/5 relative">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded border border-[#10b981]/20">
              Ecosystem Map
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
              Integrated Compliance Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-[#737c92] mt-3">
              Every node connects seamlessly under statutory control, guided by certified financial experts.
            </p>
          </div>

          <ComplianceEcosystem />
        </section>

        {/* ==================== MODULES / SERVICES GRID ==================== */}
        <section className="py-24 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-2.5 py-1 rounded border border-[#3b82f6]/20">
              Our Capabilities
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
              Statutory Services Redefined
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, i) => (
              <TiltCard key={i}>
                <div className="h-full border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] p-7 rounded-3xl transition-all group flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#3b82f6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  <div>
                    <span className="text-[9px] font-bold font-mono tracking-wider text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/25 mb-4 inline-block">
                      {svc.tag}
                    </span>
                    <h3 className="font-display text-base font-bold text-white mb-2 group-hover:text-[#3b82f6] transition-colors">{svc.name}</h3>
                    <p className="text-xs text-[#737c92] leading-relaxed">{svc.desc}</p>
                  </div>
                  <div className="mt-8 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50 group-hover:text-white transition-colors">
                    Explore Service
                    <CornerDownRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ==================== SECTION 6: SUCCESS METRICS / TESTIMONIALS ==================== */}
        <section className="py-24 border-t border-white/5 relative">
          <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] bg-[#3b82f6]/5 blur-[100px] pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-2.5 py-1 rounded border border-[#3b82f6]/20">
              Vouched
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
              Trusted by Founders & CFOs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                quote: "NumberIQ transformed our corporate tax workflow. Managing Section 43B(h) and MSME compliance was extremely stressful until they automated the tracking logic. Professional CAs who truly understand tech.",
                author: "Devendra Patil",
                role: "Co-Founder, PayGlow",
                rating: 5
              },
              {
                quote: "Not your traditional firm. The team doesn't just hand over spreadsheets; their dashboard modeling, practice-ready outputs, and clear tax strategy saved our finance team over 15 hours every single month.",
                author: "Ananya Mehta",
                role: "CFO, Zenith Retail",
                rating: 5
              }
            ].map((t, idx) => (
              <TiltCard key={idx}>
                <div className="h-full border border-white/10 bg-black/60 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex gap-1 mb-4 text-[#f5b74a]">
                      {[...Array(t.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                    <p className="text-xs sm:text-sm text-[#aab2c5] leading-relaxed italic mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#10b981] flex items-center justify-center text-white text-xs font-bold font-mono">
                      {t.author.substring(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{t.author}</h4>
                      <p className="text-[9px] uppercase tracking-wider text-[#737c92] mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ==================== SECTION 7: FINAL CTA (HOLOGRAPHIC COMMAND CENTER) ==================== */}
        <section id="contact" className="py-24 border-t border-white/5 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden border border-[#3b82f6]/20 bg-gradient-to-br from-[#070b16] to-[#050505] rounded-3xl px-8 py-16 text-center"
          >
            {/* Holographic grid and lighting beams */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[70%] h-[120%] bg-[#3b82f6]/10 blur-[100px] rounded-full pointer-events-none" />
            
            <Sparkles size={24} className="text-[#3b82f6] mx-auto mb-6 animate-pulse" />
            
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white mb-4 relative z-10 leading-tight">
              Ready to Upgrade Your
              <br />
              Financial Foundation?
            </h2>
            <p className="text-xs sm:text-sm text-[#aab2c5] max-w-lg mx-auto mb-10 relative z-10 leading-relaxed">
              Step into the boardroom. Partner with CAs who calculate with code-level precision and understand startup scale.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                href="/contact"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-xs font-bold uppercase tracking-wider text-white hover:opacity-95 transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)]"
              >
                Let&apos;s Build Your Future
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/tools"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-[#aab2c5] hover:text-white transition-all"
              >
                Launch Terminal
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
