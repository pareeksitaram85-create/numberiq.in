import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "GST Reco Analytics | NumberIQ Boardroom",
  robots: { index: false, follow: false },
};

/**
 * Thin launcher for the GST reconciliation module.
 *
 * There is deliberately NO gate here. This page previously compared a PIN in
 * client-side React - first any string of 4+ characters, then a hardcoded
 * literal. Neither was a gate:
 *
 *   1. A value compared in the browser ships to the browser. A literal password
 *      in this file is readable in the page's JS bundle by any visitor.
 *   2. It guarded nothing. The iframe below points at
 *      /api/module/gst-reco-analytics, which anyone can open directly - that
 *      route serves the HTML shell unauthenticated, as every module route in
 *      this repo does.
 *
 * Access is enforced in the two places that actually hold the data:
 *   - the module's Supabase sign-in (public/js/gst-reco-gate.js), which checks
 *     the user_access table for the `gst-reco-analytics` slug, and
 *   - Postgres RLS via gst_has_access(), which gates every gst_* table, so a
 *     visitor without a valid session sees an empty module rather than figures.
 *
 * Do not reintroduce a client-side PIN, and never ship module data as a static
 * file under public/ - that bypasses both of the above.
 */
export default function GSTRecoAnalyticsDashboardPage() {
  return (
    <div className="w-full h-screen bg-[#05060a] flex flex-col overflow-hidden">
      <div className="bg-[#0F172A] border-b border-[#1E293B] px-6 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Boardroom
          </Link>
          <div className="h-4 w-px bg-[#1E293B]" />
          <span className="text-xs font-bold text-white">
            GST Reconciliation &amp; ITC Analytics
          </span>
        </div>

        <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-[#10B981]" />
          Sign in inside the module to load data
        </span>
      </div>

      <iframe
        src="/api/module/gst-reco-analytics"
        className="w-full flex-1 border-none bg-[#05060a]"
        title="GST Reconciliation & ITC Analytics"
      />
    </div>
  );
}
