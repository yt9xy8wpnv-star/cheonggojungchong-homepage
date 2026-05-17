-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.

create or replace function public.suspend_profile(target_profile_id uuid, suspension_start timestamptz, suspension_end timestamptz, permanent boolean default false)
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
  normalized_start timestamptz;
  normalized_end timestamptz;
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

  caller_rank := case caller_role when 'admin' then 3 when 'sub_admin' then 2 else 1 end;
  target_rank := case target_role when 'admin' then 3 when 'sub_admin' then 2 else 1 end;

  if caller_role not in ('admin', 'sub_admin') then
    raise exception '관리자 또는 부관리자만 회원 자격을 관리할 수 있습니다.';
  end if;

  if target_role is null then
    raise exception '관리 가능한 회원을 찾을 수 없습니다.';
  end if;

  if target_profile_id = auth.uid() then
    raise exception '본인 회원 자격은 직접 박탈할 수 없습니다.';
  end if;

  if caller_rank <= target_rank then
    raise exception '자신과 같거나 높은 등급의 회원은 수정할 수 없습니다.';
  end if;

  normalized_start := coalesce(suspension_start, now());

  if coalesce(permanent, false) then
    normalized_end := null;
  else
    if suspension_end is null then
      raise exception '정지 종료일을 선택해주세요.';
    end if;

    if suspension_end < normalized_start then
      raise exception '정지 종료일은 시작일 이후여야 합니다.';
    end if;

    normalized_end := suspension_end;
  end if;

  update public.profiles as profiles
  set
    is_suspended_permanently = coalesce(permanent, false),
    suspension_starts_at = normalized_start,
    suspension_ends_at = normalized_end
  where profiles.id = target_profile_id;
end;
$fn$;

grant execute on function public.suspend_profile(uuid, timestamptz, timestamptz, boolean) to authenticated;
