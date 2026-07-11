import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Shield, ExternalLink, Activity, Table, BarChart3, Megaphone, Globe2, Lock, ChevronRight, FileSpreadsheet, FileCode2 } from "lucide-react";

export const metadata: Metadata = {
  title: "NumberIQ",
  robots: { index: false, follow: false },
};

interface Submodule {
  name: string;
  href: string | null;
}

interface BoardroomModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string | null; // null = not yet linked
  icon: React.ReactNode;
  accent: string;
  features: { icon: React.ReactNode; label: string }[];
  submodules: Submodule[];
}

const MODULES: BoardroomModule[] = [
  {
    id: "uaemis",
    name: "UAE MIS",
    tagline: "Executive Performance Dashboard",
    description:
      "Live Board KPI summary, consolidation metrics, and monthly financial ledger reports. Connects directly to your Supabase ledger storage.",
    href: "/api/module/uaemis",
    icon: <BarChart3 size={20} />,
    accent: "#4f7cff",
    features: [
      { icon: <BarChart3 size={13} />, label: "Interactive Charts" },
      { icon: <Table size={13} />, label: "Financial Matrices" },
      { icon: <Activity size={13} />, label: "Real-time Sync" },
    ],
    submodules: [],
  },
  {
    id: "marketing-tracker",
    name: "Marketing Tracker",
    tagline: "Campaign & Spend Analytics",
    description:
      "Track campaign performance, marketing spend effectiveness, channel ROI and lead attribution across business units.",
    href: null,
    icon: <Megaphone size={20} />,
    accent: "#f59e0b",
    features: [
      { icon: <Activity size={13} />, label: "Campaign ROI" },
      { icon: <BarChart3 size={13} />, label: "Channel Analytics" },
      { icon: <Table size={13} />, label: "Spend Ledger" },
    ],
    submodules: [],
  },
  {
    id: "invoice-to-tally",
    name: "Invoice → Tally Converter",
    tagline: "Automated Voucher Entry",
    description:
      "Read supplier invoices (PDF/scan), match party names against your Tally ledger list, and download import-ready Tally XML vouchers, ledger masters and Excel registers. Up to 500 invoices per batch.",
    href: "/api/module/invoice-to-tally",
    icon: <FileSpreadsheet size={20} />,
    accent: "#a78bfa",
    features: [
      { icon: <FileCode2 size={13} />, label: "Tally XML Vouchers" },
      { icon: <Table size={13} />, label: "Ledger Auto-Match" },
      { icon: <Activity size={13} />, label: "AI Invoice Reading" },
    ],
    submodules: [],
  },
  {
    id: "invoice-to-tally-uae",
    name: "UAE Invoice → Tally (AED)",
    tagline: "Automated VAT Voucher Entry",
    description:
      "AI reads UAE tax invoices (PDF/scan) — TRN, taxable value and 5% VAT — matches party names against your Tally ledger list, and downloads AED voucher XML, ledger masters and Excel registers. Up to 500 invoices per batch.",
    href: "/api/module/invoice-to-tally-uae",
    icon: <FileSpreadsheet size={20} />,
    accent: "#bd9646",
    features: [
      { icon: <FileCode2 size={13} />, label: "AED Tally Vouchers" },
      { icon: <Table size={13} />, label: "TRN & VAT Checks" },
      { icon: <Activity size={13} />, label: "AI Invoice Reading" },
    ],
    submodules: [],
  },
  {
    id: "international-business",
    name: "International Business",
    tagline: "Cross-Border Operations MIS",
    description:
      "Consolidated view of international entities — revenue, compliance calendar, transfer pricing data and country-wise P&L.",
    href: "/api/module/international-business",
    icon: <Globe2 size={20} />,
    accent: "#34d399",
    features: [
      { icon: <Globe2 size={13} />, label: "Entity Consolidation" },
      { icon: <Table size={13} />, label: "Country P&L" },
      { icon: <Activity size={13} />, label: "Compliance Calendar" },
    ],
    submodules: [],
  },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-12 px-6 max-w-[1200px] mx-auto w-full relative z-10 flex flex-col gap-8">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4f7cff]/10 border border-[#4f7cff]/20 flex items-center justify-center text-[#4f7cff]">
              <Shield size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">Dashboard — Analytics Modules</h1>
              <p className="text-[10px] text-[#737c92]">Internal Corporate MIS Modules · Access is per-module</p>
            </div>
          </div>
          <div className="text-[10px] text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 px-2.5 py-0.5 rounded font-mono">
            SECURED EXECUTIVE SESSION
          </div>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODULES.map((m) => {
            const live = !!m.href;
            return (
              <div
                key={m.id}
                className="border border-white/10 bg-white/[0.02] rounded-3xl p-7 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-5"
              >
                <div
                  className="absolute top-0 right-0 w-[120px] h-[120px] blur-3xl pointer-events-none"
                  style={{ background: `linear-gradient(to bottom right, ${m.accent}33, transparent)` }}
                />

                {/* Icon + status */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-11 h-11 rounded-xl border flex items-center justify-center"
                    style={{ color: m.accent, borderColor: `${m.accent}33`, backgroundColor: `${m.accent}1a` }}
                  >
                    {m.icon}
                  </div>
                  {live ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded border text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded border text-[#737c92] bg-white/[0.03] border-white/10">
                      COMING SOON
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-lg font-display font-bold text-white tracking-tight">{m.name}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: m.accent }}>{m.tagline}</p>
                </div>

                <p className="text-xs text-[#737c92] leading-relaxed flex-1">{m.description}</p>

                {/* Features */}
                <div className="flex flex-col gap-2">
                  {m.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-[11px] text-[#aab2c5]">
                      <span style={{ color: m.accent }}>{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>

                {/* Submodules (rendered when a module defines them) */}
                {m.submodules.length > 0 && (
                  <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5">
                    <p className="text-[9px] uppercase tracking-widest text-[#737c92] font-bold">Submodules</p>
                    {m.submodules.map((s) =>
                      s.href ? (
                        <a
                          key={s.name}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-[#aab2c5] hover:text-white transition-colors"
                        >
                          <ChevronRight size={11} style={{ color: m.accent }} />
                          {s.name}
                        </a>
                      ) : (
                        <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-[#4a5164]">
                          <ChevronRight size={11} />
                          {s.name} · soon
                        </span>
                      )
                    )}
                  </div>
                )}

                {/* Launch button */}
                {live ? (
                  <a
                    href={m.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-3 rounded-xl text-white transition-all cursor-pointer"
                    style={{
                      backgroundColor: m.accent,
                      boxShadow: `0 0 20px ${m.accent}4d`,
                    }}
                  >
                    Launch Module
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-5 py-3 rounded-xl bg-white/[0.04] text-[#737c92] border border-white/10 cursor-not-allowed select-none">
                    <Lock size={13} />
                    Not Yet Linked
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Access model note */}
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 text-[11px] text-[#737c92] leading-relaxed">
          <span className="text-[#aab2c5] font-semibold">Access model:</span> every module has its own user list —
          being granted one module does not open the others. A person who is granted multiple modules signs in with
          the <span className="text-[#aab2c5]">same email and password</span> everywhere (one account, per-module permissions).
        </div>
      </main>

      <Footer />
    </div>
  );
}
