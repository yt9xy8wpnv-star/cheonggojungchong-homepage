alter table public.profiles add column if not exists email text default '';
alter table public.profiles add column if not exists username text default '회원';
alter table public.profiles add column if not exists name text default '';
alter table public.profiles add column if not exists grade integer;
alter table public.profiles add column if not exists class_no integer;
alter table public.profiles add column if not exists student_no integer;
alter table public.profiles add column if not exists korean_subject text default '화법과 작문';
alter table public.profiles add column if not exists math_subject text default '미적분';
alter table public.profiles add column if not exists english_choice text default '응시함';
alter table public.profiles add column if not exists inquiry1_subject text default '응시하지 않음';
alter table public.profiles add column if not exists inquiry2_subject text default '응시하지 않음';
alter table public.profiles add column if not exists second_foreign_subject text default '응시하지 않음';
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists role text default 'member';
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists created_at timestamptz default now();

update public.profiles as profiles
set
  email = coalesce(nullif(profiles.email, ''), users.email, ''),
  username = coalesce(nullif(profiles.username, ''), users.raw_user_meta_data ->> 'username', split_part(coalesce(users.email, ''), '@', 1), '회원'),
  name = coalesce(profiles.name, users.raw_user_meta_data ->> 'name', ''),
  korean_subject = coalesce(nullif(profiles.korean_subject, ''), users.raw_user_meta_data ->> 'korean_subject', '화법과 작문'),
  math_subject = coalesce(nullif(profiles.math_subject, ''), users.raw_user_meta_data ->> 'math_subject', '미적분'),
  english_choice = coalesce(nullif(profiles.english_choice, ''), users.raw_user_meta_data ->> 'english_choice', '응시함'),
  inquiry1_subject = coalesce(nullif(profiles.inquiry1_subject, ''), users.raw_user_meta_data ->> 'inquiry1_subject', '응시하지 않음'),
  inquiry2_subject = coalesce(nullif(profiles.inquiry2_subject, ''), users.raw_user_meta_data ->> 'inquiry2_subject', '응시하지 않음'),
  second_foreign_subject = coalesce(nullif(profiles.second_foreign_subject, ''), users.raw_user_meta_data ->> 'second_foreign_subject', '응시하지 않음'),
  is_admin = coalesce(profiles.is_admin, false),
  role = case
    when profiles.role in ('member', 'sub_admin', 'admin') then profiles.role
    when profiles.is_admin = true then 'admin'
    else 'member'
  end,
  is_approved = coalesce(profiles.is_approved, false),
  created_at = coalesce(profiles.created_at, users.created_at, now())
from auth.users as users
where profiles.id = users.id;

alter table public.profiles alter column email set default '';
alter table public.profiles alter column username set default '회원';
alter table public.profiles alter column name set default '';
alter table public.profiles alter column korean_subject set default '화법과 작문';
alter table public.profiles alter column math_subject set default '미적분';
alter table public.profiles alter column english_choice set default '응시함';
alter table public.profiles alter column inquiry1_subject set default '응시하지 않음';
alter table public.profiles alter column inquiry2_subject set default '응시하지 않음';
alter table public.profiles alter column second_foreign_subject set default '응시하지 않음';
alter table public.profiles alter column is_admin set default false;
alter table public.profiles alter column role set default 'member';
alter table public.profiles alter column is_approved set default false;
alter table public.profiles alter column created_at set default now();

alter table public.profiles alter column email set not null;
alter table public.profiles alter column username set not null;
alter table public.profiles alter column name set not null;
alter table public.profiles alter column korean_subject set not null;
alter table public.profiles alter column math_subject set not null;
alter table public.profiles alter column english_choice set not null;
alter table public.profiles alter column inquiry1_subject set not null;
alter table public.profiles alter column inquiry2_subject set not null;
alter table public.profiles alter column second_foreign_subject set not null;
alter table public.profiles alter column is_admin set not null;
alter table public.profiles alter column role set not null;
alter table public.profiles alter column is_approved set not null;
alter table public.profiles alter column created_at set not null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $profile_trigger$
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
    created_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, ''), '@', 1), '회원'),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    case when new.raw_user_meta_data ->> 'grade' ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'grade')::integer else null end,
    case when new.raw_user_meta_data ->> 'class_no' ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'class_no')::integer else null end,
    case when new.raw_user_meta_data ->> 'student_no' ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'student_no')::integer else null end,
    coalesce(nullif(new.raw_user_meta_data ->> 'korean_subject', ''), '화법과 작문'),
    coalesce(nullif(new.raw_user_meta_data ->> 'math_subject', ''), '미적분'),
    coalesce(nullif(new.raw_user_meta_data ->> 'english_choice', ''), '응시함'),
    coalesce(nullif(new.raw_user_meta_data ->> 'inquiry1_subject', ''), '응시하지 않음'),
    coalesce(nullif(new.raw_user_meta_data ->> 'inquiry2_subject', ''), '응시하지 않음'),
    coalesce(nullif(new.raw_user_meta_data ->> 'second_foreign_subject', ''), '응시하지 않음'),
    false,
    'member',
    false,
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;

  return new;
end;
$profile_trigger$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

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
  created_at
)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(nullif(users.raw_user_meta_data ->> 'username', ''), split_part(coalesce(users.email, ''), '@', 1), '회원'),
  coalesce(users.raw_user_meta_data ->> 'name', ''),
  case when users.raw_user_meta_data ->> 'grade' ~ '^[0-9]+$' then (users.raw_user_meta_data ->> 'grade')::integer else null end,
  case when users.raw_user_meta_data ->> 'class_no' ~ '^[0-9]+$' then (users.raw_user_meta_data ->> 'class_no')::integer else null end,
  case when users.raw_user_meta_data ->> 'student_no' ~ '^[0-9]+$' then (users.raw_user_meta_data ->> 'student_no')::integer else null end,
  coalesce(nullif(users.raw_user_meta_data ->> 'korean_subject', ''), '화법과 작문'),
  coalesce(nullif(users.raw_user_meta_data ->> 'math_subject', ''), '미적분'),
  coalesce(nullif(users.raw_user_meta_data ->> 'english_choice', ''), '응시함'),
  coalesce(nullif(users.raw_user_meta_data ->> 'inquiry1_subject', ''), '응시하지 않음'),
  coalesce(nullif(users.raw_user_meta_data ->> 'inquiry2_subject', ''), '응시하지 않음'),
  coalesce(nullif(users.raw_user_meta_data ->> 'second_foreign_subject', ''), '응시하지 않음'),
  false,
  'member',
  false,
  coalesce(users.created_at, now())
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;
