-- Keep delete audit entries after their source case is removed.

create or replace function public.audit_missing_case_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  case_id_value uuid;
  details_value jsonb;
begin
  if tg_op = 'DELETE' then
    case_id_value := null;
    details_value := jsonb_build_object(
      'deleted_case_id', old.id,
      'old', to_jsonb(old),
      'new', null
    );
  elsif tg_op = 'INSERT' then
    case_id_value := new.id;
    details_value := jsonb_build_object('old', null, 'new', to_jsonb(new));
  else
    case_id_value := new.id;
    details_value := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  end if;

  insert into public.missing_case_audit_log(actor_id, case_id, action, details)
  values (auth.uid(), case_id_value, tg_op || '_' || tg_table_name, details_value);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

alter table public.missing_case_tips
  drop constraint if exists missing_case_tips_case_id_fkey;
alter table public.missing_case_tips
  add constraint missing_case_tips_case_id_fkey
  foreign key (case_id) references public.missing_person_cases(id) on delete cascade;
