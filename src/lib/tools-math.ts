/**
 * NumberIQ — mathematics for the GSTIN, presumptive-taxation, litigation-cost
 * and statutory-timeline tools. Kept separate from calculator-math.ts so the
 * older calculators' test surface stays untouched.
 */

export function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

// ==========================================
// 1. GSTIN VALIDATION & DECODING
// ==========================================

export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu (merged)", "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra", "28": "Andhra Pradesh (pre-bifurcation)", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh",
  "96": "Foreign Country", "97": "Other Territory", "99": "Centre Jurisdiction",
};

// The 4th character of a PAN encodes the type of holder.
export const PAN_ENTITY_TYPES: Record<string, string> = {
  A: "Association of Persons (AOP)",
  B: "Body of Individuals (BOI)",
  C: "Company",
  F: "Firm / LLP",
  G: "Government Agency",
  H: "Hindu Undivided Family (HUF)",
  J: "Artificial Juridical Person",
  L: "Local Authority",
  P: "Individual / Proprietor",
  T: "Trust",
};

const GSTIN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * GSTIN check digit per the GSTN specification: the first 14 characters are
 * weighted alternately 1 and 2, and for each product the quotient and the
 * remainder on division by 36 are summed. The 15th character is whatever makes
 * that total a multiple of 36.
 */
export function gstinCheckDigit(first14: string): string | null {
  if (first14.length !== 14) return null;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = GSTIN_ALPHABET.indexOf(first14[i]);
    if (value < 0) return null;
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_ALPHABET[(36 - (sum % 36)) % 36];
}

export interface GstinResult {
  input: string;
  valid: boolean;
  errors: string[];
  stateCode: string | null;
  stateName: string | null;
  pan: string | null;
  entityType: string | null;
  registrationNumber: string | null;
  isTaxDeductor: boolean;
  isNonResident: boolean;
  expectedCheckDigit: string | null;
  actualCheckDigit: string | null;
}

export function validateGstin(raw: string): GstinResult {
  const input = (raw ?? "").toUpperCase().replace(/\s+/g, "");
  const errors: string[] = [];

  const shell: GstinResult = {
    input, valid: false, errors, stateCode: null, stateName: null, pan: null,
    entityType: null, registrationNumber: null, isTaxDeductor: false,
    isNonResident: false, expectedCheckDigit: null, actualCheckDigit: null,
  };

  if (!input) {
    errors.push("Enter a GSTIN to validate.");
    return shell;
  }
  if (input.length !== 15) {
    errors.push(`A GSTIN is exactly 15 characters — you entered ${input.length}.`);
    return shell;
  }
  if (!/^[0-9A-Z]{15}$/.test(input)) {
    errors.push("A GSTIN may contain only digits and capital letters.");
    return shell;
  }

  const stateCode = input.slice(0, 2);
  const pan = input.slice(2, 12);
  const registrationNumber = input.slice(12, 13);
  const fourteenth = input.slice(13, 14);
  const actualCheckDigit = input.slice(14, 15);

  const stateName = GST_STATE_CODES[stateCode] ?? null;
  if (!stateName) errors.push(`"${stateCode}" is not a valid state code.`);

  const panShapeOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
  if (!panShapeOk) {
    errors.push("Characters 3–12 do not form a valid PAN (AAAAA9999A).");
  }

  const entityType = PAN_ENTITY_TYPES[pan[3]] ?? null;
  if (panShapeOk && !entityType) {
    errors.push(`"${pan[3]}" is not a recognised PAN holder-type character.`);
  }

  if (!/^[1-9A-Z]$/.test(registrationNumber)) {
    errors.push("Character 13 (registration count) must be 1–9 or A–Z.");
  }

  // "Z" is the default for a regular registration; C and U appear on TDS/TCS deductors.
  const isTaxDeductor = fourteenth === "C" || fourteenth === "U";
  const isNonResident = stateCode === "96";

  const expectedCheckDigit = gstinCheckDigit(input.slice(0, 14));
  if (expectedCheckDigit && expectedCheckDigit !== actualCheckDigit) {
    errors.push(
      `Checksum failed — character 15 should be "${expectedCheckDigit}", not "${actualCheckDigit}".`
    );
  }

  return {
    input,
    valid: errors.length === 0,
    errors,
    stateCode,
    stateName,
    pan,
    entityType,
    registrationNumber,
    isTaxDeductor,
    isNonResident,
    expectedCheckDigit,
    actualCheckDigit,
  };
}

