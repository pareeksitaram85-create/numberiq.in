/**
 * Golden-number test for the GST reconciliation engine.
 *
 * The engine in public/js/gst-reco-engine.js is a port of
 * gst-reco/_engine/tally_2a_reco.py. The Python has already been run over the
 * real Join Commerce workbooks and its output committed to
 * GST_2A_Reco_FY2025-26.xlsx / GST_2A_Reco_FY2026-27.xlsx. Those Overview
 * sheets are the golden numbers below.
 *
 * Counts must match exactly. Tax totals are compared to the paisa - float
 * summation order differs between pandas and JS, so a 1p band is the tightest
 * honest tolerance. Any deviation beyond that is an engine bug, not a
 * tolerance question.
 *
 * WHERE THE WORKBOOKS LIVE
 * The pipeline folder is `deploy/gst-reco` (override with GST_RECO_DIR). Its
 * two data directories are gitignored, so a checkout alone is not enough:
 *   1_INPUT/   the GSTR-2A downloads
 *   3_OUTPUT/  the step-1 books exports
 * They used to sit together in a single `GST Reco py/` folder beside the repo.
 * That folder was reorganised away and this resolver was not updated, so the
 * suite silently skipped for a while - reporting green while asserting nothing.
 * If you change the layout again, change it here too and CHECK THE SUITE RUNS.
 *
 * If the data is absent the suite skips with a clear message rather than
 * failing, so CI on a machine without it stays green.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const PIPELINE_DIR = process.env.GST_RECO_DIR
  ? path.resolve(process.env.GST_RECO_DIR)
  : path.resolve(process.cwd(), "gst-reco");

const INPUT_DIR = path.join(PIPELINE_DIR, "1_INPUT");
const OUTPUT_DIR = path.join(PIPELINE_DIR, "3_OUTPUT");

/** Books come out of step 1 into 3_OUTPUT; the 2A downloads go into 1_INPUT. */
const FILES = {
  books25: path.join(OUTPUT_DIR, "GST_Entries_FY2025-26_Join_Commerce_Private_Limited_-_FY_2025-2026.xlsx"),
  books26: path.join(OUTPUT_DIR, "GST_Entries_20260401-20260630_Join_Commerce_Private_Limited_-_FY_2025-2026.xlsx"),
  portal25: path.join(INPUT_DIR, "JC 2A 25-26.xlsx"),
  portal26: path.join(INPUT_DIR, "JC 2A 26-27.xlsx"),
};

const OWN_PAN = "AAECJ6910B";

const missingFiles = Object.values(FILES).filter((f) => !existsSync(f));
const haveData = missingFiles.length === 0;

/** Load a browser script the way the page does: evaluate it, read the global. */
function evalScript(file: string, sandbox: Any): Any {
  const src = readFileSync(path.resolve(process.cwd(), "public", "js", file), "utf8");
  new Function("globalThis", "module", "console", src)(sandbox, sandbox.module, console);
  return sandbox;
}

function loadEngine(): Any {
  const sandbox: Any = { module: { exports: {} } };
  evalScript("gst-reco-engine.js", sandbox);
  return sandbox.GSTRecoEngine ?? sandbox.module.exports;
}

/** Engine + store in one sandbox, as the module loads them. */
function loadStore(): Any {
  const sandbox: Any = { module: { exports: {} } };
  evalScript("gst-reco-engine.js", sandbox);
  evalScript("gst-reco-store.js", sandbox);
  return sandbox.GSTRecoStore;
}

function readWorkbook(file: string) {
  return XLSX.read(readFileSync(file), {
    type: "buffer",
    raw: true,
    cellDates: false,
  });
}

