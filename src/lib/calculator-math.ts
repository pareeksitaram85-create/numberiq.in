/**
 * NumberIQ — Core Tax & Financial Calculator Mathematics Library
 * 
 * This library extracts the mathematical calculations from the React components
 * and static pages, ensuring they are cleanly structured, fully typed, and
 * completely testable in isolation.
 */

// Cost Inflation Index (CII) mappings for India u/s 48
export const CII_MAP: Record<string, number> = {
  "2001-02": 100,
  "2002-03": 105,
  "2003-04": 109,
  "2004-05": 113,
  "2005-06": 117,
  "2006-07": 122,
  "2007-08": 129,
  "2008-09": 137,
  "2009-10": 148,
  "2010-11": 167,
  "2011-12": 184,
  "2012-13": 200,
  "2013-14": 220,
  "2014-15": 240,
  "2015-16": 254,
  "2016-17": 264,
  "2017-18": 272,
  "2018-19": 280,
  "2019-20": 289,
  "2020-21": 301,
  "2021-22": 317,
  "2022-23": 331,
  "2023-24": 348,
  "2024-25": 363,
  "2025-26": 369,
  "2026-27": 369, // Standard transition mapping
};

// ==========================================
// 1. GST INTEREST (Section 50)
// ==========================================

export interface GstInterestResult {
  amt: number;
  rate: number;
  days: number;
  interest: number;
  totalPayable: number;
  isDelayed: boolean;
}

export function calculateGstInterest(
  taxAmtStr: string,
  dueDateStr: string,
  paymentDateStr: string,
  rateStr: string
): GstInterestResult | null {
  const amt = parseFloat(taxAmtStr);
  const intRate = parseFloat(rateStr);

  if (isNaN(amt) || amt <= 0 || !dueDateStr || !paymentDateStr || isNaN(intRate)) return null;

  const due = new Date(dueDateStr);
  const paid = new Date(paymentDateStr);

  due.setHours(0, 0, 0, 0);
  paid.setHours(0, 0, 0, 0);

  const diffTime = paid.getTime() - due.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return { amt, rate: intRate, days: 0, interest: 0, totalPayable: amt, isDelayed: false };
  }

  const interest = (amt * intRate * days) / (100 * 365);
  const totalPayable = amt + interest;

  return {
    amt,
    rate: intRate,
    days,
    interest,
    totalPayable,
    isDelayed: true,
  };
}

// ==========================================
// 2. GST LATE FEE (Section 47)
// ==========================================

export interface GstLateFeeResult {
  days: number;
  perDay: number;
  gross: number;
  cap: number;
  payable: number;
  cgst: number;
  sgst: number;
  isDelayed: boolean;
}

export function calculateGstLateFee(
  dueDateStr: string,
  filingDateStr: string,
  type: string,
  capStr: string
): GstLateFeeResult | null {
  if (!dueDateStr || !filingDateStr) return null;

  const due = new Date(dueDateStr);
  const filed = new Date(filingDateStr);

  due.setHours(0, 0, 0, 0);
  filed.setHours(0, 0, 0, 0);

  const diffTime = filed.getTime() - due.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return { days: 0, perDay: 0, gross: 0, cap: 0, payable: 0, cgst: 0, sgst: 0, isDelayed: false };
  }

  const perDay = type === "nil" ? 20 : 50;
  const cap = type === "nil" ? 500 : parseInt(capStr, 10) || 2000;
  const gross = days * perDay;
  const payable = Math.min(gross, cap);
  const half = payable / 2;

  return {
    days,
    perDay,
    gross,
    cap,
    payable,
    cgst: half,
    sgst: half,
    isDelayed: true,
  };
}

// ==========================================
// 2.1 COMBINED GST INTEREST & LATE FEE (Sec 50 + Sec 47)
// ==========================================

export interface GstInterestAndLateFeeResult {
  returnType: "GSTR-3B" | "GSTR-1";
  taxAmount: number;
  dueDate: string;
  filingDate: string;
  isQrmp: boolean;
  isNilReturn: boolean;
  daysDelayed: number;
  interestRate: number;
  interestAmount: number;
  lateFeePerDay: number;
  lateFeeGross: number;
  lateFeeCap: number;
  lateFeePayable: number;
  lateFeeCgst: number;
  lateFeeSgst: number;
  totalStatutoryPayable: number;
  isDelayed: boolean;
}

