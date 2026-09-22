-- Fix audit triggers for INSERT/DELETE records.

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
    case_id_value := old.id;
    details_value := jsonb_build_object('old', to_jsonb(old), 'new', null);
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

create or replace function public.audit_missing_case_tip_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  case_id_value uuid;
  tip_id_value uuid;
  details_value jsonb;
begin
  if tg_op = 'DELETE' then
    case_id_value := old.case_id;
    tip_id_value := old.id;
    details_value := jsonb_build_object('old', to_jsonb(old), 'new', null);
  elsif tg_op = 'INSERT' then
    case_id_value := new.case_id;
    tip_id_value := new.id;
    details_value := jsonb_build_object('old', null, 'new', to_jsonb(new));
  else
    case_id_value := new.case_id;
    tip_id_value := new.id;
    details_value := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  end if;

  insert into public.missing_case_audit_log(
    actor_id, case_id, tip_id, action, details
  )
  values (
    auth.uid(), case_id_value, tip_id_value,
    tg_op || '_' || tg_table_name, details_value
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
