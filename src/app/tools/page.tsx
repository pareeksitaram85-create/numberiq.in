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

const toolsList = [
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
    desc: "Search standard HSN/SAC codes and corresponding tax rates for goods & services.",
    category: "gst",
    featured: false
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
