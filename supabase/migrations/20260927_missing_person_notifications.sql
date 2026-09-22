-- Enable realtime events used by the mobile case and notification flows.
alter publication supabase_realtime add table public.missing_person_cases;
alter publication supabase_realtime add table public.missing_case_notifications;

drop policy if exists "Public can upload tip photos" on storage.objects;
create policy "Public can upload tip photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'missing-person-photos'
    and split_part(name, '/', 1) = 'tips'
    and exists (
      select 1
      from public.missing_person_cases c
      where c.id::text = split_part(name, '/', 2)
        and c.status in ('verified', 'resolved')
    )
  );

create or replace function public.notify_missing_case_reporter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reporter_id is not null
     and old.status is distinct from new.status then
    insert into public.missing_case_notifications(
      recipient_id, case_id, notification_type, title, body
    )
    values (
      new.reporter_id,
      new.id,
      'case_status_changed',
      'Statut de votre déclaration modifié',
      case new.status
        when 'verified' then 'Votre déclaration a été vérifiée et publiée.'
        when 'rejected' then 'Votre déclaration a été rejetée après vérification.'
        when 'resolved' then 'Le cas a été marqué comme résolu.'
        else 'Le statut de votre déclaration a changé.'
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_missing_case_reporter
  on public.missing_person_cases;
create trigger notify_missing_case_reporter
after update of status on public.missing_person_cases
for each row execute function public.notify_missing_case_reporter();
