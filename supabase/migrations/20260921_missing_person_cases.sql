-- Missing-person case management: reports, tips, moderation, roles and notifications.

create extension if not exists pgcrypto;

create type public.missing_case_status as enum (
  'pending_review',
  'verified',
  'rejected',
  'resolved'
);

create type public.tip_status as enum (
  'new',
  'reviewed',
  'actioned',
  'dismissed'
);

create type public.app_role as enum (
  'user',
  'moderator',
  'admin'
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.has_app_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and active = true
      and role = any(required_roles)
  );
$$;

revoke all on function public.has_app_role(public.app_role[]) from public;
grant execute on function public.has_app_role(public.app_role[]) to anon, authenticated;

create table if not exists public.missing_person_cases (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  full_name text not null check (length(trim(full_name)) between 2 and 200),
  age integer check (age is null or age between 0 and 130),
  description text not null check (length(trim(description)) between 10 and 5000),
  circumstances text check (circumstances is null or length(trim(circumstances)) <= 5000),
  last_seen_at timestamptz,
  last_seen_location text not null check (length(trim(last_seen_location)) between 2 and 300),
  last_seen_latitude numeric(9,6) check (last_seen_latitude between -90 and 90),
  last_seen_longitude numeric(9,6) check (last_seen_longitude between -180 and 180),
  status public.missing_case_status not null default 'pending_review',
  published_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  reporter_name text not null check (length(trim(reporter_name)) between 2 and 200),
  reporter_contact text not null check (length(trim(reporter_contact)) between 3 and 300),
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'verified' and published_at is not null)
    or status <> 'verified'
  ),
  check (
    (status = 'resolved' and resolved_at is not null)
    or status <> 'resolved'
  )
);

create index if not exists missing_cases_public_idx
  on public.missing_person_cases(status, created_at desc);
create index if not exists missing_cases_name_idx
  on public.missing_person_cases using gin(to_tsvector('simple', full_name));
create index if not exists missing_cases_reporter_idx
  on public.missing_person_cases(reporter_id);

create table if not exists public.missing_case_photos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.missing_person_cases(id) on delete cascade,
  storage_path text not null unique,
  sort_order smallint not null default 0 check (sort_order between 0 and 3),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists one_primary_missing_case_photo_idx
  on public.missing_case_photos(case_id)
  where is_primary = true;

create or replace function public.enforce_missing_case_photo_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*) from public.missing_case_photos
    where case_id = new.case_id
  ) >= 4 then
    raise exception 'A missing-person case cannot have more than four photos';
  end if;
  return new;
end;
$$;

drop trigger if exists missing_case_photo_limit on public.missing_case_photos;
create trigger missing_case_photo_limit
before insert on public.missing_case_photos
for each row execute function public.enforce_missing_case_photo_limit();

create table if not exists public.missing_case_tips (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.missing_person_cases(id) on delete cascade,
  contributor_id uuid references auth.users(id) on delete set null,
  message text not null check (length(trim(message)) between 10 and 5000),
  is_anonymous boolean not null default true,
  contributor_name text,
  contributor_contact text,
  photo_storage_path text,
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  status public.tip_status not null default 'new',
  internal_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check (
    is_anonymous
    or contributor_name is not null
    or contributor_contact is not null
  )
);

create index if not exists missing_case_tips_case_idx
  on public.missing_case_tips(case_id, created_at desc);
create index if not exists missing_case_tips_status_idx
  on public.missing_case_tips(status, created_at desc);

create table if not exists public.missing_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.missing_person_cases(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (length(trim(event_type)) between 2 and 80),
  description text not null check (length(trim(description)) between 2 and 2000),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists missing_case_events_case_idx
  on public.missing_case_events(case_id, created_at desc);

create table if not exists public.missing_case_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.missing_person_cases(id) on delete cascade,
  tip_id uuid references public.missing_case_tips(id) on delete cascade,
  notification_type text not null check (length(trim(notification_type)) between 2 and 80),
  title text not null check (length(trim(title)) between 2 and 200),
  body text not null check (length(trim(body)) between 2 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (case_id is not null or tip_id is not null)
);

create index if not exists missing_case_notifications_recipient_idx
  on public.missing_case_notifications(recipient_id, read_at, created_at desc);

create table if not exists public.missing_case_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  case_id uuid references public.missing_person_cases(id) on delete set null,
  tip_id uuid references public.missing_case_tips(id) on delete set null,
  action text not null check (length(trim(action)) between 2 and 100),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.missing_person_cases enable row level security;
alter table public.missing_case_photos enable row level security;
alter table public.missing_case_tips enable row level security;
alter table public.missing_case_events enable row level security;
alter table public.missing_case_notifications enable row level security;
alter table public.missing_case_audit_log enable row level security;

drop policy if exists "Published missing cases are publicly readable"
  on public.missing_person_cases;
create policy "Published missing cases are publicly readable"
  on public.missing_person_cases for select
  to anon, authenticated
  using (status in ('verified', 'resolved'));

drop policy if exists "Reporters can read their own cases"
  on public.missing_person_cases;
create policy "Reporters can read their own cases"
  on public.missing_person_cases for select
  to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "Anyone can submit a missing-person case"
  on public.missing_person_cases;
create policy "Anyone can submit a missing-person case"
  on public.missing_person_cases for insert
  to anon, authenticated
  with check (
    status = 'pending_review'
    and published_at is null
    and resolved_at is null
    and moderation_note is null
    and (reporter_id is null or reporter_id = auth.uid())
  );

drop policy if exists "Staff can manage missing-person cases"
  on public.missing_person_cases;
create policy "Staff can manage missing-person cases"
  on public.missing_person_cases for all
  to authenticated
  using (public.has_app_role(array['moderator', 'admin']::public.app_role[]))
  with check (public.has_app_role(array['moderator', 'admin']::public.app_role[]));

drop policy if exists "Published case photos are publicly readable"
  on public.missing_case_photos;
create policy "Published case photos are publicly readable"
  on public.missing_case_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.missing_person_cases c
      where c.id = case_id and c.status in ('verified', 'resolved')
    )
  );

