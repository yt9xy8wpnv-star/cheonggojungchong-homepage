-- study with 정시 이름 표시 보정 SQL입니다.
-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.
-- Run and enable RLS는 사용하지 마세요.

alter table public.study_timer_status add column if not exists username text;
alter table public.study_timer_status add column if not exists name text;

update public.study_timer_status as timers
set
  name = coalesce(nullif(profiles.name, ''), timers.name),
  username = coalesce(
    nullif(timers.username, ''),
    nullif(profiles.username, ''),
    split_part(coalesce(profiles.email, ''), '@', 1),
    '회원'
  )
from public.profiles as profiles
where timers.user_id = profiles.id;
