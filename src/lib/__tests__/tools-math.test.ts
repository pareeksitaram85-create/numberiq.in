import { describe, it, expect } from "vitest";
import {
  validateGstin,
  gstinCheckDigit,
  calculatePresumptive,
  calculateLitigationCost,
  lawInForceOn,
  financialYearOf,
  assessmentYearOf,
  isIta2025,
} from "../tools-math";

describe("GSTIN validation", () => {
  // Check digits verified against real, publicly listed GSTINs.
  const REAL_GSTINS = [
    "27AAPFU0939F1ZV",
    "29AAGCB7383J1Z4",
    "24AAACC1206D1ZM",
    "09AAACI1195H1ZK",
  ];

  it.each(REAL_GSTINS)("accepts the valid GSTIN %s", (gstin) => {
    const r = validateGstin(gstin);
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it.each(REAL_GSTINS)("computes the published check digit for %s", (gstin) => {
    expect(gstinCheckDigit(gstin.slice(0, 14))).toBe(gstin[14]);
  });

  it("decodes state, PAN and holder type", () => {
    const r = validateGstin("27AAPFU0939F1ZV");
    expect(r.stateCode).toBe("27");
    expect(r.stateName).toBe("Maharashtra");
    expect(r.pan).toBe("AAPFU0939F");
    expect(r.entityType).toBe("Firm / LLP");
    expect(r.registrationNumber).toBe("1");
  });

  it("rejects a bad check digit and names the right one", () => {
    const r = validateGstin("27AAPFU0939F1ZZ");
    expect(r.valid).toBe(false);
    expect(r.expectedCheckDigit).toBe("V");
    expect(r.errors.join(" ")).toContain("Checksum failed");
  });

  it("rejects a wrong length", () => {
    expect(validateGstin("27AAPFU0939F1Z").valid).toBe(false);
    expect(validateGstin("").errors[0]).toContain("Enter a GSTIN");
  });

  it("rejects an unknown state code", () => {
    const r = validateGstin("49AAPFU0939F1ZV");
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toContain("not a valid state code");
  });

  it("normalises case and whitespace", () => {
    expect(validateGstin(" 27aapfu0939f1zv ").valid).toBe(true);
  });

  it("flags a non-resident registration", () => {
    expect(validateGstin("96AAPFU0939F1ZV").isNonResident).toBe(true);
  });
});

describe("Presumptive taxation", () => {
  it("applies 6% to digital and 8% to cash receipts under 44AD", () => {
    const r = calculatePresumptive("44AD", 1000000, 100000, 200000);
    expect(r.presumptiveIncome).toBe(1000000 * 0.06 + 100000 * 0.08);
  });

  it("presumes a flat 50% under 44ADA", () => {
    const r = calculatePresumptive("44ADA", 4000000, 0, 0);
    expect(r.presumptiveIncome).toBe(2000000);
    expect(r.effectiveRatePct).toBe(50);
  });

  it("grants the enhanced 44AD ceiling when cash is within 5%", () => {
    const r = calculatePresumptive("44AD", 24000000, 1000000, 5000000);
    expect(r.cashSharePct).toBeCloseTo(4);
    expect(r.turnoverLimit).toBe(30000000);
    expect(r.eligible).toBe(true);
  });

  it("drops to the basic ceiling when cash exceeds 5%", () => {
    const r = calculatePresumptive("44AD", 20000000, 5000000, 5000000);
    expect(r.turnoverLimit).toBe(20000000);
    expect(r.eligible).toBe(false);
  });

  it("uses the enhanced 44ADA ceiling of 75 lakh within the cash cap", () => {
    const r = calculatePresumptive("44ADA", 7000000, 100000, 4000000);
    expect(r.turnoverLimit).toBe(7500000);
    expect(r.eligible).toBe(true);
  });

  it("requires an audit when declared income falls below the presumptive rate", () => {
    const r = calculatePresumptive("44ADA", 4000000, 0, 500000);
    expect(r.declaredIncomeBelowPresumptive).toBe(true);
    expect(r.auditRequired).toBe(true);
  });

  it("does not require an audit when declared income meets the presumptive rate", () => {
    const r = calculatePresumptive("44ADA", 4000000, 0, 2500000);
    expect(r.auditRequired).toBe(false);
  });

  it("handles zero turnover without dividing by zero", () => {
    const r = calculatePresumptive("44AD", 0, 0, 0);
    expect(r.cashSharePct).toBe(0);
    expect(r.effectiveRatePct).toBe(0);
    expect(r.eligible).toBe(false);
  });
});

describe("Litigation cost", () => {
  it("computes a 10% GST pre-deposit", () => {
    const r = calculateLitigationCost("gst-appellate-authority", 1000000, 100000, 50000, 2, 50, 75000);
    expect(r.preDeposit).toBe(100000);
    expect(r.preDepositPct).toBe(10);
  });

  it("caps the GST pre-deposit at 20 crore", () => {
    const r = calculateLitigationCost("gst-tribunal", 5000000000, 0, 0, 1, 50, 0);
    expect(r.preDepositCapped).toBe(true);
    expect(r.preDeposit).toBe(200000000);
  });

  it("accrues simple interest over the years to disposal", () => {
    const r = calculateLitigationCost("gst-appellate-authority", 1000000, 0, 0, 3, 50, 0);
    expect(r.interestIfLost).toBe(1000000 * 0.18 * 3);
  });

  it("sinks only professional fees when the appeal succeeds", () => {
    const r = calculateLitigationCost("gst-appellate-authority", 1000000, 100000, 0, 2, 100, 75000);
    expect(r.contestAndWinTotal).toBe(75000);
    expect(r.expectedCost).toBe(75000);
    expect(r.contestIsCheaper).toBe(true);
  });

  it("charges the full demand plus accrued interest when the appeal fails", () => {
    const r = calculateLitigationCost("gst-appellate-authority", 1000000, 100000, 50000, 2, 0, 75000);
    expect(r.contestAndLoseTotal).toBe(1000000 + 100000 + 50000 + 360000 + 75000);
    expect(r.expectedCost).toBe(r.contestAndLoseTotal);
    expect(r.contestIsCheaper).toBe(false);
  });

  it("weights the expected cost by the win probability", () => {
    const r = calculateLitigationCost("gst-appellate-authority", 1000000, 0, 0, 1, 50, 0);
    expect(r.expectedCost).toBeCloseTo(0.5 * r.contestAndWinTotal + 0.5 * r.contestAndLoseTotal);
  });

  it("reports a break-even win probability inside 0-100", () => {
    const r = calculateLitigationCost("it-cit-appeals", 1000000, 200000, 100000, 3, 40, 100000);
    expect(r.breakEvenWinPct).toBeGreaterThanOrEqual(0);
    expect(r.breakEvenWinPct).toBeLessThanOrEqual(100);
  });

  it("uses 12% and no statutory deposit for income-tax forums", () => {
    const r = calculateLitigationCost("it-tribunal", 1000000, 0, 0, 1, 50, 0);
    expect(r.interestRatePct).toBe(12);
    expect(r.notes.join(" ")).toContain("no statutory pre-deposit");
  });
});

describe("Statutory timeline", () => {
  it("applies the Income-tax Act 1961 before 1 April 2026", () => {
    const facts = lawInForceOn("2025-06-15");
    expect(facts.find((f) => f.domain === "Direct Tax")?.regime).toBe("Income-tax Act, 1961");
    expect(isIta2025("2025-06-15")).toBe(false);
  });

  it("applies the Income-tax Act 2025 from 1 April 2026", () => {
    const facts = lawInForceOn("2026-04-01");
    expect(facts.find((f) => f.domain === "Direct Tax")?.regime).toBe("Income-tax Act, 2025");
    expect(isIta2025("2026-04-01")).toBe(true);
  });

  it("shows the pre-GST regime before 1 July 2017", () => {
    const facts = lawInForceOn("2017-06-30");
    expect(facts.find((f) => f.domain === "Indirect Tax")?.regime).toBe("Pre-GST indirect tax");
  });

  it("shows GST from 1 July 2017", () => {
    const facts = lawInForceOn("2017-07-01");
    expect(facts.find((f) => f.domain === "Indirect Tax")?.regime).toBe("GST regime");
  });

  it("derives the financial year across the April boundary", () => {
    expect(financialYearOf("2026-03-31")).toBe("2025-26");
    expect(financialYearOf("2026-04-01")).toBe("2026-27");
  });

  it("derives the assessment year", () => {
    expect(assessmentYearOf("2026-05-10")).toBe("2027-28");
  });

  it("returns nothing for an unparseable date", () => {
    expect(lawInForceOn("not-a-date")).toEqual([]);
    expect(financialYearOf("not-a-date")).toBeNull();
  });
});
