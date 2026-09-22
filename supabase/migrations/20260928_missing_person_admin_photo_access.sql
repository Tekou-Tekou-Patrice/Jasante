-- Ensure moderators and administrators can read and remove missing-person photos.

drop policy if exists "Staff can read missing case photos"
  on public.missing_case_photos;
create policy "Staff can read missing case photos"
  on public.missing_case_photos for select
  to authenticated
  using (
    public.has_app_role(array['moderator', 'admin']::public.app_role[])
  );

drop policy if exists "Staff can read missing-person photos"
  on storage.objects;
create policy "Staff can read missing-person photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'missing-person-photos'
    and public.has_app_role(array['moderator', 'admin']::public.app_role[])
  );

drop policy if exists "Staff can delete missing-person photos"
  on storage.objects;
create policy "Staff can delete missing-person photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'missing-person-photos'
    and public.has_app_role(array['moderator', 'admin']::public.app_role[])
  );
