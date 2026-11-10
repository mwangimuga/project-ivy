-- ============================================================
-- Project Ivy - Security hardening, tenancy ending, landlord
-- verification, and legal-terms acceptance.
-- Idempotent: safe to run on any database state, and safe to run twice.
-- (Also included at the end of supabase/catch_up.sql.)
-- ============================================================

-- ── F. SECURITY HARDENING ───────────────────────────────────

-- F1. Columns needed by the hardening below
alter table public.profiles
  add column if not exists landlord_verified boolean not null default false,
  add column if not exists landlord_verified_at timestamp with time zone;
alter table public.properties
  add column if not exists landlord_verified boolean not null default false;

-- F2. Terms acceptance records (created early: the signup trigger writes to it)
create table if not exists public.terms_acceptances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  document text not null check (document in ('terms', 'landlord_agreement')),
  version text not null,
  accepted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, document, version)
);
alter table public.terms_acceptances enable row level security;

drop policy if exists "Users view their own terms acceptances" on public.terms_acceptances;
create policy "Users view their own terms acceptances"
  on public.terms_acceptances for select using (user_id = auth.uid());

drop policy if exists "Users record their own terms acceptance" on public.terms_acceptances;
create policy "Users record their own terms acceptance"
  on public.terms_acceptances for insert with check (user_id = auth.uid());

drop policy if exists "Super agents view all terms acceptances" on public.terms_acceptances;
create policy "Super agents view all terms acceptances"
  on public.terms_acceptances for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent'));

-- F3. SIGNUP: never trust a client-supplied role. Self-signup can only ever
-- produce a client or a landlord; staff roles are granted by administrators.
-- (Admin-created accounts get their role set by the server right after creation.)
-- Also records acceptance of the Terms when the signup form sends the version.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role public.user_role;
begin
  v_role := case
    when new.raw_user_meta_data->>'role' in ('client', 'landlord')
      then (new.raw_user_meta_data->>'role')::public.user_role
    else 'client'::public.user_role
  end;

  insert into public.profiles (id, username, full_name, role, must_change_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_role,
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false)
  );

  -- Must never be able to block a signup.
  begin
    if new.raw_user_meta_data ? 'terms_version' then
      insert into public.terms_acceptances (user_id, document, version)
      values (new.id, 'terms', new.raw_user_meta_data->>'terms_version')
      on conflict do nothing;
    end if;
  exception when others then
    null;
  end;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- F4. PROFILES: users may edit their own name/username, but never their own
-- role, extra roles, verification status, or "created by". (The original
-- policy let anyone set role = 'super_agent' on their own row.)
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / SQL editor / internal functions carry no end-user identity.
  if auth.uid() is null then
    return new;
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent') then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.additional_roles is distinct from old.additional_roles
     or new.created_by is distinct from old.created_by
     or new.landlord_verified is distinct from old.landlord_verified
     or new.landlord_verified_at is distinct from old.landlord_verified_at then
    raise exception 'You are not allowed to change role, verification, or ownership fields.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_fields on public.profiles;
create trigger trg_protect_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_fields();

-- F5. Role requests may only ask for roles that can be granted by request.
drop policy if exists "Users create their own role requests" on public.role_requests;
create policy "Users create their own role requests"
  on public.role_requests for insert
  with check (
    user_id = auth.uid() and status = 'pending'
    and requested_role in ('landlord', 'client', 'project_manager', 'maintenance')
  );

-- ── G. WHO MAY MANAGE A PROPERTY ────────────────────────────
-- A Project Manager created by a LANDLORD is scoped to that landlord's
-- properties only. A Project Manager created by an administrator (or the
-- seed) is a platform-wide PM. Previously every PM had platform-wide access.

create or replace function public.is_global_pm(p_uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles me
    where me.id = p_uid and me.role = 'project_manager'
      and (
        me.created_by is null
        or exists (select 1 from public.profiles c where c.id = me.created_by and c.role in ('super_agent', 'system_agent'))
      )
  );
$$;