// ==========================================
// 2. PRESUMPTIVE TAXATION (44AD / 44ADA)
// ==========================================

export type PresumptiveScheme = "44AD" | "44ADA";

export interface PresumptiveResult {
  scheme: PresumptiveScheme;
  turnover: number;
  eligible: boolean;
  turnoverLimit: number;
  limitReason: string;
  cashSharePct: number;
  presumptiveIncome: number;
  actualIncome: number;
  effectiveRatePct: number;
  declaredIncomeBelowPresumptive: boolean;
  auditRequired: boolean;
  incomeDifference: number;
  notes: string[];
}

/**
 * Presumptive income under s.44AD (eligible business) and s.44ADA (specified
 * profession). 44AD presumes 6% of receipts routed through prescribed banking
 * or digital modes and 8% of everything else; 44ADA presumes a flat 50%.
 * The enhanced turnover ceilings apply only where cash receipts stay within 5%
 * of total receipts.
 */
export function calculatePresumptive(
  scheme: PresumptiveScheme,
  digitalReceipts: number,
  cashReceipts: number,
  actualIncome: number
): PresumptiveResult {
  const digital = Math.max(0, Number(digitalReceipts) || 0);
  const cash = Math.max(0, Number(cashReceipts) || 0);
  const turnover = digital + cash;
  const cashSharePct = turnover > 0 ? (cash / turnover) * 100 : 0;
  const withinCashCap = cashSharePct <= 5;

  const baseLimit = scheme === "44AD" ? 20000000 : 5000000;
  const enhancedLimit = scheme === "44AD" ? 30000000 : 7500000;
  const turnoverLimit = withinCashCap ? enhancedLimit : baseLimit;
  const limitReason = withinCashCap
    ? "Cash receipts are within 5% of turnover, so the enhanced ceiling applies."
    : "Cash receipts exceed 5% of turnover, so only the basic ceiling applies.";

  const presumptiveIncome =
    scheme === "44AD" ? digital * 0.06 + cash * 0.08 : turnover * 0.5;

  const eligible = turnover > 0 && turnover <= turnoverLimit;
  const actual = Math.max(0, Number(actualIncome) || 0);
  const effectiveRatePct = turnover > 0 ? (presumptiveIncome / turnover) * 100 : 0;

  const declaredIncomeBelowPresumptive = actual < presumptiveIncome;
  const auditRequired = eligible && declaredIncomeBelowPresumptive;

  const notes: string[] = [];
  if (turnover > 0 && turnover > turnoverLimit) {
    notes.push(
      `Turnover of ${formatInr(turnover)} exceeds the ${formatInr(turnoverLimit)} ceiling for ${scheme}, so regular books are mandatory.`
    );
  }
  if (scheme === "44AD" && cash > 0) {
    notes.push("Cash receipts are presumed at 8%; only prescribed digital receipts attract the 6% rate.");
  }
  if (auditRequired) {
    notes.push(
      "Declaring income below the presumptive rate requires audited books, which removes the compliance benefit of the scheme."
    );
  }
  if (scheme === "44AD" && eligible) {
    notes.push("Opting out of 44AD bars the scheme for the next five assessment years.");
  }

  return {
    scheme, turnover, eligible, turnoverLimit, limitReason, cashSharePct,
    presumptiveIncome, actualIncome: actual, effectiveRatePct,
    declaredIncomeBelowPresumptive, auditRequired,
    incomeDifference: Math.abs(actual - presumptiveIncome), notes,
  };
}

// ==========================================
// 3. LITIGATION COST — CONTEST VS SETTLE
// ==========================================

export type LitigationForum =
  | "gst-appellate-authority"
  | "gst-tribunal"
  | "it-cit-appeals"
  | "it-tribunal";

interface ForumConfig {
  label: string;
  statute: string;
  pct: number;
  cap: number | null;
  interest: number;
  statutoryDeposit: boolean;
}

export const LITIGATION_FORUMS: Record<LitigationForum, ForumConfig> = {
  "gst-appellate-authority": {
    label: "GST — First Appellate Authority",
    statute: "Section 107, CGST Act",
    pct: 10,
    cap: 200000000,
    interest: 18,
    statutoryDeposit: true,
  },
  "gst-tribunal": {
    label: "GST — Appellate Tribunal (GSTAT)",
    statute: "Section 112, CGST Act",
    pct: 10,
    cap: 200000000,
    interest: 18,
    statutoryDeposit: true,
  },
  "it-cit-appeals": {
    label: "Income Tax — CIT(Appeals)",
    statute: "Customary stay deposit — no statutory pre-deposit",
    pct: 20,
    cap: null,
    interest: 12,
    statutoryDeposit: false,
  },
  "it-tribunal": {
    label: "Income Tax — ITAT",
    statute: "Customary stay deposit before the Tribunal",
    pct: 20,
    cap: null,
    interest: 12,
    statutoryDeposit: false,
  },
};

