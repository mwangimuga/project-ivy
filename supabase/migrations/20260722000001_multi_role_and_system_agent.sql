-- ============================================================
-- Project Ivy — Multi-Role Accounts, Role Requests, System Agent Permissions
-- Run this AFTER 20260722000000_system_agent_role.sql has fully committed.
-- ============================================================

-- 1. MULTI-ROLE SUPPORT
-- `role` stays the account's primary role (drives default dashboard,
-- signup, RLS defaults). `additional_roles` lets one verified person
-- also operate as e.g. a landlord while primarily a client — added
-- only through an explicit request + Super/System Agent approval,
-- never self-granted.
alter table public.profiles
  add column if not exists additional_roles user_role[] not null default '{}',
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create table public.role_requests (
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

create policy "Users view their own role requests"
  on public.role_requests for select
  using (user_id = auth.uid());

create policy "Users create their own role requests"
  on public.role_requests for insert
  with check (user_id = auth.uid() and status = 'pending');

create policy "Super Agent and System Agent view all role requests"
  on public.role_requests for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent','system_agent'))
  );

create policy "Super Agent and System Agent resolve role requests"
  on public.role_requests for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent','system_agent'))
  );

-- Approving a request appends the role. Wrapped in a function (rather than
-- done ad-hoc from the API) so the array-append and status-update always
-- happen together, atomically.
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

-- 2. PROPERTIES — landlords-by-additional-role can list properties too
create policy "Additional-role landlords can insert their own properties"
  on public.properties for insert
  with check (
    auth.role() = 'authenticated'
    and landlord_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and 'landlord' = any(additional_roles))
  );

create policy "Additional-role landlords can update their own properties"
  on public.properties for update
  using (
    auth.role() = 'authenticated'
    and landlord_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and 'landlord' = any(additional_roles))
  );

-- 3. SYSTEM AGENT — day-to-day approval powers alongside Project Manager,
-- deliberately excluding higher-risk actions (withdrawals, user deletion,
-- impersonation, property deletion stay Super-Agent-only).
create policy "System agents manage leases"
  on public.leases for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent')
  );

create policy "System agents update tickets"
  on public.tickets for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent')
  );

create policy "System agents view all properties"
  on public.properties for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent')
  );

create policy "System agents update property status"
  on public.properties for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent')
  );

-- 4. SYSTEM AGENT can read the activity log (read-only) — same visibility
-- as Super Agent for audit purposes, without any write/delete capability.
create policy "System agents can view audit logs"
  on public.audit_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'system_agent')
  );
