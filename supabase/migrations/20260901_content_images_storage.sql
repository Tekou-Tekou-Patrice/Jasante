-- Shared public bucket used by the admin upload and the mobile app.
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read content images" on storage.objects;
create policy "Public can read content images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'content-images');

drop policy if exists "Authenticated users can upload content images" on storage.objects;
create policy "Authenticated users can upload content images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'content-images');

drop policy if exists "Authenticated users can update content images" on storage.objects;
create policy "Authenticated users can update content images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'content-images')
  with check (bucket_id = 'content-images');

drop policy if exists "Authenticated users can delete content images" on storage.objects;
create policy "Authenticated users can delete content images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'content-images');
