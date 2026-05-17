-- 자유게시판 중복 신고 방지용 조회 정책입니다.
-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.
-- Run and enable RLS는 사용하지 마세요.

drop policy if exists "community_reports_select_staff" on public.community_reports;
drop policy if exists "community_reports_select_own_or_staff" on public.community_reports;

create policy "community_reports_select_own_or_staff"
on public.community_reports
for select
to authenticated
using (
  reporter_id = auth.uid()
  or exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (
        coalesce(profiles.is_admin, false) = true
        or profiles.role in ('admin', 'sub_admin')
      )
      and coalesce(profiles.is_rejected, false) = false
      and coalesce(profiles.is_suspended_permanently, false) = false
      and not (
        profiles.suspension_starts_at is not null
        and profiles.suspension_ends_at is not null
        and now() between profiles.suspension_starts_at and profiles.suspension_ends_at
      )
  )
);