create or replace function public.can_pm_property(p_uid uuid, p_property uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_uid is not null and (
    public.is_global_pm(p_uid)
    or exists (
      select 1 from public.profiles me
      join public.properties pr on pr.id = p_property
      where me.id = p_uid and me.role = 'project_manager'
        and pr.landlord_id is not null and me.created_by = pr.landlord_id
    )
  );
$$;

create or replace function public.can_staff_property(p_uid uuid, p_property uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_uid is not null and (
    exists (select 1 from public.profiles me where me.id = p_uid and me.role in ('super_agent', 'system_agent'))
    or public.can_pm_property(p_uid, p_property)
  );
$$;

create or replace function public.can_manage_property(p_uid uuid, p_property uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_uid is not null and (
    public.can_staff_property(p_uid, p_property)
    or exists (select 1 from public.properties pr where pr.id = p_property and pr.landlord_id = p_uid)
  );
$$;

-- Leases
drop policy if exists "Leases viewable by involved parties" on public.leases;
create policy "Leases viewable by involved parties"
  on public.leases for select
  using (
    auth.role() = 'authenticated' and (
      client_id = auth.uid()
      or exists (select 1 from public.properties where properties.id = leases.property_id and properties.landlord_id = auth.uid())
      or public.can_staff_property(auth.uid(), property_id)
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'maintenance')
    )
  );

drop policy if exists "Leases manageable by project managers and super agents" on public.leases;
create policy "Leases manageable by project managers and super agents"
  on public.leases for all
  using (public.can_staff_property(auth.uid(), property_id))
  with check (public.can_staff_property(auth.uid(), property_id));

-- Ledgers (financials: Super Agent, the owning landlord, the client, and PMs for their properties)
drop policy if exists "Ledger entries viewable by client, landlord, managers" on public.ledgers;
create policy "Ledger entries viewable by client, landlord, managers"
  on public.ledgers for select
  using (
    auth.role() = 'authenticated' and (
      client_id = auth.uid()
      or exists (
        select 1 from public.leases l join public.properties p on p.id = l.property_id
        where l.id = ledgers.lease_id and p.landlord_id = auth.uid()
      )
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
      or exists (select 1 from public.leases l where l.id = ledgers.lease_id and public.can_pm_property(auth.uid(), l.property_id))
    )
  );

-- Tickets
drop policy if exists "Tickets viewable by client, maintenance, managers, super agent" on public.tickets;
create policy "Tickets viewable by client, maintenance, managers, super agent"
  on public.tickets for select
  using (
    client_id = auth.uid()
    or assigned_to = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('maintenance', 'super_agent'))
    or public.can_staff_property(auth.uid(), property_id)
    or exists (select 1 from public.properties where properties.id = tickets.property_id and properties.landlord_id = auth.uid())
  );

drop policy if exists "Maintenance and managers update tickets" on public.tickets;
create policy "Maintenance and managers update tickets"
  on public.tickets for update
  using (
    assigned_to = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('maintenance', 'super_agent'))
    or public.can_staff_property(auth.uid(), property_id)
  );

-- Messages
drop policy if exists "Messages viewable by authorized role and client" on public.messages;
create policy "Messages viewable by authorized role and client"
  on public.messages for select
  using (
    auth.role() = 'authenticated' and (
      exists (select 1 from public.leases where leases.id = messages.lease_id and leases.client_id = auth.uid())
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
      or (messages.stream_type = 'maintenance' and exists (select 1 from public.profiles where id = auth.uid() and role = 'maintenance'))
      or exists (select 1 from public.leases l where l.id = messages.lease_id and public.can_pm_property(auth.uid(), l.property_id))
    )
  );

drop policy if exists "Messages insertable by sender" on public.messages;
create policy "Messages insertable by sender"
  on public.messages for insert
  with check (
    auth.role() = 'authenticated' and sender_id = auth.uid() and (
      exists (select 1 from public.leases where leases.id = messages.lease_id and leases.client_id = auth.uid())
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
      or (messages.stream_type = 'maintenance' and exists (select 1 from public.profiles where id = auth.uid() and role = 'maintenance'))
      or exists (select 1 from public.leases l where l.id = messages.lease_id and public.can_pm_property(auth.uid(), l.property_id))
    )
  );

-- Properties
drop policy if exists "Project managers and super agents can manage all properties" on public.properties;
create policy "Project managers and super agents can manage all properties"
  on public.properties for all
  using (
    auth.role() = 'authenticated' and (
      exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
      or public.can_pm_property(auth.uid(), id)
    )
  )
  with check (
    auth.role() = 'authenticated' and (
      exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent')
      or public.can_pm_property(auth.uid(), id)
    )
  );

