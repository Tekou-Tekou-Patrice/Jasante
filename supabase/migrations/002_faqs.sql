create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_fr text not null check (char_length(question_fr) between 5 and 500),
  question_en text not null check (char_length(question_en) between 5 and 500),
  answer_fr text not null check (char_length(answer_fr) between 10 and 2000),
  answer_en text not null check (char_length(answer_en) between 10 and 2000),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faqs enable row level security;

grant select on public.faqs to anon;
grant select, insert, update, delete on public.faqs to authenticated;

create policy "admin manages faqs"
on public.faqs for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "published faqs readable"
on public.faqs for select to anon
using (published = true);
