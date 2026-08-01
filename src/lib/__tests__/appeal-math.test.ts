import { describe, it, expect } from "vitest";
import { calculateAppealDeadline, appealFee, calculateImmunity } from "../appeal-math";

describe("Appeal limitation", () => {
  it("gives CIT(A) 30 days from service of the demand notice", () => {
    const r = calculateAppealDeadline("cit-appeals", "2026-06-01", 500000, "2026-06-01");
    expect(r.dueDate).toBe("2026-07-01");
    expect(r.daysRemaining).toBe(30);
    expect(r.status).toBe("in-time");
  });

  it("gives ITAT 60 days from communication of the order", () => {
    const r = calculateAppealDeadline("itat", "2026-06-01", 500000, "2026-06-01");
    expect(r.dueDate).toBe("2026-07-31");
    expect(r.status).toBe("in-time");
  });

  it("gives a cross-objection 30 days", () => {
    const r = calculateAppealDeadline("itat-cross-objection", "2026-06-01", 0, "2026-06-01");
    expect(r.dueDate).toBe("2026-07-01");
  });

  it("gives the High Court 120 days", () => {
    const r = calculateAppealDeadline("high-court", "2026-01-01", 0, "2026-01-01");
    expect(r.dueDate).toBe("2026-05-01");
  });

  it("treats income-tax delay as condonable without an outer limit", () => {
    const r = calculateAppealDeadline("cit-appeals", "2020-01-01", 500000, "2026-06-01");
    expect(r.isLate).toBe(true);
    expect(r.status).toBe("condonation-needed");
    expect(r.isTimeBarred).toBe(false);
  });

  it("uses 3 months for a GST appeal under Section 107", () => {
    const r = calculateAppealDeadline("gst-appellate-authority", "2026-01-15", 0, "2026-01-15");
    expect(r.dueDate).toBe("2026-04-15");
    expect(r.condonationLastDate).toBe("2026-05-15");
  });

  it("time-bars a GST appeal beyond the one further month", () => {
    const r = calculateAppealDeadline("gst-appellate-authority", "2026-01-15", 0, "2026-05-16");
    expect(r.status).toBe("time-barred");
    expect(r.isTimeBarred).toBe(true);
  });

  it("still allows condonation inside the further month", () => {
    const r = calculateAppealDeadline("gst-appellate-authority", "2026-01-15", 0, "2026-05-01");
    expect(r.status).toBe("condonation-needed");
    expect(r.isTimeBarred).toBe(false);
  });

  it("gives the GST Tribunal a further three months", () => {
    const r = calculateAppealDeadline("gst-tribunal", "2026-01-15", 0, "2026-01-15");
    expect(r.condonationLastDate).toBe("2026-07-15");
  });

  it("flags the due date itself as in time", () => {
    const r = calculateAppealDeadline("cit-appeals", "2026-06-01", 500000, "2026-07-01");
    expect(r.daysRemaining).toBe(0);
    expect(r.status).toBe("in-time");
  });

  it("handles month-end rollover without skipping a month", () => {
    const r = calculateAppealDeadline("gst-appellate-authority", "2026-01-31", 0, "2026-01-31");
    expect(r.dueDate).toBe("2026-04-30");
  });

  it("returns an unknown status for an unparseable date", () => {
    const r = calculateAppealDeadline("cit-appeals", "not-a-date", 0, "2026-06-01");
    expect(r.status).toBe("unknown");
    expect(r.dueDate).toBeNull();
  });
});

