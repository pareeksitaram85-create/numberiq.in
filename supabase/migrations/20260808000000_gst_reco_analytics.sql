-- ============================================================================
-- GST Reconciliation & ITC Analytics  -  module `gst-reco-analytics`
-- ============================================================================
-- Cumulative store for the reconciliation engine in
-- public/js/gst-reco-engine.js. Raw normalised rows accumulate month on month;
-- the engine re-runs over the whole pool on each upload, so an invoice the
-- supplier files late still matches on a later run instead of sitting in
-- "at risk" forever.
--
-- ROW KEYS ARE VALIDATED, NOT ASSUMED. Both were tested against the real
-- Join Commerce workbooks before being made unique:
--   gst_books.row_key   -> 0 duplicates across 31,642 + 6,521 rows. The shorter
--                          candidates fail: dropping supplier_gstin leaves 111
--                          collisions.
--   gst_portal.row_key  -> unique by construction after rate-line aggregation.
--                          `section` MUST stay in the key: dropping it collides
--                          82 amendment/original pairs, which is precisely the
--                          double-count resolveAmendments() exists to prevent.
--
-- Access mirrors the attendance module's established pattern
-- (att_email / att_has_access / att_is_admin).
-- ============================================================================

-- ---------------------------------------------------------------- access ---

create or replace function public.gst_email()
returns text
language sql stable
set search_path to 'public'
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.gst_has_access()
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select public.gst_email() = 'sitaram.pareek@igp.com'
      or coalesce((
           select ua.is_admin or 'gst-reco-analytics' = any(ua.allowed_modules)
             from public.user_access ua
            where lower(ua.email) = public.gst_email()
            limit 1), false);
$$;

create or replace function public.gst_is_admin()
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select public.gst_email() = 'sitaram.pareek@igp.com'
      or coalesce((select ua.is_admin from public.user_access ua
                    where lower(ua.email) = public.gst_email() limit 1), false);
$$;

-- ---------------------------------------------------------------- tables ---

-- Our own registrations. Seed from gst-reco/_engine/our_gstins.csv.
create table if not exists public.gst_entities (
  gstin       text primary key,
  pan         text not null,
  state_code  text not null,
  state_name  text,
  legal_name  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- One row per uploaded file. The sha256 unique constraint stops a
-- double-clicked upload; content-level de-duplication is the row_key's job.
create table if not exists public.gst_uploads (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('books', 'portal', 'payments')),
  source       text not null default '2A'
               check (source in ('2A', '2B', 'IMS', 'TALLY', 'LEDGER')),
  fy           text not null,
  period_from  date,
  period_to    date,
  filename     text not null,
  file_sha256  text not null unique,
  row_count    integer not null default 0,
  uploaded_by  text not null,
  uploaded_at  timestamptz not null default now(),
  notes        text
);

create table if not exists public.gst_books (
  id                  bigserial primary key,
  row_key             text not null unique,
  fy                  text not null,
  our_gstin           text,
  state               text,
  voucher_date        date,
  voucher_type        text,
  voucher_no          text,
  voucher_kind        text,
  supplier_name       text,
  supplier_gstin      text,
  supplier_gstin_raw  text,
  supplier_reg_type   text,
  supplier_pan        text,
  supplier_inv_no     text,
  supplier_inv_date   date,
  -- The supplier's invoice date where present, else our voucher date. 2A
  -- reports the supplier's date and the two differ across period ends.
  match_date          date,
  inv_norm            text,
  name_norm           text,
  taxable_value       numeric(18,2) not null default 0,
  cgst                numeric(18,2) not null default 0,
  sgst                numeric(18,2) not null default 0,
  igst                numeric(18,2) not null default 0,
  cess                numeric(18,2) not null default 0,
  isd                 numeric(18,2) not null default 0,
  reversal_17_5       numeric(18,2) not null default 0,
  other_gst           numeric(18,2) not null default 0,
  total_tax           numeric(18,2) not null default 0,
  total_invoice_value numeric(18,2) not null default 0,
  multi_state_vch     text,
  narration           text,
  is_interbranch      boolean not null default false,
  -- Out of scope is decided by the GST bucket (ISD / 17(5) reversal only),
  -- never by voucher type - see read_books() in the engine.
  out_of_scope        boolean not null default false,
  upload_id           uuid references public.gst_uploads(id) on delete set null,
  first_seen_at       timestamptz not null default now(),
  last_seen_at        timestamptz not null default now()
);