/** Overview rows keyed by the Python's line id, for both years. */
const GOLDEN: Record<string, Record<string, { count: number | null; tax: number }>> = {
  "FY2025-26": {
    "1": { count: 31442, tax: 240392423.67 },
    "2": { count: 29905, tax: 233232528.41 },
    "3": { count: 1567, tax: 15672394.63 },
    "4": { count: 18, tax: 243705.88 },
    "5": { count: 1519, tax: 6916189.38 },
    "6": { count: 3980, tax: 10722997.54 },
    "6a": { count: 790, tax: -5741394.15 },
    "6b": { count: 2777, tax: 16040743.31 },
    "6c": { count: 413, tax: 423648.38 },
    "6.5": { count: 568, tax: 2444494.11 },
    "7": { count: 200, tax: 10020769.48 },
    "9": { count: 31642, tax: 250413193.15 },
  },
  "FY2026-27": {
    "1": { count: 6503, tax: 42505803.18 },
    "2": { count: 5902, tax: 38567011.17 },
    "3": { count: 98, tax: 1684203.0 },
    "4": { count: 345, tax: 2558317.06 },
    "5": { count: 256, tax: 1380474.95 },
    "6": { count: 1816, tax: 9018577.51 },
    "6a": { count: 272, tax: 769801.84 },
    "6b": { count: 1294, tax: 6691893.51 },
    "6c": { count: 250, tax: 1556882.16 },
    "6.5": { count: 126, tax: 620482.69 },
    "7": { count: 18, tax: 955153.24 },
    "9": { count: 6521, tax: 43460956.42 },
  },
};

const suite = haveData ? describe : describe.skip;

if (!haveData) {
  console.warn(
    `[gst-reco-engine] SKIPPING golden-number tests - asserting nothing.\n` +
      `  pipeline dir: ${PIPELINE_DIR}  (override with GST_RECO_DIR)\n` +
      missingFiles.map((f) => `  missing: ${f}`).join("\n"),
  );
}