describe("Appeal filing fee", () => {
  it("applies the CIT(A) slabs under Section 249(1)", () => {
    expect(appealFee("cit-appeals", 80000).fee).toBe(250);
    expect(appealFee("cit-appeals", 150000).fee).toBe(500);
    expect(appealFee("cit-appeals", 900000).fee).toBe(1000);
  });

  it("applies the ITAT slabs under Section 253(6)", () => {
    expect(appealFee("itat", 80000).fee).toBe(500);
    expect(appealFee("itat", 150000).fee).toBe(1500);
  });

  it("charges 1% above the second ITAT slab", () => {
    expect(appealFee("itat", 500000).fee).toBe(5000);
  });

  it("caps the ITAT fee at Rs 10,000", () => {
    expect(appealFee("itat", 50000000).fee).toBe(10000);
    expect(appealFee("itat", 5000000).basis).toContain("ceiling");
  });

  it("charges nothing on a cross-objection", () => {
    expect(appealFee("itat-cross-objection", 5000000).fee).toBe(0);
  });

  it("returns no rupee fee for GST and High Court forums", () => {
    expect(appealFee("gst-appellate-authority", 100000).fee).toBeNull();
    expect(appealFee("high-court", 100000).fee).toBeNull();
  });

  it("applies the slab boundaries exactly", () => {
    expect(appealFee("cit-appeals", 100000).fee).toBe(250);
    expect(appealFee("cit-appeals", 100001).fee).toBe(500);
    expect(appealFee("cit-appeals", 200000).fee).toBe(500);
    expect(appealFee("cit-appeals", 200001).fee).toBe(1000);
  });
});

describe("Section 270AA immunity", () => {
  const base = {
    order: "2026-06-10",
    tax: 500000,
    interest: 90000,
  };

  // Computed literally: order received June, end of that month is 30 June, one
  // month later is 30 July. Some commentaries read the last date as 31 July; the
  // tool deliberately shows the earlier of the two.
  it("sets the Form 68 deadline one month from the end of the month of receipt", () => {
    const r = calculateImmunity(base.order, base.tax, base.interest, false, true, false, 30, "2026-06-15");
    expect(r.formDeadline).toBe("2026-07-30");
  });

  it("handles a 31-day month of receipt without overshooting", () => {
    const r = calculateImmunity("2026-01-20", 100000, 0, false, true, false, 30, "2026-01-25");
    expect(r.formDeadline).toBe("2026-02-28");
  });

  it("is available where the conditions are met", () => {
    const r = calculateImmunity(base.order, base.tax, base.interest, false, true, false, 30, "2026-06-15");
    expect(r.eligible).toBe(true);
    expect(r.blockers).toEqual([]);
  });

  it("is barred where the addition is misreporting", () => {
    const r = calculateImmunity(base.order, base.tax, base.interest, true, true, false, 30, "2026-06-15");
    expect(r.eligible).toBe(false);
    expect(r.penaltyRatePct).toBe(200);
    expect(r.blockers.join(" ")).toContain("misreporting");
  });

  it("is barred where the assessee wants to appeal", () => {
    const r = calculateImmunity(base.order, base.tax, base.interest, false, true, true, 30, "2026-06-15");
    expect(r.eligible).toBe(false);
    expect(r.blockers.join(" ")).toContain("not appealing");
  });

  it("is barred where the tax has not been paid", () => {
    const r = calculateImmunity(base.order, base.tax, base.interest, false, false, false, 30, "2026-06-15");
    expect(r.eligible).toBe(false);
  });

  it("is barred once the filing window has closed", () => {
    const r = calculateImmunity(base.order, base.tax, base.interest, false, true, false, 30, "2026-08-05");
    expect(r.deadlinePassed).toBe(true);
    expect(r.eligible).toBe(false);
  });

  it("charges under-reporting penalty at 50% of tax", () => {
    const r = calculateImmunity(base.order, 500000, 0, false, true, false, 30, "2026-06-15");
    expect(r.penaltyRatePct).toBe(50);
    expect(r.penaltyExposure).toBe(250000);
  });

  it("charges misreporting penalty at 200% of tax", () => {
    const r = calculateImmunity(base.order, 500000, 0, true, true, false, 30, "2026-06-15");
    expect(r.penaltyExposure).toBe(1000000);
  });

  it("costs tax plus interest to take immunity", () => {
    const r = calculateImmunity(base.order, 500000, 90000, false, true, false, 30, "2026-06-15");
    expect(r.immunityCost).toBe(590000);
  });

  it("prefers appealing when the case is very strong", () => {
    const r = calculateImmunity(base.order, 500000, 90000, false, true, false, 95, "2026-06-15");
    expect(r.recommendation).toContain("appealing has the lower expected cost");
  });

  it("prefers immunity when the case is weak", () => {
    const r = calculateImmunity(base.order, 500000, 90000, false, true, false, 5, "2026-06-15");
    expect(r.recommendation).toContain("immunity is the cheaper course");
  });
});
