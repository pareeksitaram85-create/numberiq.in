import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Scale, Calculator, BookOpen, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CAConsultation } from "@/components/ca-consultation";
import { AdSenseUnit } from "@/components/adsense";
import { jsonLdString } from "@/lib/json-ld";
import { GSTInterestLateFeeCalculator } from "@/components/calculators/gst-interest-late-fee";

export const metadata: Metadata = {
  title: "GST Interest Calculator & Late Fee Tool | NumberIQ",
  description: "Calculate GST interest u/s 50 (18%/24%) and late fee u/s 47 for GSTR-3B & GSTR-1 with day count and cash liability breakdown. Free FY 2026-27 tool.",
  keywords: [
    "gst interest calculator",
    "gst late fee calculator",
    "section 50 cgst act",
    "section 47 cgst act",
    "gstr 3b late fee calculator",
    "gstr 1 late fee calculator",
    "gst interest calculation on cash liability"
  ],
  alternates: {
    canonical: "https://numberiq.in/tools/gst-interest-calculator",
  },
  openGraph: {
    title: "GST Interest Calculator & Late Fee Tool | NumberIQ",
    description: "Calculate GST interest u/s 50 (18%/24%) and late fee u/s 47 for GSTR-3B & GSTR-1 with day count and cash liability breakdown. Free FY 2026-27 tool.",
    type: "website",
    url: "https://numberiq.in/tools/gst-interest-calculator",
    images: [
      {
        url: "https://numberiq.in/og-cover.png",
        width: 1200,
        height: 630,
        alt: "GST Interest & Late Fee Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GST Interest Calculator & Late Fee Tool | NumberIQ",
    description: "Calculate GST interest u/s 50 (18%/24%) and late fee u/s 47 for GSTR-3B & GSTR-1 with day count and cash liability breakdown. Free FY 2026-27 tool.",
    images: ["https://numberiq.in/og-cover.png"],
  },
};

const faqItems = [
  {
    question: "Is GST interest calculated on gross tax liability or net cash liability?",
    answer: "Under the retrospective amendment to Section 50(1) of the CGST Act (effective from 1 July 2017), interest is payable strictly on the NET CASH LIABILITY — the portion paid through the Electronic Cash Ledger after utilizing eligible Input Tax Credit (ITC). However, if GSTR-3B is filed after commencement of Section 73 or 74 proceedings, interest applies on the gross liability."
  },
  {
    question: "What is the standard interest rate for delayed GST return filing?",
    answer: "The statutory interest rate under Section 50(1) is 18% per annum. Interest is calculated on a daily basis from the day immediately following the statutory due date until the actual date of payment/filing."
  },
  {
    question: "When does the 24% interest rate apply under GST?",
    answer: "Under Section 50(3) of the CGST Act, a higher interest rate of 24% per annum applies when a taxpayer wrong claims and utilizes Input Tax Credit (ITC) or makes an undue reduction in output tax liability."
  },
  {
    question: "What is the late fee for filing GSTR-3B or GSTR-1 after the due date?",
    answer: "For taxable returns, the standard late fee is ₹50 per day (₹25 CGST + ₹25 SGST). For Nil returns (no outward turnover and no tax liability), the reduced late fee is ₹20 per day (₹10 CGST + ₹10 SGST)."
  },
  {
    question: "What are the maximum statutory late fee caps by annual turnover?",
    answer: "Under CBIC rationalization notifications (Notification No. 19/2021 & 20/2021-Central Tax):\n• Nil returns: Capped at ₹500 (₹250 CGST + ₹250 SGST)\n• Turnover up to ₹1.5 Cr: Capped at ₹2,000 (₹1,000 CGST + ₹1,000 SGST)\n• Turnover ₹1.5 Cr to ₹5 Cr: Capped at ₹5,000 (₹2,500 CGST + ₹2,500 SGST)\n• Turnover above ₹5 Cr: Capped at statutory maximum of ₹10,000 (₹5,000 CGST + ₹5,000 SGST)."
  },
  {
    question: "How are due dates calculated for QRMP taxpayers?",
    answer: "Taxpayers registered under the QRMP (Quarterly Return Monthly Payment) scheme file GSTR-3B quarterly. The due date is the 22nd of the following month for Category M1 states (Southern & Western India) and the 24th of the following month for Category M2 states (Northern & Eastern India)."
  },
  {
    question: "Does GSTR-1 carry an independent late fee?",
    answer: "Yes, Section 47 applies equally to GSTR-1. Delay in filing GSTR-1 attracts a late fee of ₹50/day (taxable) or ₹20/day (nil), which is automatically auto-populated in the subsequent month's GSTR-3B return on the GST portal."
  },
  {
    question: "Can late fee or interest be waived by the taxpayer?",
    answer: "Interest under Section 50 is mandatory and statutory; officers have no discretionary power to waive interest. Late fee under Section 47 can only be waived by specific CBIC amnesty schemes or notifications issued under Section 128 of the CGST Act."
  }
];

export default function GSTInterestCalculatorPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NumberIQ GST Interest & Late Fee Calculator",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Free statutory GST Interest (Sec 50) and Late Fee (Sec 47) calculator for GSTR-3B & GSTR-1 with day count and cash liability breakdown."
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-[#c3cbe0]">
      <Navbar />

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(appSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-xs text-[#737c92]">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white font-medium">GST Interest & Late Fee Calculator</span>
        </nav>
      </div>

      {/* Page Hero Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4f7cff]/10 border border-[#4f7cff]/20 text-[#4f7cff] text-xs font-semibold uppercase tracking-wider mb-4">
          <Scale className="w-3.5 h-3.5" /> CGST Act Sec 50 & 47 Compliance Engine
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          GST Interest & Late Fee Calculator
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#8a95ad] max-w-3xl mx-auto leading-relaxed">
          Instantly compute interest on delayed GST payments under Section 50 (18%/24% on net cash liability) and Section 47 late fees for GSTR-3B and GSTR-1 with turnover-based caps.
        </p>
      </header>

      {/* Interactive Tool Component Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <GSTInterestLateFeeCalculator />

        {/* AdSense Unit */}
        <div className="my-12">
          <AdSenseUnit slot="calculator-mid-slot" />
        </div>

        {/* Structured SEO Guide Content (800+ Words) */}
        <article className="mt-16 bg-[#121624] border border-[#23293e] rounded-2xl p-6 md:p-10 text-sm md:text-base leading-relaxed space-y-10">
          
          {/* Section 1: Overview & Section 50 Rules */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#4f7cff]" />
              How GST Interest is Calculated under Section 50
            </h2>
            <p>
              Under the Central Goods and Services Tax (CGST) Act 2017, registered taxpayers who fail to pay output tax liability on or before the statutory due date are liable to pay interest for the period of delay. Section 50 governs interest liability and establishes clear rules for applicability, rate, and computation base.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="bg-[#1a2138] border border-[#23293e] rounded-xl p-5 space-y-2">
                <h3 className="text-base font-bold text-[#4f7cff]">1. Net Cash Liability Principle (18% p.a.)</h3>
                <p className="text-xs md:text-sm text-[#a3b1cc]">
                  Retrospectively amended from 1 July 2017 via the Finance Act 2021, interest under <strong>Section 50(1)</strong> is calculated strictly on the <strong>net cash liability</strong> paid through the Electronic Cash Ledger. Interest does NOT apply on the portion of tax discharged by utilizing Electronic Credit Ledger balances.
                </p>
              </div>

              <div className="bg-[#1a2138] border border-[#23293e] rounded-xl p-5 space-y-2">
                <h3 className="text-base font-bold text-rose-400">2. Ineligible ITC Claim & Utilization (24% p.a.)</h3>
                <p className="text-xs md:text-sm text-[#a3b1cc]">
                  Under <strong>Section 50(3)</strong>, if a taxpayer wrongly claims and utilizes Input Tax Credit (ITC) or makes an undue reduction in output tax liability, interest is charged at <strong>24% per annum</strong> on the wrongly utilized credit amount.
                </p>
              </div>
            </div>

            <p className="text-[#a3b1cc]">
              <strong>Interest Computation Formula:</strong>
            </p>
            <div className="bg-[#1a2138] border border-[#4f7cff]/30 p-4 rounded-xl font-mono text-xs md:text-sm text-[#4f7cff] overflow-x-auto">
              Interest Payable = (Net Cash Liability × Interest Rate × Days of Delay) ÷ 36500
            </div>
            <p className="text-xs text-[#8a95ad]">
              *Days of delay are counted starting from the day immediately following the statutory due date up to the date of actual payment in the Electronic Cash Ledger.
            </p>
          </section>

          {/* Section 2: Section 47 Late Fee Rules */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <Scale className="w-6 h-6 text-[#4f7cff]" />
              GST Late Fee Rules under Section 47 & Turnover Rationalization Caps
            </h2>
            <p>
              Section 47 of the CGST Act levies an automatic daily late fee for failure to furnish GST returns (GSTR-3B, GSTR-1, GSTR-4, GSTR-9) within the prescribed statutory due dates. To ease compliance burden on micro, small, and medium enterprises (MSMEs), the CBIC introduced rationalized caps based on annual aggregate turnover via Notification No. 19/2021 and 20/2021-Central Tax.
            </p>

            {/* Late Fee Rate Reference Table */}
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left text-xs md:text-sm text-[#c3cbe0] border-collapse">
                <thead>
                  <tr className="border-b border-[#23293e] bg-[#1a2138]">
                    <th className="py-3 px-4 text-white font-semibold">Category / Turnover Slab</th>
                    <th className="py-3 px-4 text-white font-semibold">Daily Fee (CGST + SGST)</th>
                    <th className="py-3 px-4 text-white font-semibold">Maximum Statutory Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23293e]">
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Nil Return (No Turnover & No Liability)</td>
                    <td className="py-3 px-4 text-amber-300">₹20 / day (₹10 + ₹10)</td>
                    <td className="py-3 px-4 text-white font-mono">₹500 (₹250 + ₹250)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Turnover Up to ₹1.5 Crore</td>
                    <td className="py-3 px-4 text-amber-300">₹50 / day (₹25 + ₹25)</td>
                    <td className="py-3 px-4 text-white font-mono">₹2,000 (₹1,000 + ₹1,000)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Turnover ₹1.5 Crore to ₹5 Crore</td>
                    <td className="py-3 px-4 text-amber-300">₹50 / day (₹25 + ₹25)</td>
                    <td className="py-3 px-4 text-white font-mono">₹5,000 (₹2,500 + ₹2,500)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Turnover Above ₹5 Crore</td>
                    <td className="py-3 px-4 text-amber-300">₹50 / day (₹25 + ₹25)</td>
                    <td className="py-3 px-4 text-white font-mono">₹10,000 (₹5,000 + ₹5,000)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Detailed Real Worked Example */}
          <section className="space-y-4 bg-[#1a2138]/50 border border-[#23293e] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Real Worked Example: Step-by-Step Statutory Computation
            </h2>
            <p className="text-sm">
              Consider a business registered under regular GST with an annual aggregate turnover below ₹1.5 Crore. The business has a net cash tax liability of <strong>₹1,00,000</strong> for GSTR-3B of May 2026.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-[#a3b1cc]">
              <li><strong>Statutory Due Date:</strong> 20 June 2026</li>
              <li><strong>Actual Filing Date:</strong> 15 July 2026</li>
              <li><strong>Return Type:</strong> GSTR-3B (Taxable)</li>
            </ul>

            <div className="bg-[#121624] p-4 rounded-xl border border-[#23293e] space-y-3 text-xs md:text-sm">
              <div className="flex justify-between border-b border-[#23293e] pb-2">
                <span>1. Delay Period:</span>
                <span className="font-mono font-bold text-white">21 June to 15 July = 25 Days</span>
              </div>
              <div className="flex justify-between border-b border-[#23293e] pb-2">
                <span>2. Sec 50 Interest (@18% p.a.):</span>
                <span className="font-mono text-[#4f7cff] font-bold">(₹1,00,000 × 18 × 25) ÷ 36,500 = ₹1,232.88 (₹1,233)</span>
              </div>
              <div className="flex justify-between border-b border-[#23293e] pb-2">
                <span>3. Sec 47 Late Fee (@₹50/day):</span>
                <span className="font-mono text-amber-300 font-bold">25 days × ₹50/day = ₹1,250 (CGST ₹625 + SGST ₹625)</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-white">Total Amount Payable to Clear Statutory Demand:</span>
                <span className="font-mono text-emerald-400 font-bold text-base">₹1,00,000 + ₹1,232.88 + ₹1,250 = ₹1,02,482.88</span>
              </div>
            </div>
          </section>

          {/* Section 4: FAQs */}
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-[#4f7cff]" />
              Frequently Asked Questions (FAQs)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqItems.map((item, idx) => (
                <div key={idx} className="bg-[#1a2138] border border-[#23293e] rounded-xl p-5 space-y-2">
                  <h3 className="text-sm md:text-base font-bold text-white">{item.question}</h3>
                  <p className="text-xs md:text-sm text-[#8a95ad] leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CA Consultation CTA */}
          <div className="pt-6">
            <CAConsultation toolName="GST Interest & Late Fee Calculator" />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
