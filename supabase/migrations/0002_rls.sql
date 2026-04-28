-- Row-level security: only allowlisted profiles can read/write.
-- v1: 3 founders all have full access. No per-user restrictions.

alter table public.profiles enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.businesses enable row level security;
alter table public.activity_log enable row level security;
alter table public.email_templates enable row level security;
alter table public.calendar_events enable row level security;

-- Helper: is the current authenticated user a known team member?
-- (Membership = row in profiles. Profile rows are created via the
-- handle_new_user trigger only when email is in allowed_emails.)
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where user_id = auth.uid()
  );
$$;

-- Profiles: team members can read all profiles, update only their own
create policy profiles_select on public.profiles
  for select using (public.is_team_member());

create policy profiles_update_own on public.profiles
  for update using (user_id = auth.uid());

-- Allowed emails: read-only for team members
create policy allowed_emails_select on public.allowed_emails
  for select using (public.is_team_member());

-- Businesses, activity log, templates, calendar events:
-- full read/write for any team member
create policy businesses_all on public.businesses
  for all using (public.is_team_member()) with check (public.is_team_member());

create policy activity_log_all on public.activity_log
  for all using (public.is_team_member()) with check (public.is_team_member());

create policy email_templates_all on public.email_templates
  for all using (public.is_team_member()) with check (public.is_team_member());

create policy calendar_events_all on public.calendar_events
  for all using (public.is_team_member()) with check (public.is_team_member());

-- Auto-create profile row when an allowlisted email signs up.
-- Non-allowlisted signups: profile row is NOT created, so is_team_member()
-- returns false and they cannot read/write anything.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.allowed_emails where email = new.email) then
    insert into public.profiles (user_id, email, name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
