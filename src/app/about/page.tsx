import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92] mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">About</span>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-3">
            About NumberIQ
          </h1>
          <p className="text-sm text-[#4f7cff] font-semibold tracking-wider uppercase">
            Built by a CA, for CAs
          </p>
        </header>

        {/* Content */}
        <article className="space-y-6">
          <p className="text-base md:text-lg text-white leading-relaxed font-medium">
            NumberIQ is a finance-intelligence workspace built by a practising Chartered Accountant for CAs, finance teams and growing businesses operating across India, the UAE and Singapore.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            What we do
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            NumberIQ brings GST, direct tax, international tax, MIS and compliance into one console. It pairs a suite of secure modules (MIS dashboards, GST returns, transfer pricing, income tax and more) with free, browser-based Finance Tools — calculators and reckoners reviewed for FY 2026-27 that anyone can open instantly, with no sign-up.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            Who it's for
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Chartered Accountants, tax and finance professionals, CFOs, founders and accounts teams who need accurate, current Indian tax references and quick computations without logging in or sharing data.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            Our approach
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Every tool and article is mapped to the relevant section, rule, notification or circular, and reviewed against the latest position of law (Income-tax Act 2025, CGST Act, FEMA and allied regulations). Calculators run entirely in your browser — your figures never leave your device.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            Why "built by a CA, for CA"
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            NumberIQ exists because finance professionals deserve tools that speak their language — precise section references, correct thresholds and board-ready output, not generic calculators. It is maintained by a Mumbai-based Chartered Accountant with a Diploma in International Taxation, working in-house across multi-jurisdiction operations.
          </p>

          {/* Disclaimer Alert */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-xs md:text-sm text-[#737c92] italic mt-12 leading-relaxed">
            NumberIQ content is for general guidance only and does not constitute professional advice. Tax law changes frequently — verify the current position and consult a qualified Chartered Accountant before acting.
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
