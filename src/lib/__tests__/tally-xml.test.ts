import { describe, it, expect } from "vitest";
import {
  toTallyDate,
  buildVoucherXml,
  buildEnvelope,
  buildMastersXml,
  findLedgerMatch,
  normName,
  type TallyRow,
  type VoucherSettings,
} from "../tally-xml";

/**
 * These functions previously lived inside components/calculators/invoice-to-tally.tsx and are
 * now shared with the automation API. They are also mirrored by hand in
 * automation/invoice-watcher/src/tally-xml.js — this spec is what catches the two drifting.
 */

const settings: VoucherSettings = {
  company: "JOIN COMMERCE PVT LTD",
  voucherType: "Purchase",
  purchaseLedger: "Purchase Account",
  salesLedger: "Sales Account",
  cgstLedger: "Input CGST",
  sgstLedger: "Input SGST",
  igstLedger: "Input IGST",
  roundOffLedger: "Round Off",
};

const row = (over: Partial<TallyRow> = {}): TallyRow => ({
  id: 1,
  File_Name: "inv.pdf",
  Invoice_Number: "INV-1042",
  Invoice_Date: "12-01-2026",
  Supplier_Name: "Sharma Traders",
  Supplier_GSTIN: "08AAECJ6910B1ZK",
  Taxable_Amount: "1000",
  CGST_Amount: "90",
  SGST_Amount: "90",
  IGST_Amount: "0",
  Total_Amount: "1180",
  Party_Ledger: "",
  _src: "manual",
  _warn: "",
  ...over,
});

describe("toTallyDate", () => {
  it("reads Indian DD-MM-YYYY, not the US convention", () => {
    expect(toTallyDate("12-01-2026")).toBe("20260112");
    expect(toTallyDate("12/01/26")).toBe("20260112");
  });

  it("reads ISO, month-name and US-style month-first dates", () => {
    expect(toTallyDate("2026-01-12")).toBe("20260112");
    expect(toTallyDate("12-Jan-2026")).toBe("20260112");
    expect(toTallyDate("Jan 12, 2026")).toBe("20260112");
  });

  it("returns null rather than guessing an accounting period", () => {
    expect(toTallyDate("")).toBeNull();
    expect(toTallyDate("not a date")).toBeNull();
    expect(toTallyDate("32-01-2026")).toBeNull();
    expect(toTallyDate("12-13-2026")).toBeNull();
  });
});

describe("buildVoucherXml", () => {
  it("credits the party and debits expense plus input GST, netting to zero", () => {
    const { xml, warn } = buildVoucherXml(row(), settings);
    expect(warn).toBe("");

    const amounts = [...xml.matchAll(/<AMOUNT>(-?[\d.]+)<\/AMOUNT>/g)].map(m => parseFloat(m[1]));
    // party line carries a duplicate amount inside BILLALLOCATIONS, so drop one copy
    const ledgerLines = amounts.filter((_, i) => i !== 1);
    expect(ledgerLines.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 2);

    expect(xml).toContain("<LEDGERNAME>Sharma Traders</LEDGERNAME>");
    expect(xml).toContain("<AMOUNT>1180.00</AMOUNT>");
    expect(xml).toContain("<LEDGERNAME>Purchase Account</LEDGERNAME>");
    expect(xml).toContain("<AMOUNT>-1000.00</AMOUNT>");
    expect(xml).toContain('<VOUCHER VCHTYPE="Purchase" ACTION="Create">');
    expect(xml).toContain("<DATE>20260112</DATE>");
  });

  it("flips the signs for a sales voucher", () => {
    const { xml } = buildVoucherXml(row(), { ...settings, voucherType: "Sales" });
    expect(xml).toContain("<AMOUNT>-1180.00</AMOUNT>");
    expect(xml).toContain("<LEDGERNAME>Sales Account</LEDGERNAME>");
    expect(xml).toContain("<AMOUNT>1000.00</AMOUNT>");
  });

  it("skips the row instead of posting a bad date, party or total", () => {
    expect(buildVoucherXml(row({ Invoice_Date: "junk" }), settings).warn).toMatch(/date/i);
    expect(buildVoucherXml(row({ Supplier_Name: "", Party_Ledger: "" }), settings).warn).toMatch(/party/i);
    expect(buildVoucherXml(row({ Taxable_Amount: "0", CGST_Amount: "0", SGST_Amount: "0", IGST_Amount: "0", Total_Amount: "0" }), settings).warn).toMatch(/total/i);
  });

  it("absorbs a rounding difference into the round-off ledger", () => {
    const { xml } = buildVoucherXml(row({ Total_Amount: "1180.40" }), settings);
    expect(xml).toContain("<LEDGERNAME>Round Off</LEDGERNAME>");
    expect(xml).toContain("<AMOUNT>-0.40</AMOUNT>");
  });

  it("warns when the round-off is too large to be a round-off", () => {
    const { warn } = buildVoucherXml(row({ Total_Amount: "1500" }), settings);
    expect(warn).toMatch(/verify amounts/i);
  });

  it("prefers Party_Ledger over the raw supplier name", () => {
    const { xml } = buildVoucherXml(row({ Party_Ledger: "Sharma Traders Pvt Ltd" }), settings);
    expect(xml).toContain("<PARTYLEDGERNAME>Sharma Traders Pvt Ltd</PARTYLEDGERNAME>");
  });

  it("escapes XML-significant characters in names", () => {
    const { xml } = buildVoucherXml(row({ Supplier_Name: "Tata & Sons <Delhi>" }), settings);
    expect(xml).toContain("Tata &amp; Sons &lt;Delhi&gt;");
    expect(xml).not.toContain("Tata & Sons <Delhi>");
  });

  it("falls back to the file name when the invoice number is missing", () => {
    const { xml } = buildVoucherXml(row({ Invoice_Number: "Missing" }), settings);
    expect(xml).toContain("<VOUCHERNUMBER>inv.pdf</VOUCHERNUMBER>");
  });
});