create index if not exists gst_books_fy_idx           on public.gst_books (fy);
create index if not exists gst_books_supplier_idx     on public.gst_books (supplier_gstin);
create index if not exists gst_books_pan_idx          on public.gst_books (supplier_pan);
create index if not exists gst_books_inv_idx          on public.gst_books (inv_norm);
create index if not exists gst_books_our_gstin_idx    on public.gst_books (our_gstin);
create index if not exists gst_books_state_idx        on public.gst_books (state);
create index if not exists gst_books_match_date_idx   on public.gst_books (match_date);
create index if not exists gst_books_upload_idx       on public.gst_books (upload_id);

-- Portal invoices AFTER rate-line aggregation: one row per invoice, not per
-- rate. GSTR-2A reports B2B rate-wise; books hold one row per invoice.
create table if not exists public.gst_portal (
  id                bigserial primary key,
  row_key           text not null unique,
  fy                text not null,
  source            text not null default '2A',
  sheet             text,
  our_gstin         text,
  supplier_gstin    text,
  supplier_pan      text,
  supplier_name     text,
  name_norm         text,
  section           text,
  doc_type          text,
  invoice_no        text,
  inv_norm          text,
  invoice_date      date,
  return_period     text,
  taxable_value     numeric(18,2) not null default 0,
  igst              numeric(18,2) not null default 0,
  cgst              numeric(18,2) not null default 0,
  sgst              numeric(18,2) not null default 0,
  cess              numeric(18,2) not null default 0,
  total_tax         numeric(18,2) not null default 0,
  invoice_value     numeric(18,2) not null default 0,
  tax_rates         text,
  rate_lines        integer not null default 1,
  rcm               text,
  -- 3B status is carried as source data and drives nothing. The portal's value
  -- is unreliable: QRMP filers report "Not Filed" for the first two months of
  -- every quarter and the ISD sheet has no 3B column at all.
  gstr3b_status     text,
  gstr3b_effective  text,
  gstr3b_basis      text,
  gstr1_status      text,
  filing_period     text,
  filing_date       text,
  orig_doc_no       text,
  amendment_type    text,
  gstin_cancelled   text,
  taxpayer_type     text,
  -- A B2B/CDN replaced by the B2BA/CDNA that amends it. Kept for audit, never
  -- offered to the matcher.
  is_superseded     boolean not null default false,
  upload_id         uuid references public.gst_uploads(id) on delete set null,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

create index if not exists gst_portal_fy_idx        on public.gst_portal (fy);
create index if not exists gst_portal_supplier_idx  on public.gst_portal (supplier_gstin);
create index if not exists gst_portal_pan_idx       on public.gst_portal (supplier_pan);
create index if not exists gst_portal_inv_idx       on public.gst_portal (inv_norm);
create index if not exists gst_portal_period_idx    on public.gst_portal (return_period);
create index if not exists gst_portal_date_idx      on public.gst_portal (invoice_date);
create index if not exists gst_portal_upload_idx    on public.gst_portal (upload_id);

-- Creditors ledger for the second proviso to s.16(2) (180-day rule). Empty
-- until a Tally payments export exists; the overlay reports "awaiting payment
-- data" rather than guessing while it is.
create table if not exists public.gst_payments (
  id              bigserial primary key,
  row_key         text not null unique,
  our_gstin       text,
  supplier_gstin  text,
  supplier_pan    text,
  supplier_inv_no text,
  inv_norm        text,
  paid_date       date,
  paid_amount     numeric(18,2),
  upload_id       uuid references public.gst_uploads(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists gst_payments_lookup_idx
  on public.gst_payments (our_gstin, supplier_gstin, inv_norm);

create table if not exists public.gst_reco_runs (
  id              uuid primary key default gen_random_uuid(),
  fy              text not null,
  run_at          timestamptz not null default now(),
  run_by          text not null,
  as_on           date not null,
  engine_version  text not null,
  params          jsonb not null default '{}'::jsonb,
  overview        jsonb,
  by_head         jsonb,
  statutory       jsonb,
  headline        jsonb,
  identity        jsonb,
  -- A run whose identity checks fail must never be written. The engine returns
  -- identity.ok; the store layer refuses to persist when it is false, because a
  -- broken identity means the ITC numbers are wrong.
  identity_ok     boolean not null,
  is_current      boolean not null default true
);

create index if not exists gst_reco_runs_fy_idx on public.gst_reco_runs (fy, run_at desc);
create unique index if not exists gst_reco_runs_current_idx
  on public.gst_reco_runs (fy) where is_current;

create table if not exists public.gst_reco_rows (
  id                   bigserial primary key,
  run_id               uuid   not null references public.gst_reco_runs(id) on delete cascade,
  book_id              bigint not null references public.gst_books(id)     on delete cascade,
  portal_id            bigint references public.gst_portal(id)             on delete set null,
  -- MATCHED | TIMING | AT_RISK | OUT_OF_SCOPE
  bucket               text not null,
  reco_status          text,
  match_tier           text,
  tax_diff             numeric(18,2),
  date_gap_days        integer,
  books_fy             text,
  portal_fy            text,
  is_interbranch       boolean not null default false,
  sec16_4_due          date,
  sec16_4_days         integer,
  sec16_4_state        text,
  rate_flag            text,
  blocked_17_5_clause  text,
  blocked_17_5_status  text,
  payment_status       text,
  payment_days         integer,
  duplicate_group      text,
  duplicate_count      integer,
  cancelled_flag       text,
  unique (run_id, book_id)
);

create index if not exists gst_reco_rows_run_bucket_idx on public.gst_reco_rows (run_id, bucket);
create index if not exists gst_reco_rows_book_idx       on public.gst_reco_rows (book_id);
create index if not exists gst_reco_rows_portal_idx     on public.gst_reco_rows (portal_id);
create index if not exists gst_reco_rows_s164_idx       on public.gst_reco_rows (run_id, sec16_4_state);

create table if not exists public.gst_portal_only (
  id             bigserial primary key,
  run_id         uuid   not null references public.gst_reco_runs(id) on delete cascade,
  portal_id      bigint not null references public.gst_portal(id)    on delete cascade,
  -- PORTAL_ONLY | RCM | ISD | SUPERSEDED
  bucket         text not null,
  why_unmatched  text,
  cancelled_flag text,
  unique (run_id, portal_id)
);

create index if not exists gst_portal_only_run_idx on public.gst_portal_only (run_id, bucket);

-- The working layer: chase state per vendor, carried across runs so a monthly
-- re-run does not wipe the follow-up history.
create table if not exists public.gst_vendor_actions (
  id             bigserial primary key,
  supplier_pan   text not null,
  supplier_gstin text not null default '',
  status         text not null default 'open'
                 check (status in ('open', 'chasing', 'escalated', 'resolved', 'written_off')),
  owner          text,
  due_date       date,
  remarks        text,
  updated_by     text,
  updated_at     timestamptz not null default now(),
  unique (supplier_pan, supplier_gstin)
);

-- ------------------------------------------------------------------- RLS ---
-- Every table is closed to anon and open only to an authenticated user the
-- module gate would also admit. Writes are admin-only except the vendor chase
-- workflow, which is the one thing a viewer is meant to update.

alter table public.gst_entities       enable row level security;
alter table public.gst_uploads        enable row level security;
alter table public.gst_books          enable row level security;
alter table public.gst_portal         enable row level security;
alter table public.gst_payments       enable row level security;
alter table public.gst_reco_runs      enable row level security;
alter table public.gst_reco_rows      enable row level security;
alter table public.gst_portal_only    enable row level security;
alter table public.gst_vendor_actions enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'gst_entities', 'gst_uploads', 'gst_books', 'gst_portal', 'gst_payments',
    'gst_reco_runs', 'gst_reco_rows', 'gst_portal_only'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.gst_has_access())',
      t || '_read', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.gst_is_admin())',
      t || '_write', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.gst_is_admin()) with check (public.gst_is_admin())',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.gst_is_admin())',
      t || '_delete', t);
  end loop;
