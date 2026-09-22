-- Content shown in the mobile app. Editors manage it in Supabase; the app only reads published rows.
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question_fr text not null,
  question_en text not null,
  options_fr jsonb not null check (jsonb_typeof(options_fr) = 'array'),
  options_en jsonb not null check (jsonb_typeof(options_en) = 'array'),
  correct_option_index integer not null check (correct_option_index >= 0),
  explanation_fr text not null,
  explanation_en text not null,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_array_length(options_fr) = jsonb_array_length(options_en)),
  check (correct_option_index < jsonb_array_length(options_fr))
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_fr text not null,
  question_en text not null,
  answer_fr text not null,
  answer_en text not null,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;
alter table public.faqs enable row level security;

create policy "Published quiz questions are readable" on public.quiz_questions
  for select to anon using (published = true);
create policy "Published FAQs are readable" on public.faqs
  for select to anon using (published = true);
