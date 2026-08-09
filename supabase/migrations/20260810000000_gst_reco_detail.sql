-- ============================================================================
-- GST Reconciliation - portal-side detail and exception drill-downs
-- ============================================================================
-- Follows 20260808000000_gst_reco_analytics.sql. That migration modelled the
-- BOOK side well and left three real gaps, all of which forced the UI either to
-- pull whole tables into the browser or to show nothing:
--
--   1. Overview lines 6 / 6a / 6b / 6c / 6.5 (In 2A only, credit notes, party
--      known, party unknown, RCM) had NO view and NO paged reader. Only
--      gst_reco_rows - the book side - was summarised.
--   2. ISD could not be reported at all. It is the one bucket that cannot be
--      matched invoice-by-invoice, so it needs a totals-only control.
--   3. The statutory flags were stored per row but not filterable, so the
--      exceptions view had no way to drill from a count to the rows behind it.
--
-- Also persists the 2A column-mapping report, which the engine already builds
-- on every upload and which nothing was saving. That report is the Python's
-- `Column_Mapping` sheet and the whole reason 2b_CHECK_2A_COLUMNS.bat exists:
-- when a 2A arrives in a new layout it is the only evidence that "Taxable
-- Value" was read from the taxable-value column and not from something else.
-- ============================================================================

-- ------------------------------------------------------------ entities ---
-- our_gstins.csv carries a Type column that gst_entities had nowhere to put.
-- It matters: the Maharashtra ISD registration (27AAECJ6910B2ZV) is a
-- different animal from the 18 Regular ones - it receives invoices and
-- distributes credit, and its 2A sheet carries no 3B column at all.
alter table public.gst_entities
  add column if not exists reg_type text not null default 'Regular';

-- ------------------------------------------------------------- mapping ---
-- One JSONB per upload: [{sheet, status, rows, headerRow, fields{}, unmapped}]
alter table public.gst_uploads
  add column if not exists column_mapping jsonb;

comment on column public.gst_uploads.column_mapping is
  'Per-sheet column mapping report from parsePortalWorkbook/parseBooksWorkbook. '
  'Evidence of which source column was read as which field - read it before '
  'trusting a reconciliation built from a 2A in an unfamiliar layout.';

-- --------------------------------------------------------------- views ---
-- security_invoker so RLS applies to the querying user, exactly as in the
-- previous migration. Without it a view runs as its owner and bypasses RLS.

-- The mirror of gst_v_bucket_summary for the PORTAL side. Splitting on
-- why_unmatched is what makes Overview 6a/6b/6c reportable: the three are
-- completely different instructions and the total is meaningless on its own.
--   6a credit notes    - a LIABILITY. ITC claimed that the supplier credited.
--   6b party known     - verify, do NOT re-book. Usually a reference/period
--                        difference on a supplier already dealt with.
--   6c party unknown   - the only genuinely unclaimed credit.
create or replace view public.gst_v_portal_bucket_summary
with (security_invoker = on) as
select po.run_id,
       run.fy,
       po.bucket,
       coalesce(po.why_unmatched, '')   as why_unmatched,
       count(*)                         as rows,
       sum(p.igst)                      as igst,
       sum(p.cgst)                      as cgst,
       sum(p.sgst)                      as sgst,
       sum(p.cess)                      as cess,
       sum(p.total_tax)                 as total_tax,
       sum(p.taxable_value)             as taxable_value,
       count(*) filter (where p.gstin_cancelled is not null
                          and p.gstin_cancelled <> '') as cancelled_rows
  from public.gst_portal_only po
  join public.gst_portal     p   on p.id = po.portal_id
  join public.gst_reco_runs  run on run.id = po.run_id
 group by po.run_id, run.fy, po.bucket, coalesce(po.why_unmatched, '');

