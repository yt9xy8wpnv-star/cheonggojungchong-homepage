-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.

create or replace function public.reject_profile(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_current_user_staff() then
    raise exception '관리자 또는 부관리자만 회원가입을 거절할 수 있습니다.';
  end if;

  update public.profiles as profiles
  set
    is_approved = false,
    is_rejected = true,
    rejected_at = now(),
    role = 'member',
    is_admin = false
  where profiles.id = target_profile_id
    and coalesce(profiles.is_approved, false) = false
    and coalesce(profiles.is_rejected, false) = false
    and coalesce(profiles.role, 'member') = 'member'
    and coalesce(profiles.is_admin, false) = false;

  if not found then
    raise exception '거절 가능한 회원가입 신청을 찾을 수 없습니다.';
  end if;
end;
$fn$;

grant execute on function public.reject_profile(uuid) to authenticated;
