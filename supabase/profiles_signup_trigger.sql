create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  username text not null,
  name text not null default '',
  grade integer,
  class_no integer,
  student_no integer,
  korean_subject text not null default '화법과 작문',
  math_subject text not null default '미적분',
  english_choice text not null default '응시함',
  inquiry1_subject text not null default '응시하지 않음',
  inquiry2_subject text not null default '응시하지 않음',
  second_foreign_subject text not null default '응시하지 않음',
  is_admin boolean not null default false,
  role text not null default 'member' check (role in ('member', 'sub_admin', 'admin')),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text default '';
alter table public.profiles add column if not exists username text;
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
  username = coalesce(nullif(username, ''), '회원'),
  name = coalesce(name, ''),
  korean_subject = coalesce(nullif(korean_subject, ''), '화법과 작문'),
  math_subject = coalesce(nullif(math_subject, ''), '미적분'),
  english_choice = coalesce(nullif(english_choice, ''), '응시함'),
  inquiry1_subject = coalesce(nullif(inquiry1_subject, ''), '응시하지 않음'),
  inquiry2_subject = coalesce(nullif(inquiry2_subject, ''), '응시하지 않음'),
  second_foreign_subject = coalesce(nullif(second_foreign_subject, ''), '응시하지 않음'),
  is_admin = coalesce(is_admin, false),
  role = case
    when role in ('member', 'sub_admin', 'admin') then role
    when is_admin = true then 'admin'
    else 'member'
  end,
  is_approved = coalesce(is_approved, false),
  created_at = coalesce(profiles.created_at, users.created_at, now())
from auth.users as users
where profiles.id = users.id;

update public.profiles
set email = coalesce(email, '')
where email is null;

alter table public.profiles alter column email set default '';
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
alter table public.profiles alter column role set default 'member';
alter table public.profiles alter column role set not null;
alter table public.profiles alter column is_approved set not null;
alter table public.profiles alter column created_at set not null;

alter table public.profiles enable row level security;

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

create or replace function public.profile_meta_int(meta jsonb, key text)
returns integer
language sql
immutable
as $$
  select case
    when meta ->> key ~ '^[0-9]+$' then (meta ->> key)::integer
    else null
  end
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (is_admin = true or role = 'admin')
  )
$$;

create or replace function public.is_current_user_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (is_admin = true or role in ('admin', 'sub_admin'))
  )
$$;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.is_current_user_staff() to authenticated;

create or replace function public.approve_profile(target_profile_id uuid, next_role text default 'member')
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

grant execute on function public.approve_profile(uuid, text) to authenticated;

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