-- ISD control. The 2A ISD sheet holds invoices RECEIVED by the ISD
-- registration; the book entries are monthly distribution journals carrying no
-- invoice number and no supplier. They are opposite ends of the same mechanism
-- and CANNOT be matched invoice-by-invoice - reconcile on totals only.
create or replace view public.gst_v_isd_control
with (security_invoker = on) as
with received as (
  select po.run_id,
         count(*)                    as isd_2a_rows,
         coalesce(sum(p.total_tax), 0) as isd_2a_tax
    from public.gst_portal_only po
    join public.gst_portal p on p.id = po.portal_id
   where po.bucket = 'ISD'
   group by po.run_id
),
distributed as (
  select r.run_id,
         count(*) filter (where abs(b.isd) >= 0.01)        as isd_book_rows,
         coalesce(sum(b.isd), 0)                           as isd_book_tax,
         count(*) filter (where abs(b.reversal_17_5) >= 0.01) as rev175_rows,
         coalesce(sum(b.reversal_17_5), 0)                 as rev175_tax,
         coalesce(sum(b.other_gst), 0)                     as other_gst_tax,
         count(*) filter (where r.bucket = 'OUT_OF_SCOPE') as out_of_scope_rows,
         coalesce(sum(b.total_tax) filter (where r.bucket = 'OUT_OF_SCOPE'), 0)
                                                           as out_of_scope_tax
    from public.gst_reco_rows r
    join public.gst_books b on b.id = r.book_id
   group by r.run_id
)
select run.id                                as run_id,
       run.fy,
       coalesce(rc.isd_2a_rows, 0)           as isd_2a_rows,
       coalesce(rc.isd_2a_tax, 0)            as isd_2a_tax,
       coalesce(d.isd_book_rows, 0)          as isd_book_rows,
       coalesce(d.isd_book_tax, 0)           as isd_book_tax,
       coalesce(rc.isd_2a_tax, 0) - coalesce(d.isd_book_tax, 0) as isd_difference,
       coalesce(d.rev175_rows, 0)            as rev175_rows,
       coalesce(d.rev175_tax, 0)             as rev175_tax,
       coalesce(d.other_gst_tax, 0)          as other_gst_tax,
       coalesce(d.out_of_scope_rows, 0)      as out_of_scope_rows,
       coalesce(d.out_of_scope_tax, 0)       as out_of_scope_tax
  from public.gst_reco_runs run
  left join received    rc on rc.run_id = run.id
  left join distributed d  on d.run_id  = run.id;

comment on view public.gst_v_isd_control is
  'ISD received (2A) vs distributed (books). These are opposite ends of the ISD '
  'mechanism and cannot be matched invoice-by-invoice - reconcile on totals.';

-- ----------------------------------------------------------------- RPCs ---

