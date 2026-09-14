-- =========================================================================
-- I App — Accounting / Financial Ledger
-- =========================================================================
-- STATUS: PROPOSED MIGRATION FILE ONLY. NOT APPLIED TO SUPABASE.
-- This file has not been run against any database, test or production.
-- Applying it is an explicit, separate, future step — see
-- ACCOUNTING-IMPLEMENTATION-REPORT.md for exactly what remains before
-- that can happen.
--
-- Verified live facts this migration is designed against (read-only audit,
-- prior task): iapp.payments currently has ZERO rows. No historical
-- backfill is needed or performed by this file — the ledger starts empty.
-- Opening balances, if wanted, are entered later through the normal
-- opening-balance RPC, not fabricated here.
--
-- Additive only. Does not touch: iapp.patients, iapp.visits,
-- iapp.examinations, iapp.diagnoses, iapp.prescriptions, iapp.payments,
-- iapp.services, iapp.clinics, iapp.doctors, or any clinical enum.
-- =========================================================================

-- ── shared authorization helper ──────────────────────────────────────────
-- Single place the doctor/admin rule lives, reused by every RLS policy and
-- every RPC below. Current, verified authorization decision: doctor has
-- the same clinic scope as admin (all clinics) — profiles.clinic_id is
-- single-valued and cannot represent "doctor A restricted to clinics X,Y"
-- and clinic_schedules is scheduling data, not an access-control list, so
-- no reliable narrower scope exists to enforce. Documented, not invented.
create or replace function iapp.is_doctor_or_admin()
returns boolean
language sql stable security invoker
set search_path = pg_catalog, iapp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('doctor', 'admin')
  );
$$;

create or replace function iapp.assert_doctor_or_admin()
returns void
language plpgsql security invoker
set search_path = pg_catalog, iapp
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not iapp.is_doctor_or_admin() then
    raise exception 'not authorized: doctor or admin role required';
  end if;
end;
$$;

-- =========================================================================
-- 1. PAYMENT METHODS
-- =========================================================================
create table iapp.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name_ar     text not null,
  name_en     text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  updated_by  uuid
);

insert into iapp.payment_methods (code, name_ar, name_en, sort_order) values
  ('cash', 'نقدي', 'Cash', 1),
  ('card', 'بطاقة', 'Card', 2),
  ('bank_transfer', 'تحويل بنكي', 'Bank Transfer', 3),
  ('insurance', 'تأمين', 'Insurance', 4),
  ('other', 'أخرى', 'Other', 5);

-- =========================================================================
-- 2. EXPENSE CATEGORIES
-- =========================================================================
create table iapp.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name_ar     text not null,
  name_en     text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  updated_by  uuid
);

insert into iapp.expense_categories (code, name_ar, name_en, sort_order) values
  ('rent', 'إيجار', 'Rent', 1),
  ('utilities', 'مرافق', 'Utilities', 2),
  ('salaries', 'رواتب', 'Salaries', 3),
  ('supplies', 'مستلزمات طبية', 'Medical Supplies', 4),
  ('maintenance', 'صيانة', 'Maintenance', 5),
  ('marketing', 'تسويق', 'Marketing', 6),
  ('equipment', 'أجهزة', 'Equipment', 7),
  ('software', 'برمجيات', 'Software', 8),
  ('transport', 'مواصلات', 'Transportation', 9),
  ('other', 'أخرى', 'Other', 10);

-- =========================================================================
-- 3. ACCOUNTS / CASHBOXES
-- =========================================================================
create table iapp.accounts (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid references iapp.clinics(id),   -- null = shared account
  code             text not null unique,
  name_ar          text not null,
  name_en          text,
  kind             text not null check (kind in ('cash', 'bank', 'other')),
  currency         char(3) not null default 'EGP',
  allow_overdraft  boolean not null default false,
  is_active        boolean not null default true,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid,
  updated_by       uuid
);

