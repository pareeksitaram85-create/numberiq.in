import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import updatesData from "../../../content/updates.json";

export const revalidate = 86400; // Cache page for 24 hours (daily updates check)

export const metadata = {
  title: "Weekly Tax & Compliance Radar | NumberIQ",
  description: "Stay updated with weekly regulatory notifications and circulars from CBDT, CBIC, RBI, MCA and GSTN, curated for tax practitioners.",
  alternates: {
    canonical: "https://numberiq.in/updates",
  },
  openGraph: {
    title: "Weekly Tax & Compliance Radar | NumberIQ",
    description: "Stay updated with weekly regulatory notifications and circulars from CBDT, CBIC, RBI, MCA and GSTN, curated for tax practitioners.",
    type: "website",
    url: "https://numberiq.in/updates",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "NumberIQ Updates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekly Tax & Compliance Radar | NumberIQ",
    description: "Stay updated with weekly regulatory notifications and circulars from CBDT, CBIC, RBI, MCA and GSTN, curated for tax practitioners.",
    images: ["/og-cover.png"],
  },
};

interface UpdateItem {
  date: string;
  source: string;
  title: string;
  summary: string;
  link: string;
}

interface WeekGroup {
  weekOf: string;
  items: UpdateItem[];
}

export default function UpdatesPage() {
  const groups: WeekGroup[] = updatesData as WeekGroup[];

  const getSourceBadgeClass = (source: string) => {
    switch (source.toUpperCase()) {
      case "CBDT":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "CBIC":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "GSTN":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "RBI":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "MCA":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-white/5 text-[#aab2c5] border-white/10";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#34d399]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6 max-w-4xl mx-auto w-full relative z-10">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92] mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">Updates</span>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-white/5 pb-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 text-xs font-semibold text-[#34d399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
            Tax Radar
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
            Weekly Tax &amp; Compliance Updates
          </h1>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed max-w-2xl">
            The week&apos;s important CBDT, CBIC, MCA and RBI updates — notifications, circulars and due-date changes — curated for practitioners, refreshed every Saturday.
          </p>
        </header>

        {/* Updates Timeline List */}
        <div className="space-y-12">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-6">
              {/* Week Header */}
              <div className="flex items-center gap-4">
                <h2 className="text-sm md:text-base font-bold text-[#34d399] uppercase tracking-wider font-mono">
                  Week of {formatDate(group.weekOf)}
                </h2>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>

              {/* Items in this week */}
              <div className="space-y-6">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="group relative border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-[#34d399]/20 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSourceBadgeClass(item.source)}`}>
                          {item.source}
                        </span>
                        <span className="text-xs text-[#737c92] flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#34d399] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-[#aab2c5] leading-relaxed mb-4">
                      {item.summary}
                    </p>

                    <div className="flex justify-start">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#aab2c5] hover:text-white transition-colors border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl"
                      >
                        <span>View Official Source</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
