-- RLS-safe checks for attaching photos to a private pending case.

create or replace function public.can_attach_pending_case_photo(
  requested_case_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.missing_person_cases
    where id = requested_case_id
      and status = 'pending_review'
      and published_at is null
  );
$$;

revoke all on function public.can_attach_pending_case_photo(uuid) from public;
grant execute on function public.can_attach_pending_case_photo(uuid)
  to anon, authenticated;

drop policy if exists "Public can upload pending case photos"
  on storage.objects;
create policy "Public can upload pending case photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'missing-person-photos'
    and public.can_attach_pending_case_photo(
      split_part(name, '/', 1)::uuid
    )
  );

drop policy if exists "Public can attach pending case photos"
  on public.missing_case_photos;
create policy "Public can attach pending case photos"
  on public.missing_case_photos for insert
  to anon, authenticated
  with check (
    public.can_attach_pending_case_photo(case_id)
  );