suite("GST reco engine - golden numbers", () => {
  let E: Any;
  const runs: Record<string, Any> = {};
  const pools: Record<string, Any> = {};

  beforeAll(() => {
    E = loadEngine();

    const portal25 = E.parsePortalWorkbook(XLSX, readWorkbook(FILES.portal25), {
      label: "FY2025-26",
      source: "2A",
    });
    const portal26 = E.parsePortalWorkbook(XLSX, readWorkbook(FILES.portal26), {
      label: "FY2026-27",
      source: "2A",
    });

    // The adjacent-year pool is aggregated + QRMP'd but NOT amendment-resolved,
    // matching main() in the Python. It is used for labelling only.
    const built25 = E.buildPool(portal25.rows);
    const built26 = E.buildPool(portal26.rows);
    pools["FY2025-26"] = built25;
    pools["FY2026-27"] = built26;

    const books25 = E.parseBooksWorkbook(XLSX, readWorkbook(FILES.books25), { ownPan: OWN_PAN });
    const books26 = E.parseBooksWorkbook(XLSX, readWorkbook(FILES.books26), { ownPan: OWN_PAN });

    const amd25 = E.resolveAmendments(built25.pool.slice());
    const amd26 = E.resolveAmendments(built26.pool.slice());

    runs["FY2025-26"] = E.reconcile(books25.rows, amd25.kept, {
      label: "FY2025-26",
      otherYearPool: built26.pool,
      ownPan: OWN_PAN,
      superseded: amd25.superseded,
    });
    runs["FY2026-27"] = E.reconcile(books26.rows, amd26.kept, {
      label: "FY2026-27",
      otherYearPool: built25.pool,
      ownPan: OWN_PAN,
      superseded: amd26.superseded,
    });
  }, 300_000);

  describe.each(["FY2025-26", "FY2026-27"])("%s", (fy) => {
    it("reproduces every Overview line", () => {
      const byId: Record<string, Any> = {};
      for (const row of runs[fy].overview) byId[row.id] = row;

      for (const [id, want] of Object.entries(GOLDEN[fy])) {
        const got = byId[id];
        expect(got, `overview line ${id} missing`).toBeTruthy();
        if (want.count !== null) {
          expect(got.count, `${fy} line ${id} count`).toBe(want.count);
        }
        expect(got.tax, `${fy} line ${id} tax`).toBeCloseTo(want.tax, 2);
      }
    });

    it("passes both identity checks", () => {
      const id = runs[fy].identity;
      expect(id.inScopeOk, "matched + timing + at-risk must equal in-scope").toBe(true);
      expect(id.booksOk, "in-scope + out-of-scope must equal books total").toBe(true);
      expect(id.noDoubleMatchOk, "no portal row consumed twice").toBe(true);
      expect(id.ok).toBe(true);
    });

    it("consumes each portal row at most once", () => {
      const seen = new Set<Any>();
      for (const r of runs[fy].matched) {
        expect(seen.has(r.portal), "portal row matched twice").toBe(false);
        seen.add(r.portal);
      }
      expect(seen.size).toBe(runs[fy].matched.length);
    });

    it("splits the leftover portal pile exactly three ways", () => {
      const r = runs[fy];
      expect(r.creditNotes.length + r.partyKnown.length + r.partyUnknown.length)
        .toBe(r.portalOnly.length);
    });

    it("reports tax-head totals that sum to the bucket total", () => {
      // Book-side buckets carry ISD / 17(5) / Other GST on top of the ordinary
      // four heads, and Tally's Total Tax includes them. The out-of-scope
      // bucket is entirely special heads - zero ordinary tax by definition.
      for (const [name, h] of Object.entries(runs[fy].byHead) as [string, Any][]) {
        expect(h.ordinary, `${name} ordinary`).toBeCloseTo(
          Math.round((h.igst + h.cgst + h.sgst + h.cess) * 100) / 100, 2);
        expect(
          Math.round((h.ordinary + h.special) * 100) / 100,
          `${name} ordinary + special must equal total`,
        ).toBeCloseTo(h.total, 2);
      }
      expect(runs[fy].byHead.outOfScope.ordinary, "out-of-scope holds no ordinary ITC").toBe(0);
    });
  });

  it("collapses FY2025-26 rate lines into invoices", () => {
    const p = pools["FY2025-26"];
    expect(p.rateLines).toBe(38803);
    expect(p.aggregated).toBe(34553);
  });

  it("applies the statutory overlays without disturbing the reconciliation", () => {
    // As-on is pinned so the run is reproducible; s.16(4) for FY2025-26 closes
    // on 30-Nov-2026, so an as-on of 01-Dec-2026 puts that year past the date.
    const before = JSON.stringify(runs["FY2025-26"].overview);
    const out = E.applyStatutory(runs["FY2025-26"], { asOn: "2026-12-01" });
    expect(JSON.stringify(runs["FY2025-26"].overview)).toBe(before);

    const s = out.statutory;
    expect(s.asOn).toBe("2026-12-01");
    // FY2025-26 credit had to be availed by 30-Nov-2026, so as at 01-Dec-2026
    // the whole year is past its date.
    expect(s.sec16_4.expired).toBe(31441);
    // The one exception is real: a supplier invoice dated 07-Aug-2026 sitting in
    // the FY25-26 ledger, so it is governed by FY2026-27's window. Any "Open"
    // row must be explained that way, never by the current year.
    for (const row of out.recoRows) {
      if (row.sec16_4_state === "Open") expect(row.books_fy).not.toBe("FY2025-26");
    }

    // No payment ledger was supplied, so the 180-day rule must stay inert
    // rather than guess.
    expect(s.payment180.available).toBe(false);
    expect(s.payment180.breached).toBe(0);
    expect(out.recoRows[0].payment_status).toBe("Awaiting payment data");

    // The 17(5) screen is a review prompt. On this ledger it must find the one
    // genuine personal-consumption item and nothing else - see the gift-stock
    // regression test for why a looser screen is worse than none.
    expect(s.blocked17_5.count).toBe(1);
    expect(Object.keys(s.blocked17_5.byClause)).toEqual(["17(5)(g)"]);

    // Withdrawn-slab and duplicate-booking findings, as measured.
    expect(s.rateFlags.count).toBe(97);
    expect(s.duplicates.groups).toBe(341);
    expect(s.duplicates.rows).toBe(735);

    expect(out.headline.itcAvailable).toBeCloseTo(233232528.41, 2);
    expect(out.headline.itcAtRisk).toBeCloseTo(6916189.38, 2);
    expect(out.headline.itcToReverse).toBeCloseTo(5741394.15, 2);
  });

  it("keeps the cumulative row keys unique on the real data", () => {
    // THE test for "continuous". These keys are what stops a re-uploaded month
    // from duplicating rows. A collision here means silent double-counting of
    // ITC on every subsequent upload, so it is checked against the full ledger
    // rather than a sample.
    const S = loadStore();

    const bookKeys = new Set<string>();
    const bookDupes: string[] = [];
    for (const fy of ["FY2025-26", "FY2026-27"]) {
      for (const r of runs[fy].recoRows) {
        const k = S.booksRowKey(r.book);
        if (bookKeys.has(k)) bookDupes.push(k);
        bookKeys.add(k);
      }
      for (const b of runs[fy].outOfScope) {
        const k = S.booksRowKey(b);
        if (bookKeys.has(k)) bookDupes.push(k);
        bookKeys.add(k);
      }
    }
    expect(bookDupes, `books row_key collided: ${bookDupes.slice(0, 3).join(" | ")}`)
      .toHaveLength(0);
    expect(bookKeys.size).toBe(31642 + 6521);

    for (const fy of ["FY2025-26", "FY2026-27"]) {
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const p of pools[fy].pool) {
        const k = S.portalRowKey(p, fy);
        if (seen.has(k)) dupes.push(k);
        seen.add(k);
      }
      expect(dupes, `${fy} portal row_key collided`).toHaveLength(0);
      expect(seen.size).toBe(pools[fy].pool.length);
    }
  });

  it("pairs each FY with its adjacent year for timing lookups", () => {
    const S = loadStore();
    expect(S.adjacentFy("FY2025-26")).toBe("FY2026-27");
    expect(S.adjacentFy("FY2026-27")).toBe("FY2027-28");
    expect(S.adjacentFy("rubbish")).toBe("");
  });

  it("reports run-over-run movement", () => {
    const d = E.diffRuns(runs["FY2025-26"], runs["FY2025-26"]);
    expect(d.newRows).toHaveLength(0);
    expect(d.newlyMatched).toHaveLength(0);
    expect(d.newlyAtRisk).toHaveLength(0);
    // Comparing against an empty prior run makes every row new.
    const fresh = E.diffRuns(runs["FY2025-26"], { recoRows: [] });
    expect(fresh.newRows.length).toBe(runs["FY2025-26"].recoRows.length);
  });
});

