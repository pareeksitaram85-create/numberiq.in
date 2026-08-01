import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { practiceAreas, practiceSlugs } from "@/lib/practice-content";
import { ArrowRight, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Practice Areas — Transfer Pricing, International Tax, FEMA & Tax Audit | NumberIQ",
  description:
    "Specialist coverage across India's most technical compliance areas — transfer pricing documentation, cross-border tax and DTAA, FEMA reporting, and tax audit under Section 44AB.",
  alternates: { canonical: "https://numberiq.in/practice" },
  openGraph: {
    title: "Practice Areas — Transfer Pricing, International Tax, FEMA & Tax Audit | NumberIQ",
    description:
      "Specialist coverage across India's most technical compliance areas — transfer pricing, cross-border tax, FEMA and tax audit.",
    type: "website",
    url: "https://numberiq.in/practice",
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: "NumberIQ Practice Areas" }],
  },
};

export default function PracticeIndex() {
  const areas = practiceSlugs.map((s) => practiceAreas[s]);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a] overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[45%] rounded-full bg-[#4f7cff]/8 blur-[140px] pointer-events-none nq-drift-a" />
      <div className="absolute top-[45%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#a855f7]/6 blur-[150px] pointer-events-none nq-drift-b" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-6xl mx-auto w-full relative z-10">
        <nav className="flex items-center gap-1.5 text-xs text-[#737c92] mb-10" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">Practice Areas</span>
        </nav>

        <header className="mb-16 max-w-3xl">
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20">
            Practice Areas
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight mt-5 mb-6 leading-[1.05] bg-gradient-to-b from-white via-[#eef1f8] to-[#8a93a8] bg-clip-text text-transparent">
            Precision across every
            <br />
            <span className="bg-gradient-to-r from-[#4f7cff] via-[#38e1d6] to-[#f4b740] bg-clip-text text-transparent">
              tax dimension.
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#c3cad9] leading-relaxed">
            Four areas where the rules are technical, the deadlines are unforgiving, and the penalty
            for a procedural slip is levied whether or not the underlying position was right.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {areas.map((a) => (
            <Link key={a.slug} href={`/practice/${a.slug}`} className="block group">
              <article
                className="h-full nq-glass nq-glass-hover backdrop-blur-xl relative overflow-hidden rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300"
                style={{ borderColor: `${a.tone}26` }}
              >
                <span aria-hidden className="nq-sheen rounded-3xl" />
                <div
                  aria-hidden
                  className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `${a.tone}1f` }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl border flex items-center justify-center text-xs font-black font-mono"
                      style={{ color: a.tone, background: `${a.tone}18`, borderColor: `${a.tone}4d` }}
                    >
                      {a.icon}
                    </div>
                    <span
                      className="text-[8px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border text-right"
                      style={{ color: a.tone, background: `${a.tone}14`, borderColor: `${a.tone}33` }}
                    >
                      {a.eyebrow}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl font-black text-white mb-3">{a.name}</h2>
                  <p className="text-[13px] text-[#aab2c5] leading-relaxed line-clamp-4">{a.lede}</p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    {a.chips.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border"
                        style={{ color: `${a.tone}cc`, background: `${a.tone}10`, borderColor: `${a.tone}30` }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className="relative z-10 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mt-7"
                  style={{ color: a.tone }}
                >
                  Explore {a.name}
                  <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
