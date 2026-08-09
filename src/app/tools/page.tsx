import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolsIndexClient } from "@/components/tools-index-client";

export const metadata: Metadata = {
  title: "Free Tax Calculators & Compliance Tools FY 2026-27 | NumberIQ",
  description: "Free online tax calculators and compliance tools for CAs, corporate finance teams, and tax practitioners in India. GST, Income Tax, TDS, and MSME tracker.",
  alternates: {
    canonical: "https://numberiq.in/tools",
  },
  openGraph: {
    title: "Free Tax Calculators & Compliance Tools FY 2026-27 | NumberIQ",
    description: "Free online tax calculators and compliance tools for CAs, corporate finance teams, and tax practitioners in India. GST, Income Tax, TDS, and MSME tracker.",
    type: "website",
    url: "https://numberiq.in/tools",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "NumberIQ Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tax Calculators & Compliance Tools FY 2026-27 | NumberIQ",
    description: "Free online tax calculators and compliance tools for CAs, corporate finance teams, and tax practitioners in India. GST, Income Tax, TDS, and MSME tracker.",
    images: ["/og-cover.png"],
  },
};

// The AI/automation tools are the paid tier. The calculators stay free forever on purpose:
// they are what earns the organic traffic (this page holds the site's only page-1 ranking,
// #5 for "section 270AA immunity calculator"), and a commodity calculator is not something
// anyone pays for — ClearTax gives the same ones away.
//
// Billing is not live yet, so Pro tools remain fully usable and are labelled "free during
// beta". Nothing here claims to be locked or paid-for until Razorpay is actually wired up.
const PRO_SLUGS = new Set([
  "invoice-to-tally",
  "gemini-invoice-reader",
  "notice-drafting-studio",
  "gst-reco-studio-ims-fixed",
]);

// The flagship: upload an invoice, get the voucher into Tally. Highlighted above the grid.
const FLAGSHIP_SLUG = "invoice-to-tally";

