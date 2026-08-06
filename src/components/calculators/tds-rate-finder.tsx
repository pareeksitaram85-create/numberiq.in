"use client";

import { useState } from "react";
import { Search, CheckCircle2, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { CAConsultation } from "../ca-consultation";
import Link from "next/link";

export interface TdsSection {
  section: string;
  name: string;
  category: "contractor" | "professional" | "rent" | "interest" | "commission" | "goods" | "salary" | "crypto" | "non-resident" | "other";
  individualRate: string;
  companyRate: string;
  thresholdSingle: string;
  thresholdAnnual: string;
  noPanRate: string;
  dueDate: string;
  returnForm: string;
  sec197Eligible: boolean;
  notes: string;
}

export function TdsRateFinder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Calculator state
  const [selectedSection, setSelectedSection] = useState<string>("194J-tech");
  const [paymentAmount, setPaymentAmount] = useState<number>(100000);
  const [payeeType, setPayeeType] = useState<"individual" | "company">("individual");
  const [hasValidPan, setHasValidPan] = useState<boolean>(true);
  const [hasLowerCert, setHasLowerCert] = useState<boolean>(false);
  const [customLowerRate, setCustomLowerRate] = useState<number>(1.5);

  const sectionsDatabase: TdsSection[] = [
    {
      section: "194C",
      name: "Payments to Contractors & Sub-contractors",
      category: "contractor",
      individualRate: "1%",
      companyRate: "2%",
      thresholdSingle: "₹30,000",
      thresholdAnnual: "₹1,00,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Applies to work contracts, advertising, transport (unless transporter owns <=10 vehicles & submits PAN declaration)."
    },
    {
      section: "194J (Fees)",
      name: "Fees for Professional Services & Director Fees",
      category: "professional",
      individualRate: "10%",
      companyRate: "10%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹30,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Applies to legal, medical, engineering, accounting, CA, architectural, management consulting and director fees."
    },
    {
      section: "194J (Tech)",
      name: "Fees for Technical Services & Call Center",
      category: "professional",
      individualRate: "2%",
      companyRate: "2%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹30,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Concessional 2% rate for technical services (managerial/technical/consultancy) and business of operating call centers."
    },
    {
      section: "194H",
      name: "Commission or Brokerage Payments",
      category: "commission",
      individualRate: "2%",
      companyRate: "2%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹15,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Rate reduced to 2% (from 5%) by Finance Act 2024. Excludes insurance commission (Sec 194D) and underwriting commission."
    },
    {
      section: "194I (Land)",
      name: "Rent on Land, Building or Furniture",
      category: "rent",
      individualRate: "10%",
      companyRate: "10%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹2,40,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Applies when rent paid by business/entity subject to tax audit or audit thresholds in preceding financial year."
    },
    {
      section: "194I (Plant)",
      name: "Rent on Plant, Machinery & Equipment",
      category: "rent",
      individualRate: "2%",
      companyRate: "2%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹2,40,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Lower 2% rate for hiring plant, machinery, vehicle, or equipment for commercial/industrial use."
    },
    {
      section: "194IB",
      name: "Rent by Individual or HUF (Not under Tax Audit)",
      category: "rent",
      individualRate: "2%",
      companyRate: "2%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹50,000 / month",
      noPanRate: "20%",
      dueDate: "30 days from end of month of deduction",
      returnForm: "Form 26QC (Challan-cum-statement)",
      sec197Eligible: false,
      notes: "Deducted once a year or in last month of tenancy. Rate reduced to 2% (from 5%) by Finance Act 2024. TAN not required."
    },
    {
      section: "194IA",
      name: "Payment on Transfer of Immovable Property",
      category: "rent",
      individualRate: "1%",
      companyRate: "1%",
      thresholdSingle: "₹50,000,00 (Total Consideration)",
      thresholdAnnual: "₹50,00,000",
      noPanRate: "20%",
      dueDate: "30 days from end of month of payment",
      returnForm: "Form 26QB (Challan-cum-statement)",
      sec197Eligible: false,
      notes: "Buyer deducts 1% on purchase of property (other than agricultural land) valued >= ₹50 Lakhs. TAN not required."
    },
    {
      section: "194Q",
      name: "TDS on Purchase of Goods",
      category: "goods",
      individualRate: "0.1%",
      companyRate: "0.1%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹50,00,000 (per seller)",
      noPanRate: "5%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: false,
      notes: "Buyer with turnover > ₹10 Cr in preceding FY deducts 0.1% on purchase of goods exceeding ₹50 Lakhs from a resident seller."
    },
    {
      section: "194A",
      name: "Interest other than Interest on Securities (Banks)",
      category: "interest",
      individualRate: "10%",
      companyRate: "10%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹40,000 (₹50k for Senior Citizens)",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Applies to bank/post office FD interest. Form 15G/15H can be submitted for nil deduction if eligible."
    },
    {
      section: "194A (Others)",
      name: "Unsecured Loan / NBFC / Firm Interest",
      category: "interest",
      individualRate: "10%",
      companyRate: "10%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹5,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Interest paid by firms, private companies, or individuals under audit to lenders or partners (other than banks)."
    },
    {
      section: "192",
      name: "TDS on Salary Income",
      category: "salary",
      individualRate: "Slab Rates",
      companyRate: "Slab Rates",
      thresholdSingle: "N/A",
      thresholdAnnual: "Basic Exemption (₹3L / ₹4L)",
      noPanRate: "Maximum Marginal Rate",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 24Q",
      sec197Eligible: true,
      notes: "Employer computes net taxable salary taking into account New vs Old tax regime opt-in, HRA, 80C/80D deductions."
    },
    {
      section: "194M",
      name: "Payments by Individual/HUF (Contractor, Commission, Legal)",
      category: "contractor",
      individualRate: "2%",
      companyRate: "2%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹50,00,000",
      noPanRate: "20%",
      dueDate: "30 days from end of month of payment",
      returnForm: "Form 26QD (Challan-cum-statement)",
      sec197Eligible: false,
      notes: "Applies to individuals/HUFs not liable for tax audit making large personal payments. Rate reduced to 2% by Finance Act 2024. TAN not required."
    },
    {
      section: "194S",
      name: "TDS on Transfer of Virtual Digital Assets (Crypto / NFT)",
      category: "crypto",
      individualRate: "1%",
      companyRate: "1%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹10,000 (₹50,000 for Specified Persons)",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q / 26QE",
      sec197Eligible: false,
      notes: "Deducted by crypto exchanges or buyers on transfer of VDAs (Bitcoin, Ethereum, NFTs, tokens)."
    },
    {
      section: "194R",
      name: "TDS on Benefit or Perquisite in respect of Business / Profession",
      category: "other",
      individualRate: "10%",
      companyRate: "10%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹20,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: false,
      notes: "Applies to non-monetary incentives, free trips, dealer gifts, or vouchers provided to business partners/agents."
    },
    {
      section: "195",
      name: "Payment to Non-Resident / Foreign Company",
      category: "non-resident",
      individualRate: "As per IT Act / DTAA Rate",
      companyRate: "As per IT Act / DTAA Rate",
      thresholdSingle: "Nil (Any Amount)",
      thresholdAnnual: "Nil",
      noPanRate: "20% or DTAA rate (Sec 206AA)",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 27Q",
      sec197Eligible: true,
      notes: "Requires Form 15CA/15CB certificate before remitting funds abroad. Lower treaty rate applicable if TRC + Form 10F available."
    },
    {
      section: "194D",
      name: "Insurance Commission",
      category: "commission",
      individualRate: "5%",
      companyRate: "10%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹15,000",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Commission paid to insurance agents for soliciting or procuring insurance business."
    },
    {
      section: "194DA",
      name: "Payment in respect of Life Insurance Policy",
      category: "other",
      individualRate: "5%",
      companyRate: "5%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹1,00,000 (Income portion)",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "TDS @ 5% is deducted only on the net income component (maturity amount less total premium paid) where policy isn't tax-free u/s 10(10D)."
    },
    {
      section: "194N",
      name: "TDS on Cash Withdrawals from Banks / Post Office",
      category: "interest",
      individualRate: "2% - 5%",
      companyRate: "2% - 5%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹1 Crore (₹20 Lakhs for Non-Filers)",
      noPanRate: "20%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: false,
      notes: "Deducted by bank on aggregate cash withdrawals exceeding ₹1 Cr in a FY. Rate is 2% above ₹20L and 5% above ₹1Cr for non-filers."
    },
    {
      section: "194O",
      name: "TDS by E-Commerce Operator on E-Commerce Participants",
      category: "goods",
      individualRate: "0.1%",
      companyRate: "0.1%",
      thresholdSingle: "N/A",
      thresholdAnnual: "₹5,00,000 (Individual/HUF)",
      noPanRate: "5%",
      dueDate: "7th of next month (30th April for March)",
      returnForm: "Form 26Q",
      sec197Eligible: true,
      notes: "Deducted by marketplaces (Amazon, Flipkart, Swiggy) on gross payment to sellers. Rate reduced to 0.1% by Finance Act 2024."
    }
  ];

  const filteredSections = sectionsDatabase.filter((sec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sec.section.toLowerCase().includes(q) ||
      sec.name.toLowerCase().includes(q) ||
      sec.notes.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || sec.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate TDS for interactive tool
  const currentSecObj = sectionsDatabase.find((s) => s.section.toLowerCase().startsWith(selectedSection.toLowerCase())) || sectionsDatabase[1];

  const calculateTdsDetails = () => {
    let applicableRate = 0;
    let rateExplanation = "";

    if (!hasValidPan) {
      applicableRate = 20;
      rateExplanation = "Penalty rate under Section 206AA applied due to Invalid/Missing PAN (20% mandatory floor rate).";
    } else if (hasLowerCert) {
      applicableRate = customLowerRate;
      rateExplanation = `Lower deduction certificate under Section 197 applied (${customLowerRate}% rate).`;
    } else {
      if (currentSecObj.section === "194C") {
        applicableRate = payeeType === "individual" ? 1 : 2;
        rateExplanation = payeeType === "individual" ? "1% for Individual / HUF payee" : "2% for Company / Partnership Firm / Others";
      } else if (currentSecObj.section === "194J (Fees)") {
        applicableRate = 10;
        rateExplanation = "10% standard rate for professional / director services";
      } else if (currentSecObj.section === "194J (Tech)") {
        applicableRate = 2;
        rateExplanation = "2% concessional rate for technical / call center services";
      } else if (currentSecObj.section === "194H") {
        applicableRate = 2;
        rateExplanation = "2% standard rate for commission / brokerage (Finance Act 2024)";
      } else if (currentSecObj.section === "194I (Land)") {
        applicableRate = 10;
        rateExplanation = "10% standard rate for land/building rent";
      } else if (currentSecObj.section === "194I (Plant)") {
        applicableRate = 2;
        rateExplanation = "2% rate for machinery / plant hire";
      } else if (currentSecObj.section === "194IB") {
        applicableRate = 2;
        rateExplanation = "2% rate for rent by individuals (Finance Act 2024)";
      } else if (currentSecObj.section === "194IA") {
        applicableRate = 1;
        rateExplanation = "1% rate for property purchase >= ₹50L";
      } else if (currentSecObj.section === "194Q") {
        applicableRate = 0.1;
        rateExplanation = "0.1% rate for purchase of goods";
      } else if (currentSecObj.section === "194A") {
        applicableRate = 10;
        rateExplanation = "10% rate for bank/corporate interest";
      } else if (currentSecObj.section === "194M") {
        applicableRate = 2;
        rateExplanation = "2% rate for personal contractor/professional payments > ₹50L";
      } else if (currentSecObj.section === "194S") {
        applicableRate = 1;
        rateExplanation = "1% rate for VDA / Crypto transfers";
      } else if (currentSecObj.section === "194R") {
        applicableRate = 10;
        rateExplanation = "10% rate for business benefits & perquisites";
      } else if (currentSecObj.section === "194O") {
        applicableRate = 0.1;
        rateExplanation = "0.1% rate for e-commerce operators";
      } else {
        applicableRate = parseFloat(currentSecObj.individualRate) || 10;
        rateExplanation = `${applicableRate}% standard statutory rate`;
      }
    }

    const tdsAmount = Math.round((paymentAmount * applicableRate) / 100);
    const netPayable = paymentAmount - tdsAmount;

    return {
      applicableRate,
      tdsAmount,
      netPayable,
      rateExplanation
    };
  };

  const calcResult = calculateTdsDetails();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Interactive Calculator Studio */}
      <section className="bg-[#121624] border border-[#23293e] rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-[#4f7cff]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#23293e] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4f7cff]/10 border border-[#4f7cff]/20 text-[#4f7cff] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={12} /> FY 2026-27 TDS Calculation Studio
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Interactive TDS Amount Calculator</h2>
            <p className="text-xs md:text-sm text-[#8a95ad] mt-1">
              Select section, enter bill amount, check PAN status and compute net payment instantly under Finance Act rules.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#1a2138] p-1.5 rounded-xl border border-[#23293e]">
            <button
              onClick={() => setPayeeType("individual")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                payeeType === "individual" ? "bg-[#4f7cff] text-white shadow-md" : "text-[#8a95ad] hover:text-white"
              }`}
            >
              Individual / HUF
            </button>
            <button
              onClick={() => setPayeeType("company")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                payeeType === "company" ? "bg-[#4f7cff] text-white shadow-md" : "text-[#8a95ad] hover:text-white"
              }`}
            >
              Company / Firm / Body Corporate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#aab2c5] uppercase tracking-wider mb-2">
                1. Select TDS Section & Nature of Payment
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-[#1a2138] border border-[#23293e] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4f7cff] transition-colors"
              >
                <option value="194C">Section 194C — Payments to Contractors & Subcontractors (1% / 2%)</option>
                <option value="194J-fees">Section 194J (Fees) — Professional & Director Fees (10%)</option>
                <option value="194J-tech">Section 194J (Tech) — Technical Services & Call Center (2%)</option>
                <option value="194H">Section 194H — Commission or Brokerage (2%)</option>
                <option value="194I-land">Section 194I (Land/Bldg) — Rent on Property (10%)</option>
                <option value="194I-plant">Section 194I (Plant) — Rent on Machinery & Equipment (2%)</option>
                <option value="194IB">Section 194IB — Rent by Individuals (&gt;₹50k/mo) (2%)</option>
                <option value="194IA">Section 194IA — Property Purchase (1%)</option>
                <option value="194Q">Section 194Q — Purchase of Goods (0.1%)</option>
                <option value="194A">Section 194A — Interest on Loans / FD / Corporate (10%)</option>
                <option value="194M">Section 194M — Personal Payments by Individuals (2%)</option>
                <option value="194S">Section 194S — Transfer of Crypto / VDA (1%)</option>
                <option value="194R">Section 194R — Business Benefits & Perquisites (10%)</option>
                <option value="194O">Section 194O — E-Commerce Operator TDS (0.1%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#aab2c5] uppercase tracking-wider mb-2">
                2. Gross Payment / Invoice Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737c92] font-semibold">₹</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#1a2138] border border-[#23293e] text-white rounded-xl pl-8 pr-4 py-3 text-base font-mono font-bold focus:outline-none focus:border-[#4f7cff] transition-colors"
                  placeholder="e.g. 100000"
                />
              </div>
            </div>

            {/* Compliance Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#1a2138] border border-[#23293e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Valid PAN Available?</div>
                  <div className="text-[11px] text-[#737c92]">Sec 206AA check (20% if No)</div>
                </div>
                <button
                  onClick={() => setHasValidPan(!hasValidPan)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    hasValidPan ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {hasValidPan ? "Yes (Valid)" : "No (Missing)"}
                </button>
              </div>

              <div className="bg-[#1a2138] border border-[#23293e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Sec 197 Lower Cert?</div>
                  <div className="text-[11px] text-[#737c92]">AO Lower rate certificate</div>
                </div>
                <button
                  onClick={() => setHasLowerCert(!hasLowerCert)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    hasLowerCert ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/5 text-[#737c92] border border-white/10"
                  }`}
                >
                  {hasLowerCert ? "Yes (Lower)" : "No"}
                </button>
              </div>
            </div>

            {hasLowerCert && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-amber-400">
                  Enter Certified Rate from AO Certificate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customLowerRate}
                  onChange={(e) => setCustomLowerRate(Number(e.target.value))}
                  className="w-full bg-[#121624] border border-amber-500/30 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                  placeholder="e.g. 1.5"
                />
              </div>
            )}
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-[#1a2138] border border-[#23293e] rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
                <span className="text-xs font-semibold text-[#8a95ad] uppercase tracking-wider">TDS Rate Applied</span>
                <span className="text-2xl font-extrabold font-mono text-[#4f7cff]">{calcResult.applicableRate}%</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-[#a3b1cc]">
                  <span>Gross Invoice Amount:</span>
                  <span className="font-mono font-semibold text-white">₹{paymentAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between items-center text-red-400 font-semibold bg-red-500/5 p-2.5 rounded-lg border border-red-500/10">
                  <span>TDS Amount to Deduct:</span>
                  <span className="font-mono text-base">₹{calcResult.tdsAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between items-center text-emerald-400 font-bold bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                  <span>Net Payable to Vendor:</span>
                  <span className="font-mono text-base">₹{calcResult.netPayable.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="bg-[#121624] p-3 rounded-xl border border-[#23293e] text-xs text-[#8a95ad] space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#4f7cff]" /> Compliance Details:
                </div>
                <p>• {calcResult.rateExplanation}</p>
                <p>• Deposit Due Date: <span className="text-white font-medium">{currentSecObj.dueDate}</span></p>
                <p>• Return Statement: <span className="text-white font-medium">{currentSecObj.returnForm}</span></p>
              </div>

              {!hasValidPan && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Section 206AA Triggered:</span> In absence of a valid PAN, deductor MUST deduct at 20% floor rate or standard rate (whichever is higher).
                  </div>
                </div>
              )}
            </div>

            <a
              href="#master-table"
              className="w-full text-center py-3 bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-[#4f7cff]/20 block"
            >
              Explore Full Master Rate Database ↓
            </a>
          </div>
        </div>
      </section>

      {/* Master TDS Rate Table & Search */}
      <section id="master-table" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Statutory TDS Rate Master Database FY 2026-27</h2>
            <p className="text-xs sm:text-sm text-[#8a95ad] mt-1">
              Search by section code, payment type, or filter by category under Income Tax Act rules.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737c92]" size={16} />
              <input
                type="text"
                placeholder="Search section (e.g. 194C, rent, contract)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121624] border border-[#23293e] text-white rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#4f7cff]"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#121624] border border-[#23293e] text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#4f7cff] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="contractor">Contractors (194C/194M)</option>
                <option value="professional">Professional & Tech (194J)</option>
                <option value="rent">Rent (194I/194IB/194IA)</option>
                <option value="interest">Interest & Banks (194A/194N)</option>
                <option value="commission">Commission (194H/194D)</option>
                <option value="goods">Goods Purchase (194Q/194O)</option>
                <option value="crypto">Crypto / VDA (194S)</option>
                <option value="non-resident">Non-Resident (195)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-[#121624] border border-[#23293e] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#1a2138] border-b border-[#23293e] text-[#8a95ad] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-4">Section</th>
                  <th className="py-4 px-4">Nature of Payment</th>
                  <th className="py-4 px-4">Indiv / HUF</th>
                  <th className="py-4 px-4">Company / Firm</th>
                  <th className="py-4 px-4">Threshold Limit</th>
                  <th className="py-4 px-4">No-PAN Rate</th>
                  <th className="py-4 px-4">Return Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23293e] text-[#c3cbe0]">
                {filteredSections.length > 0 ? (
                  filteredSections.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1a2138]/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-[#4f7cff] whitespace-nowrap">
                        Sec {item.section}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[11px] text-[#737c92] mt-0.5 line-clamp-2">{item.notes}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-emerald-400">{item.individualRate}</td>
                      <td className="py-4 px-4 font-mono font-semibold text-emerald-400">{item.companyRate}</td>
                      <td className="py-4 px-4 font-mono text-[#aab2c5]">
                        <div>{item.thresholdAnnual}</div>
                        {item.thresholdSingle !== "N/A" && (
                          <div className="text-[10px] text-[#737c92]">Single: {item.thresholdSingle}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-red-400">{item.noPanRate}</td>
                      <td className="py-4 px-4 font-semibold text-white whitespace-nowrap">{item.returnForm}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#737c92]">
                      No TDS sections match your search query. Try searching for &quot;194C&quot;, &quot;rent&quot;, or &quot;professional&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Monetisation Surface 1: Affiliate / Product Placement Cross-Sell */}
      <section className="bg-gradient-to-r from-[#192342] via-[#121624] to-[#192342] border border-[#23293e] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles size={13} /> Recommended Automation for CA Firms & Accounting Teams
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Auto-Extract TDS & Convert PDF Invoices to Tally Prime Vouchers
          </h3>
          <p className="text-xs md:text-sm text-[#8a95ad] leading-relaxed">
            Stop manually checking TDS rates and typing purchase vouchers. NumberIQ&apos;s AI Invoice Reader extracts vendor GSTIN, TDS section codes, gross amount, and generates 1-click XML vouchers for Tally Prime.
          </p>
        </div>

        <Link
          href="/tools/invoice-to-tally"
          className="px-6 py-3.5 bg-[#4f7cff] hover:bg-[#3d66dd] text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-[#4f7cff]/30 flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          Try Invoice → Tally Automation <ArrowRight size={14} />
        </Link>
      </section>

      {/* Monetisation Surface 2: Lead Capture CA Consultation */}
      <section className="border-t border-[#23293e] pt-8">
        <CAConsultation toolName="TDS Rates & Section 197 Compliance" />
      </section>
    </div>
  );
}
