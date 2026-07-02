import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function DisclaimerPage() {
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
          <span className="text-white font-semibold">Disclaimer</span>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-3">
            Disclaimer
          </h1>
          <p className="text-sm text-[#4f7cff] font-semibold tracking-wider uppercase">
            General guidance only — not professional advice
          </p>
        </header>

        {/* Content */}
        <article className="space-y-6">
          <p className="text-base md:text-lg text-white leading-relaxed font-medium">
            The information, calculators and tools on NumberIQ are provided for general informational and educational purposes only and do not constitute professional, legal, tax, accounting or financial advice.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            1. Not professional advice
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Nothing on this website should be relied upon as a substitute for advice from a qualified Chartered Accountant, tax advisor or legal professional. You should obtain professional advice tailored to your specific facts before making any decision or taking any action.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            2. Accuracy and currency of information
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Indian tax law — including the Income-tax Act 2025, CGST/SGST/IGST Acts, FEMA and allied rules — changes frequently through amendments, notifications, circulars and case law. While we review content against the latest available position (FY 2026-27 unless stated), we make no warranty that all information is complete, current or error-free. Always verify the present position against official sources:{" "}
            <a href="https://www.incometax.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">incometax.gov.in</a>,{" "}
            <a href="https://www.gst.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">gst.gov.in</a>,{" "}
            <a href="https://www.cbic.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">cbic.gov.in</a>,{" "}
            <a href="https://www.mca.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">mca.gov.in</a>, and{" "}
            <a href="https://www.rbi.org.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">rbi.org.in</a>.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            3. Calculator results
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Our calculators run in your browser and produce indicative estimates based on the inputs you provide and the assumptions stated. Results may not reflect every provision applicable to your case (surcharge, marginal relief, exemptions, special rates, etc.) and should be independently verified before filing or payment.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            4. No liability
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            To the maximum extent permitted by law, NumberIQ and its author accept no liability for any loss or damage — direct, indirect or consequential — arising from use of, or reliance on, this website, its tools or its content.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            5. External links
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            This site links to government portals and third-party resources for convenience. We are not responsible for the content, accuracy or availability of external sites.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            6. Advertising
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            This site may display third-party advertising (including Google AdSense). Advertisements do not constitute an endorsement. See our{" "}
            <Link href="/privacy-policy" className="text-white hover:text-[#4f7cff] transition-colors underline font-semibold">Privacy Policy</Link>{" "}
            for how advertising cookies are used.
          </p>

          {/* Accept Disclaimer Notice */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-xs md:text-sm text-[#737c92] italic mt-12 leading-relaxed">
            By using NumberIQ you acknowledge and accept this disclaimer. If you do not agree, please discontinue use of the website.
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
