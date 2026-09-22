create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  platform text not null,
  updated_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;

drop policy if exists "Devices can register notification tokens"
  on public.device_tokens;
create policy "Devices can register notification tokens"
  on public.device_tokens
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Devices can refresh notification tokens"
  on public.device_tokens;
create policy "Devices can refresh notification tokens"
  on public.device_tokens
  for update
  to anon, authenticated
  using (true)
  with check (true);

revoke select, delete on public.device_tokens from anon, authenticated;
