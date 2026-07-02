import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Shield, ExternalLink, Activity, Table, BarChart3 } from "lucide-react";

export default async function UaeMisPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/module");
  }

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
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">Boardroom Analytics Center</h1>
              <p className="text-[10px] text-[#737c92]">Internal Corporate MIS - UAE Operations</p>
            </div>
          </div>
          <div className="text-[10px] text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 px-2.5 py-0.5 rounded font-mono">
            SECURED EXECUTIVE SESSION
          </div>
        </div>

        {/* Boardroom Portal Launch Card */}
        <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-br from-[#4f7cff]/20 to-transparent blur-3xl pointer-events-none" />
          
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              UAE Executive Performance Dashboard
            </h2>
            <p className="text-sm text-[#737c92] leading-relaxed max-w-xl">
              Access the live Board KPI summary, consolidation metrics, and monthly financial ledger reports. This secure environment connects directly to your Supabase ledger storage.
            </p>
            
            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-xs text-[#aab2c5]">
                <BarChart3 size={14} className="text-[#4f7cff]" />
                Interactive Charts
              </div>
              <div className="flex items-center gap-2 text-xs text-[#aab2c5]">
                <Table size={14} className="text-[#4f7cff]" />
                Financial Matrices
              </div>
              <div className="flex items-center gap-2 text-xs text-[#aab2c5]">
                <Activity size={14} className="text-[#4f7cff]" />
                Real-time Sync
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <a
              href="/api/module/uaemis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold px-6 py-4 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-white transition-all shadow-[0_0_20px_rgba(79,124,255,0.3)] hover:shadow-[0_0_25px_rgba(79,124,255,0.5)] cursor-pointer"
            >
              Launch Boardroom Portal
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
