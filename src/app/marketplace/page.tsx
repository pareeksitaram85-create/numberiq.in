import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Download, CreditCard, ShieldCheck, FileSpreadsheet, Percent, ShoppingBag } from "lucide-react";

interface Template {
  id: string;
  title: string;
  desc: string;
  price: string;
  originalPrice: string;
  features: string[];
  downloads: string;
}

const templates: Template[] = [
  {
    id: "uae-boardroom-mis",
    title: "UAE Executive Boardroom MIS Sheet",
    desc: "Fully automated, C-Suite ready financial dashboard in Excel. Includes multi-currency conversions (AED/INR), consolidated monthly ledgers, and dynamic performance charts.",
    price: "₹1,499",
    originalPrice: "₹4,999",
    features: [
      "Dynamic Multi-Emirate Consolidation",
      "Auto currency conversions (AED to INR)",
      "Ready-to-use executive slide deck layout",
      "No macros required — pure formula setup"
    ],
    downloads: "248 downloads"
  },
  {
    id: "gst-itc-reco-master",
    title: "GST Input Tax Credit (ITC) Reco Tracker",
    desc: "Automate Books vs GSTR-2B invoice matching. Excel spreadsheet containing rules to flag mismatches u/s 16(2)(aa) and Rule 36(4) instantly.",
    price: "₹999",
    originalPrice: "₹2,499",
    features: [
      "Vlookup & index-match automation",
      "Highlight duplicate claim risks",
      "Supplier payment status compliance dashboard",
      "Formatted Excel worksheets"
    ],
    downloads: "512 downloads"
  },
  {
    id: "msme-43b-payment-tracker",
    title: "MSME Section 43B(h) Auditor Sheet",
    desc: "Ensure compliance with Section 43B(h) rules. Track supplier classification (micro/small/medium), calculate 15/45-day limits, and auto-compute penal interest.",
    price: "₹499",
    originalPrice: "₹1,199",
    features: [
      "Due date automatic calendar alerts",
      "Micro vs Small category classification rules",
      "Compound interest rate computation (3x SBI rate)",
      "Auditor verification checklist"
    ],
    downloads: "389 downloads"
  }
];

export default function MarketplacePage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4f7cff]/10 border border-[#4f7cff]/20 text-xs font-semibold text-[#4f7cff]">
            <ShoppingBag size={12} />
            Digital Asset Store
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-none">
            Premium Finance & Tax Templates
          </h1>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Download production-ready Excel sheets, CFO models, and tax compliance trackers to streamline your corporate workflows immediately.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-white/5 bg-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.3)] group hover:border-[#4f7cff]/20 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-[#4f7cff]/10 to-transparent blur-xl pointer-events-none" />
              
              <div className="space-y-5">
                {/* Icon & Details */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#4f7cff]/10 border border-[#4f7cff]/20 flex items-center justify-center text-[#4f7cff]">
                    <FileSpreadsheet size={20} />
                  </div>
                  <span className="text-[10px] text-[#34d399] bg-[#34d399]/10 px-2 py-0.5 rounded font-mono">
                    {tpl.downloads}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">{tpl.title}</h3>
                  <p className="text-xs text-[#737c92] leading-relaxed min-h-[60px]">{tpl.desc}</p>
                </div>

                {/* Features list */}
                <ul className="space-y-2 pt-2 border-t border-white/5">
                  {tpl.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[10px] text-[#aab2c5]">
                      <ShieldCheck size={12} className="text-[#4f7cff] flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing & Buy Button */}
              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{tpl.price}</div>
                  <div className="text-[10px] text-[#737c92] line-through">{tpl.originalPrice}</div>
                </div>
                <div>
                  <a
                    href="https://pages.instamojo.com/numberiq-placeholder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#4f7cff] hover:bg-[#3d66dd] text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-[0_0_15px_rgba(79,124,255,0.2)] group-hover:shadow-[0_0_20px_rgba(79,124,255,0.4)]"
                  >
                    Get Template
                    <Download size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
