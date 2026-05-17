-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.

create or replace function public.profile_meta_int(meta jsonb, key text)
returns integer
language sql
immutable
as $profile_meta_int$
  select case
    when meta ->> key ~ '^[0-9]+$' then (meta ->> key)::integer
    else null
  end
$profile_meta_int$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $handle_new_user_profile$
begin
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
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, ''), '@', 1), '회원'),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    public.profile_meta_int(new.raw_user_meta_data, 'grade'),
    public.profile_meta_int(new.raw_user_meta_data, 'class_no'),
    public.profile_meta_int(new.raw_user_meta_data, 'student_no'),
    coalesce(nullif(new.raw_user_meta_data ->> 'korean_subject', ''), '화법과 작문'),
    coalesce(nullif(new.raw_user_meta_data ->> 'math_subject', ''), '미적분'),
    coalesce(nullif(new.raw_user_meta_data ->> 'english_choice', ''), '응시함'),
    coalesce(nullif(new.raw_user_meta_data ->> 'inquiry1_subject', ''), '응시하지 않음'),
    coalesce(nullif(new.raw_user_meta_data ->> 'inquiry2_subject', ''), '응시하지 않음'),
    coalesce(nullif(new.raw_user_meta_data ->> 'second_foreign_subject', ''), '응시하지 않음'),
    false,
    'member',
    false,
    false,
    null,
    null,
    null,
    false,
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;

  return new;
end;
$handle_new_user_profile$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();
