import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CAConsultation } from "@/components/ca-consultation";
import { practiceAreas, practiceSlugs } from "@/lib/practice-content";
import { ChevronRight, ArrowRight, CalendarClock, AlertTriangle, Check } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return practiceSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = practiceAreas[slug];
  if (!area) return {};

  const url = `https://numberiq.in/practice/${area.slug}`;
  return {
    title: area.metaTitle,
    description: area.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: area.metaTitle,
      description: area.metaDescription,
      type: "website",
      url,
      images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: `NumberIQ ${area.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: area.metaTitle,
      description: area.metaDescription,
      images: ["/og-cover.png"],
    },
  };
}

export default async function PracticePage({ params }: PageProps) {
  const { slug } = await params;
  const area = practiceAreas[slug];
  if (!area) notFound();

  const t = area.tone;
  const url = `https://numberiq.in/practice/${area.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: area.name,
        description: area.metaDescription,
        serviceType: area.name,
        areaServed: { "@type": "Country", name: "India" },
        provider: { "@type": "Organization", name: "NumberIQ", url: "https://numberiq.in" },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: area.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://numberiq.in" },
          { "@type": "ListItem", position: 2, name: "Practice Areas", item: "https://numberiq.in/practice" },
          { "@type": "ListItem", position: 3, name: area.name, item: url },
        ],
      },
    ],
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a] overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Ambient field, tinted to the practice area */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[55%] h-[50%] rounded-full blur-[140px] pointer-events-none nq-drift-a"
        style={{ background: `${t}14` }}
      />
      <div
        className="absolute top-[45%] left-[-12%] w-[45%] h-[45%] rounded-full blur-[150px] pointer-events-none nq-drift-b"
        style={{ background: `${t}0d` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-6xl mx-auto w-full relative z-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#737c92] mb-10" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/practice" className="hover:text-white transition-colors">Practice Areas</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">{area.name}</span>
        </nav>

        {/* Hero */}
        <header className="mb-14">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl border flex items-center justify-center text-sm font-black font-mono"
              style={{ color: t, background: `${t}18`, borderColor: `${t}4d`, boxShadow: `0 0 32px ${t}26` }}
            >
              {area.icon}
            </div>
            <span
              className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded border"
              style={{ color: t, background: `${t}14`, borderColor: `${t}33` }}
            >
              {area.eyebrow}
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6 bg-gradient-to-b from-white via-[#eef1f8] to-[#8a93a8] bg-clip-text text-transparent">
            {area.name}
          </h1>

          <p className="text-base md:text-lg text-[#c3cad9] leading-relaxed max-w-3xl mb-8">
            {area.lede}
          </p>

          <div className="flex flex-wrap gap-2">
            {area.chips.map((c) => (
              <span
                key={c}
                className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border"
                style={{ color: `${t}dd`, background: `${t}10`, borderColor: `${t}30` }}
              >
                {c}
              </span>
            ))}
          </div>
        </header>

        {/* Stat band */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {area.stats.map((s) => (
            <div
              key={s.label}
              className="group nq-glass nq-glass-hover backdrop-blur-xl relative overflow-hidden rounded-2xl p-6 border transition-all duration-300"
              style={{ borderColor: `${t}26` }}
            >
              <span aria-hidden className="nq-sheen rounded-2xl" />
              <div
                aria-hidden
                className="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity duration-500"
                style={{ background: `${t}22` }}
              />
              <div className="relative z-10">
                <span className="font-display text-2xl sm:text-3xl font-black block tracking-tight" style={{ color: t }}>
                  {s.value}
                </span>
                <span className="text-[11px] text-[#aab2c5] mt-2 block leading-snug">{s.label}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Overview */}
        <section className="mb-20">
          <h2 className="font-display text-2xl md:text-4xl font-black text-white mb-8 leading-tight">
            {area.overviewHeading}
          </h2>
          <div className="flex flex-col gap-5 max-w-4xl">
            {area.overview.map((p, i) => (
              <p key={i} className="text-sm md:text-base text-[#c3cad9] leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mb-20">
          <h2 className="font-display text-2xl md:text-4xl font-black text-white mb-8 leading-tight">
            What We Handle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {area.services.map((s) => (
              <div
                key={s.title}
                className="group nq-glass nq-glass-hover backdrop-blur-xl relative overflow-hidden rounded-2xl p-6 border transition-all duration-300"
                style={{ borderColor: `${t}22` }}
              >
                <span aria-hidden className="nq-sheen rounded-2xl" />
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `${t}18` }}
                />
                <div className="relative z-10">
                  <div
                    className="w-9 h-9 rounded-xl border flex items-center justify-center mb-4"
                    style={{ color: t, background: `${t}18`, borderColor: `${t}40` }}
                  >
                    <Check size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-[#aab2c5] leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deadlines */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <CalendarClock style={{ color: t }} size={22} />
            <h2 className="font-display text-2xl md:text-4xl font-black text-white leading-tight">
              {area.deadlinesHeading}
            </h2>
          </div>

          <div className="nq-glass backdrop-blur-xl rounded-2xl border overflow-hidden" style={{ borderColor: `${t}22` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-[10px] uppercase tracking-widest font-bold text-[#737c92] px-5 py-4">Form</th>
                    <th className="text-[10px] uppercase tracking-widest font-bold text-[#737c92] px-5 py-4">What it covers</th>
                    <th className="text-[10px] uppercase tracking-widest font-bold text-[#737c92] px-5 py-4 whitespace-nowrap">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {area.deadlines.map((d) => (
                    <tr key={d.form + d.what} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-4 text-xs font-bold font-mono whitespace-nowrap" style={{ color: t }}>
                        {d.form}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#c3cad9] leading-relaxed">{d.what}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-white whitespace-nowrap">{d.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[10px] text-[#737c92] mt-3 leading-relaxed">
            Dates are the ordinary statutory positions and are frequently extended by notification. Confirm the current
            position before relying on any of them.
          </p>
        </section>

        {/* Pitfalls */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="text-[#f4b740]" size={22} />
            <h2 className="font-display text-2xl md:text-4xl font-black text-white leading-tight">
              {area.pitfallsHeading}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {area.pitfalls.map((p) => (
              <div
                key={p}
                className="flex items-start gap-3 rounded-2xl border border-[#f4b740]/15 bg-[#f4b740]/[0.04] p-5"
              >
                <AlertTriangle size={14} className="text-[#f4b740] mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-[#c3cad9] leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-20">
          <h2 className="font-display text-2xl md:text-4xl font-black text-white mb-8 leading-tight">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-3">
            {area.faqs.map((f) => (
              <details
                key={f.question}
                className="group nq-glass backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-300"
                style={{ borderColor: `${t}1f` }}
              >
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-white">{f.question}</h3>
                  <ChevronRight
                    size={16}
                    className="flex-shrink-0 transition-transform duration-300 group-open:rotate-90"
                    style={{ color: t }}
                  />
                </summary>
                <div className="px-6 pb-5 -mt-1">
                  <p className="text-[13px] text-[#aab2c5] leading-relaxed">{f.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Related tools */}
        <section className="mb-16">
          <h2 className="font-display text-xl md:text-2xl font-black text-white mb-6">Related Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {area.relatedTools.map((rt) => (
              <Link
                key={rt.slug}
                href={`/tools/${rt.slug}`}
                className="group nq-glass nq-glass-hover backdrop-blur-xl rounded-2xl border p-5 flex items-center justify-between gap-3 transition-all duration-300"
                style={{ borderColor: `${t}22` }}
              >
                <span className="text-xs font-semibold text-white group-hover:text-[color:var(--t)]" style={{ ["--t" as string]: t }}>
                  {rt.name}
                </span>
                <ArrowRight size={13} style={{ color: t }} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl nq-glass backdrop-blur-xl border p-10 text-center" style={{ borderColor: `${t}33` }}>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 60% at 50% 0%, ${t}1a 0%, transparent 70%)` }}
          />
          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-3">
              Need help with {area.name.toLowerCase()}?
            </h2>
            <p className="text-sm text-[#aab2c5] max-w-lg mx-auto mb-7 leading-relaxed">
              Speak to a Chartered Accountant who works on these matters day to day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-95"
                style={{ background: `linear-gradient(135deg, ${t}, ${t}bb)` }}
              >
                Get in touch
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/tools"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
              >
                Explore free tools
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <CAConsultation toolName={area.name} />
        </div>

        <p className="text-[10px] text-[#737c92] mt-10 leading-relaxed border-t border-white/5 pt-6">
          General guidance only, current to the Income-tax Act 1961 numbering that governs assessment years up to and
          including the year ending 31 March 2026. The Income-tax Act 2025 applies from 1 April 2026. Thresholds,
          rates and due dates change frequently — verify the position and take advice before acting.
        </p>
      </main>

      <Footer />
    </div>
  );
}
