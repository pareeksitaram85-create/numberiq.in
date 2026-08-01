"use client";

import React, { useState, useMemo } from "react";
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Scale } from "lucide-react";
import { CAConsultation } from "@/components/ca-consultation";

interface RcmCategory {
  id: string;
  name: string;
  sacCode: string;
  notificationRef: string;
  supplier: string;
  recipient: string;
  rate: string;
  verdict: "YES" | "CONDITIONAL" | "NO";
  summary: string;
  conditions: string[];
  itcEligible: boolean;
  notes: string;
}

const RCM_DATABASE: RcmCategory[] = [
  {
    id: "gta-freight",
    name: "Goods Transport Agency (GTA) Services",
    sacCode: "996511 / 996512",
    notificationRef: "Notif 13/2017-CT(R) Entry 1 & Notif 04/2022-CT(R)",
    supplier: "Goods Transport Agency (GTA)",
    recipient: "Factory, Society, Co-operative, Registered Person, Body Corporate, Partnership Firm",
    rate: "5% (CGST 2.5% + SGST 2.5%) or 12% (if GTA did not exercise FCM option @ 12%)",
    verdict: "CONDITIONAL",
    summary: "RCM applies @ 5% if GTA has NOT opted to pay under Forward Charge Mechanism (FCM) @ 5% or 12% in Annexure V.",
    conditions: [
      "If GTA issues invoice with FCM Declaration (Annexure V) paying 5% or 12%, RCM does NOT apply.",
      "If GTA does not opt for FCM, recipient specified under Entry 1 MUST pay 5% GST under RCM.",
      "Department / Govt Bodies registered only for TDS under Sec 51 are EXEMPT from RCM."
    ],
    itcEligible: true,
    notes: "Recipient paying tax under RCM is entitled to full Input Tax Credit (ITC) if used for business purpose."
  },
  {
    id: "legal-services",
    name: "Legal Services by Advocates / Senior Advocates / Law Firm",
    sacCode: "998211",
    notificationRef: "Notif 13/2017-CT(R) Entry 2",
    supplier: "Individual Advocate, Senior Advocate, or Firm of Advocates",
    recipient: "Any Business Entity located in the taxable territory",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "YES",
    summary: "Mandatory RCM on all legal advice, representation, and consultancy provided to a business entity.",
    conditions: [
      "Recipient business entity must be located in taxable territory.",
      "If recipient turnover is below GST registration threshold (and not registered), service is EXEMPT under Notif 12/2017.",
      "Senior Advocates providing services to another Advocate/Firm are also covered under RCM."
    ],
    itcEligible: true,
    notes: "Advocates are completely exempt from taking GST registration if their entire income is subject to RCM."
  },
  {
    id: "director-remuneration",
    name: "Director Remuneration / Professional Fees",
    sacCode: "998311 / 998313",
    notificationRef: "Notif 13/2017-CT(R) Entry 3 & Circular 140/2020",
    supplier: "Director of a Company or Body Corporate",
    recipient: "The Company or Body Corporate",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "CONDITIONAL",
    summary: "RCM applies on Sitting Fees, Commission, and Professional Fees paid to Directors.",
    conditions: [
      "Executive / Whole-time / Managing Director salary subjected to TDS under Section 192 (Employment): NO GST / NO RCM.",
      "Independent / Non-Executive Director fees or Executive Director fees subjected to TDS under Section 194J (Professional): MANDATORY RCM @ 18%."
    ],
    itcEligible: true,
    notes: "Company must deposit tax in cash via GSTR-3B Table 3.1(d) and can claim ITC in Table 4(A)(2)."
  },
  {
    id: "renting-residential-property",
    name: "Renting of Residential Dwelling to Registered Person",
    sacCode: "997211",
    notificationRef: "Notif 05/2022-CT(R) w.e.f. 18-07-2022",
    supplier: "Any Person (Registered or Unregistered)",
    recipient: "Any GST Registered Person",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "YES",
    summary: "Mandatory RCM whenever a GST-registered business/proprietor rents a residential property.",
    conditions: [
      "If rented by a Proprietor in personal capacity for personal residence (not charged as business expense), it is EXEMPT via Notif 15/2022.",
      "If rented for commercial use or business guest house / office, RCM @ 18% applies."
    ],
    itcEligible: false,
    notes: "ITC is BLOCKED under Section 17(5) if used for personal residence of employees/proprietor."
  },
  {
    id: "renting-commercial-property",
    name: "Renting of Commercial Immovable Property by Unregistered Person",
    sacCode: "997212",
    notificationRef: "Notif 09/2024-CT(R) w.e.f. 10-10-2024",
    supplier: "Any Unregistered Person (Landlord)",
    recipient: "Any GST Registered Person (Tenant)",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "YES",
    summary: "RCM applies on commercial property rent when landlord is unregistered and tenant is registered.",
    conditions: [
      "If Landlord is REGISTERED under GST, Forward Charge (FCM) applies — Landlord issues GST invoice.",
      "If Landlord is UNREGISTERED, tenant pays 18% under RCM under Entry 5AA."
    ],
    itcEligible: true,
    notes: "Tenant can claim 100% ITC if the commercial premises is used for business operations."
  },
  {
    id: "sponsorship-services",
    name: "Sponsorship Services",
    sacCode: "998397",
    notificationRef: "Notif 13/2017-CT(R) Entry 4",
    supplier: "Any Person",
    recipient: "Any Body Corporate or Partnership Firm located in taxable territory",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "YES",
    summary: "Mandatory RCM on sponsorship fees paid to sports teams, events, or individuals by corporate entities.",
    conditions: [
      "Recipient MUST be a Body Corporate (Company/LLP) or Partnership Firm.",
      "If recipient is a Sole Proprietorship or Individual, Forward Charge applies."
    ],
    itcEligible: true,
    notes: "Sponsorship for business promotion yields valid ITC under Section 16."
  },
  {
    id: "security-services",
    name: "Security Services (Supply of Security Personnel)",
    sacCode: "998529",
    notificationRef: "Notif 29/2018-CT(R) Entry 14",
    supplier: "Any Person other than a Body Corporate (e.g., Firm, LLP, Individual)",
    recipient: "A Registered Person located in taxable territory",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "CONDITIONAL",
    summary: "RCM applies when security agency is a non-body-corporate (proprietorship/partnership firm).",
    conditions: [
      "If Security Supplier is a Private Limited / Public Limited Company (Body Corporate), FCM applies.",
      "If Security Supplier is a Proprietorship or Partnership Firm, Registered Recipient MUST pay under RCM.",
      "Govt Departments registered only for TDS under Sec 51 are exempt from RCM."
    ],
    itcEligible: true,
    notes: "Security charges for factory or corporate office are eligible for full ITC."
  },
  {
    id: "import-of-services",
    name: "Import of Services from Foreign Supplier",
    sacCode: "9983 / 9984 / Various",
    notificationRef: "Notif 10/2017-IT(R) Entry 1 & Sec 7(1)(b) IGST Act",
    supplier: "Any Person located in non-taxable territory (Outside India)",
    recipient: "Any Person located in taxable territory (India)",
    rate: "18% IGST",
    verdict: "YES",
    summary: "Mandatory IGST under RCM on cross-border service imports (SaaS, foreign consultants, cloud servers).",
    conditions: [
      "Applies whether import is for business or non-business (if with consideration).",
      "OIDAR services (e.g., Netflix) provided to non-taxable online recipients are paid by foreign provider under FCM."
    ],
    itcEligible: true,
    notes: "Must issue Self-Invoice under Section 31(3)(f) and Payment Voucher under Section 31(3)(g)."
  },
  {
    id: "copyright-transfer",
    name: "Transfer of Copyright (Author, Music Composer, Photographer, Artist)",
    sacCode: "998391",
    notificationRef: "Notif 13/2017-CT(R) Entry 9 & Notif 22/2019-CT(R)",
    supplier: "Author, Music Composer, Photographer, Artist",
    recipient: "Publisher, Music Company, Producer, or Business Entity",
    rate: "12% (Books/Author) or 18% (Music/Art)",
    verdict: "CONDITIONAL",
    summary: "RCM applies on royalties paid to authors/composers unless author opts for FCM.",
    conditions: [
      "Authors can opt to pay under FCM by filing declaration in Annexure I with 1-year lock-in.",
      "If no FCM option is filed by author, publisher pays GST under RCM."
    ],
    itcEligible: true,
    notes: "Royalty payments for commercial publishing/music rights generate eligible ITC."
  },
  {
    id: "arbitral-tribunal",
    name: "Arbitral Tribunal Services",
    sacCode: "998215",
    notificationRef: "Notif 13/2017-CT(R) Entry 3",
    supplier: "Arbitral Tribunal / Arbitrator",
    recipient: "Any Business Entity located in taxable territory",
    rate: "18% (CGST 9% + SGST 9% or IGST 18%)",
    verdict: "YES",
    summary: "Mandatory RCM on fees paid to arbitrators by business entities.",
    conditions: [
      "Recipient must be a business entity in India.",
      "Small business entities below registration threshold are exempt."
    ],
    itcEligible: true,
    notes: "Arbitrator fee paid during commercial dispute resolution is eligible for ITC."
  }
];

