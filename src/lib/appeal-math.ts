/**
 * NumberIQ — appeal limitation, filing fees, and Section 270AA immunity.
 *
 * Statutory basis is the Income-tax Act 1961 numbering, which governs every
 * assessment year up to and including the year ending 31 March 2026. The
 * Income-tax Act 2025 applies from 1 April 2026 — see the Statutory Time
 * Machine tool for the renumbering.
 */

import { formatInr } from "./tools-math";

export type AppealForum =
  | "cit-appeals"
  | "itat"
  | "itat-cross-objection"
  | "high-court"
  | "gst-appellate-authority"
  | "gst-tribunal";

export interface ForumRule {
  label: string;
  form: string;
  statute: string;
  /** Limitation period expressed in days, or months where the statute says months. */
  limitDays?: number;
  limitMonths?: number;
  /** Further period the appellate authority may condone. */
  condonableMonths?: number;
  condonableUnlimited: boolean;
  condonationStatute: string;
  startsFrom: string;
  /** Label for the date input on the tool. */
  dateLabel: string;
  feeNote: string;
}

export const APPEAL_FORUMS: Record<AppealForum, ForumRule> = {
  "cit-appeals": {
    label: "Commissioner (Appeals)",
    form: "Form 35",
    statute: "Section 246A / 249(2), Income-tax Act 1961",
    limitDays: 30,
    condonableUnlimited: true,
    condonationStatute: "Section 249(3) — delay condonable on sufficient cause, no outer limit",
    startsFrom: "the date of service of the notice of demand",
    dateLabel: "Date of service of the notice of demand",
    feeNote: "Fee under Section 249(1), by reference to assessed total income",
  },
  itat: {
    label: "Income Tax Appellate Tribunal",
    form: "Form 36",
    statute: "Section 253(3), Income-tax Act 1961",
    limitDays: 60,
    condonableUnlimited: true,
    condonationStatute: "Section 253(5) — delay condonable on sufficient cause, no outer limit",
    startsFrom: "the date the order was communicated to you",
    dateLabel: "Date the order was communicated to you",
    feeNote: "Fee under Section 253(6), by reference to assessed total income",
  },
  "itat-cross-objection": {
    label: "ITAT — Cross-Objection",
    form: "Form 36A",
    statute: "Section 253(4), Income-tax Act 1961",
    limitDays: 30,
    condonableUnlimited: true,
    condonationStatute: "Section 253(5) — delay condonable on sufficient cause",
    startsFrom: "the date you received notice that the other side had appealed",
    dateLabel: "Date you received notice of the other side's appeal",
    feeNote: "No filing fee is payable on a cross-objection",
  },
  "high-court": {
    label: "High Court",
    form: "Appeal under Section 260A",
    statute: "Section 260A(2), Income-tax Act 1961",
    limitDays: 120,
    condonableUnlimited: true,
    condonationStatute: "Section 260A(2A) — delay condonable on sufficient cause",
    startsFrom: "the date the ITAT order was received",
    dateLabel: "Date the ITAT order was received",
    feeNote: "Court fee as prescribed by the relevant High Court rules",
  },
  "gst-appellate-authority": {
    label: "GST — First Appellate Authority",
    form: "Form GST APL-01",
    statute: "Section 107(1), CGST Act",
    limitMonths: 3,
    condonableMonths: 1,
    condonableUnlimited: false,
    condonationStatute: "Section 107(4) — a further one month only, and no more",
    startsFrom: "the date the order was communicated to you",
    dateLabel: "Date the order was communicated to you",
    feeNote: "No filing fee; a pre-deposit of 10% of the disputed tax is required",
  },
  "gst-tribunal": {
    label: "GST Appellate Tribunal",
    form: "Form GST APL-05",
    statute: "Section 112(1), CGST Act",
    limitMonths: 3,
    condonableMonths: 3,
    condonableUnlimited: false,
    condonationStatute: "Section 112(6) — a further three months only",
    startsFrom: "the date the order was communicated to you",
    dateLabel: "Date the order was communicated to you",
    feeNote: "Fee as prescribed; a further pre-deposit applies under Section 112(8)",
  },
};

