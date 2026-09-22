-- Mobile-client additions. Run after the core categories/articles/videos schema.
-- The public app can only read content that an administrator has published.

alter table public.quiz_questions
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists quiz_questions_category_published_order_idx
  on public.quiz_questions(category_id, published, display_order);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null,
  name_en text not null,
  description_fr text,
  description_en text,
  phone text,
  whatsapp text,
  email text,
  address text,
  type text not null default 'other',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_published_name_idx
  on public.resources(published, name_fr);

alter table public.resources enable row level security;

drop policy if exists "Published resources are readable" on public.resources;
create policy "Published resources are readable" on public.resources
  for select to anon using (published = true);
