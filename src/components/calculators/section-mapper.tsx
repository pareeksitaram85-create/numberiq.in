"use client";

import { useState } from "react";
import { Search, Info, HelpCircle } from "lucide-react";

interface SectionMapping {
  oldSec: string;
  newSec: string;
  title: string;
  category: "TDS/TCS" | "Capital Gains" | "Presumptive" | "Penalties & Others" | "Corporate & Other Business";
  desc: string;
  note?: string;
}

const MAPPINGS_DATA: SectionMapping[] = [
  {
    oldSec: "192",
    newSec: "392",
    title: "TDS on Salary",
    category: "TDS/TCS",
    desc: "Governs deduction of tax at source by employers on salary paid to employees.",
    note: "Employer computes tax liability based on the slab (default is Section 202 new regime)."
  },
  {
    oldSec: "192A",
    newSec: "392(7)",
    title: "TDS on Premature EPF Withdrawal",
    category: "TDS/TCS",
    desc: "TDS on withdrawal from Employee Provident Fund before 5 years of continuous service.",
    note: "Deduction rate is 10% on withdrawals crossing ₹50,000 threshold."
  },
  {
    oldSec: "193",
    newSec: "393(1)",
    title: "TDS on Interest on Securities",
    category: "TDS/TCS",
    desc: "TDS on interest paid on debentures, bonds, or other securities issued by companies or government.",
    note: "Consolidated under Section 393 resident non-salary TDS table."
  },
  {
    oldSec: "194",
    newSec: "393(1)",
    title: "TDS on Dividend",
    category: "TDS/TCS",
    desc: "Tax deduction on dividends distributed by domestic companies to resident shareholders.",
    note: "Deducted at 10% on aggregate payments exceeding ₹10,000 in a financial year."
  },
  {
    oldSec: "194A",
    newSec: "393(1)",
    title: "TDS on Interest other than Securities (FD interest)",
    category: "TDS/TCS",
    desc: "TDS on bank fixed deposits, post office scheme interest, and interest on loans/deposits from non-banking entities.",
    note: "FD threshold is ₹50,000 (₹1,00,00,000 for senior citizens). Others is ₹10,000."
  },
  {
    oldSec: "194B",
    newSec: "393(1)",
    title: "TDS on Lottery & Card Games Winnings",
    category: "TDS/TCS",
    desc: "TDS on winnings from lotteries, crosswords, card games, and other similar games.",
    note: "Flat tax of 30% applies on payouts exceeding ₹10,000."
  },
  {
    oldSec: "194BA",
    newSec: "393(1)",
    title: "TDS on Online Gaming Winnings",
    category: "TDS/TCS",
    desc: "TDS on net winnings from online games in user accounts.",
    note: "Flat 30% tax calculated at year-end or withdrawal with no minimum threshold."
  },
  {
    oldSec: "194BB",
    newSec: "393(1)",
    title: "TDS on Horse Race Winnings",
    category: "TDS/TCS",
    desc: "TDS on winnings from bookmakers or horse race club payouts.",
    note: "Flat 30% tax on amounts exceeding ₹10,000."
  },
  {
    oldSec: "194C",
    newSec: "393(1)",
    title: "TDS on Contractor & Sub-contractor Payments",
    category: "TDS/TCS",
    desc: "TDS on payments to resident contractors for carrying out works contract (job-work, AMC, building, logistics).",
    note: "1% for individual/HUF contractors, 2% for others. Threshold: ₹30,000 single bill / ₹1,00,000 aggregate."
  },
  {
    oldSec: "194D",
    newSec: "393(1)",
    title: "TDS on Insurance Commission",
    category: "TDS/TCS",
    desc: "TDS on commission paid to resident insurance agents.",
    note: "2% for individual agents, 10% for companies. Threshold is ₹20,000."
  },
  {
    oldSec: "194DA",
    newSec: "393(1)",
    title: "TDS on Life Insurance Policy Payouts",
    category: "TDS/TCS",
    desc: "TDS on taxable sum paid under a life insurance policy (not exempt under Section 10(10D)).",
    note: "Deduction is 2% on the income portion (maturity amount minus premiums paid) if exceeding ₹1,00,000."
  },
  {
    oldSec: "194EE",
    newSec: "393(1)",
    title: "TDS on National Savings Scheme (NSS) Payout",
    category: "TDS/TCS",
    desc: "TDS on payments from NSS deposits.",
    note: "Rate is 10% on payouts exceeding ₹2,500."
  },
  {
    oldSec: "194G",
    newSec: "393(1)",
    title: "TDS on Lottery Commission",
    category: "TDS/TCS",
    desc: "TDS on commission, brokerage, or prize discount on sale of lottery tickets.",
    note: "Rate is 2% on payments exceeding ₹20,000."
  },
  {
    oldSec: "194H",
    newSec: "393(1)",
    title: "TDS on Commission or Brokerage",
    category: "TDS/TCS",
    desc: "TDS on commission or brokerage paid to resident agents for services.",
    note: "Rate is 2% (reduced from 5%) on payouts crossing ₹20,000."
  },
  {
    oldSec: "194I",
    newSec: "393(1)",
    title: "TDS on Rent",
    category: "TDS/TCS",
    desc: "TDS on rent paid for land, building, furniture, or plant and machinery.",
    note: "Consolidated monthly limit of ₹50,000/month. Rate is 10% for land/building, 2% for plant/machinery."
  },
  {
    oldSec: "194IA",
    newSec: "393(1)",
    title: "TDS on Purchase of Immovable Property",
    category: "TDS/TCS",
    desc: "TDS paid by a buyer to a seller on transfer of land/building (other than agricultural land).",
    note: "Rate is 1% on consideration of ₹50 Lakhs or more. TAN is not required."
  },
  {
    oldSec: "194IB",
    newSec: "393(1)",
    title: "TDS on Rent by Individuals/HUF (salaried/no-audit)",
    category: "TDS/TCS",
    desc: "TDS on rent paid by individuals or HUF not covered under regular audit parameters.",
    note: "Rate is 2% on rent exceeding ₹50,000 per month. Paid once a year."
  },
  {
    oldSec: "194IC",
    newSec: "393(1)",
    title: "TDS on Joint Development Agreement (JDA)",
    category: "TDS/TCS",
    desc: "TDS on monetary consideration paid to a landowner under a joint development agreement.",
    note: "Rate is 10% with no threshold limit."
  },
  {
    oldSec: "194J",
    newSec: "393(1)",
    title: "TDS on Professional or Technical Fees",
    category: "TDS/TCS",
    desc: "TDS on fees for professional services, technical services, royalty, and non-compete fees.",
    note: "10% for professional fees (CA/lawyer/doctor), 2% for FTS/royalty. Limit is ₹50,000."
  },
  {
    oldSec: "194LA",
    newSec: "393(1)",
    title: "TDS on Property Compulsory Acquisition Compensation",
    category: "TDS/TCS",
    desc: "TDS on compensation paid by government for acquiring private land/building.",
    note: "Rate is 10% on payments exceeding ₹5,00,000."
  },
  {
    oldSec: "194M",
    newSec: "393(1)",
    title: "TDS on Contractor/Professional Fees by Individuals/HUF",
    category: "TDS/TCS",
    desc: "TDS on works contracts, brokerage, or professional fees paid by non-audited individuals.",
    note: "Rate is 2% on payments exceeding ₹50 Lakhs in a year."
  },
  {
    oldSec: "194N",
    newSec: "393(1)",
    title: "TDS on Cash Withdrawals from Bank",
    category: "TDS/TCS",
    desc: "TDS on cash withdrawals from bank/co-operative bank accounts.",
    note: "2% on withdrawals exceeding ₹1 Crore (₹20 Lakhs with 5% above ₹1 Crore for non-ITR filers)."
  },
  {
    oldSec: "194O",
    newSec: "393(1)",
    title: "TDS on E-commerce Operator Payments to Participants",
    category: "TDS/TCS",
    desc: "TDS on sale of goods or services facilitated through e-commerce operator platforms.",
    note: "Rate is 0.1% on annual sales exceeding ₹5,00,000."
  },
  {
    oldSec: "194Q",
    newSec: "393(1)",
    title: "TDS on Purchase of Goods",
    category: "TDS/TCS",
    desc: "TDS on buying goods from resident sellers, deducted by buyers with turnover > ₹10 Crores.",
    note: "Rate is 0.1% on purchase value exceeding ₹50 Lakhs from a single seller in a year."
  },
  {
    oldSec: "194R",
    newSec: "393(1)",
    title: "TDS on Business Benefits or Perquisites",
    category: "TDS/TCS",
    desc: "TDS on benefits, gifts, trip sponsorships, or incentives given to dealers/distributors.",
    note: "Rate is 10% on aggregate benefit value exceeding ₹20,000 in a year."
  },
  {
    oldSec: "194S",
    newSec: "393(1)",
    title: "TDS on Virtual Digital Assets (Crypto)",
    category: "TDS/TCS",
    desc: "TDS on transfer of virtual digital assets or cryptocurrency.",
    note: "Rate is 1% on consideration exceeding ₹10,000 (₹50,000 for specified individuals)."
  },
  {
    oldSec: "194T",
    newSec: "393(1)",
    title: "TDS on Payments by Firm to Partners",
    category: "TDS/TCS",
    desc: "TDS on salary, commission, bonus, or interest paid by a partnership firm/LLP to partners.",
    note: "Introduced in 2025. Rate is 10% on aggregate payments exceeding ₹20,000."
  },
  {
    oldSec: "195",
    newSec: "393(2)",
    title: "TDS on Payments to Non-residents",
    category: "TDS/TCS",
    desc: "TDS on interest, capital gains, royalty, or other taxable payments to non-resident entities.",
    note: "Governed by Section 393(2). Subject to DTAA rates if lower. Health & education cess applies."
  },
  {
    oldSec: "206C(1)",
    newSec: "405",
    title: "TCS on Scrap, Timber, Forest Products",
    category: "TDS/TCS",
    desc: "Tax collection at source on sale of scrap, alcohol, tendu leaves, timber, or minerals.",
    note: "All TCS provisions are consolidated under Section 405 (formerly Section 206C)."
  },
  {
    oldSec: "206C(1F)",
    newSec: "405",
    title: "TCS on Motor Vehicle Sales",
    category: "TDS/TCS",
    desc: "TCS collected by dealers on retail sale of motor vehicles.",
    note: "Rate is 1% on vehicles exceeding sale value of ₹10 Lakhs."
  },
  {
    oldSec: "206C(1G)",
    newSec: "405",
    title: "TCS on LRS Foreign Remittance & Tour Packages",
    category: "TDS/TCS",
    desc: "TCS on sending money abroad under Liberalised Remittance Scheme and buying overseas tour packages.",
    note: "5% up to ₹7 Lakhs, 20% above (exempt/lower rates for medical and education)."
  },
  {
    oldSec: "201(1A)",
    newSec: "399(3)",
    title: "Interest on Late Deduction or Payment of TDS",
    category: "Penalties & Others",
    desc: "Interest charged for defaults in deducting TDS or delay in depositing deducted tax.",
    note: "1% per month for late deduction, 1.5% per month for late payment."
  },
  {
    oldSec: "43B",
    newSec: "37",
    title: "Deductions Allowed only on Actual Payment",
    category: "Corporate & Other Business",
    desc: "Specifies that certain business expenses (taxes, bank interest, bonuses) are allowed as deduction only upon payment.",
    note: "Now governed by Section 37 of the new Income-tax Act 2025."
  },
  {
    oldSec: "43B(h)",
    newSec: "37",
    title: "MSME Payment Disallowance",
    category: "Corporate & Other Business",
    desc: "Business expenses owed to registered MSMEs are disallowed if not paid within MSMED Act deadlines (15/45 days).",
    note: "Highly critical practitioner section. Re-mapped to Section 37."
  },
  {
    oldSec: "44AD",
    newSec: "58",
    title: "Presumptive Taxation for Businesses",
    category: "Presumptive",
    desc: "Allows eligible businesses to declare presumptive profits (6% or 8% of turnover) without audit.",
    note: "Turnover limit up to ₹3 Crores (subject to cash transaction limits)."
  },
  {
    oldSec: "44ADA",
    newSec: "59",
    title: "Presumptive Taxation for Professionals",
    category: "Presumptive",
    desc: "Allows eligible professionals (doctors, CAs, engineers) to declare profits at 50% of gross receipts.",
    note: "Receipts limit up to ₹75 Lakhs in a financial year."
  },
  {
    oldSec: "44AB",
    newSec: "54",
    title: "Applicability of Tax Audit",
    category: "Corporate & Other Business",
    desc: "Mandates maintenance of accounts and tax audit by a CA if turnover exceeds threshold.",
    note: "Standard limit is ₹1 Crore (up to ₹10 Crores if cash transactions are under 5%)."
  },
  {
    oldSec: "234A",
    newSec: "432",
    title: "Interest on Delay in Filing ITR",
    category: "Penalties & Others",
    desc: "Interest levied for defaults or delay in furnishing the return of income.",
    note: "Rate is 1% per month or part of a month on outstanding tax."
  },
  {
    oldSec: "234B",
    newSec: "433",
    title: "Interest on Default in Payment of Advance Tax",
    category: "Penalties & Others",
    desc: "Interest levied when advance tax paid is less than 90% of assessed tax.",
    note: "Rate is 1% per month on the shortfall amount."
  },
  {
    oldSec: "234C",
    newSec: "434",
    title: "Interest on Deferment of Advance Tax",
    category: "Penalties & Others",
    desc: "Interest charged for deferment or failure to pay quarterly advance tax installments.",
    note: "Levied on shortfall of individual installments at 1% per month for 3 months (except March)."
  },
  {
    oldSec: "234F",
    newSec: "440",
    title: "Late Fee for Delay in Filing ITR",
    category: "Penalties & Others",
    desc: "Late filing fee for submitting the Income Tax Return after the statutory due date.",
    note: "Standard fee is ₹5,000 (₹1,000 if total income is below ₹5 Lakhs)."
  },
  {
    oldSec: "270A",
    newSec: "462",
    title: "Penalty for Under-reporting or Misreporting of Income",
    category: "Penalties & Others",
    desc: "Penalty levied during assessment for under-reporting (50% of tax) or misreporting (200% of tax) of income.",
    note: "Now Section 462 under the Income-tax Act 2025."
  },
  {
    oldSec: "115BAC",
    newSec: "202",
    title: "Concessional Slabs / New Tax Regime Option",
    category: "Corporate & Other Business",
    desc: "Establishes the default tax regime slabs for individuals, HUF, and AOP with lower tax rates.",
    note: "Now Section 202 in the new Act. Default regime unless opted out."
  },
  {
    oldSec: "111A",
    newSec: "196",
    title: "Short-Term Capital Gains (STCG) on Equity",
    category: "Capital Gains",
    desc: "Tax on short-term capital gains arising from listed equity shares or equity mutual funds.",
    note: "Governed by Section 196. Rate is 20% on transactions subject to STT."
  },
  {
    oldSec: "112",
    newSec: "197",
    title: "Long-Term Capital Gains (LTCG) on Unlisted Assets",
    category: "Capital Gains",
    desc: "Tax on long-term capital gains on unlisted securities, properties, and physical gold.",
    note: "Governed by Section 197. Rate is 12.5% without indexation benefit."
  },
  {
    oldSec: "112A",
    newSec: "198",
    title: "Long-Term Capital Gains (LTCG) on Listed Equity",
    category: "Capital Gains",
    desc: "Tax on long-term capital gains from transfer of listed shares or equity mutual funds.",
    note: "Governed by Section 198. Rate is 12.5% on gains exceeding ₹1.25 Lakhs. No indexation."
  },
  {
    oldSec: "56(2)(x)",
    newSec: "105",
    title: "Taxability of Gifts & Deemed Income",
    category: "Corporate & Other Business",
    desc: "Taxability of money, property, or shares received by individuals without or for inadequate consideration.",
    note: "Mapped to Section 105. Gift value exceeding ₹50,000 is taxed as income from other sources."
  },
  {
    oldSec: "139",
    newSec: "263",
    title: "Filing of Income Tax Return (ITR)",
    category: "Corporate & Other Business",
    desc: "Governs requirements, due dates, and conditions for filing annual income tax returns.",
    note: "Mapped to Section 263. Filing is mandatory for corporate entities and taxable individuals."
  },
  {
    oldSec: "143(1)",
    newSec: "270",
    title: "Processing of Return & Intimation",
    category: "Penalties & Others",
    desc: "Allows automated verification and processing of filed ITRs by the CPC.",
    note: "Intimations are issued under Section 270 outlining demand or refund calculations."
  },
  {
    oldSec: "143(2)",
    newSec: "271",
    title: "Scrutiny Notice",
    category: "Penalties & Others",
    desc: "Notice served to taxpayers to produce evidence or explain filed returns for detailed scrutiny.",
    note: "Notice under Section 271 must be served within statutory timelines."
  }
];

