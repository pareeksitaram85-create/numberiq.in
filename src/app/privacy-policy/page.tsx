import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <span className="text-white font-semibold">Privacy Policy</span>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#737c92] font-semibold tracking-wider">
            Effective: June 2026 &middot; Last reviewed: June 2026
          </p>
        </header>

        {/* Content */}
        <article className="space-y-6">
          <p className="text-base md:text-lg text-white leading-relaxed font-medium">
            NumberIQ does not collect personal data. Our calculators and tools run entirely in your browser, and no figures you enter are transmitted to or stored on our servers.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            1. Information we collect
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            NumberIQ is a finance-reference website. We do not ask you to create an account, and we do not collect names, email addresses, phone numbers, or financial information. Any numbers you type into our calculators (such as turnover, tax, or interest figures) are processed locally in your browser using JavaScript and are <strong className="text-white">never sent to us</strong>.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            2. Cookies and analytics
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            We may use privacy-respecting analytics to understand aggregate, anonymous traffic (such as page views and country-level location). These do not identify you personally.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            3. Advertising (Google AdSense)
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            This site may display advertising served by Google AdSense. Google and its partners use cookies to serve ads based on a user's prior visits to this and other websites:
          </p>
          <ul className="list-disc list-inside text-sm md:text-base text-[#737c92] space-y-2.5 leading-relaxed">
            <li>
              Third-party vendors, including Google, use cookies to serve ads based on prior visits.
            </li>
            <li>
              Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.
            </li>
            <li>
              You may opt out of personalised advertising by visiting the{" "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#4f7cff] transition-colors underline font-semibold">Google Ads Settings</a>. You can also opt out of third-party vendor cookies by visiting{" "}
              <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#4f7cff] transition-colors underline font-semibold">aboutads.info</a>.
            </li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            4. Third-party links
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            NumberIQ links to government and authority sources (such as{" "}
            <a href="https://www.incometax.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">incometax.gov.in</a>,{" "}
            <a href="https://www.gst.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">gst.gov.in</a>,{" "}
            <a href="https://www.cbic.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">cbic.gov.in</a>,{" "}
            <a href="https://www.mca.gov.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">mca.gov.in</a>, and{" "}
            <a href="https://www.rbi.org.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">rbi.org.in</a>). We are not responsible for the privacy practices of these external sites.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            5. Children's privacy
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            This site is intended for finance and tax professionals and businesses. It is not directed at children and does not knowingly collect data from children.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            6. Changes to this policy
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            We may update this policy from time to time. The effective date above reflects the latest version.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            7. Contact
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            For privacy queries, contact us via{" "}
            <Link href="/contact" className="text-white hover:text-[#4f7cff] transition-colors underline font-semibold">our contact page</Link>.
          </p>

          {/* Policy Disclaimer Alert */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-xs md:text-sm text-[#737c92] italic mt-12 leading-relaxed">
            NumberIQ content is for general guidance only and does not constitute professional advice. Tax law changes frequently — verify the current position and consult a qualified Chartered Accountant before acting.
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
