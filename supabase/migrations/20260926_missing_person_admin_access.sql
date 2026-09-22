-- Allow the admin panel account to use the shared user_roles table.

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

grant execute on function public.has_app_role(public.app_role[]) to authenticated;