const baseTools = [
  {
    slug: "appeal-deadline-calculator",
    name: "CIT(A) & ITAT Appeal Deadline Calculator",
    desc: "Last date to file Form 35 or Form 36, whether condonation is now needed, and the exact fee under s.249(1)/253(6).",
    category: "mis",
    featured: true
  },
  {
    slug: "section-270aa-immunity",
    name: "Section 270AA Immunity Navigator",
    desc: "Give up the appeal, kill the penalty. Check Form 68 eligibility and weigh immunity against contesting the addition.",
    category: "tax",
    featured: true
  },
  {
    slug: "gstin-validator",
    name: "GSTIN Validator & Decoder",
    desc: "Check any 15-digit GSTIN against the official checksum and decode its state, PAN, holder type and registration count.",
    category: "gst",
    featured: true
  },
  {
    slug: "rcm-applicability-checker",
    name: "RCM Applicability Checker (Section 9(3) & 9(4))",
    desc: "Test GST Reverse Charge applicability across 15+ procurement categories with exact CBIC notification citations.",
    category: "gst",
    featured: true
  },
  {
    slug: "litigation-cost-calculator",
    name: "Litigation Cost Calculator",
    desc: "Appeal or pay? Model the pre-deposit, accruing interest and break-even success rate before you file.",
    category: "mis",
    featured: true
  },
  {
    slug: "presumptive-tax-optimiser",
    name: "Presumptive Tax Optimiser (44AD/44ADA)",
    desc: "Compare presumptive taxation against regular books, with turnover ceilings, the 5% cash cap and audit exposure.",
    category: "tax",
    featured: true
  },
  {
    slug: "statutory-time-machine",
    name: "Statutory Time Machine",
    desc: "Pick a transaction date and see which law governed it — ITA 1961 or 2025, pre-GST or GST — with the section to cite.",
    category: "tax",
    featured: true
  },
  {
    slug: "notice-drafting-studio",
    name: "AI Notice & Appeal Drafting Studio",
    desc: "Draft professional, legally cited replies to GST and Income Tax notices (DRC-01, 142(1), 143(2)) in seconds.",
    category: "mis",
    featured: true
  },
  {
    slug: "gemini-invoice-reader",
    name: "Gemini AI Bulk Invoice Extractor & Tally Exporter",
    desc: "100% Free Gemini AI powered bulk invoice extractor. Upload PDF/images, extract CGST, SGST, IGST, vendor name, and download Tally Prime Excel vouchers.",
    category: "mis",
    featured: true
  },
  {
    slug: "invoice-to-tally",
    name: "Invoice to Tally Converter",
    desc: "Upload PDF/scanned invoices, review AI-extracted data, and download Tally-ready XML vouchers + ledger masters.",
    category: "mis",
    featured: true
  },
  {
    slug: "gst-late-fee-calculator",
    name: "GST Late Fee Calculator (S.47)",
    desc: "Calculate Section 47 late fee liability for GSTR-1, 3B, and GSTR-9 returns with FY 2026-27 limits.",
    category: "gst",
    featured: true
  },
  {
    slug: "gst-interest-calculator",
    name: "GST Interest Calculator (S.50)",
    desc: "Compute interest on delayed filing of GSTR-3B on net cash liability at 18% p.a. under Section 50.",
    category: "gst",
    featured: true
  },
  {
    slug: "itc-utilization-calculator",
    name: "ITC Utilization Engine",
    desc: "Optimize utilization of IGST, CGST, and SGST credits according to legal ordering rules.",
    category: "gst",
    featured: false
  },
  {
    slug: "gst-reco-studio-ims-fixed",
    name: "GST Input Reconciliation Studio",
    desc: "Match purchase registers with auto-drafted GSTR-2B statement to identify missing ITCs.",
    category: "gst",
    featured: true
  },
  {
    slug: "invoice-compliance",
    name: "GST Invoice Compliance Checker",
    desc: "Verify invoice data fields against standard CGST compliance parameters.",
    category: "gst",
    featured: false
  },
  {
    slug: "hsn-sac-finder",
    name: "HSN/SAC Finder & Rate Chart",
    desc: "Search 80+ official HSN/SAC tariff codes, verify GST rates and test mandatory HSN digit compliance (Notif 78/2020).",
    category: "gst",
    featured: true
  },
  {
    slug: "income-tax-calculator-fy2026-27",
    name: "Income Tax Calculator (FY 2026-27)",
    desc: "Compare old vs new tax regime slabs for individuals, senior citizens, and HUFs.",
    category: "tax",
    featured: true
  },
  {
    slug: "advance-tax-calculator",
    name: "Advance Tax Estimator",
    desc: "Estimate quarterly advance tax installments due on 15th June, Sep, Dec, and March.",
    category: "tax",
    featured: true
  },
  {
    slug: "interest-234abc-calculator",
    name: "Section 234A/B/C Interest Calculator",
    desc: "Calculate interest on default in furnishing ITR or payment/deferment of advance tax.",
    category: "tax",
    featured: false
  },
  {
    slug: "capital-gains-tax-calculator",
    name: "Capital Gains Tax Studio",
    desc: "Calculate LTCG & STCG tax for property, shares, and equity mutual funds with indexation.",
    category: "tax",
    featured: true
  },
  {
    slug: "numberiq-tds-chart-fy2026-27",
    name: "TDS Rate Chart (FY 2026-27)",
    desc: "Comprehensive lookup for Section 194C, 194J, 194I, 194IA TDS thresholds and rates.",
    category: "tax",
    featured: false
  },
  {
    slug: "tds-rate-finder",
    name: "TDS Rate Finder & Section Diagnostic (FY 2026-27)",
    desc: "Search TDS rates, thresholds, Sec 206AA floor rates, deposit due dates and return forms for 30+ sections.",
    category: "tax",
    featured: true
  },
  {
    slug: "tds-interest-calculator",
    name: "TDS Non-Deduction Interest Calculator",
    desc: "Calculate interest on non-deduction (1% p.m.) or non-payment (1.5% p.m.) of TDS.",
    category: "tax",
    featured: false
  },
  {
    slug: "section-mapper-1961-to-2025",
    name: "Income Tax Section Converter: 1961 Act → 2025 Act",
    desc: "Search and map old Income Tax Act 1961 section numbers to their new Income Tax Act 2025 counterparts.",
    category: "tax",
    featured: true
  },
  {
    slug: "tds-tcs-form-mapper-2026",
    name: "TDS & TCS Form Converter: 24Q → 138, 26QB → 141",
    desc: "Find the new number for every TDS, TCS and remittance form renumbered by the Income-tax Rules 2026, each cited to the CBDT document.",
    category: "tax",
    featured: true
  },
  {
    slug: "msme-payment-tracker-calculator",
    name: "MSME Payment Tracker (S.43B)",
    desc: "Track Section 43B(h) due dates (15/45 days) to avoid tax disallowance on supplier payments.",
    category: "mis",
    featured: true
  },
  {
    slug: "depreciation-block-assets-calculator",
    name: "Block Assets Depreciation Calculator",
    desc: "Calculate written down value (WDV) and depreciation for building, machinery, and software blocks.",
    category: "mis",
    featured: false
  },
  {
    slug: "lrs-tcs-calculator",
    name: "LRS TCS Remittance Calculator",
    desc: "Track TCS rates (5%, 20%) on foreign remittances, education, and tour packages under LRS.",
    category: "mis",
    featured: false
  },
  {
    slug: "due-date-calendar",
    name: "Compliance Due Date Calendar",
    desc: "Track monthly statutory due dates for GST returns, TDS deposits, and ITR filings.",
    category: "mis",
    featured: true
  }
];

const toolsList = baseTools.map((tool) => ({
  ...tool,
  tier: PRO_SLUGS.has(tool.slug) ? ("pro" as const) : ("free" as const),
  flagship: tool.slug === FLAGSHIP_SLUG,
}));

export default function ToolsPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-[#9a6bff]/5 blur-[120px] pointer-events-none" />

      <Navbar />
      <ToolsIndexClient tools={toolsList} />
      <Footer />
    </div>
  );
}
