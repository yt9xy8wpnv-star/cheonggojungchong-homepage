insert into public.profiles (
  id,
  email,
  username,
  name,
  grade,
  class_no,
  student_no,
  korean_subject,
  math_subject,
  english_choice,
  inquiry1_subject,
  inquiry2_subject,
  second_foreign_subject,
  is_admin,
  role,
  is_approved,
  is_rejected,
  rejected_at,
  suspension_starts_at,
  suspension_ends_at,
  is_suspended_permanently,
  created_at
)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(nullif(users.raw_user_meta_data ->> 'username', ''), split_part(coalesce(users.email, ''), '@', 1), '회원'),
  coalesce(users.raw_user_meta_data ->> 'name', ''),
  public.profile_meta_int(users.raw_user_meta_data, 'grade'),
  public.profile_meta_int(users.raw_user_meta_data, 'class_no'),
  public.profile_meta_int(users.raw_user_meta_data, 'student_no'),
  coalesce(nullif(users.raw_user_meta_data ->> 'korean_subject', ''), '화법과 작문'),
  coalesce(nullif(users.raw_user_meta_data ->> 'math_subject', ''), '미적분'),
  coalesce(nullif(users.raw_user_meta_data ->> 'english_choice', ''), '응시함'),
  coalesce(nullif(users.raw_user_meta_data ->> 'inquiry1_subject', ''), '응시하지 않음'),
  coalesce(nullif(users.raw_user_meta_data ->> 'inquiry2_subject', ''), '응시하지 않음'),
  coalesce(nullif(users.raw_user_meta_data ->> 'second_foreign_subject', ''), '응시하지 않음'),
  false,
  'member',
  false,
  false,
  null,
  null,
  null,
  false,
  coalesce(users.created_at, now())
from auth.users
where not exists (
  select 1
  from public.profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_current_user_admin()
  or (
    public.is_current_user_sub_admin()
    and coalesce(role, 'member') = 'member'
    and coalesce(is_admin, false) = false
  )
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