-- No accounts are seeded here — "do not create duplicate accounts
-- automatically if equivalent accounts already exist" and none are
-- verified to exist today (no financial tables existed before this
-- migration). Creating the real "Cash — Damanhour" etc. accounts is a
-- one-time setup step through the Accounts admin screen after this
-- migration is applied, not fabricated by the migration itself.

-- =========================================================================
-- 4. THE LEDGER
-- =========================================================================
create type iapp.financial_transaction_type as enum (
  'opening_balance', 'revenue', 'expense', 'refund',
  'transfer_out', 'transfer_in',
  'adjustment_increase', 'adjustment_decrease'
);

create table iapp.financial_transactions (
  id                     uuid primary key default gen_random_uuid(),
  transaction_type       iapp.financial_transaction_type not null,

  account_id             uuid not null references iapp.accounts(id),
  clinic_id              uuid references iapp.clinics(id),

  amount                 numeric(12,2) not null,
  currency               char(3) not null,
  transaction_date       date not null default current_date,

  description            text,
  reason                 text,
  metadata               jsonb,

  patient_id             uuid references iapp.patients(id),
  visit_id               uuid references iapp.visits(id),
  service_id             uuid references iapp.services(id),
  expense_category_id    uuid references iapp.expense_categories(id),
  payment_method_id      uuid references iapp.payment_methods(id),

  receipt_no             text unique,
  related_transaction_id uuid references iapp.financial_transactions(id),
  legacy_payment_id      uuid references iapp.payments(id),

  created_at             timestamptz not null default now(),
  created_by             uuid not null default auth.uid(),

  constraint chk_amount_sign
    check (transaction_type = 'opening_balance' or amount > 0),
  constraint chk_transaction_date_not_future
    check (transaction_date <= current_date),
  constraint chk_expense_category
    check (expense_category_id is null or transaction_type = 'expense'),
  constraint chk_service_only_on_revenue_refund
    check (service_id is null or transaction_type in ('revenue', 'refund')),
  constraint chk_patient_only_on_revenue_refund
    check (patient_id is null or transaction_type in ('revenue', 'refund')),
  constraint chk_related_txn_required
    check (related_transaction_id is not null
           or transaction_type not in ('refund', 'transfer_in'))
);

-- at most one opening_balance row per account
create unique index uq_one_opening_balance_per_account
  on iapp.financial_transactions (account_id)
  where transaction_type = 'opening_balance';

create index idx_fintxn_clinic_txndate  on iapp.financial_transactions (clinic_id, transaction_date);
create index idx_fintxn_account_txndate on iapp.financial_transactions (account_id, transaction_date);
create index idx_fintxn_patient         on iapp.financial_transactions (patient_id);
create index idx_fintxn_visit           on iapp.financial_transactions (visit_id);
create index idx_fintxn_type            on iapp.financial_transactions (transaction_type);
create index idx_fintxn_legacy_payment  on iapp.financial_transactions (legacy_payment_id);

-- ── immutability: NO update, NO delete, ever. Corrections are always a
--    new compensating transaction (adjustment_increase/decrease), never a
--    mutation of the original row. This is stricter than a "void" status
--    flip — there is no status column on this table at all. ────────────
create or replace function iapp.reject_financial_transaction_mutation()
returns trigger language plpgsql
set search_path = pg_catalog, iapp
as $$
begin
  raise exception
    'iapp.financial_transactions rows are immutable — use a compensating transaction instead of %',
    tg_op;
end;
$$;

create trigger trg_fintxn_no_update
  before update on iapp.financial_transactions
  for each row execute function iapp.reject_financial_transaction_mutation();

create trigger trg_fintxn_no_delete
  before delete on iapp.financial_transactions
  for each row execute function iapp.reject_financial_transaction_mutation();

