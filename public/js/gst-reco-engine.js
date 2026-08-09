/* ============================================================================
 * GST RECONCILIATION ENGINE  -  books vs GSTR-2A/2B, GSTIN-wise
 * ============================================================================
 * A faithful port of gst-reco/_engine/tally_2a_reco.py. Every rule below was
 * derived from real Join Commerce data and each one exists because its absence
 * produced a wrong number. The measured cost of getting each wrong is recorded
 * in the comments - do not "simplify" any of them without re-running the golden
 * test in src/lib/__tests__/gst-reco-engine.test.ts.
 *
 * DECISIONS BAKED IN
 * 1. ONE YEAR PER RUN. An unmatched book row is still looked up in the OTHER
 *    year's pool. If found there it is labelled "timing", not "not in 2A". The
 *    lookup only LABELS - it never consumes a row - so the two runs stay
 *    independent and neither double-counts.
 * 2. AMENDMENTS SUPERSEDE ORIGINALS. B2BA/CDNA replace the B2B/CDN they amend.
 *    Without this the amended invoice is counted twice and totals cannot tie.
 * 3. 3B FILING STATUS DRIVES NOTHING. The portal's value proved unreliable -
 *    QRMP suppliers report "Not Filed" for the first two months of every
 *    quarter, and the ISD sheet carries no 3B column at all. Acting on it
 *    wrongly put 1.37 crore into "at risk". Carried as source data only.
 * 4. THE REAL ITC RISK IS "IN BOOKS, NOT IN 2A". Under s.16(2)(aa) credit can
 *    only be taken on an invoice the supplier reported, so a book entry with no
 *    portal counterpart is the exposure. Its mirror, "in 2A only", is either
 *    unclaimed credit or - for credit notes - an unrecognised liability.
 *
 * MATCH TIERS (each book row and each portal row consumed at most once)
 *   1   supplier GSTIN + invoice no            Matched
 *   2   as tier 1 but tax differs              Matched - amount differs
 *   2P  supplier PAN + invoice no              Matched on PAN (multi-state
 *                                              vendor on a single ledger)
 *   3   invoice no + tax, no GSTIN in books    Matched - GSTIN missing in books
 *   4   fuzzy supplier name + invoice no + tax Probable - verify
 *   5   GSTIN + date + taxable value           Probable - invoice no differs
 * ========================================================================= */

