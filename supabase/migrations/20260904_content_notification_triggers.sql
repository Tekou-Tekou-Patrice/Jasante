create extension if not exists pg_net with schema extensions;

create or replace function public.notify_published_content()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://vkfyswkisoysyoisqfuc.supabase.co/functions/v1/send-content-notification',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    )
  );

  return NEW;
end;
$$;

drop trigger if exists articles_notify_published_content
  on public.articles;
drop trigger if exists articles_notify_published_insert
  on public.articles;
create trigger articles_notify_published_insert
after insert on public.articles
for each row
when (NEW.published = true)
execute function public.notify_published_content();

drop trigger if exists articles_notify_published_update
  on public.articles;
create trigger articles_notify_published_update
after update of published on public.articles
for each row
when (NEW.published = true and OLD.published is distinct from NEW.published)
execute function public.notify_published_content();

drop trigger if exists videos_notify_published_content
  on public.videos;
drop trigger if exists videos_notify_published_insert
  on public.videos;
create trigger videos_notify_published_insert
after insert on public.videos
for each row
when (NEW.published = true)
execute function public.notify_published_content();

drop trigger if exists videos_notify_published_update
  on public.videos;
create trigger videos_notify_published_update
after update of published on public.videos
for each row
when (NEW.published = true and OLD.published is distinct from NEW.published)
execute function public.notify_published_content();