-- ── account/clinic/currency consistency + overdraft, one combined
--    BEFORE INSERT trigger so every insert path (any current or future
--    RPC) is covered identically, not duplicated per-RPC ───────────────
create or replace function iapp.enforce_transaction_account_rules()
returns trigger language plpgsql
set search_path = pg_catalog, iapp
as $$
declare
  acct record;
  v_balance numeric;
begin
  select clinic_id, currency, is_active, allow_overdraft into acct
    from iapp.accounts where id = new.account_id for update;   -- lock

  if acct is null then
    raise exception 'account % does not exist', new.account_id;
  end if;
  if not acct.is_active then
    raise exception 'account % is not active', new.account_id;
  end if;
  if acct.currency is distinct from new.currency then
    raise exception 'transaction currency (%) does not match account currency (%)',
      new.currency, acct.currency;
  end if;
  if acct.clinic_id is not null and new.clinic_id is distinct from acct.clinic_id then
    raise exception
      'transaction clinic (%) does not match its clinic-specific account''s clinic (%)',
      new.clinic_id, acct.clinic_id;
  end if;
  -- shared accounts (acct.clinic_id is null): new.clinic_id may be null or
  -- any clinic — both valid, no further check.

  if new.transaction_type in ('expense', 'refund', 'transfer_out', 'adjustment_decrease')
     and not acct.allow_overdraft
  then
    select coalesce(sum(case
      when t.transaction_type = 'opening_balance' then t.amount
      when t.transaction_type in ('revenue', 'transfer_in', 'adjustment_increase') then t.amount
      when t.transaction_type in ('expense', 'refund', 'transfer_out', 'adjustment_decrease') then -t.amount
      else 0
    end), 0) into v_balance
    from iapp.financial_transactions t
    where t.account_id = new.account_id;

    if v_balance < new.amount then
      raise exception 'insufficient balance in account % (has %, needs %)',
        new.account_id, v_balance, new.amount;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_fintxn_account_rules
  before insert on iapp.financial_transactions
  for each row execute function iapp.enforce_transaction_account_rules();

-- =========================================================================
-- 5. DAILY CLOSING
-- =========================================================================
create table iapp.daily_closings (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid references iapp.clinics(id),   -- null = global/shared scope
  closing_date  date not null,
  closed_at     timestamptz not null default now(),
  closed_by     uuid not null default auth.uid(),
  notes         text,
  created_at    timestamptz not null default now()
);

-- one closing per (clinic, date); a partial index handles the null-clinic
-- (global) case, since plain UNIQUE treats NULLs as distinct from each other
create unique index uq_daily_closing_scoped
  on iapp.daily_closings (clinic_id, closing_date)
  where clinic_id is not null;
create unique index uq_daily_closing_global
  on iapp.daily_closings (closing_date)
  where clinic_id is null;

-- daily_closings is also immutable — a closing is a permanent record.
-- KNOWN LIMITATION (documented in ACCOUNTING-ARCHITECTURE.md): if a
-- closing is created in error, there is currently no correction path —
-- the unique indexes above block re-closing the same date/clinic, and
-- there is no update/delete. Deliberately not over-engineered with a
-- void/supersede mechanism in this pass.
create trigger trg_closing_no_update
  before update on iapp.daily_closings
  for each row execute function iapp.reject_financial_transaction_mutation();
create trigger trg_closing_no_delete
  before delete on iapp.daily_closings
  for each row execute function iapp.reject_financial_transaction_mutation();

-- a closed (clinic, date) blocks new/backdated transactions attributed to
-- that clinic on or before the closing date. A NULL-clinic transaction is
-- checked against a NULL-clinic (global) closing only.
create or replace function iapp.enforce_closed_period()
returns trigger language plpgsql
set search_path = pg_catalog, iapp
as $$
declare v_blocked boolean;
begin
  select exists (
    select 1 from iapp.daily_closings
    where clinic_id is not distinct from new.clinic_id
      and closing_date >= new.transaction_date
  ) into v_blocked;
  if v_blocked then
    raise exception
      'clinic % has a closing on or after % — transactions cannot be posted on or before a closed date',
      coalesce(new.clinic_id::text, '(shared)'), new.transaction_date;
  end if;
  return new;
