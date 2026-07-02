"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Calculator, 
  History, 
  Star, 
  Save, 
  User, 
  LogOut, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("saved");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Mock data for display when database is not migrated/connected
  const mockSavedCalculations = [
    {
      id: "calc-1",
      name: "Q1 GST Late Fee Estimate",
      type: "GST Late Fee (S.47)",
      date: "30 June 2026",
      summary: "₹2,000 payable (15 days delay, turnover up to 1.5 Cr)"
    },
    {
      id: "calc-2",
      name: "FY26-27 Individual Tax Comparison",
      type: "Income Tax Slabs",
      date: "28 June 2026",
      summary: "New Regime preferred (saves ₹42,500 in tax)"
    }
  ];

  const mockFavorites = [
    { name: "GST Interest Calculator (S.50)", href: "/tools/gst-interest-calculator" },
    { name: "MSME Payment Tracker (S.43B)", href: "/tools/msme-payment-tracker-calculator" }
  ];

  if (status === "loading") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#05060a]">
        <span className="text-sm text-[#737c92]">Verifying credentials...</span>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#9a6bff]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Header Profile Greeting */}
        <div className="border border-white/5 bg-white/5 p-8 rounded-3xl backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#4f7cff] to-[#9a6bff] flex items-center justify-center text-white font-bold text-lg border border-white/10 shadow-lg">
              {session.user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl font-bold text-white">
                  Welcome back, {session.user?.name || "Practitioner"}
                </h1>
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#34d399] bg-[#34d399]/10 px-2 py-0.5 rounded border border-[#34d399]/20">
                  {(session.user as any).role || "USER"}
                </span>
              </div>
              <p className="text-xs text-[#737c92] mt-0.5">{session.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-white/5 bg-white/5 hover:bg-[#ff5d73]/10 hover:border-[#ff5d73]/20 hover:text-[#ff5d73] text-[#aab2c5] transition-all cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Navigator Menu */}
          <div className="lg:col-span-3 border border-white/5 bg-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
            <button
              onClick={() => setActiveSection("saved")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === "saved"
                  ? "bg-[#4f7cff] text-white"
                  : "text-[#aab2c5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Save size={14} /> Saved Workspace
              </span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">
                {mockSavedCalculations.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSection("favorites")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === "favorites"
                  ? "bg-[#4f7cff] text-white"
                  : "text-[#aab2c5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Star size={14} /> Favorites
              </span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">
                {mockFavorites.length}
              </span>
            </button>
          </div>

          {/* Right Column: Dynamic Section rendering */}
          <div className="lg:col-span-9 border border-white/5 bg-white/5 p-6 rounded-2xl min-h-[300px]">
            {activeSection === "saved" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                    <Save size={15} className="text-[#4f7cff]" />
                    Saved Calculation Workspaces
                  </h3>
                  <p className="text-[11px] text-[#737c92]">Quickly resume your previously configured calculator outputs.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {mockSavedCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="border border-white/5 bg-white/5 hover:border-white/10 p-4 rounded-xl flex items-center justify-between gap-4 transition-all group"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-[#4f7cff] bg-[#4f7cff]/10 border border-[#4f7cff]/20 px-2 py-0.5 rounded">
                          {calc.type}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-2 mb-0.5">{calc.name}</h4>
                        <p className="text-[10px] text-[#737c92]">{calc.summary}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#737c92]">{calc.date}</span>
                        <button className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-[#aab2c5] group-hover:bg-[#4f7cff] group-hover:text-white transition-all cursor-pointer">
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "favorites" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                    <Star size={15} className="text-[#f4b740]" />
                    Bookmarked Tools
                  </h3>
                  <p className="text-[11px] text-[#737c92]">Instant launcher link shortcuts to your frequently visited calculators.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mockFavorites.map((fav, idx) => (
                    <Link
                      key={idx}
                      href={fav.href}
                      className="border border-white/5 bg-white/5 hover:bg-white/10 p-4 rounded-xl flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-white flex items-center gap-2">
                        <Calculator size={14} className="text-[#4f7cff]" />
                        {fav.name}
                      </span>
                      <ArrowRight size={12} className="text-[#737c92] group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
