-- ============================================================
-- Project Ivy — Payment Automation: Autopay, Invoicing, Receipts
-- ============================================================

-- 1. AUTOPAY
-- A client can opt in to autopay once they have a reusable Paystack
-- card authorization on file (captured from the `authorization` object
-- on a successful charge webhook — mobile money/M-Pesa charges are
-- typically NOT reusable this way, so autopay is effectively card-only;
-- the UI is explicit about this rather than silently failing later).
alter table public.leases
  add column if not exists autopay_enabled boolean not null default false,
  add column if not exists paystack_authorization_code text;

-- 2. INVOICES (Paystack Payment Requests)
-- One row per invoice sent via Paystack's Payment Request API. Status
-- is kept in sync by the webhook (`paymentrequest.success` /
-- `paymentrequest.pending`).
create type invoice_status as enum ('pending', 'paid', 'expired', 'cancelled');

create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  lease_id uuid references public.leases(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  status invoice_status not null default 'pending',
  paystack_request_code text,
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;

create policy "Clients view their own invoices"
  on public.invoices for select
  using (client_id = auth.uid());

create policy "Landlords view invoices for their properties"
  on public.invoices for select
  using (
    exists (
      select 1 from public.leases
      join public.properties on properties.id = leases.property_id
      where leases.id = invoices.lease_id and properties.landlord_id = auth.uid()
    )
  );

create policy "Managers view and create all invoices"
  on public.invoices for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('project_manager','super_agent','system_agent'))
  );

create policy "Landlords create invoices for their own properties"
  on public.invoices for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.leases
      join public.properties on properties.id = leases.property_id
      where leases.id = invoices.lease_id and properties.landlord_id = auth.uid()
    )
  );

-- 3. AUTOPAY ELIGIBILITY
-- Keeps the arrears calculation in Postgres (same philosophy as the rest
-- of the financial engine) rather than duplicating balance math in the
-- cron route. Called by /api/cron/autopay-charge.
create or replace function public.get_autopay_leases()
returns table(lease_id uuid, client_id uuid, authorization_code text, outstanding_balance numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id as lease_id,
    l.client_id,
    l.paystack_authorization_code as authorization_code,
    coalesce(sum(led.balance_change), 0) as outstanding_balance
  from public.leases l
  left join public.ledgers led on led.lease_id = l.id
  where l.autopay_enabled = true
    and l.paystack_authorization_code is not null
    and l.status = 'active'
  group by l.id, l.client_id, l.paystack_authorization_code
  having coalesce(sum(led.balance_change), 0) > 0;
$$;

-- 4. RECEIPTS
-- Ledger rows already hold everything a receipt needs (amount, split,
-- description, timestamp); this just adds a clean, indexed reference
-- column instead of parsing it back out of free-text descriptions.
alter table public.ledgers
  add column if not exists paystack_reference text;

create index if not exists idx_ledgers_paystack_reference on public.ledgers(paystack_reference);

-- process_payment previously only folded the Paystack reference into the
-- free-text description. Re-defining it here to also store it in the
-- dedicated column above, so receipts/lookups don't need to parse text.
create or replace function public.process_payment(
  p_client_id uuid,
  p_lease_id uuid,
  p_amount numeric,
  p_description text,
  p_paystack_reference text default null
)
returns public.ledgers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_split record;
  v_ledger public.ledgers;
begin
  select * into v_split from public.calc_payment_split(p_amount);

  insert into public.ledgers (
    client_id, lease_id, amount, balance_change, transaction_type,
    description, system_cut, landlord_share, paystack_reference
  ) values (
    p_client_id, p_lease_id, p_amount, -p_amount, 'payment',
    coalesce(p_description, 'Paystack payment ' || coalesce(p_paystack_reference, '')),
    v_split.system_cut, v_split.landlord_share, p_paystack_reference
  )
  returning * into v_ledger;

  return v_ledger;
end;
$$;
