-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.

create or replace function public.update_profile_role(target_profile_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  caller_role text;
  target_role text;
  caller_rank integer;
  target_rank integer;
  next_rank integer;
begin
  caller_role := coalesce((
    select case
      when profiles.is_admin = true or profiles.role = 'admin' then 'admin'
      when profiles.role = 'sub_admin' then 'sub_admin'
      else 'member'
    end
    from public.profiles as profiles
    where profiles.id = auth.uid()
  ), 'member');

  target_role := (
    select case
      when profiles.is_admin = true or profiles.role = 'admin' then 'admin'
      when profiles.role = 'sub_admin' then 'sub_admin'
      else 'member'
    end
    from public.profiles as profiles
    where profiles.id = target_profile_id
      and profiles.is_approved = true
  );

  if next_role is null or next_role not in ('member', 'sub_admin', 'admin') then
    raise exception '변경할 수 없는 등급입니다.';
  end if;

  caller_rank := case caller_role when 'admin' then 3 when 'sub_admin' then 2 else 1 end;
  target_rank := case target_role when 'admin' then 3 when 'sub_admin' then 2 else 1 end;
  next_rank := case next_role when 'admin' then 3 when 'sub_admin' then 2 else 1 end;

  if caller_role not in ('admin', 'sub_admin') then
    raise exception '관리자 또는 부관리자만 회원 권한을 관리할 수 있습니다.';
  end if;

  if target_role is null then
    raise exception '관리 가능한 회원을 찾을 수 없습니다.';
  end if;

  if target_profile_id = auth.uid() then
    raise exception '본인 등급은 직접 수정할 수 없습니다.';
  end if;

  if caller_rank <= target_rank then
    raise exception '자신과 같거나 높은 등급의 회원은 수정할 수 없습니다.';
  end if;

  if next_rank > caller_rank then
    raise exception '자신보다 높은 등급으로 변경할 수 없습니다.';
  end if;

  update public.profiles as profiles
  set
    role = next_role,
    is_admin = next_role = 'admin',
    is_approved = true
  where profiles.id = target_profile_id;
end;
$fn$;

grant execute on function public.update_profile_role(uuid, text) to authenticated;

create or replace function public.promote_profile_role(target_profile_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform public.update_profile_role(target_profile_id, next_role);
end;
$fn$;

grant execute on function public.promote_profile_role(uuid, text) to authenticated;
