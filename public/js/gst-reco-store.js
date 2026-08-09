/* ============================================================================
 * GST RECO STORE  -  cumulative persistence between the engine and Supabase
 * ============================================================================
 * What makes this module "continuous": raw normalised rows ACCUMULATE. Each
 * upload upserts on a natural row_key, so re-uploading an overlapping month
 * replaces rather than duplicates, and the engine then re-runs over the WHOLE
 * pool. That is why an invoice a supplier files late still matches on a later
 * run instead of sitting in "at risk" forever.
 *
 * Requires window.sbClient (set by gst-reco-gate.js) and window.GSTRecoEngine.
 * ========================================================================= */

(function (root) {
  "use strict";

  var E = root.GSTRecoEngine;
  if (!E) { console.error("[store] gst-reco-engine.js must load first"); return; }

  /* ASCII Unit Separator. Purpose-built for this and cannot occur in a GSTIN,
   * invoice number or voucher number, unlike "|" or "-" which appear in real
   * invoice references constantly. */
  var SEP = "\u001F";

  var CHUNK = 1000;          // Supabase caps a request at 1000 rows
  var KEEP_RUNS = 3;         // current + 2 prior, so deltas still work

  function sb() {
    if (!root.sbClient) throw new Error("Not signed in - no Supabase client");
    return root.sbClient;
  }

  /* --------------------------------------------------------------- row keys */
  /* Both validated against the real workbooks before being made unique - see
   * the migration header. Do not change either without re-running that check;
   * a weaker key silently duplicates rows on every monthly upload. */

  function booksRowKey(r) {
    return [r.our_gstin, r.voucher_type, r.voucher_no, r.state,
      r.supplier_inv_no, r._gstin].join(SEP);
  }

  function portalRowKey(r, fy) {
    // `section` MUST stay in the key: without it an amendment and the original
    // it supersedes collide, which is the double-count resolveAmendments()
    // exists to prevent (82 such pairs in FY25-26 alone).
    return [r.our_gstin, r.supplier_gstin, r.section, r._inv, fy].join(SEP);
  }

  function paymentsRowKey(r) {
    return [r.our_gstin, r.supplier_gstin, r.inv_norm].join(SEP);
  }

  /* ---------------------------------------------------------------- helpers */

  function dateOrNull(d) { return d && d.key ? d.key : null; }

  async function sha256(file) {
    var buf = await file.arrayBuffer();
    var hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  /* Yield to the event loop so a 14 MB workbook does not freeze the tab.
   * Deliberately not a Web Worker: the worker would need its own SheetJS via
   * importScripts, and the site's CSP makes blob-URL workers fragile. Yielding
   * between sheets keeps the progress bar alive, which is what actually
   * matters here. */
  function tick() {
    return new Promise(function (r) { setTimeout(r, 0); });
  }

  async function chunkedUpsert(table, rows, conflictCol, onProgress) {
    var done = 0;
    for (var i = 0; i < rows.length; i += CHUNK) {
      var slice = rows.slice(i, i + CHUNK);
      var res = await sb().from(table).upsert(slice, { onConflict: conflictCol });
      if (res.error) throw new Error(table + " upsert failed: " + res.error.message);
      done += slice.length;
      if (onProgress) onProgress(done, rows.length);
      await tick();
    }
    return done;
  }

  /** Read every row of a table past Supabase's 1000-row response cap. */
  async function selectAll(table, columns, applyFilters) {
    var out = [], page = 0;
    for (;;) {
      var q = sb().from(table).select(columns).range(page * CHUNK, page * CHUNK + CHUNK - 1);
      if (applyFilters) q = applyFilters(q);
      var res = await q;
      if (res.error) throw new Error(table + " read failed: " + res.error.message);
      out = out.concat(res.data || []);
      if (!res.data || res.data.length < CHUNK) break;
      page++;
    }
    return out;
  }

  /* ---------------------------------------------------------------- uploads */

  /**
   * Ingest one workbook. Parses, normalises and upserts; does NOT reconcile.
   * Call runReconciliation() afterwards - once, after all of a period's files
   * are in - so the engine sees the complete pool.
   *
   * @param file    a File from an <input type=file>
   * @param opts    { kind: 'books'|'portal'|'payments', fy, source, ownPan,
   *                  uploadedBy, onProgress(stage, done, total) }
   */
  async function ingestFile(file, opts) {
    opts = opts || {};
    var progress = opts.onProgress || function () {};
    if (!opts.fy) throw new Error("An FY must be chosen before upload");

    progress("hashing", 0, 1);
    var digest = await sha256(file);

    // Exact re-upload of the same bytes is almost always a double click.
    // Content-level de-duplication is the row_key's job, not this check's.
    var dup = await sb().from("gst_uploads").select("id, filename, uploaded_at")
      .eq("file_sha256", digest).maybeSingle();
    if (dup.error) throw new Error("upload check failed: " + dup.error.message);
    if (dup.data) {
      return { skipped: true, reason: "This exact file was already uploaded on " +
        new Date(dup.data.uploaded_at).toLocaleString("en-IN"), uploadId: dup.data.id };
    }

    progress("parsing", 0, 1);
    // raw:true / cellDates:false is deliberate - SheetJS Date objects drift by
    // the reader's timezone. The engine converts Excel serials itself.
    var wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), {
      type: "array", raw: true, cellDates: false,
    });
    await tick();

    var ins = await sb().from("gst_uploads").insert({
      kind: opts.kind, source: opts.source || (opts.kind === "portal" ? "2A" : "TALLY"),
      fy: opts.fy, filename: file.name, file_sha256: digest,
      uploaded_by: opts.uploadedBy || "", row_count: 0,
    }).select("id").single();
    if (ins.error) throw new Error("upload record failed: " + ins.error.message);
    var uploadId = ins.data.id;

    var count = 0, mapping = null, warnings = [];
    if (opts.kind === "books") {
      var parsed = E.parseBooksWorkbook(XLSX, wb, { ownPan: opts.ownPan });
      warnings = parsed.warnings;
      mapping = [{ sheet: parsed.sheet, status: "read", warnings: parsed.warnings }];
      var bookRows = parsed.rows.map(function (r) {
        return {
          row_key: booksRowKey(r), fy: opts.fy, upload_id: uploadId,
          our_gstin: r.our_gstin, state: r.state,
          voucher_date: dateOrNull(r.voucher_date), voucher_type: r.voucher_type,
          voucher_no: r.voucher_no, voucher_kind: r._kind,
          supplier_name: r.supplier_name, supplier_gstin: r._gstin,
          supplier_gstin_raw: r.supplier_gstin_raw,
          supplier_reg_type: r.supplier_reg_type, supplier_pan: r._pan,
          supplier_inv_no: r.supplier_inv_no,
          supplier_inv_date: dateOrNull(r.supplier_inv_date),
          match_date: dateOrNull(r._date), inv_norm: r._inv, name_norm: r._name,
          taxable_value: r.taxable_value, cgst: r.cgst, sgst: r.sgst,
          igst: r.igst, cess: r.cess, isd: r.isd,
          reversal_17_5: r.reversal_17_5, other_gst: r.other_gst,
          total_tax: r.total_tax, total_invoice_value: r.total_invoice_value,
          multi_state_vch: r.multi_state_vch, narration: r.narration,
          is_interbranch: r._interbranch, out_of_scope: r._not_2a,
          last_seen_at: new Date().toISOString(),
        };
      });
      count = await chunkedUpsert("gst_books", bookRows, "row_key",
        function (d, t) { progress("saving books", d, t); });

    } else if (opts.kind === "portal") {
      var portal = E.parsePortalWorkbook(XLSX, wb, {
        label: opts.fy, source: opts.source || "2A",
      });
      mapping = portal.mapping;
      await tick();
      // Rate lines collapse to invoices BEFORE storage: books hold one row per
      // invoice, so storing rate lines would guarantee amount mismatches.
      var built = E.buildPool(portal.rows);
      var amd = E.resolveAmendments(built.pool.slice());
      var supersededKeys = {};
      amd.superseded.forEach(function (s) { supersededKeys[portalRowKey(s, opts.fy)] = true; });

      var portalRows = built.pool.map(function (r) {
        var key = portalRowKey(r, opts.fy);
        return {
          row_key: key, fy: opts.fy, upload_id: uploadId,
          source: r.source, sheet: r.sheet,
          our_gstin: r.our_gstin, supplier_gstin: r.supplier_gstin,
          supplier_pan: r._pan, supplier_name: r.supplier_name, name_norm: r._name,
          section: r.section, doc_type: r.doc_type,
          invoice_no: r.invoice_no, inv_norm: r._inv,
          invoice_date: dateOrNull(r.invoice_date), return_period: r.return_period,
          taxable_value: r.taxable_value, igst: r.igst, cgst: r.cgst,
          sgst: r.sgst, cess: r.cess, total_tax: r.total_tax,
          invoice_value: r.invoice_value, tax_rates: r.rates, rate_lines: r.rate_lines,
          rcm: r.rcm, gstr3b_status: r.gstr3b_status,
          gstr3b_effective: r.gstr3b_effective, gstr3b_basis: r.gstr3b_basis,
          gstr1_status: r.gstr1_status, filing_period: r.filing_period,
          filing_date: r.filing_date, orig_doc_no: r.orig_doc_no,
          amendment_type: r.amendment_type, gstin_cancelled: r.gstin_cancelled,
          taxpayer_type: r.taxpayer_type,
          is_superseded: !!supersededKeys[key],
          last_seen_at: new Date().toISOString(),
        };
      });
      count = await chunkedUpsert("gst_portal", portalRows, "row_key",
        function (d, t) { progress("saving 2A/2B", d, t); });

    } else if (opts.kind === "payments") {
      var payRows = parsePaymentsWorkbook(wb).map(function (r) {
        return {
          row_key: paymentsRowKey(r), upload_id: uploadId,
          our_gstin: r.our_gstin, supplier_gstin: r.supplier_gstin,
          supplier_pan: r.supplier_pan, supplier_inv_no: r.supplier_inv_no,
          inv_norm: r.inv_norm, paid_date: r.paid_date, paid_amount: r.paid_amount,
        };
      });
      count = await chunkedUpsert("gst_payments", payRows, "row_key",
        function (d, t) { progress("saving payments", d, t); });
    } else {
      throw new Error("unknown upload kind: " + opts.kind);
    }

    /* The mapping report is stored, not just returned. When a 2A arrives in an
     * unfamiliar layout it is the only evidence that "Taxable Value" was read
     * from the taxable-value column and not from something else - the Python
     * writes it as the Column_Mapping sheet and 2b_CHECK_2A_COLUMNS.bat exists
     * for nothing else. It used to be computed here and thrown away. */
    await sb().from("gst_uploads")
      .update({ row_count: count, column_mapping: mapping })
      .eq("id", uploadId);
    return { skipped: false, uploadId: uploadId, rows: count, mapping: mapping, warnings: warnings };
  }

  /**
   * Minimal creditors-ledger reader for the 180-day rule. The Tally export that
   * would feed this does not exist yet, so the column map is a best guess and
   * the overlay stays inert until real data arrives.
   */
  function parsePaymentsWorkbook(wb) {
    var ws = wb.Sheets[wb.SheetNames[0]];
    var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
    if (!aoa.length) return [];
    var names = aoa[0].map(function (c) { return String(c || "").trim().toLowerCase(); });
    /* First header containing any of the given patterns, patterns tried in
     * order so the specific ones win over the loose ones ("paid date" before a
     * bare "date"). */
    function col(patterns) {
      for (var a = 0; a < patterns.length; a++) {
        for (var j = 0; j < names.length; j++) {
          if (names[j].indexOf(patterns[a]) !== -1) return j;
        }
      }
      return -1;
    }
    var cOur = col(["our gstin"]),
      cSup = col(["supplier gstin", "party gstin"]),
      cPan = col(["supplier pan", "party pan"]),
      cInv = col(["supplier inv no", "invoice no", "bill no", "reference"]),
      cDate = col(["payment date", "paid date", "settlement date", "date"]),
      cAmt = col(["paid amount", "payment amount", "amount"]);
    var out = [];
    for (var r = 1; r < aoa.length; r++) {
      var row = aoa[r];
      if (!row) continue;
      var inv = cInv >= 0 ? String(row[cInv] || "").trim() : "";
      if (!inv) continue;
      var d = E.toDate(cDate >= 0 ? row[cDate] : null);
      out.push({
        our_gstin: cOur >= 0 ? E.normGstin(row[cOur]) : "",
        supplier_gstin: cSup >= 0 ? E.normGstin(row[cSup]) : "",
        supplier_pan: E.panOf(cSup >= 0 ? row[cSup] : "", cPan >= 0 ? row[cPan] : ""),
        supplier_inv_no: inv, inv_norm: E.normInv(inv),
        paid_date: d ? d.key : null,
        paid_amount: cAmt >= 0 ? E.toNum(row[cAmt]) : null,
      });
    }
    return out;
  }

  /* ----------------------------------------------------------- reconcile */

  /** Rehydrate stored rows into the shapes the engine expects. */
  function hydrateBook(row) {
    return {
      _dbId: row.id,
      our_gstin: row.our_gstin, state: row.state,
      voucher_date: E.toDate(row.voucher_date), voucher_type: row.voucher_type,
      voucher_no: row.voucher_no, _kind: row.voucher_kind,
      supplier_name: row.supplier_name, supplier_gstin_raw: row.supplier_gstin_raw,
      supplier_reg_type: row.supplier_reg_type,
      supplier_inv_no: row.supplier_inv_no,
      supplier_inv_date: E.toDate(row.supplier_inv_date),
      _date: E.toDate(row.match_date), _inv: row.inv_norm, _name: row.name_norm,
      _gstin: row.supplier_gstin || "", _pan: row.supplier_pan || "",
      taxable_value: +row.taxable_value, cgst: +row.cgst, sgst: +row.sgst,
      igst: +row.igst, cess: +row.cess, isd: +row.isd,
      reversal_17_5: +row.reversal_17_5, other_gst: +row.other_gst,
      total_tax: +row.total_tax, total_invoice_value: +row.total_invoice_value,
      multi_state_vch: row.multi_state_vch, narration: row.narration,
      _interbranch: row.is_interbranch, _not_2a: row.out_of_scope,
    };
  }

  function hydratePortal(row) {
    return {
      _dbId: row.id, _srcLabel: row.fy,
      source: row.source, sheet: row.sheet,
      our_gstin: row.our_gstin, supplier_gstin: row.supplier_gstin,
      _pan: row.supplier_pan || "", supplier_name: row.supplier_name,
      _name: row.name_norm || "", section: row.section, doc_type: row.doc_type,
      invoice_no: row.invoice_no, _inv: row.inv_norm,
      invoice_date: E.toDate(row.invoice_date), return_period: row.return_period,
      taxable_value: +row.taxable_value, igst: +row.igst, cgst: +row.cgst,
      sgst: +row.sgst, cess: +row.cess, total_tax: +row.total_tax,
      invoice_value: +row.invoice_value, rates: row.tax_rates,
      rate_lines: row.rate_lines, rcm: row.rcm,
      gstr3b_status: row.gstr3b_status, gstr3b_effective: row.gstr3b_effective,
      gstr3b_basis: row.gstr3b_basis, gstr1_status: row.gstr1_status,
      filing_period: row.filing_period, filing_date: row.filing_date,
      orig_doc_no: row.orig_doc_no, amendment_type: row.amendment_type,
      gstin_cancelled: row.gstin_cancelled, taxpayer_type: row.taxpayer_type,
    };
  }

  /**
   * Re-run the engine over the FULL accumulated pool for one FY and persist the
   * result. The adjacent year is loaded too, so a book row whose invoice the
   * supplier filed in the other year is labelled "timing" rather than "at risk".
   *
   * A run whose identity checks fail is NOT written. A broken identity means
   * the reconciliation lost or double-counted rows, so every ITC figure derived
   * from it would be wrong - persisting it would put a bad number in front of
   * someone about to file.
   */
  async function runReconciliation(fy, opts) {
    opts = opts || {};
    var progress = opts.onProgress || function () {};
    var other = adjacentFy(fy);

    progress("loading books", 0, 1);
    var bookRows = await selectAll("gst_books", "*", function (q) { return q.eq("fy", fy); });
    progress("loading 2A/2B", 0, 1);
    var portalRows = await selectAll("gst_portal", "*", function (q) {
      return q.eq("fy", fy).eq("is_superseded", false);
    });
    var otherRows = await selectAll("gst_portal", "*", function (q) { return q.eq("fy", other); });

    if (!bookRows.length) throw new Error("No book rows stored for " + fy + " - upload the Tally export first");

    var books = bookRows.map(hydrateBook);
    var pool = portalRows.map(hydratePortal);
    var otherPool = otherRows.map(hydratePortal);

    progress("matching", 0, 1);
    await tick();
    var result = E.reconcile(books, pool, {
      label: fy, otherYearPool: otherPool, ownPan: opts.ownPan,
      tolerance: opts.tolerance, nameSimilarity: opts.nameSimilarity,
    });

    var payIndex = null;
    if (opts.usePayments) {
      var pays = await selectAll("gst_payments", "*");
      if (pays.length) {
        payIndex = new Map();
        pays.forEach(function (p) {
          payIndex.set([p.our_gstin, p.supplier_gstin, p.inv_norm].join(SEP),
            { paid_date: p.paid_date, paid_amount: p.paid_amount });
        });
      }
    }
    E.applyStatutory(result, { asOn: opts.asOn, paymentsIndex: payIndex });

    if (!result.identity.ok) {
      var e = new Error(
        "Reconciliation failed its identity check and was NOT saved. " +
        "matched+timing+at-risk = " + result.identity.inScopeActual +
        " but in-scope = " + result.identity.inScopeExpected +
        "; portal rows consumed " + result.identity.portalUsed +
        " vs matched " + result.identity.matchedCount + ".");
      e.identity = result.identity;
      throw e;
    }

    progress("saving run", 0, 1);
    var prev = await currentRunId(fy);

    await sb().from("gst_reco_runs").update({ is_current: false })
      .eq("fy", fy).eq("is_current", true);

    var run = await sb().from("gst_reco_runs").insert({
      fy: fy, run_by: opts.runBy || "", as_on: result.statutory.asOn,
      engine_version: E.ENGINE_VERSION,
      params: {
        tolerance: opts.tolerance ?? E.DEFAULTS.tolerance,
        nameSimilarity: opts.nameSimilarity ?? E.DEFAULTS.nameSimilarity,
        ownPan: opts.ownPan || "",
        booksRows: books.length, portalRows: pool.length, otherYearRows: otherPool.length,
      },
      overview: result.overview, by_head: result.byHead,
      statutory: result.statutory, headline: result.headline,
      identity: result.identity, identity_ok: true, is_current: true,
    }).select("id").single();
    if (run.error) throw new Error("run insert failed: " + run.error.message);
    var runId = run.data.id;

    var recoRows = result.recoRows.map(function (r) {
      return {
        run_id: runId, book_id: r.book._dbId,
        portal_id: r.portal ? r.portal._dbId : null,
        bucket: r.match_tier !== "" ? "MATCHED" : (r.timing ? "TIMING" : "AT_RISK"),
        reco_status: r.reco_status, match_tier: r.match_tier || null,
        tax_diff: r.tax_diff, date_gap_days: r.date_gap_days,
        books_fy: r.books_fy, portal_fy: r.portal_fy,
        is_interbranch: !!r.book._interbranch,
        sec16_4_due: r.sec16_4_due || null, sec16_4_days: r.sec16_4_days,
        sec16_4_state: r.sec16_4_state || null, rate_flag: r.rate_flag || null,
        blocked_17_5_clause: r.blocked_17_5_clause || null,
        blocked_17_5_status: r.blocked_17_5_status || null,
        payment_status: r.payment_status || null, payment_days: r.payment_days,
        duplicate_group: r.duplicate_group || null,
        duplicate_count: r.duplicate_count || null,
        cancelled_flag: r.cancelled_flag || null,
      };
    });
    result.outOfScope.forEach(function (b) {
      recoRows.push({ run_id: runId, book_id: b._dbId, portal_id: null,
        bucket: "OUT_OF_SCOPE", reco_status: "Out of scope (ISD / 17(5) reversal)",
        is_interbranch: !!b._interbranch });
    });
    await chunkedUpsert("gst_reco_rows", recoRows, "run_id,book_id",
      function (d, t) { progress("saving entries", d, t); });

    var onlyRows = [];
    function pushOnly(list, bucket) {
      list.forEach(function (p) {
        onlyRows.push({ run_id: runId, portal_id: p._dbId, bucket: bucket,
          why_unmatched: p.why_unmatched || null, cancelled_flag: p.cancelled_flag || null });
      });
    }
    pushOnly(result.portalOnly, "PORTAL_ONLY");
    pushOnly(result.rcmOnly, "RCM");
    pushOnly(result.isdOnly, "ISD");
    await chunkedUpsert("gst_portal_only", onlyRows, "run_id,portal_id",
      function (d, t) { progress("saving 2A-only", d, t); });

    await sb().rpc("gst_prune_runs", { p_fy: fy, p_keep: KEEP_RUNS });

    return { runId: runId, previousRunId: prev, result: result };
  }

  /** FY2025-26 <-> FY2026-27. The engine labels timing differences from this. */
  function adjacentFy(fy) {
    var m = String(fy || "").match(/^FY(\d{4})-(\d{2})$/);
    if (!m) return "";
    var y = +m[1] + 1;
    return "FY" + y + "-" + String(y + 1).slice(-2);
  }

  async function currentRunId(fy) {
    var res = await sb().from("gst_reco_runs").select("id")
      .eq("fy", fy).eq("is_current", true).maybeSingle();
    return res.data ? res.data.id : null;
  }

  /* ------------------------------------------------------------- read side */

  async function listUploads() {
    var res = await sb().from("gst_uploads").select("*").order("uploaded_at", { ascending: false });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  async function listRuns(fy) {
    var q = sb().from("gst_reco_runs").select("*").order("run_at", { ascending: false });
    if (fy) q = q.eq("fy", fy);
    var res = await q;
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  async function currentRun(fy) {
    var res = await sb().from("gst_reco_runs").select("*")
      .eq("fy", fy).eq("is_current", true).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  function viewFor(name) {
    return async function (runId, extra) {
      var q = sb().from(name).select("*").eq("run_id", runId);
      if (extra) q = extra(q);
      var res = await q;
      if (res.error) throw new Error(name + ": " + res.error.message);
      return res.data;
    };
  }

  /** Paged, filtered entry grid. Filtering happens in Postgres, not here. */
  async function entries(runId, filters, page, pageSize) {
    filters = filters || {};
    var res = await sb().rpc("gst_rpc_entries", {
      p_run_id: runId,
      p_buckets: filters.buckets || null,
      p_states: filters.states || null,
      p_our_gstin: filters.ourGstin || null,
      p_supplier: filters.supplier || null,
      p_tiers: filters.tiers || null,
      p_interbranch: filters.interBranch === undefined ? null : filters.interBranch,
      p_s164_state: filters.sec164State || null,
      p_flagged: filters.flagged === undefined ? null : filters.flagged,
      /* One named overlay: rate | blocked_17_5 | blocked_17_5_unreversed |
       * duplicate | cancelled | s164_expired | s164_closing | payment_180.
       * payment_180 matches a real breach only, never the "Awaiting payment
       * data" placeholder every row carries while gst_payments is empty. */
      p_exception: filters.exception || null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
      p_min_tax: filters.minTax === undefined ? null : filters.minTax,
      p_max_tax: filters.maxTax === undefined ? null : filters.maxTax,
      p_search: filters.search || null,
      p_limit: pageSize || 100,
      p_offset: (page || 0) * (pageSize || 100),
    });
    if (res.error) throw new Error("entries: " + res.error.message);
    return {
      rows: res.data || [],
      total: res.data && res.data.length ? Number(res.data[0].total_count) : 0,
    };
  }

  /**
   * Paged portal-side grid: "In 2A only", RCM and ISD.
   *
   * The book side has entries(); this is its mirror. Without it the module has
   * to pull every leftover portal row - ~4,500 for FY25-26 - to show twenty.
   *
   * `why` is a PREFIX of the engine's why_unmatched sentence, which is what
   * splits Overview line 6 into 6a / 6b / 6c:
   *   'Supplier CRED' -> 6a credit notes    (a liability, not an opportunity)
   *   'Party IS'      -> 6b party known     (verify, do NOT re-book)
   *   'Party NOT'     -> 6c party unknown   (the only genuinely unclaimed ITC)
   */
  async function portalOnly(runId, filters, page, pageSize) {
    filters = filters || {};
    var res = await sb().rpc("gst_rpc_portal_only", {
      p_run_id: runId,
      p_buckets: filters.buckets || null,
      p_why: filters.why || null,
      p_our_gstin: filters.ourGstin || null,
      p_supplier: filters.supplier || null,
      p_doc_type: filters.docType || null,
      p_return_period: filters.returnPeriod || null,
      p_cancelled: filters.cancelled === undefined ? null : filters.cancelled,
      p_search: filters.search || null,
      p_limit: pageSize || 100,
      p_offset: (page || 0) * (pageSize || 100),
    });
    if (res.error) throw new Error("portalOnly: " + res.error.message);
    return {
      rows: res.data || [],
      total: res.data && res.data.length ? Number(res.data[0].total_count) : 0,
    };
  }

  /** B2B/CDN rows replaced by the B2BA/CDNA amending them. Audit trail only. */
  async function superseded(fy, page, pageSize) {
    var res = await sb().rpc("gst_rpc_superseded", {
      p_fy: fy,
      p_limit: pageSize || 200,
      p_offset: (page || 0) * (pageSize || 200),
    });
    if (res.error) throw new Error("superseded: " + res.error.message);
    return {
      rows: res.data || [],
      total: res.data && res.data.length ? Number(res.data[0].total_count) : 0,
    };
  }

  async function runDelta(runId, prevRunId) {
    if (!prevRunId) return [];
    var res = await sb().rpc("gst_rpc_run_delta", { p_run_id: runId, p_prev_run_id: prevRunId });
    if (res.error) throw new Error("delta: " + res.error.message);
    return res.data;
  }

  async function saveVendorAction(action) {
    var res = await sb().from("gst_vendor_actions").upsert({
      supplier_pan: action.supplierPan,
      supplier_gstin: action.supplierGstin || "",
      status: action.status, owner: action.owner || null,
      due_date: action.dueDate || null, remarks: action.remarks || null,
      updated_by: action.updatedBy || null, updated_at: new Date().toISOString(),
    }, { onConflict: "supplier_pan,supplier_gstin" });
    if (res.error) throw new Error("vendor action: " + res.error.message);
  }

  root.GSTRecoStore = {
    SEP: SEP,
    booksRowKey: booksRowKey,
    portalRowKey: portalRowKey,
    adjacentFy: adjacentFy,
    ingestFile: ingestFile,
    runReconciliation: runReconciliation,
    listUploads: listUploads,
    listRuns: listRuns,
    currentRun: currentRun,
    bucketSummary: viewFor("gst_v_bucket_summary"),
    vendorSummary: viewFor("gst_v_vendor_summary"),
    periodSummary: viewFor("gst_v_period_summary"),
    stateSummary: viewFor("gst_v_state_summary"),
    sec164Summary: viewFor("gst_v_sec16_4"),
    // Portal side - the mirror of bucketSummary. Overview lines 6/6a/6b/6c/6.5.
    portalBucketSummary: viewFor("gst_v_portal_bucket_summary"),
    // ISD received vs distributed. Totals only - it cannot be matched
    // invoice-by-invoice, the two sides carry no common key.
    isdControl: viewFor("gst_v_isd_control"),
    entries: entries,
    portalOnly: portalOnly,
    superseded: superseded,
    runDelta: runDelta,
    saveVendorAction: saveVendorAction,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
