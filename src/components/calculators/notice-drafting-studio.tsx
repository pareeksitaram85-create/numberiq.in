"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  RotateCcw, 
  BookOpen, 
  AlertTriangle,
  Info,
  Layers,
  ChevronDown
} from "lucide-react";

interface NoticeInputs {
  taxpayerName: string;
  panGstin: string;
  noticeRef: string;
  noticeDate: string;
  replyDate: string;
  financialYear: string;
  authorityName: string;
  authorityAddress: string;
  noticeType: "drc01" | "drc01a" | "sec143_2" | "sec142_1";
  allegationCategory: string;
  disputedTax: string;
  disputedInterest: string;
  disputedPenalty: string;
  customDefense: string;
  circular183: boolean;
  circular170: boolean;
  netCashInterest: boolean;
  presumptiveTax: boolean;
  legitimateBusinessExpense: boolean;
}

const initialInputs: NoticeInputs = {
  taxpayerName: "",
  panGstin: "",
  noticeRef: "",
  noticeDate: "",
  replyDate: "",
  financialYear: "FY 2025-26",
  authorityName: "Proper Officer, GST Range-I",
  authorityAddress: "GST Division Office, Connaught Place, New Delhi - 110001",
  noticeType: "drc01",
  allegationCategory: "itc_mismatch",
  disputedTax: "150000",
  disputedInterest: "45000",
  disputedPenalty: "150000",
  customDefense: "",
  circular183: true,
  circular170: false,
  netCashInterest: true,
  presumptiveTax: false,
  legitimateBusinessExpense: false,
};

