create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

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
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists created_at timestamptz default now();

update public.profiles
set
  username = coalesce(nullif(username, ''), '회원'),
  name = coalesce(name, ''),
  korean_subject = coalesce(nullif(korean_subject, ''), '화법과 작문'),
  math_subject = coalesce(nullif(math_subject, ''), '미적분'),
  english_choice = coalesce(nullif(english_choice, ''), '응시함'),
  inquiry1_subject = coalesce(nullif(inquiry1_subject, ''), '응시하지 않음'),
  inquiry2_subject = coalesce(nullif(inquiry2_subject, ''), '응시하지 않음'),
  second_foreign_subject = coalesce(nullif(second_foreign_subject, ''), '응시하지 않음'),
  is_admin = coalesce(is_admin, false),
  is_approved = coalesce(is_approved, false),
  created_at = coalesce(created_at, now());

alter table public.profiles alter column username set not null;
alter table public.profiles alter column name set not null;
alter table public.profiles alter column korean_subject set not null;
alter table public.profiles alter column math_subject set not null;
alter table public.profiles alter column english_choice set not null;
alter table public.profiles alter column inquiry1_subject set not null;
alter table public.profiles alter column inquiry2_subject set not null;
alter table public.profiles alter column second_foreign_subject set not null;
alter table public.profiles alter column is_admin set not null;
alter table public.profiles alter column is_approved set not null;
alter table public.profiles alter column created_at set not null;

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

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
    is_approved,
    created_at
  )
  values (
    new.id,
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
      and is_admin = true
  )
$$;

insert into public.profiles (
  id,
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
  is_approved,
  created_at
)
select
  users.id,
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
