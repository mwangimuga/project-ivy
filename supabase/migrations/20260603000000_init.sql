-- Enable pgcrypto extension for bcrypt hash generation
create extension if not exists pgcrypto;

-- 1. Create Enums
create type user_role as enum ('super_agent', 'project_manager', 'landlord', 'maintenance', 'client');
create type property_type as enum ('apartment', 'student_housing', 'commercial', 'land', 'airbnb');
create type lease_status as enum ('active', 'pending', 'terminated');
create type ledger_transaction_type as enum ('payment', 'charge', 'withdrawal');
create type message_stream_type as enum ('maintenance', 'security', 'billing');

-- 2. Create public.profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  role user_role not null default 'client',
  must_change_password boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create public.properties
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  landlord_id uuid references public.profiles(id) on delete set null,
  name text not null,
  address text not null,
  property_type property_type not null,
  status text not null default 'active', -- active, draft
  details jsonb not null default '{}'::jsonb, -- dynamic attributes based on type
  media_urls text[] not null default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create public.leases
create table public.leases (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(12, 2) not null check (rent_amount >= 0),
  status lease_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create public.ledgers
create table public.ledgers (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  lease_id uuid references public.leases(id) on delete set null,
  amount numeric(12, 2) not null,
  balance_change numeric(12, 2) not null, -- positive for charges (debt increases), negative for payments (debt decreases)
  transaction_type ledger_transaction_type not null,
  description text,
  system_cut numeric(12, 2) default 0.00 not null,
  landlord_share numeric(12, 2) default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create public.messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete set null,
  lease_id uuid references public.leases(id) on delete cascade not null,
  stream_type message_stream_type not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Trigger: Create public.profile on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role, must_change_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role),
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Seed Super Agent (Mark)
-- Note: Insert into auth.users automatically triggers public.profiles insertion
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_sent_at,
  confirmed_at,
  email_change_confirm_status,
  banned_until,
  reconfirmation_token,
  reconfirmation_sent_at,
  is_sso_user,
  deleted_at,
  aud,
  role
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'mark@projectivy.com',
  crypt('12345', gen_salt('bf')),
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  null,
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"Mark","full_name":"Mark Admin","role":"super_agent","must_change_password":true}'::jsonb,
  false,
  now(),
  now(),
  null,
  null,
  '',
  null,
  now(),
  0,
  null,
  '',
  null,
  false,
  null,
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Ensure public.profiles seed entry exists in case trigger conditions vary in sandbox environment
insert into public.profiles (id, username, full_name, role, must_change_password)
values (
  '00000000-0000-0000-0000-000000000000',
  'Mark',
  'Mark Admin',
  'super_agent',
  true
) on conflict (id) do update
set username = 'Mark',
    role = 'super_agent',
    must_change_password = true;

-- 9. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.leases enable row level security;
alter table public.ledgers enable row level security;
alter table public.messages enable row level security;

-- Profiles Policies
create policy "Profiles are viewable by all authenticated users." 
  on public.profiles for select 
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile." 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Super agents can update any profile." 
  on public.profiles for update 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_agent'));

-- Properties Policies
create policy "Properties are viewable by all authenticated users." 
  on public.properties for select 
  using (auth.role() = 'authenticated');

create policy "Landlords can insert their own properties" 
  on public.properties for insert 
  with check (
    auth.role() = 'authenticated' and (
      landlord_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'landlord')
    )
  );

create policy "Landlords can update their own properties" 
  on public.properties for update 
  using (
    auth.role() = 'authenticated' and landlord_id = auth.uid()
  );

create policy "Project managers and super agents can manage all properties" 
  on public.properties for all 
  using (
    auth.role() = 'authenticated' and exists (
      select 1 from public.profiles where id = auth.uid() and role in ('project_manager', 'super_agent')
    )
  );

-- Leases Policies
create policy "Leases viewable by involved parties" 
  on public.leases for select 
  using (
    auth.role() = 'authenticated' and (
      client_id = auth.uid() or
      exists (
        select 1 from public.properties
        where properties.id = leases.property_id
        and properties.landlord_id = auth.uid()
      ) or
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role in ('project_manager', 'maintenance', 'super_agent')
      )
    )
  );

create policy "Leases manageable by project managers and super agents" 
  on public.leases for all 
  using (
    auth.role() = 'authenticated' and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('project_manager', 'super_agent')
    )
  );

-- Ledgers Policies
create policy "Ledger entries viewable by client, landlord, managers" 
  on public.ledgers for select 
  using (
    auth.role() = 'authenticated' and (
      client_id = auth.uid() or
      exists (
        select 1 from public.leases
        join public.properties on properties.id = leases.property_id
        where leases.id = ledgers.lease_id
        and properties.landlord_id = auth.uid()
      ) or
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role in ('project_manager', 'super_agent')
      )
    )
  );

create policy "Ledger entries manageable by super agents" 
  on public.ledgers for all 
  using (
    auth.role() = 'authenticated' and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_agent'
    )
  );

-- Messages Policies
create policy "Messages viewable by authorized role and client" 
  on public.messages for select 
  using (
    auth.role() = 'authenticated' and (
      exists (
        select 1 from public.leases
        where leases.id = messages.lease_id
        and leases.client_id = auth.uid()
      ) or
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'super_agent'
      ) or
      (
        messages.stream_type = 'maintenance' and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role = 'maintenance'
        )
      ) or
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'project_manager'
      )
    )
  );

create policy "Messages insertable by sender" 
  on public.messages for insert 
  with check (
    auth.role() = 'authenticated' and
    sender_id = auth.uid() and
    (
      exists (
        select 1 from public.leases
        where leases.id = lease_id
        and leases.client_id = auth.uid()
      ) or
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'super_agent'
      ) or
      (
        stream_type = 'maintenance' and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role = 'maintenance'
        )
      ) or
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'project_manager'
      )
    )
  );