end $$;

drop policy if exists gst_vendor_actions_read   on public.gst_vendor_actions;
drop policy if exists gst_vendor_actions_write  on public.gst_vendor_actions;
drop policy if exists gst_vendor_actions_update on public.gst_vendor_actions;
drop policy if exists gst_vendor_actions_delete on public.gst_vendor_actions;

create policy gst_vendor_actions_read on public.gst_vendor_actions
  for select to authenticated using (public.gst_has_access());
create policy gst_vendor_actions_write on public.gst_vendor_actions
  for insert to authenticated with check (public.gst_has_access());
create policy gst_vendor_actions_update on public.gst_vendor_actions
  for update to authenticated using (public.gst_has_access())
  with check (public.gst_has_access());
create policy gst_vendor_actions_delete on public.gst_vendor_actions
  for delete to authenticated using (public.gst_is_admin());

-- ----------------------------------------------------------------- views ---
-- security_invoker so RLS applies to the querying user. Without it a view runs
-- as its owner and quietly bypasses every policy above.

create or replace view public.gst_v_bucket_summary
with (security_invoker = on) as
select r.run_id,
       run.fy,
       r.bucket,
       count(*)                         as rows,
       sum(b.igst)                      as igst,
       sum(b.cgst)                      as cgst,
       sum(b.sgst)                      as sgst,
       sum(b.cess)                      as cess,
       sum(b.isd + b.reversal_17_5 + b.other_gst) as special,
       sum(b.total_tax)                 as total_tax,
       sum(b.taxable_value)             as taxable_value
  from public.gst_reco_rows r
  join public.gst_books     b   on b.id = r.book_id
  join public.gst_reco_runs run on run.id = r.run_id
 group by r.run_id, run.fy, r.bucket;

