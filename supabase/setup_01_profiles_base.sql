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
  is_rejected boolean not null default false,
  rejected_at timestamptz,
  suspension_starts_at timestamptz,
  suspension_ends_at timestamptz,
  is_suspended_permanently boolean not null default false,
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
alter table public.profiles add column if not exists is_rejected boolean default false;
alter table public.profiles add column if not exists rejected_at timestamptz;
alter table public.profiles add column if not exists suspension_starts_at timestamptz;
alter table public.profiles add column if not exists suspension_ends_at timestamptz;
alter table public.profiles add column if not exists is_suspended_permanently boolean default false;
alter table public.profiles add column if not exists created_at timestamptz default now();

update public.profiles as profiles
set
  email = coalesce(nullif(profiles.email, ''), users.email, ''),
  username = coalesce(nullif(profiles.username, ''), '회원'),
  name = coalesce(profiles.name, ''),
  korean_subject = coalesce(nullif(profiles.korean_subject, ''), '화법과 작문'),
  math_subject = coalesce(nullif(profiles.math_subject, ''), '미적분'),
  english_choice = coalesce(nullif(profiles.english_choice, ''), '응시함'),
  inquiry1_subject = coalesce(nullif(profiles.inquiry1_subject, ''), '응시하지 않음'),
  inquiry2_subject = coalesce(nullif(profiles.inquiry2_subject, ''), '응시하지 않음'),
  second_foreign_subject = coalesce(nullif(profiles.second_foreign_subject, ''), '응시하지 않음'),
  is_admin = coalesce(profiles.is_admin, false),
  role = case
    when profiles.role in ('member', 'sub_admin', 'admin') then profiles.role
    when profiles.is_admin = true then 'admin'
    else 'member'
  end,
  is_approved = coalesce(profiles.is_approved, false),
  is_rejected = coalesce(profiles.is_rejected, false),
  is_suspended_permanently = coalesce(profiles.is_suspended_permanently, false),
  created_at = coalesce(profiles.created_at, users.created_at, now())
from auth.users as users
where profiles.id = users.id;

update public.profiles
set email = coalesce(email, '')
where email is null;

update public.profiles
set
  is_rejected = coalesce(is_rejected, false),
  is_suspended_permanently = coalesce(is_suspended_permanently, false)
where is_rejected is null
  or is_suspended_permanently is null;

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
alter table public.profiles alter column is_rejected set default false;
alter table public.profiles alter column is_rejected set not null;
alter table public.profiles alter column is_suspended_permanently set default false;
alter table public.profiles alter column is_suspended_permanently set not null;
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
