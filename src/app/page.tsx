"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  LineChart, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Zap, 
  Layers,
  Database,
  Search
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("gst");

  const suites = {
    gst: {
      title: "Goods & Services Tax Suite",
      description: "Automate input reconciliation, interest calculations, and compliance checks with Section 47 intelligence.",
      color: "from-blue-primary to-cyan-primary",
      tools: [
        { name: "GST Interest Calculator (S.50)", desc: "Verify interest on net cash liability." },
        { name: "GST Late Fee Calculator (S.47)", desc: "Instant calculations for GSTR-1 & 3B." },
        { name: "ITC Utilization Engine", desc: "Optimize credit distribution mapping rules." },
        { name: "Reconciliation Studio (IMS)", desc: "Match purchase registers with auto GSTR-2B." }
      ]
    },
    tax: {
      title: "Direct & Corporate Taxation",
      description: "Compute advance tax liability, navigate presumptive tax exemptions, and manage capital gains.",
      color: "from-violet-primary to-crimson-primary",
      tools: [
        { name: "Income Tax Calculator (FY26-27)", desc: "Compare new vs old tax regime slabs." },
        { name: "Advance Tax Estimator", desc: "Calculate installments with Section 234A/B/C." },
        { name: "Presumptive Tax (44AD/ADA)", desc: "Exemptions and minimum profit thresholds." },
        { name: "Capital Gains Tax Studio", desc: "LTCG and STCG calculations with indexation." }
      ]
    },
    mis: {
      title: "Corporate Finance & MIS Suite",
      description: "Track working capital, monitor cash flow margins, and check compliance timelines.",
      color: "from-amber-primary to-brass",
      tools: [
        { name: "MSME Payment Tracker (S.43B)", desc: "Monitor due dates and avoid tax disallowances." },
        { name: "Depreciation Block Analyzer", desc: "Calculate block assets depreciation rates." },
        { name: "Financial Ratio Suite", desc: "Compute DSO, DPO, Current Ratio, and margins." },
        { name: "TCS LRS Calculator", desc: "Foreign remittance tax collection thresholds." }
      ]
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#05060a]">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f7cff]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#9a6bff]/10 blur-[120px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center flex flex-col items-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-xs font-medium text-[#aab2c5] mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
            Redesigned SaaS Workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.1] bg-gradient-to-b from-white via-[#eef1f8] to-[#737c92] bg-clip-text text-transparent"
          >
            Financial Intelligence. <br className="hidden sm:inline" />
            Calculated in Real-Time.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#aab2c5] max-w-xl leading-relaxed mb-8"
          >
            A unified financial workspace for Chartered Accountants, corporate finance teams, and practitioners across India.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
          >
            <Link
              href="/tools"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-[#4f7cff] hover:bg-[#3d66dd] text-sm font-semibold transition-all shadow-[0_0_20px_rgba(79,124,255,0.3)] cursor-pointer"
            >
              Access Calculators
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/insights"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-sm font-medium text-[#aab2c5] hover:text-white transition-all cursor-pointer"
            >
              Read Tax Insights
            </Link>
          </motion.div>
        </div>

        {/* Live Suite Tabs */}
        <section className="mb-24">
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
              {/* Suite Detail Panel */}
              <div className="lg:col-span-1 border border-white/5 bg-white/5 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${suites[activeTab as keyof typeof suites].color} opacity-20 blur-xl`} />
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

              {/* Tools List Bento Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suites[activeTab as keyof typeof suites].tools.map((tool, idx) => (
                  <div
                    key={idx}
                    className="border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 p-6 rounded-2xl transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#4f7cff] mb-4 group-hover:bg-[#4f7cff]/10 transition-colors">
                        <Calculator size={16} />
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1.5">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-[#737c92] leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                    <Link
                      href="/tools"
                      className="mt-6 inline-flex items-center gap-1 text-[11px] font-bold text-[#aab2c5] group-hover:text-white transition-colors"
                    >
                      Launch
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Feature Bento Grid */}
        <section className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-white/5 bg-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#4f7cff] mb-6">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-2">Zero Data Lag</h4>
              <p className="text-xs text-[#737c92] leading-relaxed">
                Calculations execute in microseconds client-side, with full schema validation and instant offline availability.
              </p>
            </div>
          </div>
          <div className="border border-white/5 bg-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#34d399] mb-6">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-2">Practitioner Grade</h4>
              <p className="text-xs text-[#737c92] leading-relaxed">
                Built strictly according to relevant provisions of the CGST Act 2017 and Income Tax Act 1961.
              </p>
            </div>
          </div>
          <div className="border border-white/5 bg-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#9a6bff] mb-6">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-2">SaaS Extensible</h4>
              <p className="text-xs text-[#737c92] leading-relaxed">
                Auth-ready, prisma-backed architecture designed to scale seamlessly from free to premium team workspaces.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