drop policy if exists "Staff can manage case photos"
  on public.missing_case_photos;
create policy "Staff can manage case photos"
  on public.missing_case_photos for all
  to authenticated
  using (public.has_app_role(array['moderator', 'admin']::public.app_role[]))
  with check (public.has_app_role(array['moderator', 'admin']::public.app_role[]));

drop policy if exists "Anyone can submit a tip"
  on public.missing_case_tips;
create policy "Anyone can submit a tip"
  on public.missing_case_tips for insert
  to anon, authenticated
  with check (
    status = 'new'
    and exists (
      select 1 from public.missing_person_cases c
      where c.id = case_id and c.status in ('verified', 'resolved')
    )
    and (contributor_id is null or contributor_id = auth.uid())
  );

drop policy if exists "Staff can manage tips"
  on public.missing_case_tips;
create policy "Staff can manage tips"
  on public.missing_case_tips for all
  to authenticated
  using (public.has_app_role(array['moderator', 'admin']::public.app_role[]))
  with check (public.has_app_role(array['moderator', 'admin']::public.app_role[]));

drop policy if exists "Public events for published cases are readable"
  on public.missing_case_events;
create policy "Public events for published cases are readable"
  on public.missing_case_events for select
  to anon, authenticated
  using (
    is_public and exists (
      select 1 from public.missing_person_cases c
      where c.id = case_id and c.status in ('verified', 'resolved')
    )
  );

drop policy if exists "Staff can manage case events"
  on public.missing_case_events;
create policy "Staff can manage case events"
  on public.missing_case_events for all
  to authenticated
  using (public.has_app_role(array['moderator', 'admin']::public.app_role[]))
  with check (public.has_app_role(array['moderator', 'admin']::public.app_role[]));

drop policy if exists "Published missing-person photos are readable"
  on storage.objects;
create policy "Published missing-person photos are readable"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'missing-person-photos'
    and exists (
      select 1
      from public.missing_case_photos p
      join public.missing_person_cases c on c.id = p.case_id
      where p.storage_path = name
        and c.status in ('verified', 'resolved')
    )
  );

drop policy if exists "Users can read their notifications"
  on public.missing_case_notifications;
create policy "Users can read their notifications"
  on public.missing_case_notifications for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "Users can mark their notifications read"
  on public.missing_case_notifications;
create policy "Users can mark their notifications read"
  on public.missing_case_notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "Admins can manage roles"
  on public.user_roles;
create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_app_role(array['admin']::public.app_role[]))
  with check (public.has_app_role(array['admin']::public.app_role[]));

drop policy if exists "Users can read their own role"
  on public.user_roles;
create policy "Users can read their own role"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Staff can read audit log"
  on public.missing_case_audit_log;
create policy "Staff can read audit log"
  on public.missing_case_audit_log for select
  to authenticated
  using (public.has_app_role(array['moderator', 'admin']::public.app_role[]));

create or replace function public.touch_missing_case_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists missing_case_updated_at on public.missing_person_cases;
create trigger missing_case_updated_at
before update on public.missing_person_cases
for each row execute function public.touch_missing_case_updated_at();

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
  values (
    auth.uid(),
    case_id_value,
    tg_op || '_' || tg_table_name,
    details_value
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_missing_case_change on public.missing_person_cases;
create trigger audit_missing_case_change
after insert or update or delete on public.missing_person_cases
for each row execute function public.audit_missing_case_change();

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
    auth.uid(),
    case_id_value,
    tip_id_value,
    tg_op || '_' || tg_table_name,
    details_value
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_missing_case_tip_change on public.missing_case_tips;
create trigger audit_missing_case_tip_change
after insert or update or delete on public.missing_case_tips
for each row execute function public.audit_missing_case_tip_change();

create or replace function public.notify_missing_case_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.missing_case_notifications(
    recipient_id, case_id, tip_id, notification_type, title, body
  )
  select
    ur.user_id,
    new.case_id,
    new.id,
    'new_tip',
    'Nouvel indice à examiner',
    'Un nouvel indice a été reçu pour un cas de disparition.'
  from public.user_roles ur
  where ur.active = true and ur.role in ('moderator', 'admin');
  return new;
end;
$$;

drop trigger if exists notify_missing_case_staff on public.missing_case_tips;
create trigger notify_missing_case_staff
after insert on public.missing_case_tips
for each row execute function public.notify_missing_case_staff();

insert into storage.buckets (id, name, public)
values ('missing-person-photos', 'missing-person-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Staff can upload missing-person photos" on storage.objects;
create policy "Staff can upload missing-person photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'missing-person-photos'
    and (
      public.has_app_role(array['moderator', 'admin']::public.app_role[])
      or exists (
        select 1
        from public.missing_person_cases c
        where c.id::text = split_part(name, '/', 1)
          and c.reporter_id = auth.uid()
          and c.status = 'pending_review'
      )
    )
  );

drop policy if exists "Staff can manage missing-person photos" on storage.objects;
create policy "Staff can manage missing-person photos"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'missing-person-photos'
    and (
      public.has_app_role(array['moderator', 'admin']::public.app_role[])
      or exists (
        select 1
        from public.missing_person_cases c
        where c.id::text = split_part(name, '/', 1)
          and c.reporter_id = auth.uid()
      )
    )
  )
  with check (
    bucket_id = 'missing-person-photos'
    and public.has_app_role(array['moderator', 'admin']::public.app_role[])
  );