-- Ranked by ITC at risk - the number a partner acts on. Credit notes are
-- surfaced separately because they are a liability, not an opportunity.
create or replace view public.gst_v_vendor_summary
with (security_invoker = on) as
with book_side as (
  select r.run_id,
         b.supplier_pan,
         max(b.supplier_name) as supplier_name,
         count(*)                                                as book_rows,
         sum(b.total_tax)                                        as book_tax,
         count(*) filter (where r.bucket = 'AT_RISK')            as at_risk_rows,
         coalesce(sum(b.total_tax) filter (where r.bucket = 'AT_RISK'), 0) as at_risk_tax,
         count(*) filter (where r.bucket = 'MATCHED')            as matched_rows,
         coalesce(sum(b.total_tax) filter (where r.bucket = 'MATCHED'), 0)  as matched_tax,
         count(*) filter (where r.bucket = 'TIMING')             as timing_rows,
         coalesce(sum(b.total_tax) filter (where r.bucket = 'TIMING'), 0)   as timing_tax
    from public.gst_reco_rows r
    join public.gst_books b on b.id = r.book_id
   group by r.run_id, b.supplier_pan
),
portal_side as (
  select po.run_id,
         p.supplier_pan,
         count(*) filter (where po.bucket = 'PORTAL_ONLY'
                            and p.doc_type like '%CREDIT%')      as unbooked_cn_rows,
         coalesce(sum(p.total_tax) filter (where po.bucket = 'PORTAL_ONLY'
                            and p.doc_type like '%CREDIT%'), 0)  as unbooked_cn_tax,
         count(*) filter (where po.bucket = 'PORTAL_ONLY'
                            and p.doc_type not like '%CREDIT%')  as unclaimed_rows,
         coalesce(sum(p.total_tax) filter (where po.bucket = 'PORTAL_ONLY'
                            and p.doc_type not like '%CREDIT%'), 0) as unclaimed_tax
    from public.gst_portal_only po
    join public.gst_portal p on p.id = po.portal_id
   group by po.run_id, p.supplier_pan
)
select coalesce(b.run_id, p.run_id)           as run_id,
       coalesce(b.supplier_pan, p.supplier_pan) as supplier_pan,
       b.supplier_name,
       coalesce(b.book_rows, 0)        as book_rows,
       coalesce(b.book_tax, 0)         as book_tax,
       coalesce(b.matched_rows, 0)     as matched_rows,
       coalesce(b.matched_tax, 0)      as matched_tax,
       coalesce(b.timing_rows, 0)      as timing_rows,
       coalesce(b.timing_tax, 0)       as timing_tax,
       coalesce(b.at_risk_rows, 0)     as at_risk_rows,
       coalesce(b.at_risk_tax, 0)      as at_risk_tax,
       coalesce(p.unbooked_cn_rows, 0) as unbooked_cn_rows,
       coalesce(p.unbooked_cn_tax, 0)  as unbooked_cn_tax,
       coalesce(p.unclaimed_rows, 0)   as unclaimed_rows,
       coalesce(p.unclaimed_tax, 0)    as unclaimed_tax,
       va.status  as action_status,
       va.owner   as action_owner,
       va.due_date as action_due_date,
       va.remarks as action_remarks
  from book_side b
  full outer join portal_side p
    on p.run_id = b.run_id and p.supplier_pan = b.supplier_pan
  left join public.gst_vendor_actions va
    on va.supplier_pan = coalesce(b.supplier_pan, p.supplier_pan)
   and va.supplier_gstin = '';