export function RCMApplicabilityChecker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("gta-freight");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return RCM_DATABASE;
    const q = searchQuery.toLowerCase();
    return RCM_DATABASE.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.sacCode.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeCategory = useMemo(() => {
    return RCM_DATABASE.find((c) => c.id === selectedCategoryId) || RCM_DATABASE[0];
  }, [selectedCategoryId]);

  return (
    <div className="w-full flex flex-col gap-8 text-white">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#121629] via-[#0d101d] to-[#080911] border border-[#4f7cff]/20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4f7cff]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4f7cff]/10 border border-[#4f7cff]/30 text-[#4f7cff] text-xs font-semibold uppercase tracking-wider">
              <Scale size={14} />
              GST Section 9(3) & 9(4) Diagnostic
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              RCM Applicability Checker & Statutory Database
            </h2>
            <p className="text-sm text-[#737c92] leading-relaxed">
              Instantly check whether Reverse Charge Mechanism (RCM) applies to your procurement, determine the exact statutory rate, and verify CBIC notification entries for FY 2026-27.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737c92]">Active Master Law</span>
            <span className="text-sm font-semibold text-[#4f7cff]">Notif 13/2017-CT(R) & Amendments</span>
            <span className="text-[11px] text-[#aab2c5]">Updated for FY 2026-27</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Category Selector & Search */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737c92]" />
            <input
              type="text"
              placeholder="Search GTA, Legal, Renting, Director, Security..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b0e19] border border-white/10 text-xs text-white placeholder-[#737c92] focus:outline-none focus:border-[#4f7cff] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCategories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex flex-col gap-1.5 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-[#4f7cff]/15 border-[#4f7cff] text-white shadow-[0_0_15px_rgba(79,124,255,0.15)]"
                      : "bg-[#0b0e19] border-white/5 text-[#aab2c5] hover:bg-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white leading-tight">{cat.name}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        cat.verdict === "YES"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : cat.verdict === "CONDITIONAL"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {cat.verdict === "YES" ? "Mandatory RCM" : cat.verdict === "CONDITIONAL" ? "Conditional RCM" : "FCM Only"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-[#737c92]">
                    <span>SAC: <strong className="text-[#aab2c5]">{cat.sacCode}</strong></span>
                    <span>•</span>
                    <span className="truncate">{cat.supplier}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Statutory Verdict & Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0e19] border border-white/10 flex flex-col gap-6 relative overflow-hidden">
            {/* Verdict Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#737c92]">Selected Statutory Category</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{activeCategory.name}</h3>
                <span className="text-xs text-[#4f7cff] font-mono mt-1 block">{activeCategory.notificationRef}</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                {activeCategory.verdict === "YES" ? (
                  <CheckCircle2 size={24} className="text-emerald-400" />
                ) : activeCategory.verdict === "CONDITIONAL" ? (
                  <AlertTriangle size={24} className="text-amber-400" />
                ) : (
                  <ShieldAlert size={24} className="text-rose-400" />
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#737c92]">Diagnostic Result</div>
                  <div
                    className={`text-xs font-bold ${
                      activeCategory.verdict === "YES"
                        ? "text-emerald-400"
                        : activeCategory.verdict === "CONDITIONAL"
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {activeCategory.verdict === "YES"
                      ? "RCM APPLICABLE"
                      : activeCategory.verdict === "CONDITIONAL"
                      ? "CONDITIONAL RCM"
                      : "FORWARD CHARGE (FCM)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Lede */}
            <div className="p-4 rounded-xl bg-[#4f7cff]/10 border border-[#4f7cff]/20 text-xs text-[#aab2c5] leading-relaxed">
              <strong className="text-white">Statutory Verdict Summary: </strong>
              {activeCategory.summary}
            </div>

            {/* Structured Specifications Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#737c92] uppercase font-bold">Supplier Status</span>
                <p className="text-xs text-white font-medium">{activeCategory.supplier}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#737c92] uppercase font-bold">Recipient Status</span>
                <p className="text-xs text-white font-medium">{activeCategory.recipient}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#737c92] uppercase font-bold">Applicable Tax Rate</span>
                <p className="text-xs text-[#4f7cff] font-bold">{activeCategory.rate}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#737c92] uppercase font-bold">Recipient ITC Status</span>
                <p className={`text-xs font-bold ${activeCategory.itcEligible ? "text-emerald-400" : "text-rose-400"}`}>
                  {activeCategory.itcEligible ? "Eligible for ITC under Sec 16" : "Blocked ITC under Sec 17(5)"}
                </p>
              </div>
            </div>

            {/* Mandatory Conditions & Caveats */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-[#4f7cff]" />
                Mandatory Legal Conditions & Provisos
              </h4>
              <ul className="space-y-2">
                {activeCategory.conditions.map((cond, idx) => (
                  <li key={idx} className="text-xs text-[#aab2c5] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#4f7cff] font-bold mt-0.5">•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compliance Action Points */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Mandatory Accounting SOP</span>
              <p className="text-xs text-[#aab2c5] leading-relaxed">
                1. Issue a Self-Invoice under Section 31(3)(f) if supplier is unregistered.<br />
                2. Deposit tax in cash via <strong>GSTR-3B Table 3.1(d)</strong> (Credit ledger cannot be used for RCM liability).<br />
                3. Claim ITC in <strong>GSTR-3B Table 4(A)(2)</strong> in the same tax period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CA Lead Consultation Section */}
      <CAConsultation
        toolName="RCM Applicability Diagnostic & Statutory Advisory"
      />
    </div>
  );
}