describe("GST reco engine - statutory overlays", () => {
  const E: Any = loadEngine();

  function bookRow(over: Any = {}): Any {
    return {
      our_gstin: "07AAECJ6910B1ZY", voucher_type: "Delhi Purchase - 25-26",
      voucher_no: "1", state: "07 - Delhi GST Input", supplier_inv_no: "INV1",
      supplier_name: "Acme", narration: "", _kind: "Purchase",
      _gstin: "07AAGCR8772D1Z1", _pan: "AAGCR8772D", _inv: "INV1",
      _date: E.toDate("2025-06-15"), _not_2a: false, _interbranch: false,
      taxable_value: 1000, igst: 0, cgst: 90, sgst: 90, cess: 0,
      isd: 0, reversal_17_5: 0, other_gst: 0, total_tax: 180,
      ...over,
    };
  }
  function resultOf(books: Any[], rows?: Any[]): Any {
    return {
      recoRows: books.map((b, i) => ({
        book: b, match_tier: "1", portal: rows ? rows[i] : null,
        books_fy: E.fyOf(b._date), reco_status: "Matched",
      })),
      portalOnly: [],
    };
  }

  it("computes the s.16(4) outer date as 30 November following the FY", () => {
    expect(E.sec164DueFor("FY2025-26").key).toBe("2026-11-30");
    expect(E.sec164DueFor("FY2026-27").key).toBe("2027-11-30");
    expect(E.sec164DueFor("rubbish")).toBe(null);
  });

  it("classifies the s.16(4) window as open, closing or expired", () => {
    const r = resultOf([bookRow()]);
    E.applyStatutory(r, { asOn: "2026-01-01" });
    expect(r.recoRows[0].sec16_4_state).toBe("Open");
    expect(r.recoRows[0].sec16_4_due).toBe("2026-11-30");

    E.applyStatutory(r, { asOn: "2026-10-15" });
    expect(r.recoRows[0].sec16_4_state).toBe("Closing");

    E.applyStatutory(r, { asOn: "2026-12-01" });
    expect(r.recoRows[0].sec16_4_state).toBe("Expired");
    expect(r.recoRows[0].sec16_4_days).toBe(-1);
  });

  it("flags only the withdrawn 12% and 28% slabs, and only after 22-Sep-2025", () => {
    expect(E.rateFlag("12%", E.toDate("2025-10-01"))).toContain("withdrawn");
    expect(E.rateFlag("28%", E.toDate("2025-10-01"))).toContain("withdrawn");
    // Before the reform date those slabs were correct.
    expect(E.rateFlag("12%", E.toDate("2025-08-01"))).toBe("");
    // Surviving slabs, and the special rates, must not be flagged.
    expect(E.rateFlag("18%", E.toDate("2025-10-01"))).toBe("");
    expect(E.rateFlag("40%", E.toDate("2025-10-01"))).toBe("");
    expect(E.rateFlag("3%", E.toDate("2025-10-01"))).toBe("");
    expect(E.rateFlag("0.25%", E.toDate("2025-10-01"))).toBe("");
    // A multi-rate invoice is flagged if any line uses a withdrawn slab.
    expect(E.rateFlag("5%, 12%", E.toDate("2025-10-01"))).toContain("withdrawn");
  });

  it("screens s.17(5) on narration, never on supplier name", () => {
    // The trap: a food wholesaler's stock-in-trade is not a blocked credit.
    expect(E.screenBlocked(
      bookRow({ supplier_name: "Shree Narain Food Industries", narration: "raw material purchase" }),
      E.BLOCKED_RULES,
    )).toBe(null);

    const club = E.screenBlocked(bookRow({ narration: "Annual club membership renewal" }), E.BLOCKED_RULES);
    expect(club.clause).toBe("17(5)(b)(ii)");

    const csr = E.screenBlocked(bookRow({ narration: "CSR donation to school" }), E.BLOCKED_RULES);
    expect(csr.clause).toBe("17(5)(fa)");
  });

  it("does not treat buying gift stock as disposing of goods by gift", () => {
    // Regression: a bare "gift" keyword flagged 240 real rows worth 42.7 lakh
    // that were "purchase of gift items" / "gift box 860 Pcs" - stock bought to
    // sell. s.17(5)(h) blocks goods DISPOSED OF as gifts, not goods purchased.
    for (const narration of [
      "Being purchase of gift items vide invoice no GST-2418",
      "Being gift box 860 Pcs @145",
      "Being purchase gift box",
    ]) {
      expect(
        E.screenBlocked(bookRow({ _kind: "Purchase", narration }), E.BLOCKED_RULES),
        `"${narration}" must not be flagged`,
      ).toBe(null);
    }
    // Actual disposal still fires.
    expect(E.screenBlocked(bookRow({ _kind: "Journal", narration: "Diwali gift distributed to staff" }),
      E.BLOCKED_RULES).clause).toBe("17(5)(h)");
    expect(E.screenBlocked(bookRow({ _kind: "Journal", narration: "free samples issued" }),
      E.BLOCKED_RULES).clause).toBe("17(5)(h)");
    // A ledger balance write-off is not goods written off.
    expect(E.screenBlocked(bookRow({ _kind: "Journal", narration: "Being Sundry Balance Written Off" }),
      E.BLOCKED_RULES)).toBe(null);
    expect(E.screenBlocked(bookRow({ _kind: "Journal", narration: "stock written off - expired" }),
      E.BLOCKED_RULES).clause).toBe("17(5)(h)");
  });

  it("anchors short keywords to a word start", () => {
    // "ltc" must not fire inside an unrelated word...
    expect(E.screenBlocked(bookRow({ narration: "multcolour packaging" }), E.BLOCKED_RULES)).toBe(null);
    // ...but must still fire as a word.
    expect(E.screenBlocked(bookRow({ narration: "LTC reimbursement" }), E.BLOCKED_RULES).clause)
      .toBe("17(5)(b)(iii)");
  });

  it("skips the food clause on purchase vouchers but keeps it on journals", () => {
    // Proviso to s.17(5)(b): credit is restored where the inward supply is used
    // to make an outward taxable supply of the same category.
    expect(E.screenBlocked(
      bookRow({ _kind: "Purchase", narration: "outdoor catering supplies" }), E.BLOCKED_RULES,
    )).toBe(null);
    const j = E.screenBlocked(
      bookRow({ _kind: "Journal", narration: "outdoor catering for staff party" }), E.BLOCKED_RULES,
    );
    expect(j.clause).toBe("17(5)(b)(i)");
  });

  it("separates a flagged 17(5) row that already carries a reversal", () => {
    const r = resultOf([
      bookRow({ narration: "gym membership", reversal_17_5: 0 }),
      bookRow({ voucher_no: "2", narration: "gym membership", reversal_17_5: 180 }),
    ]);
    E.applyStatutory(r, { asOn: "2026-01-01" });
    expect(r.recoRows[0].blocked_17_5_status).toBe("Flagged - no reversal booked");
    expect(r.recoRows[1].blocked_17_5_status).toBe("Reversal already booked");
    expect(r.statutory.blocked17_5.noReversal).toBe(1);
    expect(r.statutory.blocked17_5.reversalBooked).toBe(1);
  });

  it("stays inert on the 180-day rule until a payment ledger is supplied", () => {
    const r = resultOf([bookRow()]);
    E.applyStatutory(r, { asOn: "2026-06-01" });
    expect(r.recoRows[0].payment_status).toBe("Awaiting payment data");
    expect(r.statutory.payment180.available).toBe(false);

    const payments = new Map();
    E.applyStatutory(r, { asOn: "2026-06-01", paymentsIndex: payments });
    // 15-Jun-2025 to 01-Jun-2026 is well past 180 days with nothing recorded.
    expect(r.recoRows[0].payment_status).toContain("beyond 180 days");
    expect(r.statutory.payment180.breached).toBe(1);

    // Use the engine's own key builder - reconstructing the format by hand
    // would silently drift the moment the separator changes.
    payments.set(E.paymentKey(r.recoRows[0].book), { paid_date: "2025-07-01" });
    E.applyStatutory(r, { asOn: "2026-06-01", paymentsIndex: payments });
    expect(r.recoRows[0].payment_status).toBe("Paid");
    expect(r.recoRows[0].payment_days).toBe(16);
    expect(r.statutory.payment180.breached).toBe(0);
  });

  it("detects the same supplier invoice booked twice", () => {
    const r = resultOf([
      bookRow({ voucher_no: "1" }),
      bookRow({ voucher_no: "2" }),
      bookRow({ voucher_no: "3", supplier_inv_no: "INV2", _inv: "INV2" }),
    ]);
    E.applyStatutory(r, { asOn: "2026-01-01" });
    expect(r.statutory.duplicates.groups).toBe(1);
    expect(r.statutory.duplicates.rows).toBe(2);
    expect(r.recoRows[0].duplicate_count).toBe(2);
    expect(r.recoRows[2].duplicate_count).toBeUndefined();
  });

  it("flags credit from a supplier whose registration was already cancelled", () => {
    const portal = {
      gstin_cancelled: "01/05/2025", invoice_date: E.toDate("2025-06-15"),
      rates: "18%", total_tax: 180,
    };
    const r = resultOf([bookRow()], [portal]);
    E.applyStatutory(r, { asOn: "2026-01-01" });
    expect(r.recoRows[0].cancelled_flag).toContain("2025-05-01");
    expect(r.statutory.cancelledGstin.count).toBe(1);

    // An invoice predating the cancellation is fine.
    const ok = resultOf([bookRow({ _date: E.toDate("2025-04-01") })],
      [{ gstin_cancelled: "01/05/2025", invoice_date: E.toDate("2025-04-01"), rates: "18%" }]);
    E.applyStatutory(ok, { asOn: "2026-01-01" });
    expect(ok.recoRows[0].cancelled_flag).toBeUndefined();
  });
});