-- Invoices
drop policy if exists "Managers view and create all invoices" on public.invoices;
create policy "Managers view and create all invoices"
  on public.invoices for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent', 'system_agent'))
    or exists (select 1 from public.leases l where l.id = invoices.lease_id and public.can_pm_property(auth.uid(), l.property_id))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent', 'system_agent'))
    or exists (select 1 from public.leases l where l.id = invoices.lease_id and public.can_pm_property(auth.uid(), l.property_id))
  );

-- ── H. ENDING TENANCIES ─────────────────────────────────────
-- leases.end_date is the contracted end of a timed tenancy (the auto-expiry
-- date). termination_date is an EARLIER end set by notice; it can never extend
-- a tenancy. A daily job ends everything whose effective end has passed.

alter table public.leases
  add column if not exists termination_date date,
  add column if not exists termination_notice_at timestamp with time zone,
  add column if not exists termination_reason text,
  add column if not exists terminated_at timestamp with time zone,
  add column if not exists terminated_by uuid references public.profiles(id) on delete set null;

create or replace function public.end_tenancy(p_lease_id uuid, p_effective_date date, p_reason text)
returns public.leases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lease public.leases;
  v_eff date := coalesce(p_effective_date, current_date);
begin
  select * into v_lease from public.leases where id = p_lease_id for update;
  if not found then
    raise exception 'Tenancy not found';
  end if;
  if not public.can_manage_property(auth.uid(), v_lease.property_id) then
    raise exception 'You are not allowed to end this tenancy';
  end if;
  if v_lease.status <> 'active' then
    raise exception 'Only active tenancies can be ended (this one is %)', v_lease.status;
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 then
    raise exception 'Please give a reason (a few words at least)';
  end if;
  if v_eff < current_date then
    raise exception 'The end date cannot be in the past';
  end if;
  if v_eff > v_lease.end_date then
    raise exception 'That date is after the tenancy already ends on %', v_lease.end_date;
  end if;

  if v_eff = current_date then
    update public.leases
    set status = 'terminated', terminated_at = now(), terminated_by = auth.uid(),
        termination_reason = trim(p_reason), termination_date = v_eff,
        termination_notice_at = coalesce(termination_notice_at, now()), autopay_enabled = false
    where id = p_lease_id
    returning * into v_lease;
  else
    update public.leases
    set termination_date = v_eff, termination_notice_at = now(),
        termination_reason = trim(p_reason), terminated_by = auth.uid()
    where id = p_lease_id
    returning * into v_lease;
  end if;
  return v_lease;
end;
$$;

create or replace function public.cancel_termination_notice(p_lease_id uuid)
returns public.leases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lease public.leases;
begin
  select * into v_lease from public.leases where id = p_lease_id for update;
  if not found then
    raise exception 'Tenancy not found';
  end if;
  if not public.can_manage_property(auth.uid(), v_lease.property_id) then
    raise exception 'You are not allowed to change this tenancy';
  end if;
  if v_lease.status <> 'active' or v_lease.termination_date is null then
    raise exception 'There is no pending notice on this tenancy';
  end if;
  update public.leases
  set termination_date = null, termination_notice_at = null, termination_reason = null, terminated_by = null
  where id = p_lease_id
  returning * into v_lease;
  return v_lease;
end;
$$;

create or replace function public.end_expired_leases()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with ended as (
    update public.leases
    set status = 'terminated', terminated_at = now(), autopay_enabled = false,
        termination_reason = coalesce(termination_reason, 'Tenancy term ended'),
        termination_date = coalesce(termination_date, end_date)
    where status = 'active' and coalesce(termination_date, end_date) < current_date
    returning 1
  )
  select count(*) into n from ended;
  return n;
end;
$$;

-- ── I. LANDLORD VERIFICATION ────────────────────────────────

create table if not exists public.landlord_verifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  legal_name text not null,
  national_id_number text not null,
  kra_pin text,
  phone text not null,
  ownership_basis text not null check (ownership_basis in ('title_deed', 'lease_with_authority', 'management_mandate')),
  id_document_path text not null,
  ownership_document_path text not null,
  selfie_path text,
  reviewer_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create unique index if not exists one_pending_verification_per_user
  on public.landlord_verifications (user_id) where status = 'pending';
