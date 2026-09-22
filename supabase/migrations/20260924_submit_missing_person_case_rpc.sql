-- Secure submission endpoint for anonymous and authenticated reporters.
-- It returns only the newly-created case id; pending cases remain private.

create or replace function public.submit_missing_person_case(
  p_full_name text,
  p_age integer,
  p_description text,
  p_circumstances text,
  p_last_seen_at timestamptz,
  p_last_seen_location text,
  p_reporter_name text,
  p_reporter_contact text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_case_id uuid;
begin
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Le nom complet est obligatoire';
  end if;
  if p_description is null or length(trim(p_description)) < 10 then
    raise exception 'La description doit contenir au moins 10 caractères';
  end if;
  if p_last_seen_location is null or length(trim(p_last_seen_location)) < 2 then
    raise exception 'La dernière localisation est obligatoire';
  end if;
  if p_reporter_name is null or length(trim(p_reporter_name)) < 2 then
    raise exception 'Le nom du déclarant est obligatoire';
  end if;
  if p_reporter_contact is null or length(trim(p_reporter_contact)) < 3 then
    raise exception 'Le contact du déclarant est obligatoire';
  end if;
  if p_age is not null and (p_age < 0 or p_age > 130) then
    raise exception 'Age invalide';
  end if;

  insert into public.missing_person_cases (
    reporter_id,
    full_name,
    age,
    description,
    circumstances,
    last_seen_at,
    last_seen_location,
    reporter_name,
    reporter_contact,
    status
  )
  values (
    auth.uid(),
    trim(p_full_name),
    p_age,
    trim(p_description),
    nullif(trim(p_circumstances), ''),
    p_last_seen_at,
    trim(p_last_seen_location),
    trim(p_reporter_name),
    trim(p_reporter_contact),
    'pending_review'
  )
  returning id into new_case_id;

  return new_case_id;
end;
$$;

revoke all on function public.submit_missing_person_case(
  text, integer, text, text, timestamptz, text, text, text
) from public;
grant execute on function public.submit_missing_person_case(
  text, integer, text, text, timestamptz, text, text, text
) to anon, authenticated;