describe("GST reco engine - unit rules", () => {
  const E: Any = loadEngine();

  it("normalises invoice numbers per segment, not globally", () => {
    // Segment-wise stripping keeps interior zeros. Stripping separators first
    // and then zeros - the obvious-looking shortcut - turns this into
    // 2544FS3564, mangling the number and risking a collision.
    expect(E.normInv("250404FS03000564")).toBe("250404FS03000564");
    expect(E.normInv("JDC/25-26/03")).toBe(E.normInv("JDC-25-26-3"));
    expect(E.normInv("JDC/25-26/03")).not.toBe(E.normInv("JDC/25-26/30"));
    expect(E.normInv(null)).toBe("");
    expect(E.normInv("nan")).toBe("");
  });

  it("derives PAN from a GSTIN and falls back to the PAN column", () => {
    expect(E.panOf("27AAECJ6910B1ZW", "")).toBe("AAECJ6910B");
    expect(E.panOf("not-a-gstin", "AAECJ6910B")).toBe("AAECJ6910B");
    expect(E.panOf("", "rubbish")).toBe("");
  });

  it("strips corporate suffixes when comparing names", () => {
    expect(E.normName("SMARTSHIFT LOGISTICS SOLUTIONS PRIVATE LIMITED"))
      .toBe("SMARTSHIFT LOGISTICS SOLUTIONS");
    expect(E.normName("M/s Acme & Co.")).toBe("ACME");
  });

  it("matches difflib SequenceMatcher ratios", () => {
    // Reference values from Python: difflib.SequenceMatcher(None, a, b).ratio()
    expect(E.nameRatio("ABCD", "ABCD")).toBeCloseTo(1.0, 10);
    expect(E.nameRatio("", "")).toBeCloseTo(1.0, 10);
    expect(E.nameRatio("RELIANCE RETAIL", "RELIANCE RETAILS")).toBeCloseTo(0.967741935, 6);
    expect(E.nameRatio("ABCDE", "FGHIJ")).toBeCloseTo(0.0, 10);
    expect(E.nameRatio("TATA MOTORS", "TATA MOTOR")).toBeCloseTo(0.952380952, 6);
  });

  it("reads dates from Excel serials, text and Date objects", () => {
    expect(E.toDate(45717)?.key).toBe(E.toDate("2025-03-01")?.key);
    expect(E.toDate("02/03/2026")?.key).toBe("2026-03-02"); // dd/mm/yyyy
    expect(E.toDate("11-Apr-26")?.key).toBe("2026-04-11");
    expect(E.toDate("20260331")?.key).toBe("2026-03-31");
    expect(E.toDate("rubbish")).toBe(null);
    expect(E.toDate(12)).toBe(null); // an amount in a date column is not a date
  });

  it("derives the Indian financial year from April", () => {
    expect(E.fyOf(E.toDate("2026-03-31"))).toBe("FY2025-26");
    expect(E.fyOf(E.toDate("2026-04-01"))).toBe("FY2026-27");
  });

  it("flips the sign on supplier credit notes", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["My GSTIN", "Supplier GSTIN", "Document Type", "Section Name",
        "Document Number", "Document Date", "Taxable Value", "IGST Amount",
        "CGST Amount", "SGST Amount", "CESS Amount"],
      ["27AAECJ6910B1ZW", "27AAGCR8772D1Z2", "INVOICE", "B2B", "INV1", "01/04/2025", 1000, 180, 0, 0, 0],
      ["27AAECJ6910B1ZW", "27AAGCR8772D1Z2", "CREDIT_NOTE", "CDN", "CN1", "02/04/2025", 500, 90, 0, 0, 0],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "07");
    const out = E.parsePortalWorkbook(XLSX, wb, { label: "FY2025-26" });
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0].total_tax).toBe(180);
    expect(out.rows[1].total_tax).toBe(-90);
    expect(out.rows[1].taxable_value).toBe(-500);
  });

  it("keeps Section in the aggregation key so an amendment cannot absorb its original", () => {
    const rows = [
      { our_gstin: "G1", supplier_gstin: "S1", section: "B2B", _inv: "INV1", tax_rate: "18%",
        taxable_value: 100, invoice_value: 118, total_tax: 18, igst: 18, cgst: 0, sgst: 0, cess: 0,
        orig_doc_no: "" },
      { our_gstin: "G1", supplier_gstin: "S1", section: "B2BA", _inv: "INV1", tax_rate: "18%",
        taxable_value: 200, invoice_value: 236, total_tax: 36, igst: 36, cgst: 0, sgst: 0, cess: 0,
        orig_doc_no: "INV1" },
    ];
    const agg = E.aggregateInvoices(rows);
    expect(agg).toHaveLength(2);

    const { kept, superseded } = E.resolveAmendments(agg);
    expect(superseded).toHaveLength(1);
    expect(superseded[0].section).toBe("B2B");
    expect(kept).toHaveLength(1);
    expect(kept[0].total_tax).toBe(36);
  });

  it("rescues QRMP suppliers whose quarter 3B is filed", () => {
    const rows: Any[] = [
      { supplier_gstin: "S1", return_period: "January 2026", gstr3b_status: "Not Filed" },
      { supplier_gstin: "S1", return_period: "February 2026", gstr3b_status: "Not Filed" },
      { supplier_gstin: "S1", return_period: "March 2026", gstr3b_status: "Filed" },
      { supplier_gstin: "S2", return_period: "January 2026", gstr3b_status: "Not Filed" },
    ];
    const out = E.applyQrmpRule(rows);
    expect(out.rescued).toBe(2);
    expect(rows[0].gstr3b_effective).toBe("Filed");
    expect(rows[0].gstr3b_basis).toBe("Quarterly filer - quarter 3B filed");
    expect(rows[3].gstr3b_effective).toBe("Not Filed");
  });

  it("scopes out only ISD / 17(5) rows, never by voucher type", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Voucher Date", "Voucher Type", "Voucher No.", "Supplier Name", "Supplier GSTIN",
        "Supplier Inv No", "Taxable Value", "CGST", "SGST / UTGST", "IGST", "CESS",
        "ISD", "Reversal 17(5)", "Other GST", "Total Tax"],
      // a GST Journal carrying ordinary tax is IN scope
      ["01/04/2025", "Delhi GST Journal - 25-26", "1", "Swiggy", "07AAGCR8772D1Z1",
        "SW1", 1000, 90, 90, 0, 0, 0, 0, 0, 180],
      // an ISD-only journal is OUT of scope
      ["01/04/2025", "Delhi GST Journal - 25-26", "2", "HO ISD", "", "", 0, 0, 0, 0, 0,
        5000, 0, 0, 5000],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Consolidated");
    const out = E.parseBooksWorkbook(XLSX, wb, { ownPan: OWN_PAN });
    expect(out.rows[0]._not_2a).toBe(false);
    expect(out.rows[1]._not_2a).toBe(true);
  });

  it("takes the first unused candidate on tier 1 even when the amount differs", () => {
    const pool = [
      { supplier_gstin: "07AAGCR8772D1Z1", _pan: "AAGCR8772D", _inv: "INV1", _name: "ACME",
        total_tax: 999, invoice_date: E.toDate("2025-04-01"), sheet: "07", rcm: "N",
        doc_type: "INVOICE", return_period: "April 2025", igst: 999, cgst: 0, sgst: 0, cess: 0 },
    ];
    const books = [
      { _gstin: "07AAGCR8772D1Z1", _pan: "AAGCR8772D", _inv: "INV1", _name: "ACME",
        total_tax: 180, _date: E.toDate("2025-04-01"), igst: 180, cgst: 0, sgst: 0, cess: 0,
        _not_2a: false, _interbranch: false },
    ];
    const m = E.matchBooks(books, pool, {});
    expect(m.results[0].match_tier).toBe("1");
    expect(m.results[0].reco_status).toContain("amount differs");
  });

  it("labels an adjacent-year hit as timing without consuming it", () => {
    const other = [
      { supplier_gstin: "07AAGCR8772D1Z1", _pan: "AAGCR8772D", _inv: "INV9", _name: "ACME",
        total_tax: 180, invoice_date: E.toDate("2026-04-01"), return_period: "April 2026",
        _srcLabel: "FY2026-27", sheet: "07", rcm: "N", doc_type: "INVOICE" },
    ];
    const books = [
      { _gstin: "07AAGCR8772D1Z1", _pan: "AAGCR8772D", _inv: "INV9", _name: "ACME",
        total_tax: 180, _date: E.toDate("2026-03-31"), igst: 180, cgst: 0, sgst: 0, cess: 0,
        _not_2a: false, _interbranch: false },
    ];
    const m = E.matchBooks(books, [], { otherYearPool: other });
    expect(m.results[0].match_tier).toBe("");
    expect(m.results[0].reco_status).toContain("Timing");
    expect(m.results[0].reco_status).toContain("FY2026-27");
    expect(m.usedCount).toBe(0);
  });
});