export function SectionMapper() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const categories = ["All", "TDS/TCS", "Capital Gains", "Presumptive", "Penalties & Others", "Corporate & Other Business"];

  const filteredMappings = MAPPINGS_DATA.filter((m) => {
    const matchesSearch = 
      m.oldSec.toLowerCase().includes(search.toLowerCase()) ||
      m.newSec.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.desc.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "All" || m.category === activeTab;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-3xl font-display font-bold text-white tracking-tight mb-2">
          Income Tax Section Converter
        </h2>
        <p className="text-xs md:text-sm text-[#737c92] leading-relaxed max-w-xl mx-auto">
          Verify and map old Income-tax Act, 1961 section numbers to their renumbered counterparts under the **Income-tax Act, 2025** (effective 1 April 2026).
        </p>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737c92]" size={16} />
          <input
            type="text"
            aria-label="Search by old section, new section, or keywords"
            placeholder="Search by old section, new section, or keywords... (e.g. 194C, 43B, rent, presumptive)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpandedIndex(null);
            }}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-[#737c92] transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin scrollbar-thumb-white/10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                setExpandedIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === cat
                  ? "bg-[#4f7cff]/10 text-[#4f7cff] border border-[#4f7cff]/20"
                  : "bg-transparent text-[#737c92] hover:text-white border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mappings Table/List */}
      <div className="space-y-3">
        {filteredMappings.length > 0 ? (
          filteredMappings.map((m, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-[#4f7cff]/5 border-[#4f7cff]/20 shadow-[0_0_20px_rgba(79,124,255,0.05)]"
                    : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 cursor-pointer"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#737c92] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff]" />
                      {m.category}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-white leading-snug">
                      {m.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 sm:justify-end">
                    {/* Old Block */}
                    <div className="flex flex-col items-center bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-[#737c92]">1961 Act</span>
                      <span className="text-xs md:text-sm font-bold text-[#aab2c5]">Sec {m.oldSec}</span>
                    </div>

                    {/* Arrow */}
                    <span className="text-[#737c92] font-mono">→</span>

                    {/* New Block */}
                    <div className="flex flex-col items-center bg-[#4f7cff]/10 border border-[#4f7cff]/20 px-2.5 py-1 rounded-lg">
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-[#4f7cff]">2025 Act</span>
                      <span className="text-xs md:text-sm font-bold text-white">Sec {m.newSec}</span>
                    </div>
                  </div>
                </div>

                {/* Details Expanded Panel */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#080a12]/50 p-4 space-y-3 text-xs md:text-sm text-[#aab2c5] leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <Info size={16} className="text-[#4f7cff] flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Nature of Provision:</strong> {m.desc}
                      </div>
                    </div>
                    {m.note && (
                      <div className="flex items-start gap-2.5 border-t border-white/5 pt-3">
                        <HelpCircle size={16} className="text-[#34d399] flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Compliance Note (FY 2026-27):</strong> {m.note}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <p className="text-sm text-[#737c92]">No section mappings found for &ldquo;{search}&rdquo;.</p>
          </div>
        )}
      </div>

      {/* Practitioner Disclaimer */}
      <div className="mt-8 border-l-4 border-amber-500 bg-amber-500/5 p-4 rounded-r-xl text-xs text-[#aab2c5] leading-relaxed">
        <strong>Practitioner Reference:</strong> Effective from 1 April 2026, the Income-tax Act, 2025 replaces the Income-tax Act, 1961. Use the new renumbered sections for all assessment and transaction filings for FY 2026-27 (AY 2027-28) onwards.
      </div>
    </div>
  );
}
