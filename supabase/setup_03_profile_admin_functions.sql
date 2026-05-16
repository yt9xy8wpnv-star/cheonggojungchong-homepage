create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (is_admin = true or role = ''admin'')
  )
';

create or replace function public.is_current_user_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (is_admin = true or role in (''admin'', ''sub_admin''))
  )
';

create or replace function public.is_current_user_sub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as '
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = false
      and role = ''sub_admin''
  )
';

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.is_current_user_staff() to authenticated;
grant execute on function public.is_current_user_sub_admin() to authenticated;

create or replace function public.approve_profile(target_profile_id uuid, next_role text default 'member')
returns void
language plpgsql
security definer
set search_path = public
as '
declare
  caller_is_staff boolean;
begin
  caller_is_staff := public.is_current_user_staff();

  if not caller_is_staff then
    raise exception ''관리자 또는 부관리자만 회원을 승인할 수 있습니다.'';
  end if;

  update public.profiles
  set
    is_approved = true,
    role = ''member'',
    is_admin = false
  where id = target_profile_id
    and coalesce(is_approved, false) = false
    and coalesce(role, ''member'') = ''member''
    and coalesce(is_admin, false) = false;

  if not found then
    raise exception ''승인 가능한 회원을 찾을 수 없습니다.'';
  end if;
end;
';

grant execute on function public.approve_profile(uuid, text) to authenticated;

create or replace function public.promote_profile_role(target_profile_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as '
declare
  caller_role text;
  target_role text;
  normalized_role text;
begin
  select case
    when is_admin = true or role = ''admin'' then ''admin''
    when role = ''sub_admin'' then ''sub_admin''
    else ''member''
  end
  into caller_role
  from public.profiles
  where id = auth.uid();

  select case
    when is_admin = true or role = ''admin'' then ''admin''
    when role = ''sub_admin'' then ''sub_admin''
    else ''member''
  end
  into target_role
  from public.profiles
  where id = target_profile_id
    and is_approved = true
  for update;

  normalized_role := coalesce(next_role, ''member'');

  if coalesce(caller_role, ''member'') not in (''admin'', ''sub_admin'') then
    raise exception ''관리자 또는 부관리자만 회원 권한을 관리할 수 있습니다.'';
  end if;

  if target_role is null then
    raise exception ''관리 가능한 회원을 찾을 수 없습니다.'';
  end if;

  if caller_role = ''sub_admin'' and not (target_role = ''member'' and normalized_role = ''sub_admin'') then
    raise exception ''부관리자는 일반 회원만 부관리자로 승격할 수 있습니다.'';
  end if;

  if caller_role = ''admin'' and not (
    (target_role = ''member'' and normalized_role = ''sub_admin'')
    or (target_role = ''sub_admin'' and normalized_role = ''admin'')
  ) then
    raise exception ''관리자는 일반 회원 또는 부관리자만 단계적으로 승격할 수 있습니다.'';
  end if;

  update public.profiles
  set
    role = normalized_role,
    is_admin = normalized_role = ''admin'',
    is_approved = true
  where id = target_profile_id;
end;
';

grant execute on function public.promote_profile_role(uuid, text) to authenticated;
