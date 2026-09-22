create extension if not exists pgcrypto;

create type public.content_status as enum ('draft', 'published', 'withdrawn');
create type public.content_language as enum ('fr', 'en');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  language public.content_language not null,
  title text not null check (char_length(title) between 5 and 160),
  body text not null check (char_length(body) > 0),
  image_path text,
  image_alt text,
  publication_status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (image_path is null or char_length(image_alt) between 5 and 250),
  check ((publication_status = 'published') = (published_at is not null))
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  language public.content_language not null,
  youtube_url text not null unique,
  youtube_video_id text not null unique,
  title text not null check (char_length(title) between 5 and 160),
  description text not null check (char_length(description) between 20 and 2000),
  thumbnail_url text not null,
  publication_status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((publication_status = 'published') = (published_at is not null))
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  language public.content_language not null,
  question text not null check (char_length(question) between 5 and 500),
  explanation text not null check (char_length(explanation) between 10 and 1000),
  publication_status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null check (char_length(option_text) between 1 and 300),
  position smallint not null check (position between 1 and 6),
  is_correct boolean not null default false,
  unique(question_id, position)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  resource_type text not null check (char_length(resource_type) between 2 and 80),
  city text not null check (char_length(city) between 2 and 100),
  phone text,
  whatsapp text,
  address text,
  description text,
  language public.content_language not null,
  publication_status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or whatsapp is not null or address is not null or description is not null)
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()) $$;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.categories, public.articles, public.videos, public.quiz_questions, public.quiz_options, public.resources to anon;
grant select, insert, update, delete on public.categories, public.articles, public.videos, public.quiz_questions, public.quiz_options, public.resources to authenticated;

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.videos enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.resources enable row level security;

create policy "admin manages categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published categories readable" on public.categories for select to anon using (true);
create policy "admin manages articles" on public.articles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published articles readable" on public.articles for select to anon using (publication_status = 'published');
create policy "admin manages videos" on public.videos for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published videos readable" on public.videos for select to anon using (publication_status = 'published');
create policy "admin manages quizzes" on public.quiz_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published quizzes readable" on public.quiz_questions for select to anon using (publication_status = 'published');
create policy "admin manages options" on public.quiz_options for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published options readable" on public.quiz_options for select to anon using (exists(select 1 from public.quiz_questions q where q.id = question_id and q.publication_status = 'published'));
create policy "admin manages resources" on public.resources for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published resources readable" on public.resources for select to anon using (publication_status = 'published');

insert into storage.buckets (id, name, public) values ('article-images', 'article-images', true) on conflict do nothing;
create policy "admins manage article images" on storage.objects for all to authenticated using (bucket_id = 'article-images' and public.is_admin()) with check (bucket_id = 'article-images' and public.is_admin());

