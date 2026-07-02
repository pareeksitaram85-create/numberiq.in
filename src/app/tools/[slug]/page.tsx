import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CAConsultation } from "@/components/ca-consultation";
import { AdSenseUnit } from "@/components/adsense";

// Import calculators
import { GSTLateFeeCalculator } from "@/components/calculators/gst-late-fee";
import { GSTInterestCalculator } from "@/components/calculators/gst-interest";
import { MSMEPaymentTracker } from "@/components/calculators/msme-payment-tracker";
import { LrsTcsCalculator } from "@/components/calculators/lrs-tcs";
import { DueDateCalendar } from "@/components/calculators/due-date-calendar";
import { HsnSacFinder } from "@/components/calculators/hsn-sac-finder";
import { InvoiceCompliance } from "@/components/calculators/invoice-compliance";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  // Resolve component
  let CalculatorComponent = null;
  let staticHtmlUrl = "";
  let title = "";
  let category = "";

  const cleanSlug = slug.toLowerCase();

  if (cleanSlug === "gst-late-fee-calculator") {
    CalculatorComponent = GSTLateFeeCalculator;
    title = "GST Late Fee Calculator (Section 47)";
    category = "GST Suite";
  } else if (cleanSlug === "gst-interest-calculator") {
    CalculatorComponent = GSTInterestCalculator;
    title = "GST Interest Calculator (Section 50)";
    category = "GST Suite";
  } else if (cleanSlug === "msme-payment-tracker-calculator") {
    CalculatorComponent = MSMEPaymentTracker;
    title = "MSME Payment Tracker (Section 43B)";
    category = "MIS Suite";
  } else if (cleanSlug === "lrs-tcs-calculator") {
    CalculatorComponent = LrsTcsCalculator;
    title = "LRS TCS Calculator (Section 206C(1G))";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "due-date-calendar") {
    CalculatorComponent = DueDateCalendar;
    title = "Compliance Due Date Calendar";
    category = "MIS Suite";
  } else if (cleanSlug === "hsn_sac_finder" || cleanSlug === "hsn-sac-finder") {
    CalculatorComponent = HsnSacFinder;
    title = "HSN & SAC Code Finder";
    category = "GST Suite";
  } else if (cleanSlug === "invoice-compliance") {
    CalculatorComponent = InvoiceCompliance;
    title = "GST Invoice Compliance Checker";
    category = "GST Suite";
  } else if (cleanSlug === "gst_reco_studio_ims_fixed" || cleanSlug === "gst-reco-studio-ims-fixed") {
    staticHtmlUrl = "/tools/GST_ReCO_Studio_IMS_FIXED.html";
    title = "GST Input Reconciliation Studio";
    category = "GST Suite";
  } else if (cleanSlug === "capital-gains-tax-calculator") {
    staticHtmlUrl = "/tools/capital-gains-tax-calculator.html";
    title = "Capital Gains Tax Studio";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "depreciation-block-assets-calculator") {
    staticHtmlUrl = "/tools/depreciation-block-assets-calculator.html";
    title = "Depreciation on Block of Assets";
    category = "Corporate Tax Suite";
  } else if (cleanSlug === "income-tax-calculator-fy2026-27") {
    staticHtmlUrl = "/tools/income-tax-calculator-fy2026-27.html";
    title = "Income Tax Calculator (FY 2026-27)";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "numberiq-tds-chart-fy2026-27") {
    staticHtmlUrl = "/tools/numberiq-tds-chart-fy2026-27.html";
    title = "TDS Rate Chart (FY 2026-27)";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "tds-interest-calculator") {
    staticHtmlUrl = "/tools/tds-interest-calculator.html";
    title = "TDS Interest Calculator";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "interest-234abc-calculator") {
    staticHtmlUrl = "/tools/interest-234abc-calculator.html";
    title = "Section 234A/B/C Interest Calculator";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "itc-utilization-calculator") {
    staticHtmlUrl = "/tools/itc-utilization-calculator.html";
    title = "ITC Utilization Calculator";
    category = "GST Suite";
  } else if (cleanSlug === "advance-tax-calculator") {
    staticHtmlUrl = "/tools/advance-tax-calculator.html";
    title = "Advance Tax Estimator";
    category = "Direct Tax Suite";
  } else {
    // For other tools not yet rebuilt as custom react components
    title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    category = "Finance Calculator";
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10 flex flex-col gap-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-[#737c92]">
          <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
          <ChevronRight size={12} />
          <span className="text-[#aab2c5] font-semibold">{category}</span>
          <ChevronRight size={12} />
          <span className="text-white truncate max-w-xs">{title}</span>
        </div>

        {/* Dynamic Calculator Container */}
        {CalculatorComponent ? (
          <CalculatorComponent />
        ) : staticHtmlUrl ? (
          <div className="border border-white/10 bg-white/[0.02] p-8 md:p-12 rounded-3xl text-center max-w-2xl mx-auto w-full backdrop-blur-sm relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-gradient-to-br from-[#4f7cff]/10 to-transparent blur-2xl pointer-events-none" />
            <h2 className="font-display text-2xl font-bold text-white mb-4">{title}</h2>
            <p className="text-sm text-[#737c92] leading-relaxed mb-8 max-w-md mx-auto">
              This tax tool is fully functional. We are currently migrating its interface to React. You can run the live utility instantly.
            </p>
            <a
              href={staticHtmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-xs font-semibold text-white transition-all shadow-[0_0_20px_rgba(79,124,255,0.25)] hover:shadow-[0_0_25px_rgba(79,124,255,0.4)] cursor-pointer"
            >
              Launch Calculator Tool
            </a>
          </div>
        ) : (
          <div className="border border-white/5 bg-white/5 p-12 rounded-3xl text-center max-w-xl mx-auto backdrop-blur-sm">
            <h2 className="font-display text-xl font-bold text-white mb-3">Calculator Under Migration</h2>
            <p className="text-sm text-[#737c92] leading-relaxed mb-6">
              We are currently rebuilding this tool in React/TypeScript to support SaaS features.
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#4f7cff] hover:bg-[#3d66dd] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Back to Workspace
            </Link>
          </div>
        )}

        {/* Monetization Block: CA Referral & AdSense */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/5 pt-8">
          <div className="md:col-span-7">
            <CAConsultation toolName={title} />
          </div>
          <div className="md:col-span-5 border border-white/5 bg-white/[0.01] p-6 rounded-2xl flex flex-col gap-4 text-center">
            <h4 className="text-[10px] text-[#737c92] uppercase font-bold tracking-widest">Sponsored Advertisement</h4>
            <div className="min-h-[200px] flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.01] text-xs text-[#737c92]">
              <AdSenseUnit slot="1234567890" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
