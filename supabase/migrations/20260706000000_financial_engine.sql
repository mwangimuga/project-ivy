-- ============================================================
-- Project Ivy — Financial Engine, Withdrawals, Storage
-- Adds server-side tiered split logic (source of truth lives in
-- Postgres, not just in application code) plus storage buckets
-- for listing media and .glb virtual tours.
-- ============================================================

-- 0. Maintenance tickets (spec section 3.4 — Maintenance/Caretakers view
--    tickets and update issue status). Missing from the original schema.
create type ticket_priority as enum ('critical', 'high', 'medium', 'low');
create type ticket_status as enum ('open', 'in_progress', 'resolved');

create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null default '',
  unit text,
  priority ticket_priority not null default 'medium',
  status ticket_status not null default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tickets enable row level security;

create policy "Tickets viewable by client, maintenance, managers, super agent"
  on public.tickets for select
  using (
    client_id = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('maintenance', 'project_manager', 'super_agent')
    )
    or exists (
      select 1 from public.properties
      where properties.id = tickets.property_id and properties.landlord_id = auth.uid()
    )
  );

create policy "Clients create their own tickets"
  on public.tickets for insert
  with check (client_id = auth.uid());

create policy "Maintenance and managers update tickets"
  on public.tickets for update
  using (
    assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('maintenance', 'project_manager', 'super_agent')
    )
  );

alter publication supabase_realtime add table public.tickets;

-- 1. Withdrawal requests (Landlords request → Super Agent/webhook confirms)
create type withdrawal_status as enum ('pending', 'processing', 'paid', 'failed');

create table if not exists public.withdrawal_requests (
  id uuid default gen_random_uuid() primary key,
  landlord_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  tier smallint not null,
  fee numeric(12, 2) not null,
  net_amount numeric(12, 2) not null,
  status withdrawal_status not null default 'pending',
  paystack_reference text,
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

alter table public.withdrawal_requests enable row level security;

create policy "Landlords view their own withdrawal requests"
  on public.withdrawal_requests for select
  using (landlord_id = auth.uid());

create policy "Landlords create their own withdrawal requests"
  on public.withdrawal_requests for insert
  with check (landlord_id = auth.uid());

create policy "Super agents manage all withdrawal requests"
  on public.withdrawal_requests for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
  );

-- 2. Tiering function — single source of truth shared by payment + withdrawal RPCs
create or replace function public.calc_tier(p_amount numeric)
returns smallint
language sql
immutable
as $$
  select case
    when p_amount <= 50000 then 1
    when p_amount <= 200000 then 2
    else 3
  end::smallint;
$$;

create or replace function public.calc_payment_split(p_amount numeric)
returns table(tier smallint, system_cut numeric, landlord_share numeric)
language sql
immutable
as $$
  select
    public.calc_tier(p_amount) as tier,
    case public.calc_tier(p_amount)
      when 1 then 20
      when 2 then 50
      else 500
    end::numeric as system_cut,
    p_amount - (case public.calc_tier(p_amount)
      when 1 then 20
      when 2 then 50
      else 500
    end::numeric) as landlord_share;
$$;

create or replace function public.calc_withdrawal_fee(p_amount numeric)
returns table(tier smallint, fee numeric, net_amount numeric)
language sql
immutable
as $$
  select
    public.calc_tier(p_amount) as tier,
    round(p_amount * (case public.calc_tier(p_amount)
      when 1 then 0.020
      when 2 then 0.025
      else 0.030
    end), 2) as fee,
    p_amount - round(p_amount * (case public.calc_tier(p_amount)
      when 1 then 0.020
      when 2 then 0.025
      else 0.030
    end), 2) as net_amount;
$$;

-- 3. process_payment — called by the Paystack webhook (service role) on charge.success.
--    Handles overpayment rollover: if payment exceeds current arrears, the lease
--    balance goes negative (a credit applied to the next billing cycle).
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
    description, system_cut, landlord_share
  ) values (
    p_client_id, p_lease_id, p_amount, -p_amount, 'payment',
    coalesce(p_description, 'Paystack payment ' || coalesce(p_paystack_reference, '')),
    v_split.system_cut, v_split.landlord_share
  )
  returning * into v_ledger;

  -- Realtime: clients subscribed to `ledgers` for their id get this instantly.
  return v_ledger;