create or replace view public.gst_v_period_summary
with (security_invoker = on) as
select r.run_id,
       run.fy,
       date_trunc('month', b.match_date)::date as period,
       r.bucket,
       count(*)          as rows,
       sum(b.total_tax)  as total_tax,
       sum(b.igst) as igst, sum(b.cgst) as cgst, sum(b.sgst) as sgst, sum(b.cess) as cess
  from public.gst_reco_rows r
  join public.gst_books     b   on b.id = r.book_id
  join public.gst_reco_runs run on run.id = r.run_id
 where b.match_date is not null
 group by r.run_id, run.fy, date_trunc('month', b.match_date), r.bucket;

create or replace view public.gst_v_state_summary
with (security_invoker = on) as
select r.run_id,
       run.fy,
       b.state,
       b.our_gstin,
       count(*)                                                as rows,
       sum(b.total_tax)                                        as book_tax,
       coalesce(sum(b.total_tax) filter (where r.bucket = 'MATCHED'), 0) as matched_tax,
       coalesce(sum(b.total_tax) filter (where r.bucket = 'TIMING'), 0)  as timing_tax,
       coalesce(sum(b.total_tax) filter (where r.bucket = 'AT_RISK'), 0) as at_risk_tax
  from public.gst_reco_rows r
  join public.gst_books     b   on b.id = r.book_id
  join public.gst_reco_runs run on run.id = r.run_id
 group by r.run_id, run.fy, b.state, b.our_gstin;

-- s.16(4): what is still claimable, what is closing, what has lapsed.
create or replace view public.gst_v_sec16_4
with (security_invoker = on) as
select r.run_id,
       run.fy,
       r.sec16_4_state,
       r.sec16_4_due,
       count(*)         as rows,
       sum(b.total_tax) as total_tax
  from public.gst_reco_rows r
  join public.gst_books     b   on b.id = r.book_id
  join public.gst_reco_runs run on run.id = r.run_id
 where r.bucket in ('AT_RISK', 'TIMING')
 group by r.run_id, run.fy, r.sec16_4_state, r.sec16_4_due;

-- ------------------------------------------------------------------ RPCs ---

-- Paged, filtered entry grid. Kept server-side so the browser pulls the slice
-- on screen rather than 40k rows. SECURITY INVOKER (the default) so RLS applies.
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
  cess numeric, total_tax numeric,
  portal_invoice_no text, portal_date date, portal_taxable numeric,
  portal_tax numeric, portal_return_period text, portal_3b_status text,
  tax_diff numeric, date_gap_days integer,
  sec16_4_due date, sec16_4_state text, rate_flag text,
  blocked_17_5_clause text, blocked_17_5_status text,
  payment_status text, duplicate_count integer, cancelled_flag text,
  narration text, is_interbranch boolean,
  total_count bigint
)
language sql stable
set search_path to 'public'
as $$
  with filtered as (
    select r.id as reco_id, r.*, b.*, p.invoice_no as p_invoice_no,
           p.invoice_date as p_invoice_date, p.taxable_value as p_taxable,
           p.total_tax as p_tax, p.return_period as p_return_period,
           p.gstr3b_status as p_3b
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
  )
  select f.reco_id, f.book_id, f.portal_id, f.bucket,
         f.reco_status, f.match_tier, f.state, f.our_gstin,
         f.voucher_date, f.voucher_no, f.voucher_type,
         f.supplier_name, f.supplier_gstin, f.supplier_pan,
         f.supplier_inv_no, f.supplier_inv_date,
         f.taxable_value, f.igst, f.cgst, f.sgst, f.cess, f.total_tax,
         f.p_invoice_no, f.p_invoice_date, f.p_taxable, f.p_tax,
         f.p_return_period, f.p_3b,
         f.tax_diff, f.date_gap_days,
         f.sec16_4_due, f.sec16_4_state, f.rate_flag,
         f.blocked_17_5_clause, f.blocked_17_5_status,
         f.payment_status, f.duplicate_count, f.cancelled_flag,
         f.narration, f.is_interbranch,
         count(*) over () as total_count
    from filtered f
   order by f.total_tax desc, f.reco_id
   limit greatest(1, least(coalesce(p_limit, 100), 1000))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- What changed between two runs of the same FY. Without this a monthly upload
