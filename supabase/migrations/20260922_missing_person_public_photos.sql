-- Allow anonymous declarations to attach photos to their own pending case.
-- The storage path must start with the case UUID: <case-id>/<file-name>.

drop policy if exists "Public can upload pending case photos" on storage.objects;
create policy "Public can upload pending case photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'missing-person-photos'
    and exists (
      select 1
      from public.missing_person_cases c
      where c.id::text = split_part(name, '/', 1)
        and c.status = 'pending_review'
    )
  );

drop policy if exists "Public can attach pending case photos"
  on public.missing_case_photos;
create policy "Public can attach pending case photos"
  on public.missing_case_photos for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.missing_person_cases c
      where c.id = case_id
        and c.status = 'pending_review'
        and c.published_at is null
    )
  );