-- Paged portal-side grid: In 2A only, RCM and ISD. The book side already had
-- gst_rpc_entries; without this the UI must pull every leftover portal row
-- (~4,500 for FY25-26) into the browser to show the first twenty.
-- SECURITY INVOKER (the default) so RLS applies.
create or replace function public.gst_rpc_portal_only(
  p_run_id        uuid,
  p_buckets       text[] default null,   -- PORTAL_ONLY | RCM | ISD
  p_why           text   default null,   -- prefix of why_unmatched (6a/6b/6c)
  p_our_gstin     text   default null,
  p_supplier      text   default null,   -- GSTIN, PAN or name
  p_doc_type      text   default null,
  p_return_period text   default null,
  p_cancelled     boolean default null,
  p_search        text   default null,   -- invoice no
  p_limit         integer default 100,
  p_offset        integer default 0
)
returns table (
  portal_only_id bigint, portal_id bigint, bucket text, why_unmatched text,
  our_gstin text, supplier_gstin text, supplier_pan text, supplier_name text,
  section text, doc_type text, invoice_no text, invoice_date date,
  return_period text, taxable_value numeric, igst numeric, cgst numeric,
  sgst numeric, cess numeric, total_tax numeric, invoice_value numeric,
  tax_rates text, rate_lines integer, rcm text, gstr3b_status text,
  gstr3b_effective text, gstr3b_basis text, gstin_cancelled text,
  cancelled_flag text, sheet text, source text,
  total_count bigint
)
language sql stable
set search_path to 'public'
as $$
  /* Columns are named, never wildcarded - see the note on gst_rpc_entries
   * below. The po.* aliases are prefixed because `bucket`, `why_unmatched` and
   * `cancelled_flag` would otherwise have to be told apart from the portal
   * columns by position. */
  with filtered as (
    select po.id             as portal_only_id,
           po.bucket         as po_bucket,
           po.why_unmatched  as po_why,
           po.cancelled_flag as po_cancelled,
           p.id, p.our_gstin, p.supplier_gstin, p.supplier_pan, p.supplier_name,
           p.section, p.doc_type, p.invoice_no, p.invoice_date, p.return_period,
           p.taxable_value, p.igst, p.cgst, p.sgst, p.cess, p.total_tax,
           p.invoice_value, p.tax_rates, p.rate_lines, p.rcm,
           p.gstr3b_status, p.gstr3b_effective, p.gstr3b_basis,
           p.gstin_cancelled, p.sheet, p.source
      from public.gst_portal_only po
      join public.gst_portal p on p.id = po.portal_id
     where po.run_id = p_run_id
       and (p_buckets       is null or po.bucket = any(p_buckets))
       and (p_why           is null or po.why_unmatched like p_why || '%')
       and (p_our_gstin     is null or p.our_gstin = p_our_gstin)
       and (p_doc_type      is null or p.doc_type ilike '%' || p_doc_type || '%')
       and (p_return_period is null or p.return_period = p_return_period)
       and (p_cancelled     is null or p_cancelled = (p.gstin_cancelled is not null
                                                  and p.gstin_cancelled <> ''))
       and (p_supplier      is null or p.supplier_gstin = p_supplier
                                    or p.supplier_pan   = p_supplier
                                    or p.supplier_name ilike '%' || p_supplier || '%')
       and (p_search        is null or p.invoice_no ilike '%' || p_search || '%')
  )
  select f.portal_only_id, f.id, f.po_bucket, f.po_why,
         f.our_gstin, f.supplier_gstin, f.supplier_pan, f.supplier_name,
         f.section, f.doc_type, f.invoice_no, f.invoice_date,
         f.return_period, f.taxable_value, f.igst, f.cgst,
         f.sgst, f.cess, f.total_tax, f.invoice_value,
         f.tax_rates, f.rate_lines, f.rcm, f.gstr3b_status,
         f.gstr3b_effective, f.gstr3b_basis, f.gstin_cancelled,
         f.po_cancelled, f.sheet, f.source,
         count(*) over () as total_count
    from filtered f
   order by abs(f.total_tax) desc, f.portal_only_id
   limit greatest(1, least(coalesce(p_limit, 100), 1000))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- Superseded originals: the B2B/CDN rows replaced by the B2BA/CDNA amending
-- them. Kept for audit and never offered to the matcher. Without this the
-- amendment trail is invisible in the module even though it is stored.
create or replace function public.gst_rpc_superseded(
  p_fy     text,
  p_limit  integer default 200,
  p_offset integer default 0
)
returns table (
  portal_id bigint, our_gstin text, supplier_gstin text, supplier_name text,
  section text, doc_type text, invoice_no text, invoice_date date,
  return_period text, orig_doc_no text, amendment_type text,
  taxable_value numeric, total_tax numeric, total_count bigint
)
language sql stable
set search_path to 'public'
as $$
  select p.id, p.our_gstin, p.supplier_gstin, p.supplier_name,
         p.section, p.doc_type, p.invoice_no, p.invoice_date,
         p.return_period, p.orig_doc_no, p.amendment_type,
         p.taxable_value, p.total_tax,
         count(*) over () as total_count
    from public.gst_portal p
   where p.fy = p_fy and p.is_superseded
   order by abs(p.total_tax) desc, p.id
   limit greatest(1, least(coalesce(p_limit, 200), 1000))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- --------------------------------------------- gst_rpc_entries + exception ---
-- Adding a parameter changes the signature, so the old function must be
-- DROPPED rather than replaced - `create or replace` with a different argument
-- list creates an OVERLOAD, and PostgREST would then reject every call as
-- ambiguous. Drop the exact old signature, then recreate.
drop function if exists public.gst_rpc_entries(
  uuid, text[], text[], text, text, text[], boolean, text, boolean,
  date, date, numeric, numeric, text, integer, integer);