end;
$$;

create trigger trg_fintxn_closed_period
  before insert on iapp.financial_transactions
  for each row execute function iapp.enforce_closed_period();

-- =========================================================================
-- 6. RECEIPT NUMBERING — per clinic, per year, row-locked counter
-- =========================================================================
create table iapp.receipt_counters (
  clinic_id    uuid references iapp.clinics(id),   -- null = shared "GEN" bucket
  year         int not null,
  last_number  int not null default 0,
  primary key (clinic_id, year)
);

create or replace function iapp.next_receipt_no(p_clinic_id uuid)
returns text
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare
  v_year int := extract(year from now())::int;
  v_next int;
  v_prefix text;
begin
  perform iapp.assert_doctor_or_admin();

  insert into iapp.receipt_counters (clinic_id, year, last_number)
    values (p_clinic_id, v_year, 0)
    on conflict (clinic_id, year) do nothing;

  update iapp.receipt_counters
    set last_number = last_number + 1
    where clinic_id is not distinct from p_clinic_id and year = v_year
    returning last_number into v_next;

  if p_clinic_id is null then
    v_prefix := 'GEN';
  else
    select upper(code) into v_prefix from iapp.clinics where id = p_clinic_id;
    v_prefix := coalesce(v_prefix, 'GEN');
  end if;

  return v_prefix || '-' || v_year || '-' || lpad(v_next::text, 6, '0');
end;
$$;
revoke execute on function iapp.next_receipt_no(uuid) from public;
grant execute on function iapp.next_receipt_no(uuid) to authenticated;

-- =========================================================================
-- 7. BALANCE / SUMMARY VIEWS — derived only, security_invoker so RLS is
--    never bypassed by reading through a view
-- =========================================================================
create view iapp.v_account_balances with (security_invoker = true) as
select
  a.id as account_id, a.clinic_id, a.name_ar, a.currency,
  coalesce(sum(case
    when t.transaction_type = 'opening_balance' then t.amount
    when t.transaction_type in ('revenue', 'transfer_in', 'adjustment_increase') then t.amount
    when t.transaction_type in ('expense', 'refund', 'transfer_out', 'adjustment_decrease') then -t.amount
    else 0
  end), 0) as current_balance
from iapp.accounts a
left join iapp.financial_transactions t on t.account_id = a.id
group by a.id, a.clinic_id, a.name_ar, a.currency;

create view iapp.v_daily_financial_summary with (security_invoker = true) as
select
  clinic_id, transaction_date as day,
  sum(amount) filter (where transaction_type = 'revenue')  as revenue,
  sum(amount) filter (where transaction_type = 'expense')  as expenses,
  sum(amount) filter (where transaction_type = 'refund')   as refunds,
  sum(amount) filter (where transaction_type = 'revenue')
    - sum(amount) filter (where transaction_type = 'expense')
    - sum(amount) filter (where transaction_type = 'refund') as net
from iapp.financial_transactions
group by clinic_id, transaction_date;

create view iapp.v_clinic_financial_summary with (security_invoker = true) as
select
  c.id as clinic_id, c.name_ar,
  sum(t.amount) filter (where t.transaction_type = 'revenue')  as revenue,
  sum(t.amount) filter (where t.transaction_type = 'expense')  as expenses,
  sum(t.amount) filter (where t.transaction_type = 'refund')   as refunds
from iapp.clinics c
left join iapp.financial_transactions t on t.clinic_id = c.id
group by c.id, c.name_ar;

create view iapp.v_payment_method_summary with (security_invoker = true) as
select
  pm.id as payment_method_id, pm.name_ar,
  sum(t.amount) as total_revenue, count(*) as transaction_count
