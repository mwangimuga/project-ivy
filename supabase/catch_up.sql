-- ============================================================
-- Project Ivy — CATCH-UP SCRIPT
-- Brings ANY state of your database fully up to date with the app.
-- Idempotent: safe to run if migrations were skipped, partly run, or
-- already applied — and safe to run twice.
--
-- STEP 1 — run this ONE line by itself first and let it finish
--          (Postgres won't let a brand-new enum value be used in the
--           same transaction that creates it):
--
--     alter type user_role add value if not exists 'system_agent';
--
-- STEP 2 — then paste and run everything below this comment block.
-- ============================================================

-- ── A. Lease applications (clients can apply, as 'pending' only) ──
drop policy if exists "Clients can apply for a lease" on public.leases;
create policy "Clients can apply for a lease"
  on public.leases for insert
  with check (auth.role() = 'authenticated' and client_id = auth.uid() and status = 'pending');

-- ── B. Public listings, audit log, admin delete rights ──
drop policy if exists "Public can view active listings" on public.properties;
create policy "Public can view active listings"
  on public.properties for select to anon
  using (status = 'active');

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.audit_logs enable row level security;

drop policy if exists "Only Super Agent can view audit logs" on public.audit_logs;
create policy "Only Super Agent can view audit logs"
  on public.audit_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent'));

drop policy if exists "System agents can view audit logs" on public.audit_logs;
create policy "System agents can view audit logs"
  on public.audit_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent'));

-- No INSERT policy on purpose: the triggers below are SECURITY DEFINER and the
-- service role bypasses RLS, so only they can write. (An open insert policy
-- would let any logged-in user forge audit entries.)
drop policy if exists "Service role and triggers can insert audit logs" on public.audit_logs;

create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if (tg_op = 'DELETE') then
    insert into public.audit_logs (actor_id, action, target_table, target_id, details)
    values (v_actor, 'delete', tg_table_name, old.id::text, to_jsonb(old));
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_logs (actor_id, action, target_table, target_id, details)
    values (v_actor, 'update', tg_table_name, new.id::text, jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  elsif (tg_op = 'INSERT') then
    insert into public.audit_logs (actor_id, action, target_table, target_id, details)
    values (v_actor, 'insert', tg_table_name, new.id::text, to_jsonb(new));
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists audit_properties on public.properties;
create trigger audit_properties after insert or update or delete on public.properties
  for each row execute procedure public.audit_trigger_fn();
drop trigger if exists audit_leases on public.leases;
create trigger audit_leases after insert or update or delete on public.leases
  for each row execute procedure public.audit_trigger_fn();
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update or delete on public.profiles
  for each row execute procedure public.audit_trigger_fn();
drop trigger if exists audit_tickets on public.tickets;
create trigger audit_tickets after insert or update or delete on public.tickets
  for each row execute procedure public.audit_trigger_fn();
drop trigger if exists audit_withdrawal_requests on public.withdrawal_requests;
create trigger audit_withdrawal_requests after insert or update on public.withdrawal_requests
  for each row execute procedure public.audit_trigger_fn();

drop policy if exists "Super agents can delete any profile" on public.profiles;
create policy "Super agents can delete any profile"
  on public.profiles for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_agent'));

drop policy if exists "Super agents can delete tickets" on public.tickets;
create policy "Super agents can delete tickets"
  on public.tickets for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent'));

-- ── C. Additional roles, role requests, System Agent permissions ──
alter table public.profiles
  add column if not exists additional_roles user_role[] not null default '{}',
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create table if not exists public.role_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  requested_role user_role not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.role_requests enable row level security;

drop policy if exists "Users view their own role requests" on public.role_requests;
create policy "Users view their own role requests"
  on public.role_requests for select using (user_id = auth.uid());

drop policy if exists "Users create their own role requests" on public.role_requests;
create policy "Users create their own role requests"
  on public.role_requests for insert
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "Super Agent and System Agent view all role requests" on public.role_requests;
create policy "Super Agent and System Agent view all role requests"
  on public.role_requests for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent','system_agent')));

drop policy if exists "Super Agent and System Agent resolve role requests" on public.role_requests;
create policy "Super Agent and System Agent resolve role requests"
  on public.role_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent','system_agent')));

create or replace function public.approve_role_request(p_request_id uuid, p_reviewer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
begin
  select * into v_req from public.role_requests where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'Request not found or already resolved';
  end if;

  update public.profiles
  set additional_roles = array_append(additional_roles, v_req.requested_role)
  where id = v_req.user_id
    and not (v_req.requested_role = any(additional_roles));

  update public.role_requests
  set status = 'approved', reviewed_by = p_reviewer_id, reviewed_at = now()
  where id = p_request_id;
end;
$$;

drop policy if exists "Additional-role landlords can insert their own properties" on public.properties;
create policy "Additional-role landlords can insert their own properties"
  on public.properties for insert
  with check (
    auth.role() = 'authenticated' and landlord_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and 'landlord' = any(additional_roles))
  );

drop policy if exists "Additional-role landlords can update their own properties" on public.properties;
create policy "Additional-role landlords can update their own properties"
  on public.properties for update
  using (
    auth.role() = 'authenticated' and landlord_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and 'landlord' = any(additional_roles))
  );

drop policy if exists "System agents manage leases" on public.leases;
create policy "System agents manage leases"
  on public.leases for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent'));

drop policy if exists "System agents update tickets" on public.tickets;
create policy "System agents update tickets"
  on public.tickets for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent'));

drop policy if exists "System agents view all properties" on public.properties;
create policy "System agents view all properties"
  on public.properties for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent'));

drop policy if exists "System agents update property status" on public.properties;
create policy "System agents update property status"
  on public.properties for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent'));

-- ── D. Payments: autopay, invoices, receipts ──
alter table public.leases
  add column if not exists autopay_enabled boolean not null default false,
  add column if not exists paystack_authorization_code text;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum ('pending', 'paid', 'expired', 'cancelled');
  end if;
end $$;

create table if not exists public.invoices (
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

drop policy if exists "Clients view their own invoices" on public.invoices;
create policy "Clients view their own invoices"
  on public.invoices for select using (client_id = auth.uid());

drop policy if exists "Landlords view invoices for their properties" on public.invoices;
create policy "Landlords view invoices for their properties"
  on public.invoices for select
  using (exists (
    select 1 from public.leases
    join public.properties on properties.id = leases.property_id
    where leases.id = invoices.lease_id and properties.landlord_id = auth.uid()
  ));

drop policy if exists "Managers view and create all invoices" on public.invoices;
create policy "Managers view and create all invoices"
  on public.invoices for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('project_manager','super_agent','system_agent')));

drop policy if exists "Landlords create invoices for their own properties" on public.invoices;
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

alter table public.ledgers add column if not exists paystack_reference text;
create index if not exists idx_ledgers_paystack_reference on public.ledgers(paystack_reference);

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

-- ── E. Live updates for the new tables, then refresh the API's schema cache ──
do $$
declare t text;
begin
  foreach t in array array['role_requests', 'audit_logs'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Fixes "Could not find the table … in the schema cache":
notify pgrst, 'reload schema';
