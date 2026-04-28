-- Admin role on profiles. Admins can invite/remove team members and manage settings.
-- Non-admin members still have full read/write access to businesses, activity_log, etc.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Bootstrap: mark Cody as admin.
update public.profiles set is_admin = true where email = 'cdychen@ucdavis.edu';

-- Helper used by RLS + server actions.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;

-- Tighten allowed_emails: only admins can write.
drop policy if exists allowed_emails_admin_write on public.allowed_emails;
create policy allowed_emails_admin_write on public.allowed_emails
  for all
  using (public.is_admin())
  with check (public.is_admin());