from iapp.payment_methods pm
join iapp.financial_transactions t
  on t.payment_method_id = pm.id and t.transaction_type = 'revenue'
group by pm.id, pm.name_ar;

create view iapp.v_service_revenue_summary with (security_invoker = true) as
select
  s.id as service_id, s.name_ar,
  sum(t.amount) as total_revenue, count(*) as transaction_count
from iapp.services s
join iapp.financial_transactions t
  on t.service_id = s.id and t.transaction_type = 'revenue'
group by s.id, s.name_ar;

-- Deliberately NOT created: an "outstanding balances" view. Revenue means
-- collected money in this model; there is no receivable/charge concept to
-- report against. See ACCOUNTING-ARCHITECTURE.md.

-- =========================================================================
-- 8. ATOMIC RPCs — every ledger write goes through one of these; none of
--    them is a bare client-side INSERT, per the "never two independent
--    frontend inserts" requirement.
-- =========================================================================

-- 8a. Record a patient payment: writes iapp.payments (compatibility layer)
--     AND iapp.financial_transactions (source of truth) atomically, so a
--     network failure can't leave one written without the other.
create or replace function iapp.record_patient_payment(
  p_patient_id uuid, p_visit_id uuid, p_clinic_id uuid, p_service_id uuid,
  p_account_id uuid, p_amount numeric, p_payment_method_id uuid,
  p_notes text, p_transaction_date date default current_date
) returns table (payment_id uuid, transaction_id uuid, receipt_no text)
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare
  v_payment_id uuid;
  v_txn_id uuid;
  v_receipt text;
  v_currency char(3);
  v_legacy_method iapp.payment_method;
  v_method_code text;
begin
  perform iapp.assert_doctor_or_admin();

  if p_amount is null or p_amount <= 0 then
    raise exception 'payment amount must be positive';
  end if;
  if p_account_id is null then
    raise exception 'an account must be selected';
  end if;

  select currency into v_currency from iapp.accounts where id = p_account_id;
  if v_currency is null then raise exception 'account % not found', p_account_id; end if;

  select code into v_method_code from iapp.payment_methods where id = p_payment_method_id;
  v_legacy_method := case v_method_code
    when 'bank_transfer' then 'transfer'::iapp.payment_method
    when 'cash' then 'cash'::iapp.payment_method
    when 'card' then 'card'::iapp.payment_method
    when 'insurance' then 'insurance'::iapp.payment_method
    else 'other'::iapp.payment_method
  end;

  v_receipt := iapp.next_receipt_no(p_clinic_id);

  insert into iapp.payments
    (patient_id, visit_id, clinic_id, service_id, amount, amount_paid, discount,
     currency, method, status, receipt_no, notes, paid_at)
  values
    (p_patient_id, p_visit_id, p_clinic_id, p_service_id, p_amount, p_amount, 0,
     v_currency, v_legacy_method, 'paid', v_receipt, p_notes, now())
  returning id into v_payment_id;

  insert into iapp.financial_transactions
    (transaction_type, account_id, clinic_id, amount, currency, transaction_date,
     description, patient_id, visit_id, service_id, payment_method_id, receipt_no,
     legacy_payment_id)
  values
    ('revenue', p_account_id, p_clinic_id, p_amount, v_currency, p_transaction_date,
     p_notes, p_patient_id, p_visit_id, p_service_id, p_payment_method_id, v_receipt,
     v_payment_id)
  returning id into v_txn_id;

  return query select v_payment_id, v_txn_id, v_receipt;
end;
$$;
revoke execute on function iapp.record_patient_payment(
  uuid, uuid, uuid, uuid, uuid, numeric, uuid, text, date) from public;
grant execute on function iapp.record_patient_payment(
  uuid, uuid, uuid, uuid, uuid, numeric, uuid, text, date) to authenticated;