end;
$$;

-- 4. process_withdrawal — called when a landlord's withdrawal request is approved/paid.
create or replace function public.process_withdrawal(
  p_landlord_id uuid,
  p_amount numeric,
  p_description text default null
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
  select * into v_split from public.calc_withdrawal_fee(p_amount);

  insert into public.ledgers (
    client_id, lease_id, amount, balance_change, transaction_type,
    description, system_cut, landlord_share
  ) values (
    p_landlord_id, null, p_amount, 0, 'withdrawal',
    coalesce(p_description, 'Landlord withdrawal'),
    v_split.fee, v_split.net_amount
  )
  returning * into v_ledger;

  return v_ledger;
end;
$$;

-- 5. Aggregate views for dashboards
create or replace view public.v_system_balance as
select coalesce(sum(system_cut), 0)::numeric(14,2) as system_balance
from public.ledgers;

create or replace view public.v_landlord_balance as
select
  p.landlord_id,
  coalesce(sum(l.landlord_share) filter (where l.transaction_type = 'payment'), 0)
    - coalesce(sum(l.amount) filter (where l.transaction_type = 'withdrawal'), 0) as landlord_balance
from public.properties p
left join public.leases le on le.property_id = p.id
left join public.ledgers l on l.lease_id = le.id or l.client_id = p.landlord_id
group by p.landlord_id;

-- 6. Storage buckets: listing photos (public read) and .glb virtual tours (public read,
--    R3F fetches them client-side by public URL)
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('virtual-tours', 'virtual-tours', true)
on conflict (id) do nothing;

create policy "Public read property-media"
  on storage.objects for select
  using (bucket_id = 'property-media');

create policy "Public read virtual-tours"
  on storage.objects for select
  using (bucket_id = 'virtual-tours');

create policy "Landlords upload property-media"
  on storage.objects for insert
  with check (
    bucket_id = 'property-media'
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('landlord','project_manager','super_agent'))
  );

create policy "Landlords upload virtual-tours"
  on storage.objects for insert
  with check (
    bucket_id = 'virtual-tours'
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('landlord','project_manager','super_agent'))
  );

-- 6a. Listing display fields the UI needs at the property level (headline
--     price, blurb, aggregate rating) — separate from the type-specific
--     `details` jsonb and from a lease's actual contracted rent_amount.
alter table public.properties
  add column if not exists rent numeric(12, 2) not null default 0,
  add column if not exists description text not null default '',
  add column if not exists rating numeric(3, 1) not null default 4.5;

-- 6c. Monthly rent charge — invoked by a Vercel Cron hitting
--     /api/cron/charge-rent, which calls this via RPC with the service
--     role. Inserts a `charge` ledger row (balance increases = arrears)
--     for every active lease. Running this monthly is what actually
--     produces the arrears that `process_payment`'s overpayment-rollover
--     logic then reduces or credits.
create or replace function public.charge_monthly_rent()
returns setof public.ledgers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lease record;
  v_ledger public.ledgers;
begin
  for v_lease in
    select id, client_id, rent_amount from public.leases where status = 'active'
  loop
    insert into public.ledgers (
      client_id, lease_id, amount, balance_change, transaction_type, description
    ) values (
      v_lease.client_id, v_lease.id, v_lease.rent_amount, v_lease.rent_amount, 'charge',
      'Monthly rent charge — ' || to_char(now(), 'Mon YYYY')
    )
    returning * into v_ledger;
    return next v_ledger;
  end loop;
  return;
end;
$$;

-- 6b. Dedicated column for the .glb virtual tour (kept separate from media_urls
--     since the 3D viewer needs to know exactly which asset to load).
alter table public.properties
  add column if not exists virtual_tour_url text;

-- 7. Realtime: make sure ledgers + messages broadcast postgres_changes
alter publication supabase_realtime add table public.ledgers;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.withdrawal_requests;
