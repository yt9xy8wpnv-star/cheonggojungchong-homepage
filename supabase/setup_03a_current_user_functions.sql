-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (profiles.is_admin = true or profiles.role = 'admin')
  )
$fn$;

create or replace function public.is_current_user_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (profiles.is_admin = true or profiles.role in ('admin', 'sub_admin'))
  )
$fn$;

create or replace function public.is_current_user_sub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = false
      and profiles.role = 'sub_admin'
  )
$fn$;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.is_current_user_staff() to authenticated;
grant execute on function public.is_current_user_sub_admin() to authenticated;