export function calculateGstInterestAndLateFee(
  returnType: "GSTR-3B" | "GSTR-1",
  taxAmountInput: number | string,
  dueDateStr: string,
  filingDateStr: string,
  isQrmp: boolean = false,
  isNilReturn: boolean = false,
  interestRateInput: number | string = 18,
  turnoverCapInput: string = "2000"
): GstInterestAndLateFeeResult | null {
  if (!dueDateStr || !filingDateStr) return null;

  const taxAmt = isNilReturn ? 0 : (typeof taxAmountInput === "number" ? taxAmountInput : parseFloat(String(taxAmountInput)) || 0);
  const intRate = typeof interestRateInput === "number" ? interestRateInput : parseFloat(String(interestRateInput)) || 18;

  const due = new Date(dueDateStr);
  const filed = new Date(filingDateStr);
  due.setHours(0, 0, 0, 0);
  filed.setHours(0, 0, 0, 0);

  const diffTime = filed.getTime() - due.getTime();
  const daysDelayed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  if (daysDelayed <= 0) {
    return {
      returnType,
      taxAmount: taxAmt,
      dueDate: dueDateStr,
      filingDate: filingDateStr,
      isQrmp,
      isNilReturn,
      daysDelayed: 0,
      interestRate: intRate,
      interestAmount: 0,
      lateFeePerDay: 0,
      lateFeeGross: 0,
      lateFeeCap: 0,
      lateFeePayable: 0,
      lateFeeCgst: 0,
      lateFeeSgst: 0,
      totalStatutoryPayable: taxAmt,
      isDelayed: false,
    };
  }

  // Interest under Section 50 (18% or 24% p.a. on Net Cash Liability)
  const interestAmount = isNilReturn || taxAmt <= 0 ? 0 : (taxAmt * intRate * daysDelayed) / (100 * 365);

  // Late Fee under Section 47 (₹20/day for Nil, ₹50/day for Taxable)
  const lateFeePerDay = isNilReturn ? 20 : 50;

  let cap = 2000;
  if (isNilReturn) {
    cap = 500;
  } else {
    const parsedCap = parseInt(turnoverCapInput, 10);
    if (!isNaN(parsedCap) && parsedCap > 0) {
      cap = parsedCap;
    }
  }

  const lateFeeGross = daysDelayed * lateFeePerDay;
  const lateFeePayable = Math.min(lateFeeGross, cap);
  const lateFeeCgst = lateFeePayable / 2;
  const lateFeeSgst = lateFeePayable / 2;

  const totalStatutoryPayable = taxAmt + interestAmount + lateFeePayable;

  return {
    returnType,
    taxAmount: taxAmt,
    dueDate: dueDateStr,
    filingDate: filingDateStr,
    isQrmp,
    isNilReturn,
    daysDelayed,
    interestRate: intRate,
    interestAmount,
    lateFeePerDay,
    lateFeeGross,
    lateFeeCap: cap,
    lateFeePayable,
    lateFeeCgst,
    lateFeeSgst,
    totalStatutoryPayable,
    isDelayed: true,
  };
}

// ==========================================
// 3. LRS TCS (Section 206C(1G))
// ==========================================

export interface LrsTcsResult {
  amount: number;
  threshold: number;
  applicableAmount: number;
  rate: number;
  tcsAmount: number;
  note: string;
}

export function calculateLrsTcs(
  amountInput: number | string,
  remittanceType: string,
  isTourPackage: boolean
): LrsTcsResult {
  const cleanAmount = Number(amountInput) || 0;
  const threshold = 700000; // 7 Lakhs threshold

  let tcsRate = 0;
  let applicableAmount = 0;
  let tcs = 0;
  let note = "";

  if (isTourPackage) {
    // Overseas tour packages: 5% up to 7L, 20% above 7L (no exemption threshold)
    if (cleanAmount <= threshold) {
      tcsRate = 5;
      tcs = cleanAmount * 0.05;
      note = "TCS rate of 5% applies on overseas tour packages up to ₹7,00,000.";
    } else {
      const baseTcs = threshold * 0.05;
      const excessTcs = (cleanAmount - threshold) * 0.20;
      tcs = baseTcs + excessTcs;
      tcsRate = cleanAmount > 0 ? (tcs / cleanAmount) * 100 : 0;
      note = "TCS u/s 206C(1G) applies: 5% on the first ₹7 Lakhs, and 20% on the remaining amount.";
    }
    applicableAmount = cleanAmount;
  } else {
    // Other remittances (LRS)
    if (cleanAmount <= threshold) {
      tcs = 0;
      tcsRate = 0;
      note = "Remittances under LRS up to ₹7 Lakhs are exempt from TCS (except tour packages).";
    } else {
      applicableAmount = cleanAmount - threshold;
      if (remittanceType === "education-loan") {
        tcsRate = 0.5;
        tcs = applicableAmount * 0.005;
        note = "Concessional rate of 0.5% applies on education remittances funded by financial loans exceeding ₹7 Lakhs.";
      } else if (remittanceType === "education-own" || remittanceType === "medical") {
        tcsRate = 5;
        tcs = applicableAmount * 0.05;
        note = "TCS of 5% applies on education/medical remittances exceeding ₹7 Lakhs.";
      } else {
        tcsRate = 20;
        tcs = applicableAmount * 0.20;
        note = "TCS of 20% applies on general LRS remittances (others) exceeding ₹7 Lakhs.";
      }
    }
  }

  return {
    amount: cleanAmount,
    threshold: isTourPackage ? 0 : threshold,
    applicableAmount,
    rate: tcsRate,
    tcsAmount: tcs,
    note,
  };
}

