import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight, ArrowRight, Layers, Users, ScrollText, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About Us — NumberIQ | Built by a CA, for CAs",
  description: "Learn more about NumberIQ — the finance intelligence workspace built by a Chartered Accountant for CAs, corporate finance teams, and practitioners.",
  alternates: {
    canonical: "https://numberiq.in/about",
  },
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a] overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 max-w-6xl mx-auto w-full relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92] mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">About</span>
        </div>

        {/* Hero */}
        <header className="mb-14 max-w-3xl">
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20">
            About
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-black text-white tracking-tight mt-5 mb-6 leading-[1.05]">
            Built by a CA,
            <br />
            <span className="bg-gradient-to-r from-[#4f7cff] via-[#34d399] to-[#f4b740] bg-clip-text text-transparent">
              for CAs.
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#aab2c5] leading-relaxed">
            NumberIQ is a finance-intelligence workspace built by a Chartered Accountant for CAs,
            finance teams and growing businesses operating across India, the UAE and Singapore.
          </p>
        </header>

        {/* Stats band */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {[
            { value: "24+", label: "Free calculators", tone: "#4f7cff" },
            { value: "100+", label: "CA-reviewed guides", tone: "#34d399" },
            { value: "50", label: "Glossary definitions", tone: "#f4b740" },
            { value: "0", label: "Figures leaving your browser", tone: "#38e1d6" },
          ].map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br from-[#07091a] to-[#050810]"
              style={{ borderColor: `${s.tone}22` }}
            >
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                style={{ background: `${s.tone}14` }}
              />
              <span
                className="relative z-10 font-display text-3xl md:text-4xl font-black block"
                style={{ color: s.tone }}
              >
                {s.value}
              </span>
              <span className="relative z-10 text-[11px] text-[#737c92] mt-1.5 block leading-snug">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            {
              icon: Layers,
              title: "What we do",
              tone: "#4f7cff",
              body: "NumberIQ brings GST, direct tax, international tax, MIS and compliance into one console. It pairs a suite of secure modules — MIS dashboards, GST returns, transfer pricing, income tax and more — with free, browser-based Finance Tools reviewed for FY 2026-27 that anyone can open instantly, with no sign-up.",
            },
            {
              icon: Users,
              title: "Who it's for",
              tone: "#34d399",
              body: "Chartered Accountants, tax and finance professionals, CFOs, founders and accounts teams who need accurate, current Indian tax references and quick computations without logging in or sharing data.",
            },
            {
              icon: ScrollText,
              title: "Our approach",
              tone: "#f4b740",
              body: "Every tool and article is mapped to the relevant section, rule, notification or circular, and reviewed against the latest position of law — the Income-tax Act 2025, the CGST Act, FEMA and allied regulations. Calculators run entirely in your browser, so your figures never leave your device.",
            },
            {
              icon: ShieldCheck,
              title: "Why built by a CA",
              tone: "#38e1d6",
              body: "Finance professionals deserve tools that speak their language — precise section references, correct thresholds and board-ready output, not generic calculators. NumberIQ is maintained by a Mumbai-based Chartered Accountant with a Diploma in International Taxation, working in-house across multi-jurisdiction operations.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="relative overflow-hidden rounded-3xl border p-8 bg-gradient-to-br from-[#07091a] to-[#050810]"
              style={{ borderColor: `${p.tone}22` }}
            >
              <div
                className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none"
                style={{ background: `${p.tone}12` }}
              />
              <div className="relative z-10">
                <div
                  className="w-11 h-11 rounded-2xl border flex items-center justify-center mb-5"
                  style={{ color: p.tone, background: `${p.tone}18`, borderColor: `${p.tone}40` }}
                >
                  <p.icon size={18} />
                </div>
                <h2 className="font-display text-xl font-bold text-white mb-3">{p.title}</h2>
                <p className="text-sm text-[#aab2c5] leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden rounded-3xl border border-[#4f7cff]/20 bg-gradient-to-br from-[#0a0f1e] to-[#050810] p-10 text-center mb-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(79,124,255,0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-3">
              Start with the free tools
            </h2>
            <p className="text-sm text-[#aab2c5] max-w-lg mx-auto mb-7">
              No sign-up, no data collection — every calculator runs in your browser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/tools"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-xs font-bold uppercase tracking-wider text-white hover:opacity-95 transition-opacity"
              >
                Explore Tools
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-xs md:text-sm text-[#737c92] leading-relaxed">
          NumberIQ content is for general guidance only and does not constitute professional advice.
          Tax law changes frequently — verify the current position and consult a qualified Chartered
          Accountant before acting.
        </div>
      </main>

      <Footer />
    </div>
  );
}