-- just regenerates a full report and nobody can see movement.
create or replace function public.gst_rpc_run_delta(p_run_id uuid, p_prev_run_id uuid)
returns table (movement text, rows bigint, total_tax numeric)
language sql stable
set search_path to 'public'
as $$
  with cur as (
    select r.book_id, r.bucket, b.total_tax
      from public.gst_reco_rows r join public.gst_books b on b.id = r.book_id
     where r.run_id = p_run_id
  ),
  prev as (
    select r.book_id, r.bucket
      from public.gst_reco_rows r where r.run_id = p_prev_run_id
  )
  select case
           when p.book_id is null                                    then 'NEW_ROW'
           when c.bucket = 'MATCHED' and p.bucket <> 'MATCHED'       then 'NEWLY_MATCHED'
           when c.bucket <> 'MATCHED' and p.bucket = 'MATCHED'       then 'NEWLY_UNMATCHED'
           when c.bucket = 'AT_RISK' and p.bucket = 'AT_RISK'        then 'STILL_AT_RISK'
           else 'UNCHANGED'
         end                as movement,
         count(*)           as rows,
         sum(c.total_tax)   as total_tax
    from cur c
    left join prev p on p.book_id = c.book_id
   group by 1;
$$;

-- Retention: keep the current run plus `p_keep - 1` prior ones per FY, so
-- deltas still work without carrying every 40k-row run forever.
create or replace function public.gst_prune_runs(p_fy text, p_keep integer default 3)
returns integer
language plpgsql security definer
set search_path to 'public'
as $$
declare deleted integer;
begin
  if not public.gst_is_admin() then
    raise exception 'gst_prune_runs: admin only';
  end if;
  with keep as (
    select id from public.gst_reco_runs
     where fy = p_fy order by run_at desc limit greatest(1, p_keep)
  )
  delete from public.gst_reco_runs
   where fy = p_fy and id not in (select id from keep);
  get diagnostics deleted = row_count;
  return deleted;
end $$;

-- ---------------------------------------------------------------- grants ---
-- Postgres grants EXECUTE on a new function to PUBLIC by default, and `anon`
-- INHERITS that. `revoke ... from anon` alone therefore does nothing - the
-- Supabase linter caught gst_prune_runs (which DELETES runs) still reachable by
-- a signed-out caller. Always revoke from PUBLIC, then re-grant explicitly.
revoke all on function public.gst_email()                      from public, anon;
revoke all on function public.gst_has_access()                 from public, anon;
revoke all on function public.gst_is_admin()                   from public, anon;
revoke all on function public.gst_prune_runs(text, integer)    from public, anon;
revoke all on function public.gst_rpc_run_delta(uuid, uuid)    from public, anon;
revoke all on function public.gst_rpc_entries(uuid, text[], text[], text, text, text[], boolean, text, boolean, date, date, numeric, numeric, text, integer, integer) from public, anon;

-- `authenticated` MUST keep EXECUTE on the access helpers: RLS policy
-- expressions are evaluated as the querying role, so without this every gst_*
-- policy errors instead of filtering and the module reads nothing.
grant execute on function public.gst_email()                   to authenticated;
grant execute on function public.gst_has_access()              to authenticated;
grant execute on function public.gst_is_admin()                to authenticated;
grant execute on function public.gst_prune_runs(text, integer) to authenticated;
grant execute on function public.gst_rpc_run_delta(uuid, uuid) to authenticated;
grant execute on function public.gst_rpc_entries(uuid, text[], text[], text, text, text[], boolean, text, boolean, date, date, numeric, numeric, text, integer, integer) to authenticated;

-- Supabase's linter still reports these three as "signed-in users can execute a
-- SECURITY DEFINER function". That is intentional and cannot be revoked: the
-- policies depend on them. They disclose nothing - each returns a boolean about
-- the caller's own access - and gst_prune_runs re-checks gst_is_admin() before
-- deleting anything.