export interface LitigationResult {
  forum: string;
  statute: string;
  preDepositPct: number;
  preDeposit: number;
  preDepositCapped: boolean;
  interestRatePct: number;
  interestIfLost: number;
  professionalFees: number;
  settleNowTotal: number;
  contestAndWinTotal: number;
  contestAndLoseTotal: number;
  expectedCost: number;
  breakEvenWinPct: number;
  contestIsCheaper: boolean;
  recommendation: string;
  notes: string[];
}

/**
 * Compares settling a demand today against contesting it, on the user's own
 * assumptions about time to disposal and chance of success. Interest is modelled
 * as simple interest, which is how departmental demands accrue.
 */
export function calculateLitigationCost(
  forum: LitigationForum,
  disputedTax: number,
  penaltyDemanded: number,
  interestAlreadyDemanded: number,
  yearsToDisposal: number,
  winProbabilityPct: number,
  professionalFees: number
): LitigationResult {
  const cfg = LITIGATION_FORUMS[forum];
  const tax = Math.max(0, Number(disputedTax) || 0);
  const penalty = Math.max(0, Number(penaltyDemanded) || 0);
  const interestNow = Math.max(0, Number(interestAlreadyDemanded) || 0);
  const years = Math.max(0, Number(yearsToDisposal) || 0);
  const winPct = Math.min(100, Math.max(0, Number(winProbabilityPct) || 0));
  const fees = Math.max(0, Number(professionalFees) || 0);

  const rawPreDeposit = tax * (cfg.pct / 100);
  const preDepositCapped = cfg.cap !== null && rawPreDeposit > cfg.cap;
  const preDeposit = preDepositCapped ? (cfg.cap as number) : rawPreDeposit;

  const interestIfLost = tax * (cfg.interest / 100) * years;

  const settleNowTotal = tax + penalty + interestNow;
  // A successful appeal refunds the pre-deposit, so only professional fees are sunk.
  const contestAndWinTotal = fees;
  const contestAndLoseTotal = tax + penalty + interestNow + interestIfLost + fees;

  const p = winPct / 100;
  const expectedCost = p * contestAndWinTotal + (1 - p) * contestAndLoseTotal;

  // Win probability at which contesting costs exactly the same as settling today.
  const spread = contestAndLoseTotal - contestAndWinTotal;
  const breakEvenWinPct =
    spread > 0
      ? Math.min(100, Math.max(0, ((contestAndLoseTotal - settleNowTotal) / spread) * 100))
      : 0;

  const contestIsCheaper = expectedCost < settleNowTotal;
  const recommendation = contestIsCheaper
    ? `Contesting is cheaper on these assumptions — an expected ${formatInr(expectedCost)} against ${formatInr(settleNowTotal)} to settle today.`
    : `Settling today is cheaper on these assumptions — ${formatInr(settleNowTotal)} against an expected ${formatInr(expectedCost)} to contest.`;

  const notes: string[] = [];
  notes.push(`The ${cfg.pct}% pre-deposit is refundable with interest if the appeal succeeds.`);
  if (preDepositCapped && cfg.cap !== null) {
    notes.push(`The pre-deposit is capped at ${formatInr(cfg.cap)} under ${cfg.statute}.`);
  }
  if (!cfg.statutoryDeposit) {
    notes.push(
      "An income-tax appeal carries no statutory pre-deposit; the 20% reflects the deposit customarily sought for a stay of demand."
    );
  }
  notes.push(
    `Interest is modelled as simple interest at ${cfg.interest}% p.a. across ${years} year(s) to disposal.`
  );
  if (breakEvenWinPct > 0 && breakEvenWinPct < 100) {
    notes.push(`Contesting pays off once the chance of success exceeds about ${Math.round(breakEvenWinPct)}%.`);
  }

  return {
    forum: cfg.label,
    statute: cfg.statute,
    preDepositPct: cfg.pct,
    preDeposit,
    preDepositCapped,
    interestRatePct: cfg.interest,
    interestIfLost,
    professionalFees: fees,
    settleNowTotal,
    contestAndWinTotal,
    contestAndLoseTotal,
    expectedCost,
    breakEvenWinPct,
    contestIsCheaper,
    recommendation,
    notes,
  };
}