alter table public.landlord_verifications enable row level security;

drop policy if exists "Users view their own verifications" on public.landlord_verifications;
create policy "Users view their own verifications"
  on public.landlord_verifications for select using (user_id = auth.uid());

drop policy if exists "Users submit their own verification" on public.landlord_verifications;
create policy "Users submit their own verification"
  on public.landlord_verifications for insert
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "Agents view all verifications" on public.landlord_verifications;
create policy "Agents view all verifications"
  on public.landlord_verifications for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent', 'system_agent')));

-- Private bucket for identity documents (never public).
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists "Verification docs: owner upload" on storage.objects;
create policy "Verification docs: owner upload"
  on storage.objects for insert
  with check (bucket_id = 'verification-docs' and auth.role() = 'authenticated' and name like auth.uid()::text || '/%');

drop policy if exists "Verification docs: owner read" on storage.objects;
create policy "Verification docs: owner read"
  on storage.objects for select
  using (bucket_id = 'verification-docs' and name like auth.uid()::text || '/%');

drop policy if exists "Verification docs: agents read" on storage.objects;
create policy "Verification docs: agents read"
  on storage.objects for select
  using (
    bucket_id = 'verification-docs'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('super_agent', 'system_agent'))
  );

create or replace function public.approve_landlord_verification(p_id uuid, p_reviewer uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  select * into v from public.landlord_verifications where id = p_id and status = 'pending' for update;
  if not found then
    raise exception 'Verification not found or already reviewed';
  end if;
  update public.landlord_verifications
  set status = 'approved', reviewed_by = p_reviewer, reviewed_at = now()
  where id = p_id;
  update public.profiles set landlord_verified = true, landlord_verified_at = now() where id = v.user_id;
  update public.properties set landlord_verified = true where landlord_id = v.user_id;
end;
$$;

create or replace function public.reject_landlord_verification(p_id uuid, p_reviewer uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.landlord_verifications
  set status = 'rejected', reviewed_by = p_reviewer, reviewed_at = now(), reviewer_note = p_note
  where id = p_id and status = 'pending';
  if not found then
    raise exception 'Verification not found or already reviewed';
  end if;
end;
$$;

-- A listing can only GO LIVE if its landlord is verified. Administrators and
-- the service role are exempt. Existing live listings are grandfathered: the
-- check only fires when a listing becomes active. Also keeps the denormalised
-- listing flag (used for the public "Verified landlord" badge) fresh.
create or replace function public.enforce_verified_landlord()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verified boolean := false;
  v_admin boolean := false;
begin
  if new.landlord_id is not null then
    select coalesce(landlord_verified, false) into v_verified from public.profiles where id = new.landlord_id;
  end if;
  new.landlord_verified := coalesce(v_verified, false);

  if new.status = 'active' and new.landlord_id is not null
     and (tg_op = 'INSERT' or old.status is distinct from 'active')
     and auth.uid() is not null then
    select exists (
      select 1 from public.profiles where id = auth.uid() and role in ('super_agent', 'system_agent', 'project_manager')
    ) into v_admin;
    if not v_admin and not coalesce(v_verified, false) then
      raise exception 'This landlord account is not verified yet. Listings stay as drafts until verification is approved.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_verified_landlord on public.properties;
create trigger trg_enforce_verified_landlord
  before insert or update on public.properties
  for each row execute procedure public.enforce_verified_landlord();

-- ── J. LOCK DOWN SENSITIVE FUNCTIONS ────────────────────────
-- These are SECURITY DEFINER and were callable by any logged-in user through
-- Supabase's RPC endpoint (e.g. marking your own rent as paid). They are only
-- ever called by the server with the service-role key.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.process_payment(uuid,uuid,numeric,text,text)',
    'public.process_withdrawal(uuid,numeric,text)',
    'public.charge_monthly_rent()',
    'public.get_autopay_leases()',
    'public.approve_role_request(uuid,uuid)',
    'public.approve_landlord_verification(uuid,uuid)',
    'public.reject_landlord_verification(uuid,uuid,text)',
    'public.end_expired_leases()'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', f);
      execute format('grant execute on function %s to service_role', f);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
