-- Enable RLS
-- alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('superuser', 'manager', 'employee')) default 'employee',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Create shifts table
create table public.shifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  start_time timestamptz default now(),
  end_time timestamptz,
  break_start timestamptz,
  break_end timestamptz,
  gps_in text, 
  gps_out text,
  selfie_in text,
  selfie_out text,
  date date default current_date
);

alter table public.shifts enable row level security;

-- Create production_reports table
create table public.production_reports (
  id uuid default gen_random_uuid() primary key,
  lead_user_id uuid references public.profiles(id) not null,
  mendmoss_s int default 0,
  mendmoss_m int default 0,
  mendhusk_s int default 0,
  mendhusk_m int default 0,
  jars_s int default 0,
  jars_m int default 0,
  jar_photo_url text,
  distributor_start timestamptz,
  sales_start timestamptz,
  created_at timestamptz default now(),
  date date default current_date
);

alter table public.production_reports enable row level security;

-- Create daily_state table (Singleton for Lead role)
create table public.daily_state (
  id int primary key default 1,
  current_lead_id uuid references public.profiles(id),
  updated_at timestamptz default now(),
  check (id = 1)
);

alter table public.daily_state enable row level security;
insert into public.daily_state (id) values (1) on conflict do nothing;

-- Storage buckets
insert into storage.buckets (id, name, public) values ('attendance', 'attendance', true);
insert into storage.buckets (id, name, public) values ('reports', 'reports', true);

-- RLS Policies

-- Profiles: 
-- Public read (for now, or authenticated)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
-- Update: Users can update their own profile
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Shifts:
-- Employees can view own shifts
create policy "Employees see own shifts" on public.shifts for select using (auth.uid() = user_id);
-- Managers can view all shifts
create policy "Managers see all shifts" on public.shifts for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'superuser'))
);
-- Employees can insert own shift
create policy "Employees insert own shift" on public.shifts for insert with check (auth.uid() = user_id);
-- Employees can update own shift (for clock out)
create policy "Employees update own shift" on public.shifts for update using (auth.uid() = user_id);

-- Production Reports:
-- Viewable by everyone (or just managers/lead)
create policy "Reports viewable by authenticated" on public.production_reports for select using (auth.role() = 'authenticated');
-- Insert by valid lead (will check in logic too, but RLS good)
create policy "Lead can insert report" on public.production_reports for insert with check (auth.uid() = lead_user_id);

-- Daily State:
-- Viewable by everyone
create policy "State viewable by everyone" on public.daily_state for select using (true);
-- Update by authenticated users (to claim lead)
create policy "Auth users can update state" on public.daily_state for update using (auth.role() = 'authenticated');