export function NoticeDraftingStudio() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputs, setInputs] = useState<NoticeInputs>(initialInputs);
  const [generatedDraft, setGeneratedDraft] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem("numberiq_notice_draft");
    if (saved) {
      try {
        setInputs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved draft inputs:", e);
      }
    }
  }, []);

  // Save draft inputs to local storage
  const saveDraftLocally = () => {
    localStorage.setItem("numberiq_notice_draft", JSON.stringify(inputs));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const resetForm = () => {
    if (window.confirm("Are you sure you want to clear all inputs and reset the drafting studio?")) {
      setInputs(initialInputs);
      localStorage.removeItem("numberiq_notice_draft");
      setGeneratedDraft("");
      setStep(1);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setInputs((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setInputs((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (name: keyof NoticeInputs) => {
    setInputs((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Autoselect templates and defaults when notice type changes
  const handleNoticeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as NoticeInputs["noticeType"];
    let category = "itc_mismatch";
    let authName = inputs.authorityName;
    let authAddr = inputs.authorityAddress;

    if (type === "sec143_2" || type === "sec142_1") {
      category = "high_value_mismatch";
      authName = "Assistant Commissioner of Income Tax, Circle 1(1)";
      authAddr = "Aayakar Bhawan, Income Tax Department, Mumbai - 400020";
    }

    setInputs((prev) => ({
      ...prev,
      noticeType: type,
      allegationCategory: category,
      authorityName: authName,
      authorityAddress: authAddr,
      // reset specific flags
      circular183: type === "drc01",
      netCashInterest: type === "drc01",
      presumptiveTax: type === "sec142_1" || type === "sec143_2",
      legitimateBusinessExpense: type === "sec142_1" || type === "sec143_2",
    }));
  };

  const generateDraftText = () => {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const formattedTax = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      parseFloat(inputs.disputedTax) || 0
    );
    const formattedInterest = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      parseFloat(inputs.disputedInterest) || 0
    );
    const formattedPenalty = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      parseFloat(inputs.disputedPenalty) || 0
    );
    const totalDemand = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      (parseFloat(inputs.disputedTax) || 0) +
      (parseFloat(inputs.disputedInterest) || 0) +
      (parseFloat(inputs.disputedPenalty) || 0)
    );

    let draft = "";

    // Header Details
    draft += `Date: ${today}\n\n`;
    draft += `TO,\n`;
    draft += `${inputs.authorityName.toUpperCase()}\n`;
    draft += `${inputs.authorityAddress}\n\n`;

    // Reference Line
    draft += `SUBJECT: REPLY TO SHOW CAUSE NOTICE / INTIMATION\n`;
    draft += `REFERENCE NO: ${inputs.noticeRef || "[NOTICE REF NO]"}\n`;
    draft += `DATED: ${inputs.noticeDate || "[NOTICE DATE]"}\n`;
    draft += `PAN/GSTIN: ${inputs.panGstin || "[GSTIN/PAN]"}\n`;
    draft += `TAX PERIOD / FINANCIAL YEAR: ${inputs.financialYear}\n`;
    draft += `TAXPAYER NAME: ${inputs.taxpayerName || "[TAXPAYER NAME]"}\n\n`;

    draft += `RESPECTED SIR/MADAM,\n\n`;
    draft += `1. PRELIMINARY SUBMISSION\n`;
    draft += `The Taxpayer, ${inputs.taxpayerName || "[Taxpayer Name]"} ("the Taxpayer"), submits this written response to the Show Cause Notice / Intimation referenced above. The Taxpayer holds this department in the highest regard and seeks to comply with all relevant provisions of the law. The Taxpayer requests that this reply be taken on record and the proposed demand be dropped in full based on the facts and legal grounds set forth below.\n\n`;

    draft += `2. BRIEF FACTS OF THE CASE\n`;
    
    if (inputs.noticeType === "drc01" || inputs.noticeType === "drc01a") {
      draft += `This notice has been issued proposing a demand of ${formattedTax} in tax liability, alongside interest of ${formattedInterest} and a penalty of ${formattedPenalty}, bringing the cumulative proposed demand to ${totalDemand}. The principal ground of the demand relates to `;
      
      if (inputs.allegationCategory === "itc_mismatch") {
        draft += `alleged discrepancies between the Input Tax Credit (ITC) availed by the Taxpayer in Form GSTR-3B and the credit reflected in Form GSTR-2B for the period ${inputs.financialYear}.\n\n`;
      } else if (inputs.allegationCategory === "turnover_suppression") {
        draft += `alleged suppression of taxable sales turnover by comparing GSTR-1 filings with financial balances or income tax returns.\n\n`;
      } else {
        draft += `alleged discrepancies in tax computation under Section 73 of the CGST Act.\n\n`;
      }
    } else {
      // Income Tax
      draft += `The notice issued under Section ${inputs.noticeType === "sec143_2" ? "143(2)" : "142(1)"} of the Income-tax Act has selected the Taxpayer's return for scrutiny / inquiry. The primary points under investigation relate to `;
      
      if (inputs.allegationCategory === "high_value_mismatch") {
        draft += `alleged mismatch between high-value transactions reported in Statement of Financial Transactions (SFT) and the declared income.\n\n`;
      } else if (inputs.allegationCategory === "expense_disallowance") {
        draft += `proposed disallowance of certain business expenditures claimed under Section 37 of the Income-tax Act.\n\n`;
      } else {
        draft += `additional compliance checks for the assessment year corresponding to ${inputs.financialYear}.\n\n`;
      }
    }

    // Detailed Submissions Block
    draft += `3. DETAILED LEGAL SUBMISSIONS & REBUTTALS\n`;

    if (inputs.noticeType === "drc01" || inputs.noticeType === "drc01a") {
      // GST Legal Defenses
      if (inputs.allegationCategory === "itc_mismatch") {
        draft += `A. ON VALUE OF INPUT TAX CREDIT DISCREPANCY:\n`;
        draft += `The Taxpayer submits that all Input Tax Credit (ITC) claimed during the financial year was availed in strict compliance with Section 16 of the Central Goods and Services Tax (CGST) Act. The requirements of Section 16(2) are fully met, i.e.:\n`;
        draft += `  - The Taxpayer is in possession of valid tax invoices/debit notes.\n`;
        draft += `  - The Taxpayer has received the underlying goods and/or services.\n`;
        draft += `  - The tax charged on such supplies has been paid to the Government.\n`;
        draft += `  - The Taxpayer has furnished the necessary returns under Section 39.\n\n`;

        if (inputs.circular183) {
          draft += `B. APPLICABILITY OF CBIC CIRCULAR NO. 183/15/2022-GST:\n`;
          draft += `For any discrepancies arising due to defaults or delay by the supplier in uploading details in GSTR-1, the Central Board of Indirect Taxes and Customs (CBIC) has clarified vide Circular No. 183/15/2022-GST that credit shall not be denied to the recipient. The Taxpayer has obtained and attached the necessary certificates from the chartered accountants or self-declarations from the suppliers certifying that tax has been deposited. Denying credit to the bona fide buyer violates the principles of natural justice and is contrary to the board's binding circular instructions.\n\n`;
        }

        if (inputs.circular170) {
          draft += `C. REFLECTION IN SYSTEM-GENERATED GSTR-2B:\n`;
          draft += `The Taxpayer refers to CBIC Circular No. 170/02/2022-GST, which establishes that GSTR-2B is only a guide. Any delay in supplier uploads which is subsequently cured does not invalidate the eligibility of credit during the tax period, provided the physical inputs and invoices are verified.\n\n`;
        }
      } else if (inputs.allegationCategory === "turnover_suppression") {
        draft += `A. RECONCILIATION OF SALES TURNOVER:\n`;
        draft += `The discrepancy flagged between the GSTR-1 return and the financial accounts is purely due to timing differences, advances received which were subsequently adjusted, or non-taxable recovery items. A full reconciliation sheet is annexed herewith. There is no suppression of outward supplies or evasion of tax.\n\n`;
      }

      if (inputs.netCashInterest) {
        draft += `D. INTEREST UNDER SECTION 50 CANNOT BE LEVIED ON GROSS LIABILITY:\n`;
        draft += `The notice proposes interest on the gross tax amount. The Taxpayer submits that under the proviso to Section 50(1) of the CGST Act (amended retrospectively), interest is only payable on the portion of tax paid by debiting the electronic cash ledger (net cash liability). No interest can be charged on liability settled through the electronic credit ledger. The computation proposed in the notice is therefore bad in law.\n\n`;
      }
    } else {
      // Income Tax Legal Defenses
      if (inputs.allegationCategory === "high_value_mismatch") {
        draft += `A. SOURCE OF HIGH VALUE TRANSACTIONS DETAILED:\n`;
        draft += `The transactions flagged in the SFT statement are fully reconcilable with the Taxpayer's audited books of accounts and bank records. The source of funds for the stated investments / acquisitions is out of declared business income, accumulated capital reserves, or standard borrowings, all of which are documented in the annexures. No part of these transactions constitutes undisclosed cash or income.\n\n`;
      }

      if (inputs.presumptiveTax) {
        draft += `B. PRESUMPTIVE TAXATION UNDER SECTION 44AD / 44ADA:\n`;
        draft += `The Taxpayer has opted to file their return under the presumptive taxation scheme under Section 44AD/44ADA of the Income-tax Act. Under this scheme, the Taxpayer is not required to maintain formal books of accounts under Section 44AA or get them audited under Section 44AB. The declared profits meet or exceed the statutory minimum percentage (6%/8%/50%) specified by the Act. Thus, seeking detailed vouchers or ledger-level details is outside the scope of presumptive assessment regulations.\n\n`;
      }

      if (inputs.legitimateBusinessExpense) {
        draft += `C. EXPENDITURE CLAIMED WAS INCURRED WHOLLY FOR BUSINESS PURPOSES:\n`;
        draft += `The expenditures proposed to be disallowed under Section 37 were incurred wholly and exclusively for the purposes of the Taxpayer's business. These are revenue in nature, not personal expenses, and do not violate any statutory prohibitions. Full supporting documentation including service agreements, commercial utility bills, and bank payments is enclosed to support the claim.\n\n`;
      }
    }

    if (inputs.customDefense) {
      draft += `E. ADDITIONAL SPECIFIC FACTS:\n`;
      draft += `${inputs.customDefense}\n\n`;
    }

    // Penalty Argument
    draft += `4. SUBMISSIONS AGAINST LEVY OF PENALTY\n`;
    draft += `The notice proposes penalty under Section ${inputs.noticeType.startsWith("drc") ? "73/74" : "270A"} of the respective Act. It is a settled position of law that penalty cannot be levied automatically. There must be a clear finding of fraud, willful misstatement, or suppression of facts to evade tax. Since the entire dispute arises out of interpretation differences or supplier-side procedural compliance, there is no mala fide intent on the part of the Taxpayer. Thus, proposed penalty is completely unwarranted.\n\n`;

    // Prayer
    draft += `5. PRAYER & REQUEST\n`;
    draft += `In light of the above facts, statutory provisions, and binding circulars, the Taxpayer respectfully requests:\n`;
    draft += `  - That the proposed demand for tax, interest, and penalty be dropped in its entirety.\n`;
    draft += `  - That the Taxpayer be granted an opportunity of personal hearing via video conferencing prior to the passing of any adverse assessment order.\n`;
    draft += `  - That the Taxpayer be allowed to submit additional documents or clarifications if required.\n\n`;

    draft += `For this act of kindness, the Taxpayer shall ever pray.\n\n\n`;
    draft += `YOURS FAITHFULLY,\n\n\n`;
    draft += `FOR ${inputs.taxpayerName.toUpperCase() || "[TAXPAYER NAME]"}\n\n`;
    draft += `_________________________\n`;
    draft += `AUTHORIZED SIGNATORY / REPRESENTATIVE\n`;

    setGeneratedDraft(draft);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Notice Reply Draft - NumberIQ</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; line-height: 1.5; padding: 40px; color: #000; font-size: 14px; }
            pre { white-space: pre-wrap; word-break: break-all; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <pre>${generatedDraft}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedDraft);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!inputs.taxpayerName.trim()) {
        alert("Please enter Taxpayer Name");
        return false;
      }
      if (!inputs.panGstin.trim()) {
        alert("Please enter PAN / GSTIN");
        return false;
      }
      if (!inputs.noticeRef.trim()) {
        alert("Please enter Notice Reference Number");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const prevStep = () => {
    setStep((prev) => (prev - 1) as any);
  };

  return (
    <div className="w-full flex flex-col gap-8 text-white">
      {/* Page Title & Hook */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#4f7cff]/10 text-[#7ba0ff] border border-[#4f7cff]/20 mb-3">
            <Sparkles size={11} className="text-[#7ba0ff]" /> Premium AI Drafting
          </span>
          <h1 className="font-display text-3xl font-black tracking-tight">
            AI Notice Reply Drafting Studio
          </h1>
          <p className="text-sm text-[#737c92] mt-1 max-w-xl">
            Input the notice details and tax position. Our engine constructs a formal legal reply citing CBIC circulars, judgments, and legal provisos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={saveDraftLocally}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#aab2c5] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? "Saved!" : "Save Draft"}
          </button>
          <button 
            onClick={resetForm}
            className="p-2.5 rounded-xl border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 text-[#737c92] hover:text-red-400 transition-all cursor-pointer"
            title="Reset All Inputs"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hand: Controls & Steps */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Step Indicator */}
          <div className="bg-[#0E121B] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-[#737c92] font-semibold">Progress</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    s === step 
                      ? "bg-[#4f7cff] w-10 shadow-[0_0_10px_rgba(79,124,255,0.4)]" 
                      : s < step 
                        ? "bg-[#00D68F]" 
                        : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-[#0E121B] border border-white/5 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-[#4f7cff]/5 blur-2xl pointer-events-none" />

            {/* STEP 1: GENERAL PARTICULARS */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 1: General Particulars</h3>
                  <p className="text-xs text-[#737c92] mt-0.5">Define taxpayer credentials and authority office.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Tax Authority / Notice Regime</label>
                  <div className="relative">
                    <select
                      name="noticeType"
                      value={inputs.noticeType}
                      onChange={handleNoticeTypeChange}
                      className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all appearance-none cursor-pointer"
                    >
                      <option value="drc01">GST DRC-01 (Show Cause Notice)</option>
                      <option value="drc01a">GST DRC-01A (Pre-SCN Intimation)</option>
                      <option value="sec143_2">Income Tax Sec 143(2) (Scrutiny Notice)</option>
                      <option value="sec142_1">Income Tax Sec 142(1) (Questionnaire)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737c92] pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Taxpayer Name</label>
                    <input
                      type="text"
                      name="taxpayerName"
                      value={inputs.taxpayerName}
                      onChange={handleInputChange}
                      placeholder="e.g. M/S Reliance Retail"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">PAN / GSTIN</label>
                    <input
                      type="text"
                      name="panGstin"
                      value={inputs.panGstin}
                      onChange={handleInputChange}
                      placeholder="e.g. 07AAAAA0000A1Z2"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Notice Ref Number</label>
                    <input
                      type="text"
                      name="noticeRef"
                      value={inputs.noticeRef}
                      onChange={handleInputChange}
                      placeholder="e.g. SCN/GST/DEL/01"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Financial Year</label>
                    <input
                      type="text"
                      name="financialYear"
                      value={inputs.financialYear}
                      onChange={handleInputChange}
                      placeholder="e.g. FY 2025-26"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Notice Date</label>
                    <input
                      type="date"
                      name="noticeDate"
                      value={inputs.noticeDate}
                      onChange={handleInputChange}
                      className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Reply Due Date</label>
                    <input
                      type="date"
                      name="replyDate"
                      value={inputs.replyDate}
                      onChange={handleInputChange}
                      className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ALLEGATIONS & TAX DEMAND */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 2: Allegations & Proposed Demand</h3>
                  <p className="text-xs text-[#737c92] mt-0.5">Specify the charges and proposed financial penalty.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Allegation Category</label>
                  <div className="relative">
                    <select
                      name="allegationCategory"
                      value={inputs.allegationCategory}
                      onChange={handleInputChange}
                      className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all appearance-none cursor-pointer"
                    >
                      {inputs.noticeType.startsWith("drc") ? (
                        <>
                          <option value="itc_mismatch">ITC Mismatch (GSTR-2B vs 3B)</option>
                          <option value="turnover_suppression">Turnover Suppression (GSTR-1 vs Financials)</option>
                          <option value="rcm_nonpayment">Non-payment of tax on RCM liabilities</option>
                          <option value="other_gst">Other CGST/SGST discrepancies</option>
                        </>
                      ) : (
                        <>
                          <option value="high_value_mismatch">SFT Mismatch (High-Value Cash/Investments)</option>
                          <option value="expense_disallowance">Business Expense Disallowance (S. 37)</option>
                          <option value="gift_loans">Loans or Gifts treated as Undisclosed Income</option>
                          <option value="other_it">Other Income Tax discrepancies</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737c92] pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Tax Proposed (₹)</label>
                    <input
                      type="number"
                      name="disputedTax"
                      value={inputs.disputedTax}
                      onChange={handleInputChange}
                      placeholder="150000"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Interest Proposed (₹)</label>
                    <input
                      type="number"
                      name="disputedInterest"
                      value={inputs.disputedInterest}
                      onChange={handleInputChange}
                      placeholder="45000"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Penalty Proposed (₹)</label>
                    <input
                      type="number"
                      name="disputedPenalty"
                      value={inputs.disputedPenalty}
                      onChange={handleInputChange}
                      placeholder="150000"
                      className="bg-[#06080D] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Assessing Officer Address</label>
                  <input
                    type="text"
                    name="authorityName"
                    value={inputs.authorityName}
                    onChange={handleInputChange}
                    placeholder="Proper Officer, Ward - 5"
                    className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all"
                  />
                  <textarea
                    name="authorityAddress"
                    value={inputs.authorityAddress}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Full Address of the authority office"
                    className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: LEGAL GROUND SELECTORS */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 3: Choose Defense Objections</h3>
                  <p className="text-xs text-[#737c92] mt-0.5">Toggle statutory exclusions or circulars to support your case.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {inputs.noticeType.startsWith("drc") ? (
                    /* GST Toggles */
                    <>
                      <div 
                        onClick={() => handleCheckboxChange("circular183")}
                        className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                          inputs.circular183 
                            ? "bg-[#4f7cff]/5 border-[#4f7cff] text-white" 
                            : "bg-[#06080D] border-white/10 text-[#737c92]"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          name="circular183" 
                          checked={inputs.circular183} 
                          onChange={() => {}} 
                          className="mt-0.5 rounded text-[#4f7cff] focus:ring-0 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1">
                            CBIC Circular 183/15/2022-GST <span title="Guidelines for verifying ITC mismatch between 3B & 2A/2B"><Info size={11} className="opacity-50" /></span>
                          </p>
                          <p className="text-[10px] text-[#737c92] mt-1 leading-relaxed">
                            Cites relaxation instructions allowing self-declaration or CA certificate validation if supplier failed to upload invoices.
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleCheckboxChange("circular170")}
                        className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                          inputs.circular170 
                            ? "bg-[#4f7cff]/5 border-[#4f7cff] text-white" 
                            : "bg-[#06080D] border-white/10 text-[#737c92]"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          name="circular170" 
                          checked={inputs.circular170} 
                          onChange={() => {}} 
                          className="mt-0.5 rounded text-[#4f7cff] focus:ring-0 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">CBIC Circular 170/02/2022-GST</p>
                          <p className="text-[10px] text-[#737c92] mt-1 leading-relaxed">
                            Cites guidelines for reporting credit reversals and establishes that GSTR-2B is simply a guide.
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleCheckboxChange("netCashInterest")}
                        className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                          inputs.netCashInterest 
                            ? "bg-[#4f7cff]/5 border-[#4f7cff] text-white" 
                            : "bg-[#06080D] border-white/10 text-[#737c92]"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          name="netCashInterest" 
                          checked={inputs.netCashInterest} 
                          onChange={() => {}} 
                          className="mt-0.5 rounded text-[#4f7cff] focus:ring-0 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Net Cash Liability Interest (S. 50)</p>
                          <p className="text-[10px] text-[#737c92] mt-1 leading-relaxed">
                            Cites retrospective amendment of Section 50(1) CGST Act. Interest applies only on electronic cash ledger payments, not credit ledger.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Income Tax Toggles */
                    <>
                      <div 
                        onClick={() => handleCheckboxChange("presumptiveTax")}
                        className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                          inputs.presumptiveTax 
                            ? "bg-[#4f7cff]/5 border-[#4f7cff] text-white" 
                            : "bg-[#06080D] border-white/10 text-[#737c92]"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          name="presumptiveTax" 
                          checked={inputs.presumptiveTax} 
                          onChange={() => {}} 
                          className="mt-0.5 rounded text-[#4f7cff] focus:ring-0 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Presumptive Taxation (S. 44AD / 44ADA)</p>
                          <p className="text-[10px] text-[#737c92] mt-1 leading-relaxed">
                            Asserts exclusion from maintaining detailed registers or auditing if presumptive scheme profits are declared.
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleCheckboxChange("legitimateBusinessExpense")}
                        className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                          inputs.legitimateBusinessExpense 
                            ? "bg-[#4f7cff]/5 border-[#4f7cff] text-white" 
                            : "bg-[#06080D] border-white/10 text-[#737c92]"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          name="legitimateBusinessExpense" 
                          checked={inputs.legitimateBusinessExpense} 
                          onChange={() => {}} 
                          className="mt-0.5 rounded text-[#4f7cff] focus:ring-0 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Section 37 Wholly & Exclusively Clause</p>
                          <p className="text-[10px] text-[#737c92] mt-1 leading-relaxed">
                            Argues that claimed expenditures were incurred in the ordinary course of business and are revenue in nature.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#737c92] font-bold">Custom Defense Facts / Notes</label>
                  <textarea
                    name="customDefense"
                    value={inputs.customDefense}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter specific facts or transaction numbers here (e.g. details of invoice matches, banking transactions, dates of payment to suppliers)..."
                    className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: GENERATE & PREVIEW */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-white">Step 4: Draft Generation</h3>
                  <p className="text-xs text-[#737c92] mt-0.5">Click generate to compile all facts into a formal submission letter.</p>
                </div>

                <div className="border border-[#4f7cff]/20 bg-[#4f7cff]/5 rounded-2xl p-4 flex gap-3 text-xs text-[#7ba0ff]">
                  <Sparkles size={16} className="shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Our AI compiler will consolidate notice particulars, apply CBIC notifications, net-cash proviso checks, and format the structure with appropriate legal address fields.
                  </p>
                </div>

                <button
                  onClick={generateDraftText}
                  className="w-full py-4 bg-gradient-to-r from-[#4f7cff] to-[#7ba0ff] hover:opacity-95 text-sm font-bold text-white rounded-xl shadow-[0_0_30px_rgba(79,124,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} /> Compile & Generate Draft
                </button>
              </div>
            )}

            {/* Step Actions Footer */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#aab2c5] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] text-xs font-bold text-white shadow-[0_0_20px_rgba(79,124,255,0.2)] transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  Next <ArrowRight size={13} />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>

        {/* Right Hand: Output Draft Previewer */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-[#0E121B] border border-white/5 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden flex flex-col min-h-[600px]">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[#00D68F]/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#4f7cff]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#aab2c5]">Draft Document Preview</span>
              </div>
              
              {generatedDraft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-[#aab2c5] hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Copy to Clipboard"
                  >
                    {isCopied ? <Check size={13} className="text-[#00D68F]" /> : <Copy size={13} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-[#aab2c5] hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Print Reply Draft"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              )}
            </div>

            {/* Document body text editor */}
            {generatedDraft ? (
              <textarea
                value={generatedDraft}
                onChange={(e) => setGeneratedDraft(e.target.value)}
                className="w-full flex-1 bg-[#06080D]/60 border border-white/5 rounded-2xl p-6 text-xs text-[#dcdfe8] font-mono leading-relaxed focus:outline-none focus:border-white/15 transition-all resize-none min-h-[500px]"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-black/10">
                <BookOpen size={40} className="text-[#737c92]/50 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Reply Draft is Empty</h4>
                <p className="text-xs text-[#737c92] max-w-sm leading-relaxed">
                  Complete the particulars and toggles in the step wizard on the left, then click "Compile & Generate Draft" in Step 4 to preview the legal reply.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authority Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex gap-4 items-start">
          <AlertTriangle size={18} className="text-[#FFB547] shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Standard Proviso Disclaimer</h5>
            <p className="text-[11px] text-[#737c92] leading-relaxed">
              Legal replies should always be cross-verified against current notifications, notifications updates, and local jurisdictional rulings. Ensure proper power of attorney/authorizations are filed along with the reply.
            </p>
          </div>
        </div>
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex gap-4 items-start">
          <Layers size={18} className="text-[#4f7cff] shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Annexures Checklist</h5>
            <p className="text-[11px] text-[#737c92] leading-relaxed">
              When submitting, remember to enclose supporting sheets: reconciliation reports, ledger certificates, proof of invoice payment, bank sheets, and certified copies of supplier returns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
