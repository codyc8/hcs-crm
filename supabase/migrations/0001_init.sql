-- HCS Dashboard / Agency CRM — initial schema
-- Run in Supabase SQL editor after creating the project.

-- Profiles (one per team member, mirrors auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Email allowlist gate. Auth signups for emails not in this table are rejected.
create table if not exists public.allowed_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

-- Businesses = the kanban cards
create type business_status as enum (
  'cold', 'outreached', 'interested', 'scheduled', 'won', 'lost'
);

create type business_vertical as enum (
  'restaurant', 'salon', 'barbershop', 'contractor', 'retail', 'fitness', 'other'
);

create type outreach_source as enum (
  'walk_in', 'email', 'ig_dm', 'warm_intro', 'scraped', 'other'
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vertical business_vertical not null default 'other',
  address text,
  phone text,
  summary text,
  contact_name text,
  contact_relationship text,
  contact_phone text,
  source outreach_source,
  status business_status not null default 'cold',
  assigned_to uuid references public.profiles(user_id) on delete set null,
  custom_site_url text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(user_id) on delete set null
);

create index businesses_status_idx on public.businesses (status, last_activity_at desc);
create index businesses_assigned_idx on public.businesses (assigned_to);

-- Activity log (append-only)
create type activity_event_type as enum (
  'outreach_sent', 'response_received', 'call_held',
  'meeting_scheduled', 'meeting_held', 'won', 'lost', 'note'
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_id uuid references public.profiles(user_id) on delete set null,
  event_type activity_event_type not null,
  channel outreach_source,
  template_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create index activity_log_business_idx on public.activity_log (business_id, created_at desc);

-- Email templates (for v2 — schema in place now)
create type template_category as enum (
  'cold', 'followup', 'recap', 'confirmation', 'other'
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  category template_category not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Calendar events (for v2 — schema in place now)
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  google_event_id text,
  scheduled_at timestamptz not null,
  attendees jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

-- Update last_activity_at automatically when a business is moved
create or replace function public.touch_business_activity()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    new.last_activity_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger businesses_touch_activity
  before update on public.businesses
  for each row execute function public.touch_business_activity();

-- Bump last_activity_at when an activity log entry is created
create or replace function public.bump_business_activity_on_log()
returns trigger as $$
begin
  update public.businesses
    set last_activity_at = new.created_at
    where id = new.business_id;
  return new;
end;
$$ language plpgsql;

create trigger activity_log_bump
  after insert on public.activity_log
  for each row execute function public.bump_business_activity_on_log();
