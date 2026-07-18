import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Tax Intelligence Universe — Interactive Knowledge Map | NumberIQ",
  description:
    "Explore the NumberIQ Tax Intelligence Universe — an interactive 3D visual map of Indian tax concepts, GST, Income Tax, TDS, Transfer Pricing, and compliance knowledge.",
  alternates: {
    canonical: "https://numberiq.in/universe",
  },
  openGraph: {
    title: "Tax Intelligence Universe | NumberIQ",
    description:
      "Explore GST, Income Tax, International Tax, and Compliance in one interactive 3D universe. Built by CAs, powered by AI.",
    type: "website",
    url: "https://numberiq.in/universe",
    images: [{ url: "/og-cover.png", alt: "NumberIQ Tax Intelligence Universe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tax Intelligence Universe | NumberIQ",
    description: "Interactive 3D knowledge map of Indian tax law — explore 7 layers of GST, Income Tax, Jurisprudence, and more.",
    images: ["/og-cover.png"],
  },
};

export default function UniversePage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#020510] text-white overflow-hidden">
      {/* Navbar sits above the universe */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Full-screen universe iframe */}
      <div className="flex-1 relative" style={{ marginTop: "-1px" }}>
        <iframe
          src="/tools/universe.html"
          title="NumberIQ Tax Intelligence Universe"
          className="w-full h-full border-0 absolute inset-0"
          style={{ minHeight: "calc(100vh - 64px)" }}
          loading="eager"
          scrolling="no"
          allow="autoplay"
        />
      </div>

      {/* Thin bottom bar with back link */}
      <div className="relative z-20 flex items-center justify-between px-6 py-2 border-t border-white/5 bg-[#020510]/80 backdrop-blur-sm">
        <Link
          href="/"
          className="text-[9px] font-mono uppercase tracking-widest text-[#5c6a8f] hover:text-[#00f5ff] transition-colors"
        >
          ← numberiq.in
        </Link>
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#3a4560]">
          Tax Intelligence Universe · v1.0
        </span>
        <Link
          href="/tools"
          className="text-[9px] font-mono uppercase tracking-widest text-[#5c6a8f] hover:text-[#00ffb3] transition-colors"
        >
          All Tools →
        </Link>
      </div>
    </div>
  );
}
