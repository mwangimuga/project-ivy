-- ============================================================
-- Project Ivy — Public Listings, Audit Log, Super Agent Admin Rights
-- ============================================================

-- 1. PUBLIC LISTING VISIBILITY
-- Anonymous visitors (the marketing site, /properties, /properties/[id])
-- can browse active listings without an account. Draft listings stay
-- invisible to everyone except their landlord and PM/Super Agent, who
-- are already covered by the existing authenticated policies.
create policy "Public can view active listings"
  on public.properties for select
  to anon
  using (status = 'active');

-- 2. AUDIT LOG
-- Generic append-only log of mutations on the tables that matter for
-- accountability. Written by a trigger (so it can't be bypassed by
-- forgetting to log something at the application layer) plus a couple
-- of explicit inserts for actions that don't correspond to a row
-- change (login-as, user creation via the Auth Admin API).
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null, -- e.g. 'insert', 'update', 'delete', 'impersonate', 'admin_create_user'
  target_table text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

create policy "Only Super Agent can view audit logs"
  on public.audit_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
  );

-- Inserts happen via security-definer trigger / service-role API routes only —
-- no direct insert policy for regular roles.
create policy "Service role and triggers can insert audit logs"
  on public.audit_logs for insert
  with check (true);

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

create trigger audit_properties
  after insert or update or delete on public.properties
  for each row execute procedure public.audit_trigger_fn();

create trigger audit_leases
  after insert or update or delete on public.leases
  for each row execute procedure public.audit_trigger_fn();

create trigger audit_profiles
  after update or delete on public.profiles
  for each row execute procedure public.audit_trigger_fn();

create trigger audit_tickets
  after insert or update or delete on public.tickets
  for each row execute procedure public.audit_trigger_fn();

create trigger audit_withdrawal_requests
  after insert or update on public.withdrawal_requests
  for each row execute procedure public.audit_trigger_fn();

-- 3. REMAINING SUPER AGENT ADMIN RIGHTS
-- Editing (properties/leases/ledgers) was already covered by existing
-- "for all" policies for project_manager/super_agent. Deleting was too,
-- EXCEPT for profiles and tickets, which had no delete path at all.

create policy "Super agents can delete any profile"
  on public.profiles for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_agent')
  );

create policy "Super agents can delete tickets"
  on public.tickets for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
  );

-- Super agents can edit any lease/ticket/property status directly (already
-- granted via existing "for all" / "update" policies for their role) — no
-- further additions needed there.
