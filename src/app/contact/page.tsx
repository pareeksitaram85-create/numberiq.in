import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight, Mail } from "lucide-react";

export default function ContactPage() {
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
          <span className="text-white font-semibold">Contact</span>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-white/5 pb-8">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-3">
            Contact Us
          </h1>
          <p className="text-sm text-[#4f7cff] font-semibold tracking-wider uppercase">
            We usually reply in 2–3 working days
          </p>
        </header>

        {/* Content */}
        <article className="space-y-6">
          <p className="text-base md:text-lg text-white leading-relaxed font-medium">
            We'd love to hear from you — feedback on a tool, a correction, a feature request, or a partnership enquiry.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4 flex items-center gap-2.5">
            <Mail className="text-[#4f7cff]" size={22} />
            Email
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Reach us at <a href="mailto:pareek.sitaram85@gmail.com" className="text-white hover:text-[#4f7cff] transition-colors font-bold underline">pareek.sitaram85@gmail.com</a>. We aim to reply within 2–3 working days.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            What to write in for
          </h2>
          <ul className="list-disc list-inside text-sm md:text-base text-[#737c92] space-y-3.5 leading-relaxed">
            <li>
              <strong className="text-white">Tool feedback or corrections</strong> — spotted an outdated rate, threshold or section? Tell us and we'll fix it.
            </li>
            <li>
              <strong className="text-white">Feature requests</strong> — a calculator or reckoner you'd like added to the suite.
            </li>
            <li>
              <strong className="text-white">Content &amp; data accuracy</strong> — questions on a guide or the law referenced.
            </li>
            <li>
              <strong className="text-white">Partnerships &amp; advertising</strong> — collaboration, sponsorship or media enquiries.
            </li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold text-white mt-10 mb-4">
            Please note
          </h2>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            NumberIQ provides general reference information and tools. We are not able to offer individual tax or legal opinions by email. For advice on your specific situation, please consult a qualified Chartered Accountant.
          </p>

          {/* Disclaimer Alert */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-xs md:text-sm text-[#737c92] italic mt-12 leading-relaxed">
            By contacting us you agree that email is not a secure channel; please do not send confidential financial or personal data.
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