-- 8b. Non-patient / general revenue (no payments-table linkage)
create or replace function iapp.create_revenue(
  p_account_id uuid, p_clinic_id uuid, p_amount numeric,
  p_patient_id uuid, p_visit_id uuid, p_service_id uuid,
  p_payment_method_id uuid, p_description text,
  p_transaction_date date default current_date
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare v_id uuid; v_currency char(3);
begin
  perform iapp.assert_doctor_or_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  select currency into v_currency from iapp.accounts where id = p_account_id;
  if v_currency is null then raise exception 'account % not found', p_account_id; end if;

  insert into iapp.financial_transactions
    (transaction_type, account_id, clinic_id, amount, currency, transaction_date,
     description, patient_id, visit_id, service_id, payment_method_id)
  values
    ('revenue', p_account_id, p_clinic_id, p_amount, v_currency, p_transaction_date,
     p_description, p_patient_id, p_visit_id, p_service_id, p_payment_method_id)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function iapp.create_revenue(
  uuid, uuid, numeric, uuid, uuid, uuid, uuid, text, date) from public;
grant execute on function iapp.create_revenue(
  uuid, uuid, numeric, uuid, uuid, uuid, uuid, text, date) to authenticated;

-- 8c. Expense
create or replace function iapp.create_expense(
  p_account_id uuid, p_clinic_id uuid, p_amount numeric,
  p_expense_category_id uuid, p_description text,
  p_transaction_date date default current_date
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare v_id uuid; v_currency char(3);
begin
  perform iapp.assert_doctor_or_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  select currency into v_currency from iapp.accounts where id = p_account_id;
  if v_currency is null then raise exception 'account % not found', p_account_id; end if;

  insert into iapp.financial_transactions
    (transaction_type, account_id, clinic_id, amount, currency, transaction_date,
     description, expense_category_id)
  values
    ('expense', p_account_id, p_clinic_id, p_amount, v_currency, p_transaction_date,
     p_description, p_expense_category_id)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function iapp.create_expense(
  uuid, uuid, numeric, uuid, text, date) from public;
grant execute on function iapp.create_expense(
  uuid, uuid, numeric, uuid, text, date) to authenticated;

-- 8d. Refund — locks the original, caps at remaining refundable amount,
--     never touches the original row or iapp.payments.
create or replace function iapp.create_refund(
  p_original_id uuid, p_amount numeric, p_reason text,
  p_transaction_date date default current_date
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare
  v_original record;
  v_already_refunded numeric;
  v_refund_id uuid;
begin
  perform iapp.assert_doctor_or_admin();

  if p_amount is null or p_amount <= 0 then raise exception 'refund amount must be positive'; end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'a refund reason is required'; end if;

  select * into v_original from iapp.financial_transactions
    where id = p_original_id for update;

  if v_original is null then raise exception 'original transaction % not found', p_original_id; end if;
  if v_original.transaction_type <> 'revenue' then
    raise exception 'original transaction is not a revenue transaction';
  end if;

  select coalesce(sum(amount), 0) into v_already_refunded
    from iapp.financial_transactions
    where related_transaction_id = p_original_id and transaction_type = 'refund';

  if v_already_refunded + p_amount > v_original.amount then
    raise exception 'refund would exceed original amount (already refunded %, original %)',
      v_already_refunded, v_original.amount;
  end if;

  insert into iapp.financial_transactions
    (transaction_type, account_id, clinic_id, patient_id, visit_id, service_id,
     amount, currency, reason, related_transaction_id, transaction_date)
  values
    ('refund', v_original.account_id, v_original.clinic_id, v_original.patient_id,
     v_original.visit_id, v_original.service_id, p_amount, v_original.currency,
     p_reason, p_original_id, p_transaction_date)
  returning id into v_refund_id;

  return v_refund_id;
end;
$$;
revoke execute on function iapp.create_refund(uuid, numeric, text, date) from public;
grant execute on function iapp.create_refund(uuid, numeric, text, date) to authenticated;

-- 8e. Transfer — atomic pair, locks both accounts, overdraft enforced by
--     the trigger (§4), not duplicated here.
--     LINKAGE NOTE: financial_transactions has no UPDATE path at all
--     (trg_fintxn_no_update rejects it unconditionally, with no
--     exception for this function) — so transfer_out is inserted first
--     with related_transaction_id left NULL, and transfer_in references
--     it. The pair is still fully discoverable (join transfer_in.
--     related_transaction_id = transfer_out.id, or look up by matching
--     amount/transaction_date/description), just asymmetric rather than
--     a mutual back-reference. chk_related_txn_required reflects this:
--     only refund and transfer_in are required to carry a reference.
create or replace function iapp.create_transfer(
  p_from_account uuid, p_to_account uuid, p_amount numeric, p_description text,
  p_transaction_date date default current_date
) returns table (out_id uuid, in_id uuid)
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare v_out uuid; v_in uuid; v_from record; v_to record;
begin
  perform iapp.assert_doctor_or_admin();

  if p_amount is null or p_amount <= 0 then raise exception 'transfer amount must be positive'; end if;
  if p_from_account = p_to_account then raise exception 'cannot transfer an account to itself'; end if;

  select * into v_from from iapp.accounts where id = p_from_account for update;
  if v_from is null then raise exception 'source account % not found', p_from_account; end if;
  if not v_from.is_active then raise exception 'source account is not active'; end if;

  select * into v_to from iapp.accounts where id = p_to_account for update;
  if v_to is null then raise exception 'destination account % not found', p_to_account; end if;
  if not v_to.is_active then raise exception 'destination account is not active'; end if;

  if v_from.currency is distinct from v_to.currency then
    raise exception 'cannot transfer between accounts of different currencies (% vs %)',
      v_from.currency, v_to.currency;
  end if;

  insert into iapp.financial_transactions
    (transaction_type, account_id, clinic_id, amount, currency, transaction_date, description)
  values ('transfer_out', p_from_account, v_from.clinic_id, p_amount, v_from.currency,
          p_transaction_date, p_description)
  returning id into v_out;

  insert into iapp.financial_transactions
    (transaction_type, account_id, clinic_id, amount, currency, transaction_date,
     description, related_transaction_id)
  values ('transfer_in', p_to_account, v_to.clinic_id, p_amount, v_to.currency,
          p_transaction_date, p_description, v_out)
  returning id into v_in;

  return query select v_out, v_in;
end;
$$;
revoke execute on function iapp.create_transfer(uuid, uuid, numeric, text, date) from public;
grant execute on function iapp.create_transfer(uuid, uuid, numeric, text, date) to authenticated;

-- 8f. Adjustment — the ONLY correction mechanism; there is no edit/void
--     of an existing row anywhere in this schema.
create or replace function iapp.create_adjustment(
  p_account_id uuid, p_direction text, p_amount numeric, p_reason text,
  p_related_transaction_id uuid default null,
  p_transaction_date date default current_date
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare v_id uuid; v_currency char(3); v_type iapp.financial_transaction_type;
begin
  perform iapp.assert_doctor_or_admin();
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'an adjustment reason is required'; end if;
  if p_direction not in ('increase', 'decrease') then
    raise exception 'direction must be ''increase'' or ''decrease''';
  end if;
  v_type := case p_direction when 'increase' then 'adjustment_increase' else 'adjustment_decrease' end;

  select currency into v_currency from iapp.accounts where id = p_account_id;
  if v_currency is null then raise exception 'account % not found', p_account_id; end if;

  insert into iapp.financial_transactions
    (transaction_type, account_id, amount, currency, reason,
     related_transaction_id, transaction_date)
  values (v_type, p_account_id, p_amount, v_currency, p_reason,
          p_related_transaction_id, p_transaction_date)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function iapp.create_adjustment(
  uuid, text, numeric, text, uuid, date) from public;
grant execute on function iapp.create_adjustment(
  uuid, text, numeric, text, uuid, date) to authenticated;

-- 8g. Opening balance — one per account, may be negative/zero/positive.
create or replace function iapp.create_opening_balance(
  p_account_id uuid, p_amount numeric, p_transaction_date date default current_date
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare v_id uuid; v_currency char(3);
begin
  perform iapp.assert_doctor_or_admin();
  select currency into v_currency from iapp.accounts where id = p_account_id;
  if v_currency is null then raise exception 'account % not found', p_account_id; end if;

  insert into iapp.financial_transactions
    (transaction_type, account_id, amount, currency, transaction_date)
  values ('opening_balance', p_account_id, p_amount, v_currency, p_transaction_date)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'account % already has an opening balance', p_account_id;
end;
$$;
revoke execute on function iapp.create_opening_balance(uuid, numeric, date) from public;
grant execute on function iapp.create_opening_balance(uuid, numeric, date) to authenticated;

-- 8h. Daily closing
create or replace function iapp.create_daily_closing(
  p_clinic_id uuid, p_closing_date date, p_notes text default null
) returns uuid
language plpgsql security definer
set search_path = pg_catalog, iapp
as $$
declare v_id uuid;
begin
  perform iapp.assert_doctor_or_admin();
  insert into iapp.daily_closings (clinic_id, closing_date, notes)
  values (p_clinic_id, p_closing_date, p_notes)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'clinic % already has a closing for %', p_clinic_id, p_closing_date;
end;
$$;
revoke execute on function iapp.create_daily_closing(uuid, date, text) from public;
grant execute on function iapp.create_daily_closing(uuid, date, text) to authenticated;

-- =========================================================================
-- 9. RLS — doctor/admin only, everywhere. No secretary policy anywhere.
--    No patient policy anywhere (receipts are printed by staff, not
--    self-served by patients, in this phase).
-- =========================================================================
alter table iapp.payment_methods enable row level security;
alter table iapp.expense_categories enable row level security;
alter table iapp.accounts enable row level security;
alter table iapp.financial_transactions enable row level security;
alter table iapp.daily_closings enable row level security;
alter table iapp.receipt_counters enable row level security;

create policy pm_select on iapp.payment_methods for select using (iapp.is_doctor_or_admin());
create policy pm_insert on iapp.payment_methods for insert with check (iapp.is_doctor_or_admin());
create policy pm_update on iapp.payment_methods for update using (iapp.is_doctor_or_admin());

create policy ec_select on iapp.expense_categories for select using (iapp.is_doctor_or_admin());
create policy ec_insert on iapp.expense_categories for insert with check (iapp.is_doctor_or_admin());
create policy ec_update on iapp.expense_categories for update using (iapp.is_doctor_or_admin());

create policy accounts_select on iapp.accounts for select using (iapp.is_doctor_or_admin());
create policy accounts_insert on iapp.accounts for insert with check (iapp.is_doctor_or_admin());
create policy accounts_update on iapp.accounts for update using (iapp.is_doctor_or_admin());
-- no delete policy anywhere in this file — is_active toggles only

create policy fintxn_select on iapp.financial_transactions
  for select using (iapp.is_doctor_or_admin());
create policy fintxn_insert on iapp.financial_transactions
  for insert with check (iapp.is_doctor_or_admin());
-- no update, no delete policy — trg_fintxn_no_update/no_delete reject
-- unconditionally regardless of RLS anyway (defense in depth)

create policy dc_select on iapp.daily_closings for select using (iapp.is_doctor_or_admin());
create policy dc_insert on iapp.daily_closings for insert with check (iapp.is_doctor_or_admin());

-- internal counter table — only iapp.next_receipt_no() (SECURITY DEFINER)
-- touches it; no direct app access
create policy rc_none on iapp.receipt_counters for all using (false);

-- =========================================================================
-- END OF PROPOSED MIGRATION — NOT APPLIED
-- =========================================================================
