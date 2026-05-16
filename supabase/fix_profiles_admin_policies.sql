alter table public.profiles enable row level security;

alter table public.profiles add column if not exists role text default 'member';

update public.profiles
set role = case
  when role in ('member', 'sub_admin', 'admin') then role
  when is_admin = true then 'admin'
  else 'member'
end;

alter table public.profiles alter column role set default 'member';
alter table public.profiles alter column role set not null;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $admin_check$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (is_admin = true or role = 'admin')
  );
$admin_check$;

create or replace function public.is_current_user_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $staff_check$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (is_admin = true or role in ('admin', 'sub_admin'))
  );
$staff_check$;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.is_current_user_staff() to authenticated;
revoke update on public.profiles from authenticated;
grant select, insert on public.profiles to authenticated;
grant update (
  username,
  korean_subject,
  math_subject,
  english_choice,
  inquiry1_subject,
  inquiry2_subject,
  second_foreign_subject
) on public.profiles to authenticated;

create or replace function public.approve_profile(target_profile_id uuid, next_role text default 'member')
returns void
language plpgsql
security definer
set search_path = public
as $approve_profile$
declare
  caller_is_admin boolean;
  caller_is_staff boolean;
  normalized_role text;
begin
  caller_is_admin := public.is_current_user_admin();
  caller_is_staff := public.is_current_user_staff();
  normalized_role := coalesce(nullif(next_role, ''), 'member');

  if not caller_is_staff then
    raise exception '관리자 또는 부관리자만 회원을 승인할 수 있습니다.';
  end if;

  if normalized_role not in ('member', 'sub_admin', 'admin') then
    raise exception '알 수 없는 권한입니다.';
  end if;

  if normalized_role <> 'member' and not caller_is_admin then
    raise exception '부관리자 이상 권한 지정은 관리자만 할 수 있습니다.';
  end if;

  update public.profiles
  set
    is_approved = true,
    role = normalized_role,
    is_admin = normalized_role = 'admin'
  where id = target_profile_id;
end;
$approve_profile$;

grant execute on function public.approve_profile(uuid, text) to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_current_user_staff()
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.is_current_user_admin()
)
with check (
  auth.uid() = id
  or public.is_current_user_admin()
);
