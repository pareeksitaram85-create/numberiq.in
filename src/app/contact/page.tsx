import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight, Mail, ArrowRight, Clock, MapPin, Wrench, Lightbulb, FileText, Handshake } from "lucide-react";

export const metadata = {
  title: "Contact Us — NumberIQ | Support & Feedback",
  description: "Get in touch with NumberIQ. Share your feedback, request new calculators, report issues, or inquire about collaboration opportunities.",
  alternates: {
    canonical: "https://numberiq.in/contact",
  },
};

export default function ContactPage() {
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
          <span className="text-white font-semibold">Contact</span>
        </div>

        {/* Hero */}
        <header className="mb-12 max-w-3xl">
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-2.5 py-1 rounded border border-[#4f7cff]/20">
            Contact
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-black text-white tracking-tight mt-5 mb-6 leading-[1.05]">
            Get in <span className="bg-gradient-to-r from-[#4f7cff] to-[#34d399] bg-clip-text text-transparent">touch.</span>
          </h1>
          <p className="text-base md:text-lg text-[#aab2c5] leading-relaxed">
            Feedback on a tool, a correction, a feature request, or a collaboration enquiry — write
            in and we will get back to you.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
          {/* Email card */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-3xl border border-[#4f7cff]/20 bg-gradient-to-br from-[#0a0f1e] to-[#050810] p-8 md:p-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#4f7cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#4f7cff]/15 border border-[#4f7cff]/30 flex items-center justify-center text-[#4f7cff] mb-6">
                <Mail size={20} />
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Email us</h2>
              <p className="text-sm text-[#aab2c5] leading-relaxed mb-6">
                The fastest way to reach us. Include the tool name or article link if your message
                is about something specific.
              </p>
              <a
                href="mailto:pareek.sitaram85@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-xs font-bold uppercase tracking-wider text-white hover:opacity-95 transition-opacity break-all"
              >
                pareek.sitaram85@gmail.com
                <ArrowRight size={14} className="flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Response time */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-1 relative overflow-hidden rounded-3xl border border-[#34d399]/20 bg-gradient-to-br from-[#06120e] to-[#050810] p-8">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#34d399]/8 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#34d399]/15 border border-[#34d399]/30 flex items-center justify-center text-[#34d399] mb-5">
                  <Clock size={18} />
                </div>
                <span className="font-display text-3xl font-black text-[#34d399] block">2–3</span>
                <span className="text-xs text-[#aab2c5] mt-1 block">working days to reply</span>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden rounded-3xl border border-[#f4b740]/20 bg-gradient-to-br from-[#130e03] to-[#050810] p-8">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#f4b740]/8 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#f4b740]/15 border border-[#f4b740]/30 flex items-center justify-center text-[#f4b740] mb-5">
                  <MapPin size={18} />
                </div>
                <span className="font-display text-lg font-bold text-white block">Mumbai, India</span>
                <span className="text-xs text-[#aab2c5] mt-1 block">
                  Serving India, the UAE and Singapore
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reasons to write in */}
        <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-8">
          What to write in for
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {[
            {
              icon: Wrench,
              title: "Tool feedback or corrections",
              tone: "#4f7cff",
              body: "Spotted an outdated rate, threshold or section? Tell us and we will fix it.",
            },
            {
              icon: Lightbulb,
              title: "Feature requests",
              tone: "#34d399",
              body: "A calculator or reckoner you would like added to the suite.",
            },
            {
              icon: FileText,
              title: "Content & data accuracy",
              tone: "#f4b740",
              body: "Questions on a guide or on the law referenced in it.",
            },
            {
              icon: Handshake,
              title: "Partnerships & advertising",
              tone: "#38e1d6",
              body: "Collaboration, sponsorship or media enquiries.",
            },
          ].map((r) => (
            <div
              key={r.title}
              className="relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br from-[#07091a] to-[#050810] flex items-start gap-4"
              style={{ borderColor: `${r.tone}22` }}
            >
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0"
                style={{ color: r.tone, background: `${r.tone}18`, borderColor: `${r.tone}40` }}
              >
                <r.icon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">{r.title}</h3>
                <p className="text-xs text-[#737c92] leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-bold text-white mb-2">Please note</h3>
            <p className="text-xs text-[#737c92] leading-relaxed">
              NumberIQ provides general reference information and tools. It is maintained by an
              individual CA and cannot offer personalised tax or legal opinions by email. For advice
              on your specific situation, please consult a qualified Chartered Accountant.
            </p>
          </div>
          <div className="rounded-2xl border border-[#f4b740]/15 bg-[#f4b740]/[0.03] p-6">
            <h3 className="text-sm font-bold text-[#f4b740] mb-2">Before you send</h3>
            <p className="text-xs text-[#737c92] leading-relaxed">
              Email is not a secure channel. Please do not send confidential financial or personal
              data — including client PANs, GSTINs tied to names, or scanned documents.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
