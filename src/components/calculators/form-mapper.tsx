"use client";

import { useState } from "react";
import { Search, Info, HelpCircle, CalendarClock, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";

interface FormMapping {
  oldForm: string;
  newForm: string;
  title: string;
  category: "Statements" | "Certificates" | "Declarations" | "Foreign Remittance";
  desc: string;
  dueDate: string;
  authority: string;
  /**
   * "primary"  — the department's own form/FAQ document is titled
   *              "Form No. X (Earlier Form No. Y)", so the mapping is stated by CBDT itself.
   * "derived"  — the new form exists and is notified, but CBDT has not published an explicit
   *              "Earlier Form No." label; the correspondence is inferred from the rule cited
   *              and the subject matter. Flagged in the UI rather than silently presented.
   */
  confidence: "primary" | "derived";
  /** Official incometaxindia.gov.in document backing the mapping. */
  source: string;
}

const FORM_MAPPINGS: FormMapping[] = [
  {
    oldForm: "24Q",
    newForm: "138",
    title: "Quarterly TDS Statement — Salary",
    category: "Statements",
    desc: "Quarterly return filed by an employer reporting tax deducted at source from salary paid to employees, including the annexure of employee-wise deduction details.",
    dueDate: "31 July (Q1), 31 October (Q2), 31 January (Q3), 31 May (Q4)",
    authority: "Rule 219, Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-138-faqs",
  },
  {
    oldForm: "26Q",
    newForm: "140",
    title: "Quarterly TDS Statement — Resident, Non-Salary",
    category: "Statements",
    desc: "Quarterly return for TDS on all non-salary payments to residents — contractor payments, professional fees, rent, interest, commission and the rest of the resident deduction table.",
    dueDate: "31 July (Q1), 31 October (Q2), 31 January (Q3), 31 May (Q4)",
    authority: "Rule 219, Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/fn-140",
  },
  {
    oldForm: "27Q",
    newForm: "144",
    title: "Quarterly TDS Statement — Non-Residents",
    category: "Statements",
    desc: "Quarterly return for tax deducted on payments to non-residents and foreign companies under the Section 393(2) framework, including treaty-rate deductions.",
    dueDate: "31 July (Q1), 31 October (Q2), 31 January (Q3), 31 May (Q4)",
    authority: "Rule 219(1), Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-144-faqs",
  },
  {
    oldForm: "27EQ",
    newForm: "143",
    title: "Quarterly TCS Statement",
    category: "Statements",
    desc: "Quarterly return filed by a collector reporting tax collected at source — scrap, motor vehicles, LRS remittances, overseas tour packages and other specified collections.",
    dueDate: "Follows the same quarterly calendar as the TDS statements",
    authority: "Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/fn-143",
  },
  {
    oldForm: "26QB / 26QC / 26QD / 26QE",
    newForm: "141",
    title: "Consolidated Challan-cum-Statement",
    category: "Statements",
    desc: "One unified challan-cum-statement replacing four separate forms — property purchase (26QB), rent by individuals and HUF (26QC), contractor and professional payments by non-audited individuals (26QD), and virtual digital assets (26QE).",
    dueDate: "Within 30 days from the end of the month in which tax was deducted",
    authority: "Rules 218(3) and 219(5), Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-141-faqs",
  },
  {
    oldForm: "16",
    newForm: "130",
    title: "TDS Certificate — Salary",
    category: "Certificates",
    desc: "Annual certificate issued by an employer to an employee showing salary paid and tax deducted, in Part A and Part B format.",
    dueDate: "By 15 June following the end of the tax year",
    authority: "Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs",
  },
  {
    oldForm: "16A",
    newForm: "131",
    title: "TDS Certificate — Non-Salary",
    category: "Certificates",
    desc: "Quarterly certificate issued to a deductee for tax deducted on payments other than salary.",
    dueDate: "Within 15 days of the due date for the corresponding quarterly statement",
    authority: "Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-131-faqs",
  },
  {
    oldForm: "16B / 16C / 16D / 16E",
    newForm: "132",
    title: "Certificate for Challan-cum-Statement Deductions",
    category: "Certificates",
    desc: "The single certificate now issued against a Form 141 deduction, replacing the four certificates that previously matched 26QB, 26QC, 26QD and 26QE.",
    dueDate: "Within 15 days of the due date for filing Form 141",
    authority: "Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-132-faqs",
  },
  {
    oldForm: "15G / 15H",
    newForm: "121",
    title: "Declaration for Receipt of Income Without Deduction",
    category: "Declarations",
    desc: "The self-declaration filed by a payee whose income is below the taxable threshold, so that tax is not deducted at source. Both the general declaration and the senior-citizen variant are now a single form.",
    dueDate: "Filed with the payer before the income is credited or paid",
    authority: "Rule 211, read with Section 393(6) of the Income-tax Act, 2025",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/fn-121",
  },
  {
    oldForm: "12BBA",
    newForm: "125",
    title: "Declaration by a Specified Senior Citizen",
    category: "Declarations",
    desc: "Declaration furnished to a specified bank by a senior citizen aged 75 or above seeking exemption from filing a return, where the bank computes and deducts the tax.",
    dueDate: "Filed with the specified bank for the relevant tax year",
    authority: "Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/fn-125",
  },
  {
    oldForm: "15CA",
    newForm: "145",
    title: "Information for Payment to a Non-Resident",
    category: "Foreign Remittance",
    desc: "Declaration filed by a remitter before making a payment to a non-resident, setting out the nature of the remittance and the tax withheld.",
    dueDate: "Before the remittance is made",
    authority: "Rule 220, Income-tax Rules, 2026",
    confidence: "primary",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-145-faqs",
  },
  {
    oldForm: "15CB",
    newForm: "146",
    title: "Accountant's Certificate for Foreign Remittance",
    category: "Foreign Remittance",
    desc: "Certificate of a chartered accountant on the taxability of a remittance to a non-resident and the rate at which tax has been withheld, including the treaty position relied on.",
    dueDate: "Obtained before the remittance, to support the Form 145 declaration",
    authority: "Rule 220, Income-tax Rules, 2026",
    confidence: "derived",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/fn-146",
  },
  {
    oldForm: "67",
    newForm: "44",
    title: "Foreign Tax Credit Statement",
    category: "Foreign Remittance",
    desc: "Statement of income earned from a country or specified territory outside India, and of the foreign tax paid on it, filed to claim foreign tax credit under the treaty or unilateral relief provisions.",
    dueDate: "On or before the due date for furnishing the return of income",
    authority: "Rule 76, Income-tax Rules, 2026",
    confidence: "derived",
    source: "https://www.incometaxindia.gov.in/documents/d/guest/form-44-45-faqs",
  },
  {
    oldForm: "13",
    newForm: "128",
    title: "Application for Lower or Nil Deduction Certificate",
    category: "Declarations",
    desc: "Application by a payee for a certificate authorising deduction at a lower rate, or no deduction at all — the route an NRI seller uses to avoid over-withholding on a property sale.",
    dueDate: "Filed in advance of the payment on which relief is sought",
    authority: "Section 395(1) and 395(3) of the Income-tax Act, 2025",
    confidence: "derived",
    source: "https://www.incometaxindia.gov.in/w/faqs-on-forms-as-per-income-tax-rules-2026-1",
  },
];

const CATEGORIES = ["All", "Statements", "Certificates", "Declarations", "Foreign Remittance"] as const;

export function FormMapper() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const query = search.trim().toLowerCase();

  const filtered = FORM_MAPPINGS.filter((m) => {
    const matchesSearch =
      query === "" ||
      m.oldForm.toLowerCase().includes(query) ||
      m.newForm.toLowerCase().includes(query) ||
      m.title.toLowerCase().includes(query) ||
      m.desc.toLowerCase().includes(query);

    const matchesTab = activeTab === "All" || m.category === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-3xl font-display font-bold text-white tracking-tight mb-2">
          TDS &amp; TCS Form Number Converter
        </h2>
        <p className="text-xs md:text-sm text-[#737c92] leading-relaxed max-w-xl mx-auto">
          Every TDS, TCS and remittance form was renumbered by the Income-tax Rules, 2026, effective 1 April 2026. Search an old form number to find what it is called now.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737c92]" size={16} />
          <input
            type="text"
            aria-label="Search by old form number, new form number, or keywords"
            placeholder="Search by form number or keyword… (e.g. 26QB, 27Q, salary certificate, 15CA)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpandedIndex(null);
            }}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-[#737c92] transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin scrollbar-thumb-white/10">
          {CATEGORIES.map((cat) => (
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

      {/* Results */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((m, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={`${m.oldForm}-${m.newForm}`}
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-[#4f7cff]/5 border-[#4f7cff]/20 shadow-[0_0_20px_rgba(79,124,255,0.05)]"
                    : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                }`}
              >
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
                    <div className="flex flex-col items-center bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-[#737c92]">Until 31 Mar 2026</span>
                      <span className="text-xs md:text-sm font-bold text-[#aab2c5]">Form {m.oldForm}</span>
                    </div>

                    <span className="text-[#737c92] font-mono">→</span>

                    <div className="flex flex-col items-center bg-[#4f7cff]/10 border border-[#4f7cff]/20 px-2.5 py-1 rounded-lg">
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-[#4f7cff]">From 1 Apr 2026</span>
                      <span className="text-xs md:text-sm font-bold text-white">Form {m.newForm}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#080a12]/50 p-4 space-y-3 text-xs md:text-sm text-[#aab2c5] leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <Info size={16} className="text-[#4f7cff] flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">What the form covers:</strong> {m.desc}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 border-t border-white/5 pt-3">
                      <CalendarClock size={16} className="text-[#f4b740] flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Due date:</strong> {m.dueDate}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 border-t border-white/5 pt-3">
                      <HelpCircle size={16} className="text-[#34d399] flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Authority:</strong> {m.authority}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 border-t border-white/5 pt-3">
                      {m.confidence === "primary" ? (
                        <ShieldCheck size={16} className="text-[#34d399] flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-[#f4b740] flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="text-white">
                          {m.confidence === "primary" ? "Stated by CBDT:" : "Derived mapping:"}
                        </strong>{" "}
                        {m.confidence === "primary"
                          ? "the department publishes this form under the heading “Form No. " +
                            m.newForm +
                            " (Earlier Form No. " +
                            m.oldForm +
                            ")”."
                          : "CBDT has notified the new form but has not published an explicit “Earlier Form No.” heading for it. The correspondence follows from the rule cited and the subject matter — confirm against the notified form before relying on it in a filing."}{" "}
                        <a
                          href={m.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#4f7cff] hover:underline"
                        >
                          Official document <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <p className="text-sm text-[#737c92]">No form mapping found for &ldquo;{search}&rdquo;.</p>
          </div>
        )}
      </div>

      <div className="mt-8 border-l-4 border-amber-500 bg-amber-500/5 p-4 rounded-r-xl text-xs text-[#aab2c5] leading-relaxed">
        <strong>Practitioner reference:</strong> The Income-tax Rules, 2026 were notified by CBDT vide Notification No. 22/2026 dated 20 March 2026 (G.S.R. 198(E)) and came into force on 1 April 2026, reducing 511 rules and 399 forms under the 1962 Rules to 333 rules and 190 forms. Which law applies turns on the earlier of credit or payment: deductions on or before 31 March 2026 stay with the old forms, deductions from 1 April 2026 use the new ones.
      </div>
    </div>
  );
}