// ==========================================
// 4. PROPERTY CAPITAL GAINS (Section 54/50C/112)
// ==========================================

export interface PropertyGainsResult {
  holdingMonths: number;
  isLongTerm: boolean;
  effectiveSaleValue: number;
  rawGain: number;
  indexedCost: number | null;
  indexedImprovement: number | null;
  gainNoIdx: number;
  gainIdx: number | null;
  taxNoIdxFinal: number;
  taxIdxFinal: number | null;
  betterOption: "no-index" | "index" | "stcg" | null;
}

export function calculatePropertyCapitalGains(
  sale: number,
  cost: number,
  improve: number,
  expenses: number,
  holdMonths: number,
  buyFY: string,
  sellFY: string,
  sdv: number = 0
): PropertyGainsResult {
  const isLongTerm = holdMonths > 24;

  // Section 50C Check: If SDV > 1.10 * Sale Value, use SDV as sale consideration
  const effectiveSaleValue = sdv > sale * 1.10 ? sdv : sale;

  // 1. Without Indexation calculations (used for STCG and LTCG Option A)
  const gainNoIdx = effectiveSaleValue - cost - improve - expenses;
  const rawGain = gainNoIdx;

  if (!isLongTerm) {
    return {
      holdingMonths: holdMonths,
      isLongTerm: false,
      effectiveSaleValue,
      rawGain,
      indexedCost: null,
      indexedImprovement: null,
      gainNoIdx,
      gainIdx: null,
      taxNoIdxFinal: 0, // Taxed at slab rates, computed by general tax calc
      taxIdxFinal: null,
      betterOption: "stcg",
    };
  }

  // 2. LTCG Option A: Flat 12.5% without indexation (Finance Act 2024)
  const taxNoIdx = Math.max(0, gainNoIdx) * 0.125;
  const taxNoIdxFinal = taxNoIdx * 1.04; // Plus 4% Health & Education Cess

  // 3. LTCG Option B: 20% with indexation (Available if acquired pre-July 23, 2024)
  let gainIdx: number | null = null;
  let taxIdxFinal: number | null = null;
  let indexedCost: number | null = null;
  let indexedImprovement: number | null = null;

  const ciiB = CII_MAP[buyFY];
  const ciiS = CII_MAP[sellFY];

  if (ciiB && ciiS) {
    indexedCost = cost * (ciiS / ciiB);
    indexedImprovement = improve > 0 ? improve * (ciiS / ciiB) : 0;
    gainIdx = effectiveSaleValue - indexedCost - indexedImprovement - expenses;

    const taxIdx = Math.max(0, gainIdx) * 0.20;
    taxIdxFinal = taxIdx * 1.04; // Plus 4% Cess
  }

  // Compare Option A vs Option B
  let betterOption: "no-index" | "index" = "no-index";
  if (taxIdxFinal !== null && taxIdxFinal < taxNoIdxFinal && gainIdx !== null && gainIdx >= 0) {
    betterOption = "index";
  }

  return {
    holdingMonths: holdMonths,
    isLongTerm: true,
    effectiveSaleValue,
    rawGain,
    indexedCost,
    indexedImprovement,
    gainNoIdx,
    gainIdx,
    taxNoIdxFinal,
    taxIdxFinal,
    betterOption,
  };
}

// ==========================================
// 5. EQUITY CAPITAL GAINS (Section 111A/112A)
// ==========================================

export interface EquityGainsResult {
  totalSale: number;
  effectiveCost: number;
  gain: number;
  isLongTerm: boolean;
  isSTT: boolean;
  taxableGain: number;
  taxBase: number;
  taxRate: number | null;
  totalTax: number | null;
  label: string;
}