export interface AppealDeadlineResult {
  forum: string;
  form: string;
  statute: string;
  startsFrom: string;
  dueDate: string | null;
  condonationLastDate: string | null;
  condonableUnlimited: boolean;
  condonationStatute: string;
  daysRemaining: number | null;
  isLate: boolean;
  isWithinCondonation: boolean;
  isTimeBarred: boolean;
  status: "in-time" | "condonation-needed" | "time-barred" | "unknown";
  headline: string;
  fee: number | null;
  feeBasis: string;
  notes: string[];
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  const day = out.getUTCDate();
  out.setUTCMonth(out.getUTCMonth() + n);
  // Guard against 31 Jan + 1 month rolling into March.
  if (out.getUTCDate() < day) out.setUTCDate(0);
  return out;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Filing fee for an income-tax appeal.
 * CIT(A) — Section 249(1); ITAT — Section 253(6), where the top slab is 1% of
 * assessed total income subject to a ceiling of Rs 10,000.
 */
export function appealFee(forum: AppealForum, assessedTotalIncome: number): { fee: number | null; basis: string } {
  const income = Math.max(0, Number(assessedTotalIncome) || 0);

  if (forum === "itat-cross-objection") {
    return { fee: 0, basis: "No fee is payable on a cross-objection under Section 253(4)." };
  }
  if (forum === "gst-appellate-authority" || forum === "gst-tribunal" || forum === "high-court") {
    return { fee: null, basis: APPEAL_FORUMS[forum].feeNote };
  }

  if (forum === "cit-appeals") {
    if (income <= 100000) return { fee: 250, basis: "Assessed total income up to ₹1,00,000 — Section 249(1)(a)." };
    if (income <= 200000) return { fee: 500, basis: "Assessed total income between ₹1,00,001 and ₹2,00,000 — Section 249(1)(b)." };
    return { fee: 1000, basis: "Assessed total income above ₹2,00,000 — Section 249(1)(c)." };
  }

  // ITAT
  if (income <= 100000) return { fee: 500, basis: "Assessed total income up to ₹1,00,000 — Section 253(6)(a)." };
  if (income <= 200000) return { fee: 1500, basis: "Assessed total income between ₹1,00,001 and ₹2,00,000 — Section 253(6)(b)." };
  const onePct = Math.round(income * 0.01);
  const fee = Math.min(10000, onePct);
  return {
    fee,
    basis:
      onePct > 10000
        ? `1% of assessed total income is ${formatInr(onePct)}, restricted to the ₹10,000 ceiling — Section 253(6)(c).`
        : `1% of assessed total income — Section 253(6)(c).`,
  };
}

/**
 * Limitation for filing an appeal, measured from the triggering date, together
 * with the outer date up to which delay may be condoned.
 */
export function calculateAppealDeadline(
  forum: AppealForum,
  triggerDateIso: string,
  assessedTotalIncome: number,
  todayIso?: string
): AppealDeadlineResult {
  const rule = APPEAL_FORUMS[forum];
  const { fee, basis } = appealFee(forum, assessedTotalIncome);

  const trigger = new Date(triggerDateIso);
  const today = new Date(todayIso ?? new Date().toISOString().slice(0, 10));

  const base: AppealDeadlineResult = {
    forum: rule.label,
    form: rule.form,
    statute: rule.statute,
    startsFrom: rule.startsFrom,
    dueDate: null,
    condonationLastDate: null,
    condonableUnlimited: rule.condonableUnlimited,
    condonationStatute: rule.condonationStatute,
    daysRemaining: null,
    isLate: false,
    isWithinCondonation: false,
    isTimeBarred: false,
    status: "unknown",
    headline: "Enter the date the order or demand notice was served.",
    fee,
    feeBasis: basis,
    notes: [],
  };

  if (Number.isNaN(trigger.getTime())) return base;

  const due =
    rule.limitDays !== undefined ? addDays(trigger, rule.limitDays) : addMonths(trigger, rule.limitMonths ?? 0);

  const condonationLast =
    rule.condonableMonths !== undefined ? addMonths(due, rule.condonableMonths) : null;

  const daysRemaining = daysBetween(today, due);
  const isLate = daysRemaining < 0;

  let status: AppealDeadlineResult["status"];
  let isWithinCondonation = false;
  let isTimeBarred = false;

  if (!isLate) {
    status = "in-time";
  } else if (rule.condonableUnlimited) {
    status = "condonation-needed";
    isWithinCondonation = true;
  } else if (condonationLast && today <= condonationLast) {
    status = "condonation-needed";
    isWithinCondonation = true;
  } else {
    status = "time-barred";
    isTimeBarred = true;
  }

  const overdueBy = Math.abs(daysRemaining);
  const headline =
    status === "in-time"
      ? daysRemaining === 0
        ? "The appeal is due today — file before the day closes."
        : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left to file in time.`
      : status === "condonation-needed"
        ? `${overdueBy} day${overdueBy === 1 ? "" : "s"} past the limitation date — an application for condonation of delay is now required.`
        : `${overdueBy} day${overdueBy === 1 ? "" : "s"} past the limitation date, and beyond the period the authority is empowered to condone.`;

  const notes: string[] = [];
  notes.push(`Limitation runs from ${rule.startsFrom}, not from the date of the order.`);
  if (rule.condonableUnlimited) {
    notes.push(rule.condonationStatute + ". There is no outer ceiling, but the explanation must be genuine and supported.");
  } else {
    notes.push(rule.condonationStatute + " — beyond that the appeal cannot be admitted at all.");
  }
  if (forum === "cit-appeals") {
    notes.push("An appeal will not be admitted unless the tax due on the returned income has been paid — Section 249(4).");
  }
  if (forum === "itat") {
    notes.push("A cross-objection may be filed within 30 days of receiving notice that the other side has appealed, and carries no fee.");
  }
  if (forum.startsWith("gst-")) {
    notes.push("The pre-deposit is a condition of admission — the appeal will not be entertained without it.");
  }
  if (status === "in-time" && daysRemaining <= 7) {
    notes.push("Very little time remains. Confirm the date of service from the acknowledgement rather than working from memory.");
  }

  return {
    ...base,
    dueDate: iso(due),
    condonationLastDate: condonationLast ? iso(condonationLast) : null,
    daysRemaining,
    isLate,
    isWithinCondonation,
    isTimeBarred,
    status,
    headline,
    notes,
  };
}

// ==========================================
// SECTION 270AA — IMMUNITY FROM PENALTY
// ==========================================

export interface ImmunityResult {
  /** Deadline to file Form 68: one month from the END of the month of receipt. */
  formDeadline: string | null;
  daysToFile: number | null;
  deadlinePassed: boolean;
  eligible: boolean;
  blockers: string[];
  penaltyRatePct: number;
  penaltyExposure: number;
  immunityCost: number;
  appealCostIfPenaltyUpheld: number;
  saving: number;
  recommendation: string;
  notes: string[];
}

/**
 * Section 270AA lets an assessee buy off penalty under Section 270A and
 * prosecution by paying the assessed tax and interest and giving up the right
 * to appeal the assessment. Immunity is not available where the addition is
 * characterised as misreporting under Section 270A(9), for which the penalty is
 * 200% rather than the 50% charged on under-reporting.
 */
export function calculateImmunity(
  orderReceivedIso: string,
  taxOnAddition: number,
  interestDemanded: number,
  isMisreporting: boolean,
  taxPaid: boolean,
  wantsToAppeal: boolean,
  chanceAdditionDeletedPct: number,
  todayIso?: string
): ImmunityResult {
  const tax = Math.max(0, Number(taxOnAddition) || 0);
  const interest = Math.max(0, Number(interestDemanded) || 0);
  const winPct = Math.min(100, Math.max(0, Number(chanceAdditionDeletedPct) || 0));

  const received = new Date(orderReceivedIso);
  const today = new Date(todayIso ?? new Date().toISOString().slice(0, 10));

  let formDeadline: string | null = null;
  let daysToFile: number | null = null;
  let deadlinePassed = false;

  if (!Number.isNaN(received.getTime())) {
    // One month from the end of the month in which the order was received.
    const endOfMonth = new Date(Date.UTC(received.getUTCFullYear(), received.getUTCMonth() + 1, 0));
    const deadline = addMonths(endOfMonth, 1);
    formDeadline = iso(deadline);
    daysToFile = daysBetween(today, deadline);
    deadlinePassed = daysToFile < 0;
  }

  const blockers: string[] = [];
  if (isMisreporting) {
    blockers.push(
      "The addition is characterised as misreporting under Section 270A(9), which is expressly outside the immunity in Section 270AA."
    );
  }
  if (deadlinePassed) {
    blockers.push("The window to file Form 68 has closed — it expires one month from the end of the month of receipt of the order.");
  }
  if (!taxPaid) {
    blockers.push("Immunity requires the tax and interest on the assessment to have been paid within the time allowed by the demand notice.");
  }
  if (wantsToAppeal) {
    blockers.push("Immunity is conditional on not appealing the assessment order — the two are mutually exclusive.");
  }

  const eligible = blockers.length === 0;

  const penaltyRatePct = isMisreporting ? 200 : 50;
  const penaltyExposure = tax * (penaltyRatePct / 100);

  // Taking immunity: pay the tax and interest, penalty falls away.
  const immunityCost = tax + interest;

  // Appealing: on the assumption the addition is upheld, tax, interest and penalty all stand.
  const p = winPct / 100;
  const appealCostIfPenaltyUpheld = tax + interest + penaltyExposure;
  const expectedAppealCost = p * 0 + (1 - p) * appealCostIfPenaltyUpheld;

  const saving = penaltyExposure;

  let recommendation: string;
  if (!eligible) {
    recommendation = "Immunity under Section 270AA is not available on these facts — the appeal route is the one that remains.";
  } else if (expectedAppealCost < immunityCost) {
    recommendation = `At a ${winPct}% chance of the addition being deleted, appealing has the lower expected cost (${formatInr(expectedAppealCost)} against ${formatInr(immunityCost)} to take immunity). The stronger the case on merits, the less attractive immunity becomes.`;
  } else {
    recommendation = `Taking immunity costs ${formatInr(immunityCost)} and extinguishes a penalty exposure of ${formatInr(penaltyExposure)}. At a ${winPct}% chance of success, appealing has an expected cost of ${formatInr(expectedAppealCost)} — immunity is the cheaper course.`;
  }

  const notes: string[] = [];
  notes.push("Form 68 must be filed within one month from the end of the month in which the assessment or reassessment order is received.");
  notes.push("The date shown is computed literally as one calendar month from the last day of the month of receipt. Some commentaries read the last date as the end of the following month instead, so file well before it rather than on it — the period is not extendable.");
  notes.push("Immunity covers penalty under Section 270A and prosecution under Sections 276C and 276CC.");
  notes.push("Accepting immunity forecloses both an appeal under Section 246A and a revision under Section 264 against that assessment order.");
  if (isMisreporting) {
    notes.push("Misreporting attracts penalty at 200% of the tax, against 50% for under-reporting — which is why the characterisation is worth contesting in its own right.");
  }
  if (eligible && daysToFile !== null && daysToFile <= 10 && daysToFile >= 0) {
    notes.push(`Only ${daysToFile} day${daysToFile === 1 ? "" : "s"} remain to file Form 68. The deadline is not extendable.`);
  }
  notes.push("The Assessing Officer must pass an order on the application within one month from the end of the month in which it is received.");

  return {
    formDeadline,
    daysToFile,
    deadlinePassed,
    eligible,
    blockers,
    penaltyRatePct,
    penaltyExposure,
    immunityCost,
    appealCostIfPenaltyUpheld,
    saving,
    recommendation,
    notes,
  };
}