// ==========================================
// 4. STATUTORY TIMELINE — LAW IN FORCE ON A DATE
// ==========================================

export interface RegimeFact {
  domain: string;
  regime: string;
  detail: string;
  tone: string;
}

/** Sections renumbered by the Income-tax Act 2025. */
export const ITA_SECTION_MAP: Record<string, { new: string; label: string }> = {
  "192": { new: "392", label: "TDS on salary" },
  "194A": { new: "393(1)", label: "TDS on interest other than securities" },
  "194C": { new: "393(1)", label: "TDS on payments to contractors" },
  "194H": { new: "393(1)", label: "TDS on commission or brokerage" },
  "194I": { new: "393(1)", label: "TDS on rent" },
  "194J": { new: "393(1)", label: "TDS on professional or technical fees" },
  "194O": { new: "393(1)", label: "TDS by e-commerce operators" },
  "195": { new: "393(2)", label: "TDS on payments to non-residents" },
  "201(1A)": { new: "399(3)", label: "Interest for failure to deduct or pay TDS" },
  "234A": { new: "432", label: "Interest for default in furnishing the return" },
  "234B": { new: "433", label: "Interest for default in payment of advance tax" },
  "234C": { new: "434", label: "Interest for deferment of advance tax" },
  "43B": { new: "37", label: "Deductions allowed only on actual payment" },
  "43B(h)": { new: "37", label: "Payments to micro and small enterprises" },
  "44AD": { new: "58", label: "Presumptive income for eligible business" },
  "44ADA": { new: "59", label: "Presumptive income for professionals" },
  "80C": { new: "123", label: "Deduction for specified investments" },
  "80D": { new: "124", label: "Deduction for health insurance premia" },
  "115BAC": { new: "202", label: "New tax regime for individuals and HUFs" },
  "139": { new: "263", label: "Return of income" },
};

/** Statutory milestones, newest first. */
const MILESTONES: { from: string; domain: string; regime: string; detail: string; tone: string }[] = [
  {
    from: "2026-04-01",
    domain: "Direct Tax",
    regime: "Income-tax Act, 2025",
    detail: "The Income-tax Act 2025 governs. Sections are renumbered — use the mapping below when citing.",
    tone: "#34d399",
  },
  {
    from: "1962-04-01",
    domain: "Direct Tax",
    regime: "Income-tax Act, 1961",
    detail: "The Income-tax Act 1961 governs. Cite the original section numbers.",
    tone: "#4f7cff",
  },
];

const GST_MILESTONES: { from: string; regime: string; detail: string; tone: string }[] = [
  {
    from: "2017-07-01",
    regime: "GST regime",
    detail: "CGST, SGST and IGST apply. Returns run on GSTR-1 and GSTR-3B.",
    tone: "#f4b740",
  },
  {
    from: "1900-01-01",
    regime: "Pre-GST indirect tax",
    detail: "Excise, service tax and VAT apply — GST was not yet in force.",
    tone: "#737c92",
  },
];

/** Which statute governed a transaction on a given date. */
export function lawInForceOn(dateIso: string): RegimeFact[] {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return [];

  const direct = MILESTONES.find((m) => d >= new Date(m.from));
  const gst = GST_MILESTONES.find((m) => d >= new Date(m.from));

  const facts: RegimeFact[] = [];
  if (direct) {
    facts.push({ domain: direct.domain, regime: direct.regime, detail: direct.detail, tone: direct.tone });
  }
  if (gst) {
    facts.push({ domain: "Indirect Tax", regime: gst.regime, detail: gst.detail, tone: gst.tone });
  }
  return facts;
}

/** The Indian financial year (1 April to 31 March) containing a date. */
export function financialYearOf(dateIso: string): string | null {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const startYear = d.getUTCMonth() >= 3 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** Assessment year for the financial year containing a date. */
export function assessmentYearOf(dateIso: string): string | null {
  const fy = financialYearOf(dateIso);
  if (!fy) return null;
  const startYear = Number(fy.slice(0, 4)) + 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** True once the Income-tax Act 2025 is in force on the given date. */
export function isIta2025(dateIso: string): boolean {
  const d = new Date(dateIso);
  return !Number.isNaN(d.getTime()) && d >= new Date("2026-04-01");
}
