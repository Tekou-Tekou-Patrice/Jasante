create table if not exists public.video_comments (
  id text primary key,
  video_id text not null,
  author text not null default 'Utilisateur',
  text text not null check (length(trim(text)) > 0),
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists video_comments_video_created_idx
  on public.video_comments(video_id, created_at desc);

alter table public.video_comments enable row level security;

drop policy if exists "Published video comments are readable"
  on public.video_comments;
create policy "Published video comments are readable"
  on public.video_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.videos
      where videos.id::text = video_comments.video_id
        and videos.published = true
    )
  );

drop policy if exists "Anyone can submit video comments"
  on public.video_comments;
create policy "Anyone can submit video comments"
  on public.video_comments
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.videos
      where videos.id::text = video_comments.video_id
        and videos.published = true
    )
  );

grant select, insert on public.video_comments to anon, authenticated;