describe("buildEnvelope", () => {
  it("wraps vouchers in a Tally import envelope carrying the company", () => {
    const xml = buildEnvelope("<INNER/>", "JOIN COMMERCE PVT LTD", "Vouchers");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<TALLYREQUEST>Import Data</TALLYREQUEST>");
    expect(xml).toContain("<REPORTNAME>Vouchers</REPORTNAME>");
    expect(xml).toContain("<SVCURRENTCOMPANY>JOIN COMMERCE PVT LTD</SVCURRENTCOMPANY>");
    expect(xml).toContain("<INNER/>");
  });

  it("omits the company block when no company is given", () => {
    expect(buildEnvelope("<INNER/>", "", "All Masters")).not.toContain("STATICVARIABLES");
  });
});

describe("buildMastersXml", () => {
  it("creates one creditor ledger per unique party", () => {
    const r = buildMastersXml([row(), row({ id: 2 }), row({ id: 3, Supplier_Name: "Verma & Co" })], settings);
    expect(r.count).toBe(2);
    expect(r.xml).toContain("<PARENT>Sundry Creditors</PARENT>");
    expect(r.xml).toContain("<PARTYGSTIN>08AAECJ6910B1ZK</PARTYGSTIN>");
  });

  it("files parties under debtors for sales", () => {
    const r = buildMastersXml([row()], { ...settings, voucherType: "Sales" });
    expect(r.xml).toContain("<PARENT>Sundry Debtors</PARENT>");
  });

  it("skips parties that already exist in Tally", () => {
    const r = buildMastersXml([row()], settings, ["Sharma Traders Pvt. Ltd."]);
    expect(r.count).toBe(0);
    expect(r.skipped).toBe(1);
  });

  it("leaves out a malformed GSTIN rather than importing it", () => {
    const r = buildMastersXml([row({ Supplier_GSTIN: "NOTAGSTIN" })], settings);
    expect(r.xml).not.toContain("PARTYGSTIN");
  });
});

describe("findLedgerMatch", () => {
  it("matches through company-suffix noise", () => {
    expect(normName("ABC Traders Pvt. Ltd.")).toBe(normName("ABC Private Limited"));
    expect(findLedgerMatch("Sharma Traders", ["Sharma Traders Pvt Ltd"])?.kind).toBe("exact");
  });

  it("accepts a close spelling as a fuzzy match", () => {
    const m = findLedgerMatch("Sharma Trading Co", ["Sharmaa Traders", "Verma Steel"]);
    expect(m?.name).toBe("Sharmaa Traders");
    expect(m?.kind).toBe("fuzzy");
  });

  it("returns null rather than posting to the wrong supplier", () => {
    expect(findLedgerMatch("Sharma Traders", ["Verma Steel", "Gupta Textiles"])).toBeNull();
    expect(findLedgerMatch("Sharma Traders", [])).toBeNull();
    expect(findLedgerMatch("", ["Sharma Traders"])).toBeNull();
  });
});