(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GSTRecoEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ENGINE_VERSION = "1.0.0";

  var DEFAULTS = {
    tolerance: 1.0,        // rupees, per invoice, on total tax
    nameSimilarity: 0.88,  // difflib ratio for tier 4
    ownPan: "",            // set per entity; enables inter-branch tagging
  };

  var GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][A-Z0-9]$/;
  var PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  var TAX_FIELDS = ["igst", "cgst", "sgst", "cess"];

  /* Ordered: the FIRST column whose lowered header contains the pattern wins,
   * so specific patterns must precede loose ones. "taxable value" must be found
   * before "total taxable value"; "igst amount" before "total igst"; the GSTR-1
   * filing STATUS before the filing RETURN PERIOD. Object key order is
   * insertion order in JS, matching Python's dict, so this ordering is load
   * bearing - do not alphabetise. */
  var FIELD_PATTERNS = {
    my_gstin: ["my gstin"],
    return_period: ["return period"],
    supplier_gstin: ["supplier gstin"],
    supplier_name: ["supplier legal name", "supplier trade name",
      "trade/legal name", "legal name", "supplier name"],
    doc_type: ["document type"],
    section: ["section name"],
    invoice_date: ["document date", "invoice date", "note date"],
    invoice_no: ["document number", "invoice number", "invoice no"],
    taxable_value: ["taxable value"],
    tax_rate: ["tax rate", "rate(%)"],
    tax_value: ["tax value"],
    igst: ["igst amount"],
    cgst: ["cgst amount"],
    sgst: ["sgst amount"],
    cess: ["cess amount"],
    invoice_value: ["total invoice value", "invoice value", "document value"],
    rcm: ["reverse charge"],
    gstr3b_status: ["gstr-3b filing status"],
    gstr1_status: ["gstr-1/iff/gstr-5 filing status"],
    filing_period: ["gstr-1/iff/gstr-5 filing return period"],
    filing_date: ["gstr-1/iff/gstr-5 filing date"],
    orig_doc_no: ["original document number"],
    orig_doc_date: ["original document date"],
    amendment_type: ["amendment type"],
    supplier_pan: ["supplier pan"],
    cancel_date: ["cancellation date"],
    taxpayer_type: ["taxpayer type"],
  };
  var REQUIRED_FIELDS = ["invoice_no", "taxable_value"];

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  var MON_ABBR = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep",
    "oct", "nov", "dec"];

  /* ------------------------------------------------------------ normalising */

  /**
   * Split on separators, strip each segment's leading zeros, rejoin.
   *
   * Order matters. Stripping separators FIRST loses the segment boundaries and
   * interior zeros then get eaten too: 250404FS03000564 -> 2544FS3564, which
   * both mangles the number and can collide two different invoices. Done this
   * way, JDC/25-26/03 == JDC-25-26-3 while JDC/25-26/03 != JDC/25-26/30.
   */
  function normInv(v) {
    var s = String(v === null || v === undefined ? "" : v).trim().toUpperCase();
    if (s === "" || s === "NAN" || s === "NONE") return "";
    var parts = s.split(/[\s\-/\\.,#:_()]+/).filter(Boolean);
    var out = "";
    for (var i = 0; i < parts.length; i++) {
      out += parts[i].replace(/^0+(?=[0-9])/, "");
    }
    return out;
  }

  function normGstin(v) {
    var s = String(v === null || v === undefined ? "" : v)
      .trim().toUpperCase().replace(/\s/g, "");
    return GSTIN_RE.test(s) ? s : "";
  }

  /**
   * PAN identifies a vendor across all their state GSTINs.
   *
   * 105 vendors bill into 3+ of our states while holding at most one GSTIN in
   * Tally (single ledger), carrying 10.5 crore of tax. GSTIN cannot match
   * those; PAN can. Safe: GSTIN[2:12] == PAN in 27,621 of 27,645 rows where
   * both exist.
   */
  function panOf(gstin, panField) {
    var g = normGstin(gstin);
    if (g) return g.slice(2, 12);
    var p = String(panField === null || panField === undefined ? "" : panField)
      .trim().toUpperCase();
    return PAN_RE.test(p) ? p : "";
  }

  function normName(v) {
    var s = String(v === null || v === undefined ? "" : v).trim().toUpperCase();
    s = s.replace(/\b(PVT|PRIVATE|LTD|LIMITED|LLP|CO|COMPANY|AND|THE|M\/S)\b/g, " ");
    return s.replace(/[^A-Z0-9]+/g, " ").trim();
  }

  function round2(v) {
    if (!isFinite(v)) return 0;
    return Math.round((v + (v < 0 ? -1e-9 : 1e-9)) * 100) / 100;
  }

  function toNum(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return isFinite(v) ? round2(v) : 0;
    var s = String(v).replace(/,/g, "").trim();
    if (s === "" || s === "-" || s === "nan" || s === "None") return 0;
    var cleaned = s.replace(/[^0-9.\-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
    var n = parseFloat(cleaned);
    return isFinite(n) ? round2(n) : 0;
  }

  var MS_DAY = 86400000;

  function mkDate(y, m, d) {
    // Reject impossible calendar dates the way strptime does.
    var t = Date.UTC(y, m - 1, d);
    var dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 ||
      dt.getUTCDate() !== d) return null;
    var mm = m < 10 ? "0" + m : String(m);
    var dd = d < 10 ? "0" + d : String(d);
    return { key: y + "-" + mm + "-" + dd, num: Math.round(t / MS_DAY), y: y, m: m, d: d };
  }

  /**
   * Dates arrive three ways: as an Excel serial (workbook read with raw
   * values - deliberate, a JS Date from SheetJS drifts by the reader's
   * timezone), as a JS Date if the caller read with cellDates, or as text in
   * any of half a dozen formats. All three collapse to a UTC day number here.
   */
  function toDate(v) {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) {
      if (isNaN(v.getTime())) return null;
      return mkDate(v.getFullYear(), v.getMonth() + 1, v.getDate());
    }
    if (typeof v === "number") {
      // Excel serial. Guard mirrors the range real invoice dates occupy so a
      // stray amount in a date column is not silently read as a date.
      if (v > 20000 && v < 80000) {
        var d = new Date(Math.round((v - 25569) * MS_DAY));
        return mkDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      }
      return null;
    }
    var s = String(v).trim();
    if (s === "" || s === "nan" || s === "NaT" || s === "None") return null;

    var m;
    // %d/%m/%Y and %d-%m-%Y
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) return mkDate(+m[3], +m[2], +m[1]);
    // %Y-%m-%d (also tolerates a trailing time component)
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
    if (m) return mkDate(+m[1], +m[2], +m[3]);
    // %d-%b-%Y and %d-%b-%y  (11-Apr-26)
    m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2}|\d{4})$/);
    if (m) {
      var mi = MON_ABBR.indexOf(m[2].slice(0, 3).toLowerCase());
      if (mi >= 0) {
        var yr = +m[3];
        if (m[3].length === 2) yr += yr < 70 ? 2000 : 1900;
        return mkDate(yr, mi + 1, +m[1]);
      }
    }
    // %Y%m%d
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return mkDate(+m[1], +m[2], +m[3]);
    // dayfirst fallback, matching pandas' to_datetime(dayfirst=True)
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
    if (m) {
      var y2 = +m[3];
      return mkDate(y2 + (y2 < 70 ? 2000 : 1900), +m[2], +m[1]);
    }
    return null;
  }

  function fyOf(d) {
    if (!d) return "";
    var y = d.m >= 4 ? d.y : d.y - 1;
    return "FY" + y + "-" + String(y + 1).slice(-2);
  }

  /** Financial year label -> its 1 April start and 31 March end, as day nums. */
  function fyBounds(fy) {
    var m = String(fy || "").match(/^FY(\d{4})-(\d{2})$/);
    if (!m) return null;
    var start = mkDate(+m[1], 4, 1);
    var end = mkDate(+m[1] + 1, 3, 31);
    return { start: start, end: end };
  }

  /* ------------------------------------------------ difflib SequenceMatcher */

  /**
   * Faithful port of Python's difflib.SequenceMatcher.ratio() with isjunk=None.
   * Tier 4 accepts a match at >= 0.88, so an approximation here would silently
   * change which invoices match. The autojunk heuristic is included for
   * completeness even though supplier names never reach the 200-element
   * threshold that activates it.
   */
  function SequenceMatcher(a, b) {
    this.a = a;
    this.b = b;
    this.b2j = Object.create(null);
    this.bJunk = Object.create(null);
    this._chainB();
  }

  SequenceMatcher.prototype._chainB = function () {
    var b = this.b, b2j = this.b2j, i;
    for (i = 0; i < b.length; i++) {
      var ch = b[i];
      if (b2j[ch] === undefined) b2j[ch] = [];
      b2j[ch].push(i);
    }
    // autojunk: for b of 200+ elements, treat elements appearing in more than
    // 1% of positions as popular and exclude them from the index.
    var n = b.length;
    if (n >= 200) {
      var ntest = Math.floor(n / 100) + 1;
      for (var key in b2j) {
        if (b2j[key].length > ntest) {
          this.bJunk[key] = true;
          delete b2j[key];
        }
      }
    }
  };

  SequenceMatcher.prototype.findLongestMatch = function (alo, ahi, blo, bhi) {
    var a = this.a, b = this.b, b2j = this.b2j;
    var besti = alo, bestj = blo, bestsize = 0;
    var j2len = Object.create(null), i, j;

    for (i = alo; i < ahi; i++) {
      var newj2len = Object.create(null);
      var idxs = b2j[a[i]];
      if (idxs) {
        for (var k = 0; k < idxs.length; k++) {
          j = idxs[k];
          if (j < blo) continue;
          if (j >= bhi) break;
          var kk = (j2len[j - 1] || 0) + 1;
          newj2len[j] = kk;
          if (kk > bestsize) { besti = i - kk + 1; bestj = j - kk + 1; bestsize = kk; }
        }
      }
      j2len = newj2len;
    }

    // Extend the match with popular/junk elements on either side.
    while (besti > alo && bestj > blo && !this.bJunk[b[bestj - 1]] &&
      a[besti - 1] === b[bestj - 1]) {
      besti--; bestj--; bestsize++;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi &&
      !this.bJunk[b[bestj + bestsize]] &&
      a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize++;
    }
    while (besti > alo && bestj > blo && this.bJunk[b[bestj - 1]] &&
      a[besti - 1] === b[bestj - 1]) {
      besti--; bestj--; bestsize++;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi &&
      this.bJunk[b[bestj + bestsize]] &&
      a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize++;
    }
    return [besti, bestj, bestsize];
  };

  SequenceMatcher.prototype.ratio = function () {
    var total = this.a.length + this.b.length;
    if (total === 0) return 1.0;
    var matches = 0;
    var queue = [[0, this.a.length, 0, this.b.length]];
    while (queue.length) {
      var q = queue.pop();
      var alo = q[0], ahi = q[1], blo = q[2], bhi = q[3];
      var x = this.findLongestMatch(alo, ahi, blo, bhi);
      var i = x[0], j = x[1], size = x[2];
      if (size) {
        matches += size;
        if (alo < i && blo < j) queue.push([alo, i, blo, j]);
        if (i + size < ahi && j + size < bhi) queue.push([i + size, ahi, j + size, bhi]);
      }
    }
    return (2.0 * matches) / total;
  };

  function nameRatio(a, b) {
    if (!a && !b) return 1.0;
    return new SequenceMatcher(a, b).ratio();
  }

  /* --------------------------------------------------------- sheet plumbing */

  function hdrText(c) {
    return String(c === null || c === undefined ? "" : c)
      .trim().toLowerCase().replace(/\s+/g, " ");
  }

  /**
   * The header row is not fixed: state sheets carry it on row 2, the ISD sheet
   * on row 1. Score the first `scan` rows by how many known fields they expose
   * and take the best. Ties go to the earliest row, matching Python's `>`.
   */
  function findHeaderRow(aoa, scan) {
    scan = scan || 10;
    var best = 0, bestHits = -1;
    var limit = Math.min(scan, aoa.length);
    for (var i = 0; i < limit; i++) {
      var joined = (aoa[i] || []).map(hdrText).join(" | ");
      var hits = 0;
      for (var field in FIELD_PATTERNS) {
        var pats = FIELD_PATTERNS[field];
        for (var p = 0; p < pats.length; p++) {
          if (joined.indexOf(pats[p]) !== -1) { hits++; break; }
        }
      }
      if (hits > bestHits) { best = i; bestHits = hits; }
    }
    return { row: best, hits: bestHits };
  }

  /** Mirror pandas' column naming: blanks become Unnamed: N, repeats get .1 */
  function headerNames(rawRow, width) {
    var names = [], seen = Object.create(null);
    for (var i = 0; i < width; i++) {
      var raw = rawRow ? rawRow[i] : null;
      var name = (raw === null || raw === undefined || String(raw).trim() === "")
        ? "Unnamed: " + i
        : String(raw).trim();
      if (seen[name] === undefined) { seen[name] = 0; } else { seen[name] += 1; name = name + "." + seen[name]; }
      names.push(name);
    }
    return names;
  }

  function mapColumns(names) {
    var lower = names.map(hdrText);
    var mapping = {}, taken = Object.create(null);
    for (var field in FIELD_PATTERNS) {
      var pats = FIELD_PATTERNS[field];
      for (var p = 0; p < pats.length; p++) {
        var hit = -1;
        for (var c = 0; c < names.length; c++) {
          if (taken[c]) continue;
          if (lower[c].indexOf(pats[p]) !== -1) { hit = c; break; }
        }
        if (hit >= 0) { mapping[field] = hit; taken[hit] = true; break; }
      }
    }
    var unmapped = [];
    for (var k = 0; k < names.length; k++) {
      if (!taken[k] && names[k].indexOf("Unnamed") !== 0) unmapped.push(names[k]);
    }
    return { mapping: mapping, unmapped: unmapped, names: names };
  }

  function sheetToAoa(XLSX, ws) {
    return XLSX.utils.sheet_to_json(ws, {
      header: 1, raw: true, defval: null, blankrows: false,
    });
  }

  function allBlank(row) {
    if (!row) return true;
    for (var i = 0; i < row.length; i++) {
      var v = row[i];
      if (v !== null && v !== undefined && String(v).trim() !== "") return false;
    }
    return true;
  }

  function str(v) {
    return String(v === null || v === undefined ? "" : v).trim();
  }

  /* ---------------------------------------------------------- portal reader */

  /**
   * Read a GSTR-2A / 2B / IMS workbook into normalised rate-line rows.
   *
   * @param {object} XLSX      the SheetJS namespace
   * @param {object} wb        a workbook read with { raw: true }
   * @param {object} opts      { label, source }  source is '2A' | '2B' | 'IMS'
   */
  function parsePortalWorkbook(XLSX, wb, opts) {
    opts = opts || {};
    var label = opts.label || "";
    var source = opts.source || "2A";
    var rows = [], report = [];

    for (var s = 0; s < wb.SheetNames.length; s++) {
      var sheet = wb.SheetNames[s];
      var aoa = sheetToAoa(XLSX, wb.Sheets[sheet]);
      if (!aoa.length) continue;

      var hdr = findHeaderRow(aoa, 10).row;
      var width = 0;
      for (var w = 0; w < aoa.length; w++) width = Math.max(width, (aoa[w] || []).length);
      var names = headerNames(aoa[hdr], width);
      var mapped = mapColumns(names);
      var mapping = mapped.mapping;

      var missing = REQUIRED_FIELDS.filter(function (f) { return mapping[f] === undefined; });
      if (missing.length) {
        report.push({ sheet: sheet, status: "SKIPPED missing " + missing.join(", "), rows: 0 });
        continue;
      }

      var g = function (row, f) {
        return mapping[f] === undefined ? null : row[mapping[f]];
      };

      var kept = 0;
      for (var r = hdr + 1; r < aoa.length; r++) {
        var row = aoa[r];
        if (allBlank(row)) continue;

        var invNo = str(g(row, "invoice_no"));
        if (invNo === "" || invNo.toLowerCase() === "nan") continue;

        var docType = str(g(row, "doc_type")).toUpperCase();
        var rec = {
          source: source,
          _srcLabel: label,
          sheet: sheet,
          our_gstin: normGstin(g(row, "my_gstin")),
          return_period: str(g(row, "return_period")),
          supplier_gstin: normGstin(g(row, "supplier_gstin")),
          supplier_name: str(g(row, "supplier_name")),
          supplier_pan_raw: str(g(row, "supplier_pan")).toUpperCase(),
          doc_type: docType,
          section: str(g(row, "section")).toUpperCase(),
          invoice_no: invNo,
          invoice_date: toDate(g(row, "invoice_date")),
          taxable_value: toNum(g(row, "taxable_value")),
          tax_rate: str(g(row, "tax_rate")),
          invoice_value: toNum(g(row, "invoice_value")),
          rcm: str(g(row, "rcm")),
          gstr3b_status: mapping.gstr3b_status === undefined
            ? "(not reported)" : str(g(row, "gstr3b_status")),
          gstr1_status: str(g(row, "gstr1_status")),
          filing_period: str(g(row, "filing_period")),
          filing_date: str(g(row, "filing_date")),
          orig_doc_no: str(g(row, "orig_doc_no")),
          amendment_type: str(g(row, "amendment_type")),
          gstin_cancelled: str(g(row, "cancel_date")),
          taxpayer_type: str(g(row, "taxpayer_type")),
        };
        for (var t = 0; t < TAX_FIELDS.length; t++) {
          rec[TAX_FIELDS[t]] = toNum(g(row, TAX_FIELDS[t]));
        }
        rec.total_tax = round2(rec.igst + rec.cgst + rec.sgst + rec.cess);

        /* A supplier credit note REDUCES available credit. Portals report the
         * amount positive with the direction carried in Doc Type, so the sign
         * has to be applied here or credit notes inflate ITC. */
        if (docType.indexOf("CREDIT") !== -1) {
          rec.igst = -rec.igst; rec.cgst = -rec.cgst;
          rec.sgst = -rec.sgst; rec.cess = -rec.cess;
          rec.taxable_value = -rec.taxable_value;
          rec.invoice_value = -rec.invoice_value;
          rec.total_tax = -rec.total_tax;
        }

        rec._inv = normInv(rec.invoice_no);
        rec._name = normName(rec.supplier_name);
        rec._pan = panOf(rec.supplier_gstin, rec.supplier_pan_raw);
        rows.push(rec);
        kept++;
      }

      var rep = {
        sheet: sheet, status: "read", rows: kept, headerRow: hdr + 1,
        unmapped: mapped.unmapped.slice(0, 5).join(", "), fields: {},
      };
      for (var f2 in mapping) rep.fields[f2] = names[mapping[f2]];
      report.push(rep);
    }

    return { rows: rows, mapping: report, label: label, source: source };
  }

  /* --------------------------------------------------- rate-line collapsing */

  function aggKey(r) {
    return r.our_gstin + "\u0001" + r.supplier_gstin + "\u0001" + r.section + "\u0001" + r._inv;
  }

  /**
   * Collapse portal rate lines into one row per invoice.
   *
   * GSTR-2A reports B2B RATE-WISE: an invoice spanning 5% and 18% appears as
   * two rows. Books hold one row for the whole invoice. Matching line-by-line
   * therefore (a) compares the book invoice against a single rate line so the
   * amount looks wrong, and (b) leaves the other rate line unmatched, inflating
   * "In 2A only". Measured: FY25-26 38,803 rate lines -> 34,553 invoices, 3,219
   * of them multi-rate.
   *
   * Section is part of the key so a B2BA amendment stays separate from the B2B
   * it amends - resolveAmendments runs next and needs both. Dropping section
   * from the key collides 82 amendment/original pairs.
   *
   * Output is sorted by the group key, reproducing pandas' groupby(sort=True).
   * Order is load bearing: the matcher consumes the first eligible candidate,
   * so a different order would match a different portal row.
   */
  function aggregateInvoices(rows) {
    var groups = new Map();
    for (var i = 0; i < rows.length; i++) {
      var k = aggKey(rows[i]);
      var g = groups.get(k);
      if (!g) { g = { key: k, first: rows[i], lines: [] }; groups.set(k, g); }
      g.lines.push(rows[i]);
    }

    var keys = Array.from(groups.keys()).sort();
    var out = [];
    for (var j = 0; j < keys.length; j++) {
      var grp = groups.get(keys[j]);
      var base = grp.first;
      var inv = {};
      for (var p in base) inv[p] = base[p];      // "first" for non-summed fields
      inv.taxable_value = 0; inv.invoice_value = 0; inv.total_tax = 0;
      inv.igst = 0; inv.cgst = 0; inv.sgst = 0; inv.cess = 0;

      var rates = Object.create(null);
      for (var L = 0; L < grp.lines.length; L++) {
        var ln = grp.lines[L];
        inv.taxable_value += ln.taxable_value;
        inv.invoice_value += ln.invoice_value;
        inv.total_tax += ln.total_tax;
        inv.igst += ln.igst; inv.cgst += ln.cgst;
        inv.sgst += ln.sgst; inv.cess += ln.cess;
        var rt = String(ln.tax_rate);
        if (rt !== "" && rt !== "nan") rates[rt] = true;
      }
      inv.taxable_value = round2(inv.taxable_value);
      inv.invoice_value = round2(inv.invoice_value);
      inv.total_tax = round2(inv.total_tax);
      inv.igst = round2(inv.igst); inv.cgst = round2(inv.cgst);
      inv.sgst = round2(inv.sgst); inv.cess = round2(inv.cess);
      inv.rate_lines = grp.lines.length;
      inv.rates = Object.keys(rates).sort().join(", ");
      out.push(inv);
    }
    return out;
  }

  /* --------------------------------------------------------------- QRMP 3B */

  function periodYm(s) {
    var parts = String(s || "").trim().split(/\s+/);
    if (parts.length !== 2) return null;
    var mi = MONTHS.indexOf(parts[0]);
    var yr = parseInt(parts[1], 10);
    if (mi < 0 || !isFinite(yr)) return null;
    return { y: yr, m: mi + 1 };
  }

  /**
   * A QRMP supplier files GSTR-3B once a QUARTER, not monthly.
   *
   * For the first two months of a quarter the portal reports 3B as "Not Filed"
   * even though the quarter's return is filed in the third month. Treating
   * those as unfiled overstates Rule 37A exposure badly - the data confirms it
   * exactly: of 2,094 "Not Filed" rows, NONE fall in March, June, September or
   * December.
   *
   * Rule: if a supplier has ANY filed 3B within a calendar quarter, every
   * invoice of that supplier in that quarter counts as covered. Rescued 1,882
   * rows / 70.8 lakh, leaving 212 rows / 19.2 lakh genuinely unfiled.
   *
   * Informational only - nothing downstream reads it. See decision 3.
   */
  function applyQrmpRule(invoices) {
    var filedQ = Object.create(null), i, ym, q;
    for (i = 0; i < invoices.length; i++) {
      ym = periodYm(invoices[i].return_period);
      q = ym ? ym.y + "Q" + Math.floor((ym.m - 1) / 3) : "";
      invoices[i]._q = q;
      var st = String(invoices[i].gstr3b_status || "").trim().toLowerCase();
      invoices[i]._filed3b = st.indexOf("not filed") !== 0;
      if (invoices[i]._filed3b) filedQ[invoices[i].supplier_gstin + "\u0001" + q] = true;
    }
    var rescued = 0;
    for (i = 0; i < invoices.length; i++) {
      var inv = invoices[i];
      if (inv._filed3b) {
        inv.gstr3b_effective = "Filed"; inv.gstr3b_basis = "";
      } else if (filedQ[inv.supplier_gstin + "\u0001" + inv._q]) {
        inv.gstr3b_effective = "Filed";
        inv.gstr3b_basis = "Quarterly filer - quarter 3B filed";
        rescued++;
      } else {
        inv.gstr3b_effective = "Not Filed"; inv.gstr3b_basis = "";
      }
      delete inv._q; delete inv._filed3b;
    }
    return { invoices: invoices, rescued: rescued };
  }

  /* ----------------------------------------------------------- amendments */

  /**
   * B2BA/CDNA supersede the B2B/CDN row they amend. Drop the original.
   *
   * Matched on (supplier GSTIN, normalised ORIGINAL document number). Without
   * this the same invoice matches twice - once at its original value and once
   * amended - and the totals cannot tie.
   */
  function resolveAmendments(invoices) {
    var keys = Object.create(null), i, isAmd = [];
    for (i = 0; i < invoices.length; i++) {
      var amd = /A$/.test(invoices[i].section || "");
      isAmd.push(amd);
      if (amd) {
        var oi = normInv(invoices[i].orig_doc_no);
        if (oi) keys[invoices[i].supplier_gstin + "\u0001" + oi] = true;
      }
    }
    var kept = [], superseded = [];
    for (i = 0; i < invoices.length; i++) {
      if (!isAmd[i] && keys[invoices[i].supplier_gstin + "\u0001" + invoices[i]._inv]) {
        superseded.push(invoices[i]);
      } else {
        kept.push(invoices[i]);
      }
    }
    return { kept: kept, superseded: superseded };
  }

  /* -------------------------------------------------------- books reader */

  /**
   * Read the step-1 Tally export. Only the Consolidated sheet is used - the
   * per-state sheets are the same rows split for presentation.
   */
  function parseBooksWorkbook(XLSX, wb, opts) {
    opts = opts || {};
    var ownPan = opts.ownPan || DEFAULTS.ownPan;
    var sheetName = opts.sheet || "Consolidated";
    if (wb.SheetNames.indexOf(sheetName) === -1) {
      // Fall back to the first sheet carrying a Voucher Date column.
      sheetName = wb.SheetNames.find(function (n) {
        var a = sheetToAoa(XLSX, wb.Sheets[n]);
        return a.length && (a[0] || []).some(function (c) {
          return hdrText(c).indexOf("voucher date") !== -1;
        });
      }) || wb.SheetNames[0];
    }

    var aoa = sheetToAoa(XLSX, wb.Sheets[sheetName]);
    var warnings = [];
    if (!aoa.length) return { rows: [], warnings: ["books sheet is empty"], sheet: sheetName };

    var width = 0;
    for (var w = 0; w < aoa.length; w++) width = Math.max(width, (aoa[w] || []).length);
    var names = headerNames(aoa[0], width);
    var idx = Object.create(null);
    for (var c = 0; c < names.length; c++) idx[names[c]] = c;

    var col = function (row, name) {
      return idx[name] === undefined ? null : row[idx[name]];
    };
    var hasSupplierInvDate = idx["Supplier Inv Date"] !== undefined;
    if (!hasSupplierInvDate) {
      warnings.push("books file has no 'Supplier Inv Date' - falling back to " +
        "voucher date. Regenerate with the current step-1 script.");
    }

    var rows = [];
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r];
      if (allBlank(row)) continue;

      var voucherDate = toDate(col(row, "Voucher Date"));
      var supplierInvDate = hasSupplierInvDate ? toDate(col(row, "Supplier Inv Date")) : null;

      var rec = {
        voucher_date: voucherDate,
        voucher_type: str(col(row, "Voucher Type")),
        voucher_no: str(col(row, "Voucher No.")),
        supplier_name: str(col(row, "Supplier Name")),
        supplier_gstin_raw: str(col(row, "Supplier GSTIN")),
        supplier_reg_type: str(col(row, "Supplier Reg Type")),
        supplier_pan_raw: str(col(row, "Supplier PAN")),
        supplier_inv_no: str(col(row, "Supplier Inv No")),
        supplier_inv_date: supplierInvDate,
        taxable_value: toNum(col(row, "Taxable Value")),
        cgst: toNum(col(row, "CGST")),
        sgst: toNum(col(row, "SGST / UTGST")),
        igst: toNum(col(row, "IGST")),
        cess: toNum(col(row, "CESS")),
        isd: toNum(col(row, "ISD")),
        reversal_17_5: toNum(col(row, "Reversal 17(5)")),
        other_gst: toNum(col(row, "Other GST")),
        total_tax: toNum(col(row, "Total Tax")),
        total_invoice_value: toNum(col(row, "Total Invoice Value")),
        our_gstin: str(col(row, "Our GSTIN")),
        state: str(col(row, "State")),
        multi_state_vch: str(col(row, "Multi-State Vch")),
        narration: str(col(row, "Narration")),
      };

      /* 2A reports the SUPPLIER's invoice date; our booking date differs across
       * period ends, so the supplier's date is authoritative wherever present. */
      rec._date = rec.supplier_inv_date || rec.voucher_date;
      rec._inv = normInv(rec.supplier_inv_no);
      rec._gstin = normGstin(rec.supplier_gstin_raw);
      rec._name = normName(rec.supplier_name);
      rec._pan = panOf(rec.supplier_gstin_raw, rec.supplier_pan_raw);

      var vt = rec.voucher_type.toLowerCase();
      rec._kind = "Other";
      if (vt.indexOf("purchase") !== -1) rec._kind = "Purchase";
      if (vt.indexOf("journal") !== -1) rec._kind = "Journal";
      if (vt.indexOf("debit note") !== -1) rec._kind = "Debit Note";
      if (vt.indexOf("credit note") !== -1) rec._kind = "Credit Note";

      rec._interbranch = !!(ownPan && rec._gstin && rec._gstin.indexOf(ownPan) !== -1);

      /* WHAT IS OUT OF SCOPE FOR 2A IS DECIDED BY THE GST BUCKET, NOT THE
       * VOUCHER TYPE. "GST Journal" is how commission/service invoices (Swiggy,
       * Zomato) get booked, and 95.2% of those rows - 12,761 of 13,404,
       * 9.39 crore of tax - have their invoice number present in 2A. Excluding
       * by voucher type produced 23,018 false "In 2A only" rows worth
       * 12.78 crore. Genuinely outside 2A is only credit that is
       * ISD-distributed or a 17(5) reversal: 200 rows, 1.00 crore. */
      var ordinary = Math.abs(rec.cgst + rec.sgst + rec.igst + rec.cess);
      var special = Math.abs(rec.isd + rec.reversal_17_5 + rec.other_gst);
      rec._not_2a = ordinary < 0.01 && special >= 0.01;

      rows.push(rec);
    }
    return { rows: rows, warnings: warnings, sheet: sheetName };
  }

  /* ----------------------------------------------------------- the matcher */

  function pushIdx(map, key, i) {
    var a = map.get(key);
    if (a) { a.push(i); } else { map.set(key, [i]); }
  }

  /**
   * Match book rows against the portal pool. Each book row and each portal row
   * is consumed at most once. Candidate lists are held in insertion order,
   * which is the aggregated pool's sort order, so the first eligible candidate
   * is the same one the Python picks.
   */
  function matchBooks(books, pool, opts) {
    opts = opts || {};
    var tol = opts.tolerance === undefined ? DEFAULTS.tolerance : opts.tolerance;
    var minSim = opts.nameSimilarity === undefined ? DEFAULTS.nameSimilarity : opts.nameSimilarity;
    var other = opts.otherYearPool || null;

    var byGstinInv = new Map(), byPanInv = new Map(), byInv = new Map(), byGstinDate = new Map();
    var i;
    for (i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (p.supplier_gstin && p._inv) pushIdx(byGstinInv, p.supplier_gstin + "\u0001" + p._inv, i);
      if (p._pan && p._inv) pushIdx(byPanInv, p._pan + "\u0001" + p._inv, i);
      if (p._inv) pushIdx(byInv, p._inv, i);
      if (p.supplier_gstin && p.invoice_date) {
        pushIdx(byGstinDate, p.supplier_gstin + "\u0001" + p.invoice_date.key, i);
      }
    }

    // Adjacent-year lookup: label only, first occurrence wins, never consumed.
    var otherIdx = new Map();
    if (other && other.length) {
      for (i = 0; i < other.length; i++) {
        var k = other[i]._pan + "\u0001" + other[i]._inv;
        if (!otherIdx.has(k)) otherIdx.set(k, other[i]);
      }
    }

    var used = new Uint8Array(pool.length);
    var usedCount = 0;
    var results = [];

    /* Replicates Python's inner `scan`. When badStatus is supplied (tiers 1 and
     * 2P) the FIRST unused candidate is taken regardless of amount, and the
     * amount decides only the label. When it is not (tiers 3 and 5) a candidate
     * outside tolerance is skipped entirely. */
    function scan(cands, okStatus, badStatus, bookTax) {
      if (!cands) return null;
      for (var c = 0; c < cands.length; c++) {
        var ix = cands[c];
        if (used[ix]) continue;
        var d = Math.abs(pool[ix].total_tax - bookTax);
        if (d > tol && badStatus === null) continue;
        return { i: ix, status: d <= tol ? okStatus : (badStatus || okStatus) };
      }
      return null;
    }

    for (var b = 0; b < books.length; b++) {
      var bk = books[b];
      var hit = null, tier = "";

      if (bk._gstin && bk._inv) {
        hit = scan(byGstinInv.get(bk._gstin + "\u0001" + bk._inv),
          "Matched", "Matched - amount differs", bk.total_tax);
        if (hit) tier = "1";
      }
      if (!hit && bk._pan && bk._inv) {
        hit = scan(byPanInv.get(bk._pan + "\u0001" + bk._inv),
          "Matched on PAN - GSTIN differs by state",
          "Matched on PAN - amount differs", bk.total_tax);
        if (hit) tier = "2P";
      }
      if (!hit && !bk._gstin && bk._inv) {
        hit = scan(byInv.get(bk._inv), "Matched - GSTIN missing in books", null, bk.total_tax);
        if (hit) tier = "3";
      }
      if (!hit && bk._inv && bk._name) {
        var cands = byInv.get(bk._inv);
        if (cands) {
          for (var c4 = 0; c4 < cands.length; c4++) {
            var ix4 = cands[c4];
            if (used[ix4]) continue;
            var sim = nameRatio(bk._name, pool[ix4]._name);
            if (sim >= minSim && Math.abs(pool[ix4].total_tax - bk.total_tax) <= tol) {
              hit = { i: ix4, status: "Probable - verify (" + sim.toFixed(2) + ")" };
              tier = "4";
              break;
            }
          }
        }
      }
      if (!hit && bk._gstin && bk._date) {
        hit = scan(byGstinDate.get(bk._gstin + "\u0001" + bk._date.key),
          "Probable - invoice no differs", null, bk.total_tax);
        if (hit) tier = "5";
      }

      var out = { book: bk, match_tier: "", portal: null };
      if (!hit) {
        var o = bk._inv ? otherIdx.get(bk._pan + "\u0001" + bk._inv) : null;
        out.reco_status = o
          ? "Timing - found in " + (o._srcLabel || "other year") + " 2A (" + o.return_period + ")"
          : "In books only - not in 2A";
        out.books_fy = fyOf(bk._date);
        out.portal_fy = "";
        out.tax_diff = null;
        out.date_gap_days = null;
        out.itc_available = "";
        out.timing = !!o;
        out.timing_match = o || null;
      } else {
        used[hit.i] = 1; usedCount++;
        var m = pool[hit.i];
        var bfy = fyOf(bk._date), afy = fyOf(m.invoice_date);
        var status = hit.status;
        if (bfy && afy && bfy !== afy) status += " | cross-year " + bfy + " vs " + afy;
        out.match_tier = tier;
        out.portal = m;
        out.reco_status = status;
        out.books_fy = bfy;
        out.portal_fy = afy;
        out.tax_diff = round2(bk.total_tax - m.total_tax);
        out.date_gap_days = (bk._date && m.invoice_date)
          ? (m.invoice_date.num - bk._date.num) : null;
        /* 3B status is informational - see decision 3. A match rests on invoice
         * evidence, never on a filing status the portal reports unreliably. */
        out.itc_available = "Yes";
        out.timing = false;
      }
      results.push(out);
    }

    return { results: results, used: used, usedCount: usedCount };
  }

  /* --------------------------------------------------------------- buckets */

  /**
   * Bucket totals split by tax head. A single blended figure is never enough to
   * post a 3B position from - IGST and CGST/SGST reverse differently.
   *
   * The book side carries three heads beyond the ordinary four: ISD, 17(5)
   * reversal and Other GST. They are NOT ordinary ITC, but Tally's "Total Tax"
   * includes them, so omitting them leaves the heads short of the total. On the
   * real data that gap is 1.24 lakh for FY25-26 in-scope, and the whole of the
   * 9.55 lakh out-of-scope bucket for FY26-27 - which by definition has no
   * ordinary tax at all. Reporting them separately is what makes the split
   * reconcile and shows the reader that the money is ISD, not credit.
   */
  function headTotals(list, get) {
    var t = { igst: 0, cgst: 0, sgst: 0, cess: 0, isd: 0, reversal_17_5: 0, other_gst: 0, total: 0 };
    for (var i = 0; i < list.length; i++) {
      var r = get(list[i]);
      t.igst += r.igst || 0; t.cgst += r.cgst || 0;
      t.sgst += r.sgst || 0; t.cess += r.cess || 0;
      t.isd += r.isd || 0;
      t.reversal_17_5 += r.reversal_17_5 || 0;
      t.other_gst += r.other_gst || 0;
      t.total += r.total_tax || 0;
    }
    for (var k in t) t[k] = round2(t[k]);
    t.ordinary = round2(t.igst + t.cgst + t.sgst + t.cess);
    t.special = round2(t.isd + t.reversal_17_5 + t.other_gst);
    return t;
  }

  function sumTax(list, pick) {
    var s = 0;
    for (var i = 0; i < list.length; i++) s += pick(list[i]);
    return round2(s);
  }

  var bookTax = function (r) { return r.book ? r.book.total_tax : r.total_tax; };
  var bookHeads = function (r) { return r.book || r; };
  var portalHeads = function (r) { return r; };

  /**
   * Run the full pipeline for one financial year.
   *
   * @param books  rows from parseBooksWorkbook
   * @param pool   invoices from aggregateInvoices -> applyQrmpRule -> resolveAmendments
   * @param opts   { otherYearPool, tolerance, nameSimilarity, ownPan, label,
   *                 superseded }
   */
  function reconcile(books, pool, opts) {
    opts = opts || {};

    /* INTER-BRANCH IS MATCHED, NOT EXCLUDED. Excluding it on the books side
     * while leaving the same invoices in the portal pool was asymmetric: 1,571
     * book rows (1.56 crore) were held back while their 1,577 counterpart
     * invoices (1.59 crore) fell straight into "In 2A only" - 55% of that pile
     * was the company billing itself. They are matched like any other supply
     * and simply TAGGED so they can be filtered. */
    var outOfScope = [], matchable = [];
    for (var i = 0; i < books.length; i++) {
      (books[i]._not_2a ? outOfScope : matchable).push(books[i]);
    }

    var m = matchBooks(matchable, pool, opts);
    var results = m.results;

    var matched = [], booksOnly = [], timing = [], atRisk = [];
    for (i = 0; i < results.length; i++) {
      if (results[i].match_tier !== "") { matched.push(results[i]); }
      else {
        booksOnly.push(results[i]);
        (results[i].timing ? timing : atRisk).push(results[i]);
      }
    }

    var portalOnlyAll = [];
    for (i = 0; i < pool.length; i++) if (!m.used[i]) portalOnlyAll.push(pool[i]);

    var portalOnly = [], rcmOnly = [], isdOnly = [];
    for (i = 0; i < portalOnlyAll.length; i++) {
      var p = portalOnlyAll[i];
      if (String(p.sheet).toUpperCase() === "ISD") { isdOnly.push(p); continue; }
      /* REVERSE-CHARGE supplies are reported by the supplier but the tax is
       * paid by US, so they are never booked as an ordinary purchase credit.
       * Leaving them in "In 2A only" presents them as unclaimed ITC, which they
       * are not. */
      var rcm = String(p.rcm || "").trim().toUpperCase();
      if (rcm === "Y" || rcm === "YES" || rcm === "TRUE") { rcmOnly.push(p); continue; }
      portalOnly.push(p);
    }

    /* WHY is each leftover portal row unmatched? Without this the pile reads as
     * one undifferentiated number when most of it is explainable. The PAN set is
     * taken from ALL book rows, including the out-of-scope ones. */
    var knownPans = Object.create(null);
    for (i = 0; i < books.length; i++) if (books[i]._pan) knownPans[books[i]._pan] = true;

    var cnOnly = [], partyKnown = [], partyUnknown = [];
    for (i = 0; i < portalOnly.length; i++) {
      var q = portalOnly[i];
      if (String(q.doc_type || "").indexOf("CREDIT") !== -1) {
        q.why_unmatched = "Supplier CREDIT NOTE not booked - reduces your ITC";
        cnOnly.push(q);
      } else if (knownPans[q._pan]) {
        q.why_unmatched = "Party IS in books - invoice reference or period differs";
        partyKnown.push(q);
      } else {
        q.why_unmatched = "Party NOT in books - genuinely unbooked";
        partyUnknown.push(q);
      }
    }

    var interBranchMatched = matched.filter(function (r) { return r.book._interbranch; });

    var inScopeTax = sumTax(results, bookTax);
    var matchedTax = sumTax(matched, bookTax);
    var timingTax = sumTax(timing, bookTax);
    var atRiskTax = sumTax(atRisk, bookTax);
    var outOfScopeTax = sumTax(outOfScope, function (r) { return r.total_tax; });
    var booksTotalTax = sumTax(books, function (r) { return r.total_tax; });

    /* Two self-checks. The Python only prints "*** BROKEN ***"; here a failure
     * is returned so the caller can refuse to persist a run, because a broken
     * identity means the ITC numbers are wrong. */
    var identity = {
      inScopeExpected: inScopeTax,
      inScopeActual: round2(matchedTax + timingTax + atRiskTax),
      booksExpected: booksTotalTax,
      booksActual: round2(inScopeTax + outOfScopeTax),
      portalUsed: m.usedCount,
      matchedCount: matched.length,
    };
    identity.inScopeOk = Math.abs(identity.inScopeExpected - identity.inScopeActual) <= 0.01;
    identity.booksOk = Math.abs(identity.booksExpected - identity.booksActual) <= 0.01;
    identity.noDoubleMatchOk = m.usedCount === matched.length;
    identity.ok = identity.inScopeOk && identity.booksOk && identity.noDoubleMatchOk;

    var overview = [
      { id: "1", item: "Book entries in scope", count: results.length, tax: inScopeTax,
        meaning: "purchases / journals / notes carrying ordinary GST" },
      { id: "2", item: "MATCHED - found in 2A", count: matched.length, tax: matchedTax,
        meaning: "ITC available and supported" },
      { id: "3", item: "  of which inter-company", count: interBranchMatched.length,
        tax: sumTax(interBranchMatched, bookTax),
        meaning: "own branches billing each other - matched, not an issue" },
      { id: "4", item: "TIMING - in the other year's 2A", count: timing.length, tax: timingTax,
        meaning: "supplier filed in a different year - no action" },
      { id: "5", item: "AT RISK - in books, NOT in 2A", count: atRisk.length, tax: atRiskTax,
        meaning: "ITC claimed but supplier has not reported it - s.16(2)(aa) exposure. CHASE THE SUPPLIER." },
      { id: "6", item: "In 2A, NOT in books", count: portalOnly.length,
        tax: sumTax(portalOnly, function (r) { return r.total_tax; }),
        meaning: "see 'Why unmatched' column - split below" },
      { id: "6a", item: "   supplier CREDIT NOTES not booked", count: cnOnly.length,
        tax: sumTax(cnOnly, function (r) { return r.total_tax; }),
        meaning: "negative - you have claimed ITC the supplier later credited. LIABILITY, not opportunity." },
      { id: "6b", item: "   party in books, reference/period differs", count: partyKnown.length,
        tax: sumTax(partyKnown, function (r) { return r.total_tax; }),
        meaning: "same supplier already dealt with - usually timing or a different invoice reference. Verify, do not re-book." },
      { id: "6c", item: "   party NOT in books at all", count: partyUnknown.length,
        tax: sumTax(partyUnknown, function (r) { return r.total_tax; }),
        meaning: "the only genuinely unclaimed credit. CHECK AND BOOK." },
      { id: "6.5", item: "Reverse charge - in 2A, tax paid by us", count: rcmOnly.length,
        tax: sumTax(rcmOnly, function (r) { return r.total_tax; }),
        meaning: "supplier reports it, WE pay the tax - not ordinary ITC and not a gap. No action." },
      { id: "7", item: "Out of scope (ISD / 17(5) reversal)", count: outOfScope.length,
        tax: outOfScopeTax, meaning: "never appears in 2A - see ISD control" },
      { id: "8", item: "CHECK: 2 + 4 + 5 must equal 1", count: null,
        tax: identity.inScopeActual, meaning: "in-scope identity - must equal line 1 exactly" },
      { id: "9", item: "BOOKS TOTAL (1 + 7)", count: books.length, tax: booksTotalTax,
        meaning: "ties to the step-1 books workbook" },
    ];

    /* Every bucket by tax head. A single blended tax figure is never enough to
     * post a 3B position from - IGST and CGST/SGST reverse differently. */
    var byHead = {
      inScope: headTotals(results, bookHeads),
      matched: headTotals(matched, bookHeads),
      timing: headTotals(timing, bookHeads),
      atRisk: headTotals(atRisk, bookHeads),
      portalOnly: headTotals(portalOnly, portalHeads),
      creditNotes: headTotals(cnOnly, portalHeads),
      partyKnown: headTotals(partyKnown, portalHeads),
      partyUnknown: headTotals(partyUnknown, portalHeads),
      rcm: headTotals(rcmOnly, portalHeads),
      outOfScope: headTotals(outOfScope, portalHeads),
    };

    return {
      engineVersion: ENGINE_VERSION,
      label: opts.label || "",
      recoRows: results,
      matched: matched,
      timing: timing,
      atRisk: atRisk,
      outOfScope: outOfScope,
      portalOnly: portalOnly,
      creditNotes: cnOnly,
      partyKnown: partyKnown,
      partyUnknown: partyUnknown,
      rcmOnly: rcmOnly,
      isdOnly: isdOnly,
      interBranchMatched: interBranchMatched,
      superseded: opts.superseded || [],
      overview: overview,
      byHead: byHead,
      identity: identity,
      headline: {
        itcAvailable: matchedTax,
        itcAtRisk: atRiskTax,
        itcToReverse: round2(-sumTax(cnOnly, function (r) { return r.total_tax; })),
      },
    };
  }

  /* =========================================================================
   * STATUTORY OVERLAYS
   * Reconciling is only half the job. These test the matched credit against the
   * conditions that actually govern whether it can be kept. Every one of them
   * FLAGS FOR REVIEW and cites the provision relied on - none silently excludes
   * or reverses anything.
   * ====================================================================== */

  /**
   * s.16(4): ITC on an invoice for a financial year cannot be taken after 30
   * November following the end of that year, or the furnishing of the annual
   * return, whichever is earlier. The 30 November limb is the one that binds in
   * practice, so that is what is computed; if the annual return is filed first,
   * the real date is earlier and the caller should say so.
   *
   * This is what makes "last year's invoice in the current year" actionable
   * rather than a label - a FY25-26 invoice surfacing in FY26-27's 2A is only
   * worth chasing while the window is open.
   */
  function sec164DueFor(fy) {
    var m = String(fy || "").match(/^FY(\d{4})-(\d{2})$/);
    if (!m) return null;
    return mkDate(+m[1] + 1, 11, 30);
  }

  var SEC_16_4_WARN_DAYS = 60;

  function sec164State(due, asOn) {
    if (!due || !asOn) return { state: "", days: null };
    var days = due.num - asOn.num;
    if (days < 0) return { state: "Expired", days: days };
    if (days <= SEC_16_4_WARN_DAYS) return { state: "Closing", days: days };
    return { state: "Open", days: days };
  }

  /* GST slabs since 22-Sep-2025 are 0 / 5 / 18 / 40. 12% and 28% were
   * withdrawn. Special rates (0.25% on diamonds, 1.5% and 3% on gold, 0.1% on
   * merchant exports) still exist, so only the two WITHDRAWN slabs are flagged -
   * flagging "anything not in the four" would bury the reader in false hits. */
  var RATE_REFORM_DATE = { y: 2025, m: 9, d: 22 };
  var WITHDRAWN_RATES = [12, 28];

  function parseRate(v) {
    var s = String(v === null || v === undefined ? "" : v).trim();
    if (!s) return null;
    var n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : null;
  }

  function rateFlag(rateStr, date) {
    if (!date) return "";
    var reform = mkDate(RATE_REFORM_DATE.y, RATE_REFORM_DATE.m, RATE_REFORM_DATE.d);
    if (date.num < reform.num) return "";
    var parts = String(rateStr || "").split(",");
    for (var i = 0; i < parts.length; i++) {
      var r = parseRate(parts[i]);
      if (r !== null && WITHDRAWN_RATES.indexOf(r) !== -1) {
        return r + "% slab was withdrawn on 22-Sep-2025 - query the invoice";
      }
    }
    return "";
  }

  /**
   * s.17(5) blocked credits, screened on narration and voucher type.
   *
   * DELIBERATELY CONSERVATIVE. This is a prompt to look, not a determination.
   * Three traps it is built to avoid, all of them measured on real data:
   *   - Supplier NAME is never screened. "Shree Narain Food Industries" is a
   *     supplier of stock-in-trade, not a blocked food expense.
   *   - BUYING is not DISPOSING. A bare "gift" keyword flagged 240 rows worth
   *     42.7 lakh that were "purchase of gift items" and "gift box 860 Pcs" -
   *     gift boxes bought to SELL. s.17(5)(h) blocks goods disposed of by way
   *     of gift or free sample, so the gift limb is scoped to disposal wording
   *     and skipped on Purchase vouchers entirely. Loss and write-off, which
   *     have no such ambiguity, stay as their own rule.
   *   - Clause (b)(i) is skipped on Purchase vouchers. Where the inward supply
   *     of food is used to make an outward taxable supply of the same category
   *     the proviso to (b) restores the credit, and for a food business that is
   *     most of the ledger. Flagging it would bury the real hits.
   *
   * Keywords are matched with a word boundary at the START only, so "ltc" does
   * not fire inside "multcolour" while "distribut" still catches "distributed".
   * Override `rules` to tune per client.
   */
  var BLOCKED_RULES = [
    { clause: "17(5)(a)", label: "Motor vehicle (<=13 seats)",
      words: ["motor car", "motor vehicle", "car purchase", "two wheeler", "scooter", "motorcycle"] },
    { clause: "17(5)(aa)/(ab)", label: "Vessel / aircraft, or its insurance & repair",
      words: ["vessel", "aircraft", "vehicle insurance", "car insurance", "vehicle servicing", "car service"] },
    { clause: "17(5)(b)(i)", label: "Food, beverage, catering, beauty or health service",
      words: ["outdoor catering", "catering", "restaurant bill", "food and beverage",
        "beauty treatment", "cosmetic surgery", "plastic surgery"],
      skipKinds: ["Purchase"] },
    { clause: "17(5)(b)(ii)", label: "Club or health & fitness centre membership",
      words: ["club membership", "gym", "fitness centre", "fitness center", "health club"] },
    { clause: "17(5)(b)(iii)", label: "Employee vacation travel benefit",
      words: ["leave travel", "ltc", "home travel concession"] },
    { clause: "17(5)(c)/(d)", label: "Works contract / construction of immovable property",
      words: ["works contract", "building construction", "civil work", "construction of building"] },
    { clause: "17(5)(fa)", label: "CSR expenditure",
      words: ["csr", "corporate social responsibility"] },
    { clause: "17(5)(g)", label: "Personal consumption",
      words: ["personal use", "personal consumption"] },
    { clause: "17(5)(h)", label: "Goods lost, stolen, destroyed or written off",
      words: ["goods lost", "goods stolen", "stock lost", "stock stolen",
        "goods destroyed", "stock destroyed", "goods written off",
        "stock written off", "inventory written off", "stock write off",
        "damaged stock", "expired stock", "breakage", "shrinkage"] },
    { clause: "17(5)(h)", label: "Goods disposed of as gift or free sample",
      /* Scoped to DISPOSAL wording and skipped on Purchase vouchers - buying
       * gift items to resell is stock-in-trade, not a blocked credit. */
      words: ["free sample", "gifted", "as gift", "gift distribut",
        "distributed as gift", "complimentary", "staff gift", "customer gift",
        "gift to "],
      skipKinds: ["Purchase"] },
  ];

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* Compiled lazily and cached on the rule so a 31k-row ledger does not rebuild
   * the same regexes 31,000 times. */
  function ruleRegexes(rule) {
    if (!rule._re) {
      rule._re = rule.words.map(function (w) {
        return { word: w, re: new RegExp("\\b" + escapeRe(w), "i") };
      });
    }
    return rule._re;
  }

  function screenBlocked(book, rules) {
    rules = rules || BLOCKED_RULES;
    var hay = (book.narration || "") + " " + (book.voucher_type || "");
    if (!hay.trim()) return null;
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.skipKinds && rule.skipKinds.indexOf(book._kind) !== -1) continue;
      var res = ruleRegexes(rule);
      for (var w = 0; w < res.length; w++) {
        if (res[w].re.test(hay)) {
          return { clause: rule.clause, label: rule.label, matched: res[w].word };
        }
      }
    }
    return null;
  }

  /**
   * Second proviso to s.16(2): where the recipient fails to pay the supplier
   * within 180 days of the invoice date, the credit is added back to output tax
   * with interest, and may be re-availed once payment is made.
   *
   * Requires a creditors/payment export that the Tally step-1 workbook does not
   * carry. Without one this returns "awaiting payment data" rather than
   * guessing - an unpaid-looking invoice that was in fact settled would be a
   * damaging false positive.
   */
  var PAYMENT_DAYS = 180;

  function paymentKey(book) {
    return (book.our_gstin || "") + "\u0001" + (book._gstin || book._pan || "") +
      "\u0001" + (book._inv || "");
  }

  /**
   * Annotate a reconcile() result with the statutory overlays.
   *
   * @param result    the object returned by reconcile()
   * @param opts      { asOn: 'YYYY-MM-DD' | date, fy, paymentsIndex: Map,
   *                    blockedRules }
   */
  function applyStatutory(result, opts) {
    opts = opts || {};
    var asOn = opts.asOn ? (opts.asOn.num !== undefined ? opts.asOn : toDate(opts.asOn)) : null;
    if (!asOn) {
      var now = new Date();
      asOn = mkDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
    var payments = opts.paymentsIndex || null;
    var rules = opts.blockedRules || BLOCKED_RULES;

    var summary = {
      asOn: asOn.key,
      sec16_4: { open: 0, closing: 0, expired: 0, expiredTax: 0, closingTax: 0 },
      rateFlags: { count: 0, tax: 0 },
      blocked17_5: { count: 0, tax: 0, reversalBooked: 0, noReversal: 0, byClause: {} },
      payment180: { available: !!payments, breached: 0, breachedTax: 0, unknown: 0 },
      duplicates: { groups: 0, rows: 0, tax: 0 },
      cancelledGstin: { count: 0, tax: 0 },
    };

    /* Duplicate booking: the same supplier invoice entered twice. The
     * reconciliation does not catch this on its own - both copies can match
     * different portal rows, or one matches and one lands in "at risk". */
    var dupIndex = Object.create(null), i, r;
    for (i = 0; i < result.recoRows.length; i++) {
      var b = result.recoRows[i].book;
      if (!b._inv) continue;
      var dk = (b._pan || b._gstin || "") + "\u0001" + b._inv;
      if (!dupIndex[dk]) dupIndex[dk] = [];
      dupIndex[dk].push(i);
    }
    for (var dk2 in dupIndex) {
      if (dupIndex[dk2].length > 1) {
        summary.duplicates.groups++;
        for (var d = 0; d < dupIndex[dk2].length; d++) {
          var rr = result.recoRows[dupIndex[dk2][d]];
          rr.duplicate_group = dk2;
          rr.duplicate_count = dupIndex[dk2].length;
          summary.duplicates.rows++;
          summary.duplicates.tax += rr.book.total_tax;
        }
      }
    }
    summary.duplicates.tax = round2(summary.duplicates.tax);

    for (i = 0; i < result.recoRows.length; i++) {
      r = result.recoRows[i];
      var book = r.book;
      var invDate = book._date;
      var fy = r.books_fy || fyOf(invDate);

      // --- s.16(4) ---
      var due = sec164DueFor(fy);
      var st = sec164State(due, asOn);
      r.sec16_4_due = due ? due.key : "";
      r.sec16_4_days = st.days;
      r.sec16_4_state = st.state;
      if (st.state === "Open") summary.sec16_4.open++;
      else if (st.state === "Closing") {
        summary.sec16_4.closing++; summary.sec16_4.closingTax += book.total_tax;
      } else if (st.state === "Expired") {
        summary.sec16_4.expired++; summary.sec16_4.expiredTax += book.total_tax;
      }

      // --- rate plausibility (portal side carries the rate) ---
      r.rate_flag = r.portal ? rateFlag(r.portal.rates || r.portal.tax_rate, r.portal.invoice_date) : "";
      if (r.rate_flag) { summary.rateFlags.count++; summary.rateFlags.tax += book.total_tax; }

      // --- s.17(5) ---
      var hit = screenBlocked(book, rules);
      if (hit) {
        r.blocked_17_5_clause = hit.clause;
        r.blocked_17_5_label = hit.label;
        r.blocked_17_5_matched = hit.matched;
        /* Reconcile the flag against what was actually booked. A flagged row
         * with a reversal already posted needs no action; one without is the
         * item to review. */
        r.blocked_17_5_status = Math.abs(book.reversal_17_5 || 0) >= 0.01
          ? "Reversal already booked" : "Flagged - no reversal booked";
        summary.blocked17_5.count++;
        summary.blocked17_5.tax += book.total_tax;
        if (Math.abs(book.reversal_17_5 || 0) >= 0.01) summary.blocked17_5.reversalBooked++;
        else summary.blocked17_5.noReversal++;
        var bc = summary.blocked17_5.byClause[hit.clause] ||
          (summary.blocked17_5.byClause[hit.clause] = { label: hit.label, count: 0, tax: 0 });
        bc.count++; bc.tax = round2(bc.tax + book.total_tax);
      } else {
        r.blocked_17_5_clause = "";
        r.blocked_17_5_status = "";
      }

      // --- 180-day payment rule ---
      if (!payments) {
        r.payment_status = "Awaiting payment data";
        r.payment_days = null;
        summary.payment180.unknown++;
      } else {
        var pay = payments.get ? payments.get(paymentKey(book)) : payments[paymentKey(book)];
        if (pay && pay.paid_date) {
          var pd = pay.paid_date.num !== undefined ? pay.paid_date : toDate(pay.paid_date);
          r.payment_days = pd && invDate ? pd.num - invDate.num : null;
          r.payment_status = "Paid";
        } else if (invDate) {
          r.payment_days = asOn.num - invDate.num;
          if (r.payment_days > PAYMENT_DAYS) {
            r.payment_status = "Unpaid beyond 180 days - reverse with interest";
            summary.payment180.breached++;
            summary.payment180.breachedTax += book.total_tax;
          } else {
            r.payment_status = "Unpaid, within 180 days";
          }
        } else {
          r.payment_status = "Awaiting payment data";
          summary.payment180.unknown++;
        }
      }
    }

    /* Cancelled supplier GSTIN: credit taken on an invoice dated on or after
     * the date the supplier's registration was cancelled. */
    function checkCancelled(p, taxOf) {
      var c = toDate(p.gstin_cancelled);
      if (!c || !p.invoice_date) return false;
      if (p.invoice_date.num >= c.num) {
        p.cancelled_flag = "Supplier GSTIN cancelled on " + c.key;
        summary.cancelledGstin.count++;
        summary.cancelledGstin.tax += taxOf;
        return true;
      }
      return false;
    }
    for (i = 0; i < result.recoRows.length; i++) {
      r = result.recoRows[i];
      if (r.portal) {
        if (checkCancelled(r.portal, r.book.total_tax)) {
          r.cancelled_flag = r.portal.cancelled_flag;
        }
      }
    }
    for (i = 0; i < result.portalOnly.length; i++) {
      checkCancelled(result.portalOnly[i], result.portalOnly[i].total_tax);
    }

    for (var kk in summary.sec16_4) summary.sec16_4[kk] = round2(summary.sec16_4[kk]);
    summary.rateFlags.tax = round2(summary.rateFlags.tax);
    summary.blocked17_5.tax = round2(summary.blocked17_5.tax);
    summary.payment180.breachedTax = round2(summary.payment180.breachedTax);
    summary.cancelledGstin.tax = round2(summary.cancelledGstin.tax);

    result.statutory = summary;
    return result;
  }

  /**
   * What changed since the previous run.
   *
   * Without this a monthly cumulative upload just regenerates a full report and
   * nobody can see movement - which is the entire reason for accumulating in
   * the first place. Keys on the book row's natural identity so it survives
   * re-ingestion.
   */
  function bookRowKey(book) {
    return [book.our_gstin, book.voucher_type, book.voucher_no, book.state,
      book.supplier_inv_no, book._gstin].join("\u0001");
  }

  function diffRuns(current, previous) {
    var prev = new Map(), i, r, k;
    if (previous && previous.recoRows) {
      for (i = 0; i < previous.recoRows.length; i++) {
        prev.set(bookRowKey(previous.recoRows[i].book), previous.recoRows[i]);
      }
    }
    var out = {
      newlyMatched: [], newlyAtRisk: [], stillAtRisk: [], newRows: [], resolved: [],
    };
    var seen = new Set();
    for (i = 0; i < current.recoRows.length; i++) {
      r = current.recoRows[i];
      k = bookRowKey(r.book);
      seen.add(k);
      var p = prev.get(k);
      var nowMatched = r.match_tier !== "";
      if (!p) { out.newRows.push(r); continue; }
      var wasMatched = p.match_tier !== "";
      if (nowMatched && !wasMatched) out.newlyMatched.push(r);
      else if (!nowMatched && wasMatched) out.newlyAtRisk.push(r);
      else if (!nowMatched && !wasMatched) out.stillAtRisk.push(r);
    }
    if (previous && previous.recoRows) {
      for (i = 0; i < previous.recoRows.length; i++) {
        if (!seen.has(bookRowKey(previous.recoRows[i].book))) {
          out.resolved.push(previous.recoRows[i]);
        }
      }
    }
    out.totals = {
      newlyMatched: sumTax(out.newlyMatched, bookTax),
      newlyAtRisk: sumTax(out.newlyAtRisk, bookTax),
      stillAtRisk: sumTax(out.stillAtRisk, bookTax),
      newRows: sumTax(out.newRows, bookTax),
      resolved: sumTax(out.resolved, bookTax),
    };
    return out;
  }

  /** Convenience: portal rows -> match-ready pool, in one call. */
  function buildPool(portalRows) {
    var agg = aggregateInvoices(portalRows);
    var q = applyQrmpRule(agg);
    return { pool: q.invoices, rescued: q.rescued, aggregated: agg.length, rateLines: portalRows.length };
  }

  return {
    ENGINE_VERSION: ENGINE_VERSION,
    DEFAULTS: DEFAULTS,
    FIELD_PATTERNS: FIELD_PATTERNS,
    // normalisation
    normInv: normInv, normGstin: normGstin, panOf: panOf, normName: normName,
    toNum: toNum, toDate: toDate, fyOf: fyOf, fyBounds: fyBounds, round2: round2,
    nameRatio: nameRatio, SequenceMatcher: SequenceMatcher,
    // sheet plumbing
    findHeaderRow: findHeaderRow, mapColumns: mapColumns, headerNames: headerNames,
    // pipeline
    parsePortalWorkbook: parsePortalWorkbook,
    parseBooksWorkbook: parseBooksWorkbook,
    aggregateInvoices: aggregateInvoices,
    applyQrmpRule: applyQrmpRule,
    resolveAmendments: resolveAmendments,
    buildPool: buildPool,
    matchBooks: matchBooks,
    reconcile: reconcile,
    // statutory overlays
    applyStatutory: applyStatutory,
    sec164DueFor: sec164DueFor,
    rateFlag: rateFlag,
    screenBlocked: screenBlocked,
    BLOCKED_RULES: BLOCKED_RULES,
    PAYMENT_DAYS: PAYMENT_DAYS,
    /* The caller builds the payments index, so it needs the same key builder
     * the overlay looks it up with. Never reconstruct this format by hand. */
    paymentKey: paymentKey,
    // continuity
    bookRowKey: bookRowKey,
    diffRuns: diffRuns,
  };
});
