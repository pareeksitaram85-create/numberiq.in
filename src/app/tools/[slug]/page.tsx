import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CAConsultation } from "@/components/ca-consultation";
import { AdSenseUnit, AdLeaderboard } from "@/components/adsense";
import { jsonLdString } from "@/lib/json-ld";

// Import calculators
import { GSTLateFeeCalculator } from "@/components/calculators/gst-late-fee";
import { GSTInterestCalculator } from "@/components/calculators/gst-interest";
import { MSMEPaymentTracker } from "@/components/calculators/msme-payment-tracker";
import { LrsTcsCalculator } from "@/components/calculators/lrs-tcs";
import { DueDateCalendar } from "@/components/calculators/due-date-calendar";
import { HsnSacFinder } from "@/components/calculators/hsn-sac-finder";
import { InvoiceCompliance } from "@/components/calculators/invoice-compliance";
import { InvoiceToTally } from "@/components/calculators/invoice-to-tally";
import { SectionMapper } from "@/components/calculators/section-mapper";
import { NoticeDraftingStudio } from "@/components/calculators/notice-drafting-studio";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ToolMeta {
  title: string;
  description: string;
  category: string;
}

export function getToolMeta(slug: string): ToolMeta {
  const cleanSlug = slug.toLowerCase();
  switch (cleanSlug) {
    case "notice-drafting-studio":
      return {
        title: "AI GST & Income Tax Notice Reply Drafting Studio | NumberIQ",
        description: "Draft legally cited, professional replies to GST DRC-01, DRC-01A and Income Tax 143(2) or 142(1) notices instantly using AI.",
        category: "MIS Suite"
      };
    case "gst-late-fee-calculator":
      return {
        title: "GST Late Fee Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Calculate late fees for GSTR-1, GSTR-3B, GSTR-4, and GSTR-9 under Section 47 of the CGST Act for FY 2026-27.",
        category: "GST Suite"
      };
    case "gst-interest-calculator":
      return {
        title: "GST Interest Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Compute interest on delayed GST payments under Section 50 of the CGST Act for net tax liability.",
        category: "GST Suite"
      };
    case "msme-payment-tracker-calculator":
      return {
        title: "MSME Payment Tracker — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Calculate MSME payment compliance deadlines and disallowances under Section 15 of MSMED Act and Section 37 of the Income-tax Act 2025.",
        category: "MIS Suite"
      };
    case "lrs-tcs-calculator":
      return {
        title: "LRS TCS Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Calculate TCS on foreign remittances and tour packages under Section 405 (formerly Section 206C(1G)) of the Income-tax Act 2025.",
        category: "Direct Tax Suite"
      };
    case "due-date-calendar":
      return {
        title: "Compliance Due Date Calendar — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Track direct tax, indirect tax, and corporate compliance due dates for GST, Income Tax, and MCA.",
        category: "MIS Suite"
      };
    case "hsn-sac-finder":
    case "hsn_sac_finder":
      return {
        title: "HSN & SAC Code Finder — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Find correct HSN (Goods) and SAC (Services) codes and rates for GST invoicing under CGST Act rules.",
        category: "GST Suite"
      };
    case "invoice-compliance":
      return {
        title: "GST Invoice Compliance Checker — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Validate GST invoice details and rule compliance for GSTR-1 and e-invoicing.",
        category: "GST Suite"
      };
    case "invoice-to-tally":
      return {
        title: "Invoice to Tally Converter — PDF Invoice to Tally XML Import | NumberIQ",
        description: "Convert PDF and scanned invoices to Tally-ready XML vouchers with AI extraction. Import purchase and sales entries into Tally Prime in one click — free.",
        category: "Accounting Suite"
      };
    case "gst-reco-studio-ims-fixed":
    case "gst_reco_studio_ims_fixed":
      return {
        title: "GST Input Reconciliation Studio — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Reconcile purchase register with GSTR-2B and manage ITC mismatch compliance under CGST Act Section 16.",
        category: "GST Suite"
      };
    case "capital-gains-tax-calculator":
      return {
        title: "Capital Gains Tax Studio — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Compute short-term (STCG) and long-term (LTCG) capital gains tax on equity and property under Sections 196, 197, and 198 of the Income-tax Act 2025.",
        category: "Direct Tax Suite"
      };
    case "depreciation-block-assets-calculator":
      return {
        title: "Block Assets Depreciation Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Calculate written down value (WDV) and depreciation under the Income-tax Act 2025.",
        category: "Corporate Tax Suite"
      };
    case "income-tax-calculator-fy2026-27":
      return {
        title: "Income Tax Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Compare tax liability under the new tax regime (Section 202) and old regime for FY 2026-27.",
        category: "Direct Tax Suite"
      };
    case "numberiq-tds-chart-fy2026-27":
      return {
        title: "TDS Rate Chart — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "View the comprehensive TDS rates and thresholds under Section 393 of the new Income-tax Act 2025.",
        category: "Direct Tax Suite"
      };
    case "tds-interest-calculator":
      return {
        title: "TDS Interest Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Calculate interest on late deduction (1%) and late payment (1.5%) of TDS under Section 399(3) (formerly Section 201(1A)) of the Income-tax Act 2025.",
        category: "Direct Tax Suite"
      };
    case "interest-234abc-calculator":
      return {
        title: "Section 234A/B/C Interest Calculator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Compute interest for defaults in return filing and advance tax under Sections 432, 433, and 434 of the Income-tax Act 2025.",
        category: "Direct Tax Suite"
      };
    case "itc-utilization-calculator":
      return {
        title: "ITC Utilization Engine — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Optimize the utilization order of IGST, CGST, and SGST input tax credit under CGST rules.",
        category: "GST Suite"
      };
    case "advance-tax-calculator":
      return {
        title: "Advance Tax Estimator — Free Online Calculator FY 2026-27 | NumberIQ",
        description: "Calculate quarterly advance tax installments and liability under the Income-tax Act 2025.",
        category: "Direct Tax Suite"
      };
    case "section-mapper-1961-to-2025":
      return {
        title: "Income Tax Section Converter: 1961 Act → 2025 Act | NumberIQ",
        description: "Search and map old Income Tax Act 1961 section numbers to their new Income Tax Act 2025 counterparts.",
        category: "Direct Tax Suite"
      };
    case "universe":
      return {
        title: "Tax Intelligence Universe — Interactive Knowledge Map | NumberIQ",
        description: "Explore the NumberIQ Tax Intelligence Universe — an interactive visual map of Indian tax concepts, GST, Income Tax, TDS, and compliance knowledge.",
        category: "MIS Suite"
      };
    default:
      return {
        title: `${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} — Free Online Calculator FY 2026-27 | NumberIQ`,
        description: "Free online tax calculator and financial compliance tool.",
        category: "Finance Suite"
      };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getToolMeta(slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://numberiq.in/tools/${slug}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url: `https://numberiq.in/tools/${slug}`,
      images: [
        {
          url: "/og-cover.png",
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og-cover.png"],
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  // Resolve component
  let CalculatorComponent = null;
  let staticHtmlUrl = "";
  let title = "";
  let category = "";

  const cleanSlug = slug.toLowerCase();
  
  if (cleanSlug === "notice-drafting-studio") {
    CalculatorComponent = NoticeDraftingStudio;
    title = "AI Notice & Appeal Drafting Studio";
    category = "MIS Suite";
  } else if (cleanSlug === "gst-late-fee-calculator") {
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
  } else if (cleanSlug === "invoice-to-tally") {
    CalculatorComponent = InvoiceToTally;
    title = "Invoice to Tally Converter (PDF → Tally XML)";
    category = "Accounting Suite";
  } else if (cleanSlug === "section-mapper-1961-to-2025") {
    CalculatorComponent = SectionMapper;
    title = "Income Tax Section Converter: 1961 Act → 2025 Act";
    category = "Direct Tax Suite";
  } else if (cleanSlug === "gst_reco_studio_ims_fixed" || cleanSlug === "gst-reco-studio-ims-fixed") {
    staticHtmlUrl = "/tools/gst-reco-studio-ims-fixed.html";
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
  } else if (cleanSlug === "universe") {
    staticHtmlUrl = "/tools/universe.html";
    title = "Tax Intelligence Universe";
    category = "MIS Suite";
  } else {
    // For other tools not yet rebuilt as custom react components
    title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    category = "Finance Calculator";
  }

  const toolMeta = getToolMeta(slug);
  const toolDescription = toolMeta.description;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": `https://numberiq.in/tools/${slug}#application`,
                "name": title,
                "description": toolDescription,
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "INR"
                }
              },
              {
                "@type": "Product",
                "@id": `https://numberiq.in/tools/${slug}#product`,
                "name": title,
                "description": toolDescription,
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "INR",
                  "valueAddedTaxIncluded": "false"
                }
              },
              {
                "@type": "Service",
                "@id": `https://numberiq.in/tools/${slug}#service`,
                "name": title,
                "description": toolDescription,
                "provider": {
                  "@type": "Organization",
                  "@id": "https://numberiq.in/#organization",
                  "name": "NumberIQ",
                  "url": "https://numberiq.in"
                }
              },
              {
                "@type": "BreadcrumbList",
                "@id": `https://numberiq.in/tools/${slug}#breadcrumb`,
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Tools",
                    "item": "https://numberiq.in/tools"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": title,
                    "item": `https://numberiq.in/tools/${slug}`
                  }
                ]
              }
            ]
          })
        }}
      />
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

        {/* Leaderboard Ad — above the fold, before calculator */}
        <AdLeaderboard slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD || "3974343520"} className="mb-2" />

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
              <AdSenseUnit slot="3974343520" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
