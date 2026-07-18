import { describe, it, expect } from "vitest";
import {
  calculateGstInterest,
  calculateGstLateFee,
  calculateLrsTcs,
  calculatePropertyCapitalGains,
  calculateEquityCapitalGains,
  calculateMfCapitalGains,
} from "../calculator-math";

describe("Calculator Math Library Tests", () => {
  // 1. GST Interest Tests
  describe("GST Interest (Section 50)", () => {
    it("should return zero interest if payment date is same as due date", () => {
      const result = calculateGstInterest("100000", "2026-06-20", "2026-06-20", "18");
      expect(result).not.toBeNull();
      expect(result!.interest).toBe(0);
      expect(result!.days).toBe(0);
      expect(result!.isDelayed).toBe(false);
    });

    it("should calculate correct interest for delayed payment", () => {
      // 100,000 at 18% for 10 days
      const result = calculateGstInterest("100000", "2026-06-20", "2026-06-30", "18");
      expect(result).not.toBeNull();
      expect(result!.days).toBe(10);
      expect(result!.isDelayed).toBe(true);
      // interest = 100000 * 0.18 * 10 / 365 = 493.1506
      expect(result!.interest).toBeCloseTo(493.15, 1);
    });
  });

  // 2. GST Late Fee Tests
  describe("GST Late Fee (Section 47)", () => {
    it("should calculate nil late fee correctly, capped at 500", () => {
      // 20 days delay, 20 per day = 400
      const result1 = calculateGstLateFee("2026-06-20", "2026-07-10", "nil", "500");
      expect(result1).not.toBeNull();
      expect(result1!.payable).toBe(400);

      // 40 days delay, 40 * 20 = 800, capped at 500
      const result2 = calculateGstLateFee("2026-06-20", "2026-07-30", "nil", "500");
      expect(result2).not.toBeNull();
      expect(result2!.payable).toBe(500);
      expect(result2!.cgst).toBe(250);
      expect(result2!.sgst).toBe(250);
    });

    it("should calculate taxable late fee correctly, capped at 2000", () => {
      // 10 days delay, 10 * 50 = 500
      const result1 = calculateGstLateFee("2026-06-20", "2026-06-30", "taxable", "2000");
      expect(result1).not.toBeNull();
      expect(result1!.payable).toBe(500);

      // 50 days delay, 50 * 50 = 2500, capped at 2000
      const result2 = calculateGstLateFee("2026-06-20", "2026-08-09", "taxable", "2000");
      expect(result2).not.toBeNull();
      expect(result2!.payable).toBe(2000);
    });
  });

  // 3. LRS TCS Tests
  describe("LRS TCS (Section 206C(1G))", () => {
    it("should apply exemption threshold for normal remittances", () => {
      // Amount under 7L
      const res1 = calculateLrsTcs(500000, "others", false);
      expect(res1.tcsAmount).toBe(0);

      // Amount over 7L (general remittance: 20% on excess)
      const res2 = calculateLrsTcs(1000000, "others", false);
      expect(res2.applicableAmount).toBe(300000);
      expect(res2.rate).toBe(20);
      expect(res2.tcsAmount).toBe(60000); // 300,000 * 0.20
    });

    it("should apply correct concessional rate for education loan", () => {
      const res = calculateLrsTcs(1000000, "education-loan", false);
      expect(res.rate).toBe(0.5);
      expect(res.tcsAmount).toBe(1500); // 300,000 * 0.005
    });

    it("should apply tour package rules without exemption threshold", () => {
      // Tour package under 7L: 5% flat
      const res1 = calculateLrsTcs(500000, "others", true);
      expect(res1.rate).toBe(5);
      expect(res1.tcsAmount).toBe(25000);

      // Tour package over 7L: 5% on 7L + 20% on excess
      const res2 = calculateLrsTcs(1000000, "others", true);
      // baseTcs = 35000, excessTcs = 300000 * 0.20 = 60000, total = 95000
      expect(res2.tcsAmount).toBe(95000);
    });
  });

  // 4. Property Capital Gains Tests
  describe("Property Capital Gains (Section 54/50C)", () => {
    it("should calculate STCG correctly and flag it", () => {
      const result = calculatePropertyCapitalGains(
        5000000, // sale
        3000000, // cost
        200000,  // improvement
        100000,  // expenses
        18,      // hold months (short term)
        "2021-22",
        "2025-26"
      );
      expect(result.isLongTerm).toBe(false);
      expect(result.gainNoIdx).toBe(1700000); // 50L - 30L - 2L - 1L
      expect(result.betterOption).toBe("stcg");
    });

    it("should trigger Section 50C SDV adjustment if stamp duty value exceeds sale price by 10%", () => {
      const result = calculatePropertyCapitalGains(
        5000000, // sale
        3000000,
        0,
        0,
        12,
        "2021-22",
        "2025-26",
        6000000  // SDV (60L exceeds 50L * 1.10)
      );
      expect(result.effectiveSaleValue).toBe(6000000);
      expect(result.gainNoIdx).toBe(3000000); // 60L - 30L
    });

    it("should compute both indexation options for LTCG and identify the better option", () => {
      const result = calculatePropertyCapitalGains(
        8000000, // sale
        3000000, // cost
        200000,  // improvement
        100000,  // expenses
        36,      // hold months (long term)
        "2021-22", // CII: 317
        "2025-26", // CII: 369
        0
      );
      expect(result.isLongTerm).toBe(true);
      // Option A: No indexation, gain = 80L - 30L - 2L - 1L = 47L
      expect(result.gainNoIdx).toBe(4700000);
      // tax = 47L * 12.5% * 1.04 = 6,11,000
      expect(result.taxNoIdxFinal).toBeCloseTo(611000, 1);

      // Option B: With indexation
      // indexed cost = 30L * 369/317 = 3,492,113.56
      // indexed improvement = 2L * 369/317 = 232,807.57
      // total indexed = 3,724,921.13
      // gain = 80L - 3,724,921.13 - 1L = 4,175,078.87
      // tax = 4,175,078.87 * 20% * 1.04 = 8,68,416.40
      expect(result.gainIdx).toBeCloseTo(4175078.87, 0);
      expect(result.betterOption).toBe("no-index"); // 12.5% without indexation is better in this case
    });
  });

  // 5. Equity Capital Gains Tests
  describe("Equity Capital Gains (Section 111A/112A)", () => {
    it("should calculate listed STCG correctly", () => {
      const result = calculateEquityCapitalGains(
        500,   // sale price
        100,   // qty
        300,   // buy price
        500,   // brokerage
        6,     // hold months
        0,     // fmv
        true   // STT paid
      );
      expect(result.isLongTerm).toBe(false);
      expect(result.totalSale).toBe(49500); // 50000 - 500
      expect(result.gain).toBe(19500);     // 49500 - 30000
      expect(result.taxRate).toBe(0.20);
      expect(result.totalTax).toBeCloseTo(4056, 1); // 19500 * 0.20 * 1.04 = 4056
    });

    it("should apply grandfathering and ₹1.25L exemption for listed LTCG", () => {
      // Acquired pre-2018. buy price 100, but FMV on 31 Jan 2018 was 250. Sold at 400.
      const result = calculateEquityCapitalGains(
        400,   // sale price
        1000,  // qty
        100,   // buy price
        1000,  // brokerage
        36,    // hold months
        250,   // FMV
        true,  // STT paid
        0      // other gains
      );
      expect(result.isLongTerm).toBe(true);
      expect(result.totalSale).toBe(399000); // 400000 - 1000
      // grandfathered cost = max(100*1000, min(250*1000, 399000)) = max(100k, min(250k, 399k)) = 250,000
      expect(result.effectiveCost).toBe(250000);
      expect(result.gain).toBe(149000); // 399k - 250k
      // taxable gain after 1.25L threshold exemption: 149000 - 125000 = 24000
      expect(result.taxBase).toBe(24000);
      expect(result.taxRate).toBe(0.125);
      expect(result.totalTax).toBeCloseTo(3120, 1); // 24000 * 0.125 * 1.04 = 3120
    });
  });

  // 6. Mutual Fund Capital Gains Tests
  describe("Mutual Fund Capital Gains", () => {
    it("should always tax debt mutual funds at slab rates", () => {
      const result = calculateMfCapitalGains("debt", 200000, 150000, 36);
      expect(result.taxRate).toBeNull();
      expect(result.gain).toBe(50000);
      expect(result.totalTax).toBeNull();
    });

    it("should calculate equity mutual fund gains and apply LTCG threshold", () => {
      const result1 = calculateMfCapitalGains("equity", 200000, 100000, 18, 0);
      expect(result1.label).toBe("LTCG — Sec 112A");
      expect(result1.gain).toBe(100000);
      expect(result1.totalTax).toBe(0); // within 1.25L threshold

      const result2 = calculateMfCapitalGains("equity", 300000, 100000, 18, 50000); // other gains: 50k
      // total gain = 200k. total equity gains = 200k + 50k = 250k. taxable above 1.25L = 125k (net of other gains = 75k)
      expect(result2.totalTax).toBeCloseTo(75000 * 0.125 * 1.04, 1);
    });
  });
});
