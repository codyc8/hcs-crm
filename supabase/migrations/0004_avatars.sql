-- Avatar storage bucket. Public read so <img src=...> works without auth.
-- Server actions write via service_role (admin client), so no insert/update policies needed.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public can read any object in this bucket.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');