export function calculateEquityCapitalGains(
  saleP: number,
  qty: number,
  buyP: number,
  brokerage: number,
  holdMonths: number,
  fmv: number = 0,
  sttPaid: boolean = true,
  otherGains: number = 0
): EquityGainsResult {
  const totalSale = saleP * qty - brokerage;
  const rawCost = buyP * qty;

  // Grandfathering u/s 112A: if FMV on 31 Jan 2018 is provided
  let effectiveCost = rawCost;
  if (fmv > 0 && sttPaid) {
    const fmvTotal = fmv * qty;
    effectiveCost = Math.max(rawCost, Math.min(fmvTotal, totalSale));
  }

  const gain = totalSale - effectiveCost;
  const isLongTerm = sttPaid ? holdMonths > 12 : holdMonths > 24;

  let taxRate: number | null = null;
  let label = "";

  if (!sttPaid) {
    // Unlisted equity shares
    if (isLongTerm) {
      taxRate = 0.125;
      label = "Long-Term (Unlisted) — Sec 112";
    } else {
      taxRate = null; // Taxed at slab rates
      label = "Short-Term (Unlisted) — Slab rates";
    }
  } else {
    // Listed equity shares (STT Paid)
    if (isLongTerm) {
      taxRate = 0.125;
      label = "Long-Term — Sec 112A";
    } else {
      taxRate = 0.20;
      label = "Short-Term — Sec 111A";
    }
  }

  // Section 112A threshold: ₹1,25,000 annual exemption
  const taxableGain = Math.max(0, gain);
  let taxBase = taxableGain;

  if (isLongTerm && sttPaid && gain > 0) {
    const totalEquityGain = gain + otherGains;
    if (totalEquityGain <= 125000) {
      taxBase = 0;
    } else {
      taxBase = Math.max(0, gain + otherGains - 125000) - otherGains;
      if (taxBase < 0) taxBase = 0;
    }
  }

  const baseTax = taxRate !== null ? taxBase * taxRate : null;
  const totalTax = baseTax !== null ? baseTax * 1.04 : null; // Cess included

  return {
    totalSale,
    effectiveCost,
    gain,
    isLongTerm,
    isSTT: sttPaid,
    taxableGain,
    taxBase,
    taxRate,
    totalTax,
    label,
  };
}

// ==========================================
// 6. MUTUAL FUND CAPITAL GAINS (Finance Act 2023)
// ==========================================

export interface MfGainsResult {
  gain: number;
  taxRate: number | null;
  totalTax: number | null;
  label: string;
  note: string;
}

export function calculateMfCapitalGains(
  type: "equity" | "debt" | "hybrid" | "gold",
  sale: number,
  cost: number,
  holdMonths: number,
  otherGains: number = 0
): MfGainsResult {
  const gain = sale - cost;
  let taxRate: number | null = null;
  let label = "";
  let note = "";

  if (type === "equity") {
    const isLT = holdMonths > 12;
    if (isLT) {
      taxRate = 0.125;
      label = "LTCG — Sec 112A";
      const total = gain + otherGains;
      if (total <= 125000) {
        note = "Within ₹1,25,000 LTCG threshold. Nil tax u/s 112A.";
      }
    } else {
      taxRate = 0.20;
      label = "STCG — Sec 111A";
    }
  } else if (type === "debt") {
    taxRate = null; // Taxed at slab rates
    label = "Slab Rate (Finance Act 2023)";
    note = "Debt MF units purchased on or after 1 Apr 2023: gains taxable at slab rate regardless of holding period.";
  } else if (type === "hybrid") {
    taxRate = null; // Taxed at slab rates
    label = "Slab Rate (equity 35–65%)";
    note = "Hybrid funds with equity exposure between 35–65% are classified as 'specified funds' — gains taxed at slab rates.";
  } else {
    // Gold and other assets
    const isLT = holdMonths > 12; // Gold LTCG threshold is 12 months (Finance Act 2024)
    if (isLT) {
      taxRate = 0.125;
      label = "LTCG — 12.5%";
    } else {
      taxRate = null;
      label = "STCG — Slab Rate";
    }
  }

  // Handle threshold check for equity LTCG tax computation base
  let taxBase = Math.max(0, gain);
  if (type === "equity" && holdMonths > 12 && gain > 0) {
    const total = gain + otherGains;
    if (total <= 125000) {
      taxBase = 0;
    } else {
      taxBase = Math.max(0, gain + otherGains - 125000) - otherGains;
      if (taxBase < 0) taxBase = 0;
    }
  }

  const baseTax = taxRate !== null ? taxBase * taxRate : null;
  const totalTax = baseTax !== null ? baseTax * 1.04 : null;

  return {
    gain,
    taxRate,
    totalTax,
    label,
    note,
  };
}