create or replace function public.gst_rpc_entries(
  p_run_id     uuid,
  p_buckets    text[] default null,
  p_states     text[] default null,
  p_our_gstin  text   default null,
  p_supplier   text   default null,   -- matches GSTIN, PAN or name
  p_tiers      text[] default null,
  p_interbranch boolean default null,
  p_s164_state text   default null,
  p_flagged    boolean default null,  -- any statutory flag set
  p_exception  text   default null,   -- one specific flag, see below
  p_date_from  date   default null,
  p_date_to    date   default null,
  p_min_tax    numeric default null,
  p_max_tax    numeric default null,
  p_search     text   default null,
  p_limit      integer default 100,
  p_offset     integer default 0
)
returns table (
  reco_id bigint, book_id bigint, portal_id bigint, bucket text,
  reco_status text, match_tier text, state text, our_gstin text,
  voucher_date date, voucher_no text, voucher_type text,
  supplier_name text, supplier_gstin text, supplier_pan text,
  supplier_inv_no text, supplier_inv_date date,
  taxable_value numeric, igst numeric, cgst numeric, sgst numeric,
  cess numeric, isd numeric, reversal_17_5 numeric, other_gst numeric,
  total_tax numeric,
  portal_invoice_no text, portal_date date, portal_taxable numeric,
  portal_tax numeric, portal_return_period text, portal_3b_status text,
  portal_tax_rates text,
  tax_diff numeric, date_gap_days integer,
  sec16_4_due date, sec16_4_days integer, sec16_4_state text, rate_flag text,
  blocked_17_5_clause text, blocked_17_5_status text,
  payment_status text, payment_days integer,
  duplicate_group text, duplicate_count integer, cancelled_flag text,
  narration text, is_interbranch boolean,
  total_count bigint
)
language sql stable
set search_path to 'public'
as $$
  /* EVERY COLUMN IS NAMED, NOT WILDCARDED.
   * The previous version built this CTE with `select r.*, b.*`, which puts TWO
   * columns called is_interbranch into its output - gst_reco_rows and gst_books
   * both carry one - and any reference to it is then ambiguous. Adding a single
   * extra output column was enough to make Postgres refuse to create the
   * function. Naming the columns costs a few lines and removes the whole class
   * of failure; do not reintroduce the wildcards. */
  with filtered as (
    select r.id                    as reco_id,
           r.book_id, r.portal_id, r.bucket, r.reco_status, r.match_tier,
           r.tax_diff, r.date_gap_days,
           r.is_interbranch        as reco_interbranch,
           r.sec16_4_due, r.sec16_4_days, r.sec16_4_state, r.rate_flag,
           r.blocked_17_5_clause, r.blocked_17_5_status,
           r.payment_status, r.payment_days,
           r.duplicate_group, r.duplicate_count, r.cancelled_flag,
           b.state, b.our_gstin, b.voucher_date, b.voucher_no, b.voucher_type,
           b.supplier_name, b.supplier_gstin, b.supplier_pan,
           b.supplier_inv_no, b.supplier_inv_date,
           b.taxable_value, b.igst, b.cgst, b.sgst, b.cess,
           b.isd, b.reversal_17_5, b.other_gst, b.total_tax, b.narration,
           p.invoice_no            as p_invoice_no,
           p.invoice_date          as p_invoice_date,
           p.taxable_value         as p_taxable,
           p.total_tax             as p_tax,
           p.return_period         as p_return_period,
           p.gstr3b_status         as p_3b,
           p.tax_rates             as p_rates
      from public.gst_reco_rows r
      join public.gst_books  b on b.id = r.book_id
      left join public.gst_portal p on p.id = r.portal_id
     where r.run_id = p_run_id
       and (p_buckets     is null or r.bucket = any(p_buckets))
       and (p_states      is null or b.state = any(p_states))
       and (p_our_gstin   is null or b.our_gstin = p_our_gstin)
       and (p_tiers       is null or r.match_tier = any(p_tiers))
       and (p_interbranch is null or r.is_interbranch = p_interbranch)
       and (p_s164_state  is null or r.sec16_4_state = p_s164_state)
       and (p_date_from   is null or b.match_date >= p_date_from)
       and (p_date_to     is null or b.match_date <= p_date_to)
       and (p_min_tax     is null or b.total_tax >= p_min_tax)
       and (p_max_tax     is null or b.total_tax <= p_max_tax)
       and (p_supplier    is null or b.supplier_gstin = p_supplier
                                  or b.supplier_pan = p_supplier
                                  or b.supplier_name ilike '%' || p_supplier || '%')
       and (p_search      is null or b.supplier_inv_no ilike '%' || p_search || '%'
                                  or b.voucher_no      ilike '%' || p_search || '%'
                                  or b.narration       ilike '%' || p_search || '%')
       and (p_flagged     is null or p_flagged = (
              r.rate_flag is not null or r.blocked_17_5_clause is not null
              or r.cancelled_flag is not null or r.duplicate_count is not null))
       /* One specific overlay. 'payment_180' deliberately matches only a real
        * breach, never the "Awaiting payment data" placeholder every row
        * carries while gst_payments is empty - see the second proviso to
        * s.16(2) in the engine. */
       and (p_exception is null or case p_exception
              when 'rate'         then r.rate_flag is not null
              when 'blocked_17_5' then r.blocked_17_5_clause is not null
              when 'blocked_17_5_unreversed'
                                  then r.blocked_17_5_status = 'Flagged - no reversal booked'
              when 'duplicate'    then r.duplicate_count is not null
              when 'cancelled'    then r.cancelled_flag is not null
              when 's164_expired' then r.sec16_4_state = 'Expired'
              when 's164_closing' then r.sec16_4_state = 'Closing'
              when 'payment_180'  then r.payment_status like 'Unpaid beyond%'
              else true end)
  )
  select f.reco_id, f.book_id, f.portal_id, f.bucket,
         f.reco_status, f.match_tier, f.state, f.our_gstin,
         f.voucher_date, f.voucher_no, f.voucher_type,
         f.supplier_name, f.supplier_gstin, f.supplier_pan,
         f.supplier_inv_no, f.supplier_inv_date,
         f.taxable_value, f.igst, f.cgst, f.sgst, f.cess,
         f.isd, f.reversal_17_5, f.other_gst, f.total_tax,
         f.p_invoice_no, f.p_invoice_date, f.p_taxable, f.p_tax,
         f.p_return_period, f.p_3b, f.p_rates,
         f.tax_diff, f.date_gap_days,
         f.sec16_4_due, f.sec16_4_days, f.sec16_4_state, f.rate_flag,
         f.blocked_17_5_clause, f.blocked_17_5_status,
         f.payment_status, f.payment_days,
         f.duplicate_group, f.duplicate_count, f.cancelled_flag,
         f.narration, f.reco_interbranch,
         count(*) over () as total_count
    from filtered f
   order by f.total_tax desc, f.reco_id
   limit greatest(1, least(coalesce(p_limit, 100), 1000))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- ---------------------------------------------------------------- grants ---
-- Postgres grants EXECUTE to PUBLIC by default and `anon` INHERITS that, so
-- `revoke ... from anon` alone does nothing. Always revoke from PUBLIC first,
-- then re-grant explicitly. Same rule as the previous migration.
revoke all on function public.gst_rpc_portal_only(
  uuid, text[], text, text, text, text, text, boolean, text, integer, integer)
  from public, anon;
revoke all on function public.gst_rpc_superseded(text, integer, integer)
  from public, anon;
revoke all on function public.gst_rpc_entries(
  uuid, text[], text[], text, text, text[], boolean, text, boolean, text,
  date, date, numeric, numeric, text, integer, integer)
  from public, anon;

grant execute on function public.gst_rpc_portal_only(
  uuid, text[], text, text, text, text, text, boolean, text, integer, integer)
  to authenticated;
grant execute on function public.gst_rpc_superseded(text, integer, integer)
  to authenticated;
grant execute on function public.gst_rpc_entries(
  uuid, text[], text[], text, text, text[], boolean, text, boolean, text,
  date, date, numeric, numeric, text, integer, integer)
  to authenticated;
