create table if not exists public.goal_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  university text not null,
  department text not null,
  korean_grade smallint check (korean_grade between 1 and 9),
  math_grade smallint check (math_grade between 1 and 9),
  english_grade smallint check (english_grade between 1 and 9),
  inquiry1_grade smallint check (inquiry1_grade between 1 and 9),
  inquiry2_grade smallint check (inquiry2_grade between 1 and 9),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goal_plans enable row level security;

grant select, insert, update, delete on public.goal_plans to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_goal_plans_updated_at on public.goal_plans;
create trigger set_goal_plans_updated_at
before update on public.goal_plans
for each row
execute function public.set_updated_at();

drop policy if exists "goal_plans_select_own" on public.goal_plans;
create policy "goal_plans_select_own"
on public.goal_plans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "goal_plans_insert_own" on public.goal_plans;
create policy "goal_plans_insert_own"
on public.goal_plans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "goal_plans_update_own" on public.goal_plans;
create policy "goal_plans_update_own"
on public.goal_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goal_plans_delete_own" on public.goal_plans;
create policy "goal_plans_delete_own"
on public.goal_plans
for delete
to authenticated
using (auth.uid() = user_id);
