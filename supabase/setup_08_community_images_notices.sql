-- 자유게시판 사진 첨부와 공지사항 고정 기능입니다.
-- Supabase SQL Editor에서는 반드시 일반 Run으로 실행하세요.
-- Run and enable RLS는 사용하지 마세요. 이 파일 안에서 필요한 설정을 직접 처리합니다.

alter table public.community_posts add column if not exists image_urls text[] default array[]::text[];
alter table public.community_posts add column if not exists is_notice boolean default false;
alter table public.community_posts add column if not exists notice_created_at timestamptz;

update public.community_posts
set
  image_urls = coalesce(image_urls, array[]::text[]),
  is_notice = coalesce(is_notice, false);

alter table public.community_posts alter column image_urls set default array[]::text[];
alter table public.community_posts alter column image_urls set not null;
alter table public.community_posts alter column is_notice set default false;
alter table public.community_posts alter column is_notice set not null;

insert into storage.buckets (id, name, public)
values ('community-post-images', 'community-post-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "community_images_select" on storage.objects;
create policy "community_images_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'community-post-images'
);

drop policy if exists "community_images_insert_own_approved_members" on storage.objects;
create policy "community_images_insert_own_approved_members"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-post-images'
  and owner = auth.uid()
  and exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (
        coalesce(profiles.is_approved, false) = true
        or coalesce(profiles.is_admin, false) = true
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

drop policy if exists "community_images_delete_own_or_staff" on storage.objects;
create policy "community_images_delete_own_or_staff"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-post-images'
  and (
    owner = auth.uid()
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
  )
);

drop policy if exists "community_posts_insert_own_approved_members" on public.community_posts;
create policy "community_posts_insert_own_approved_members"
on public.community_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    coalesce(is_notice, false) = false
    or exists (
      select 1
      from public.profiles as notice_profiles
      where notice_profiles.id = auth.uid()
        and (
          coalesce(notice_profiles.is_admin, false) = true
          or notice_profiles.role in ('admin', 'sub_admin')
        )
        and coalesce(notice_profiles.is_rejected, false) = false
        and coalesce(notice_profiles.is_suspended_permanently, false) = false
        and not (
          notice_profiles.suspension_starts_at is not null
          and notice_profiles.suspension_ends_at is not null
          and now() between notice_profiles.suspension_starts_at and notice_profiles.suspension_ends_at
        )
    )
  )
  and exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (
        coalesce(profiles.is_approved, false) = true
        or coalesce(profiles.is_admin, false) = true
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

drop policy if exists "community_posts_update_own_approved_members" on public.community_posts;
create policy "community_posts_update_own_approved_members"
on public.community_posts
for update
to authenticated
using (
  author_id = auth.uid()
  and exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (
        coalesce(profiles.is_approved, false) = true
        or coalesce(profiles.is_admin, false) = true
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
)
with check (
  author_id = auth.uid()
  and (
    coalesce(is_notice, false) = false
    or exists (
      select 1
      from public.profiles as notice_profiles
      where notice_profiles.id = auth.uid()
        and (
          coalesce(notice_profiles.is_admin, false) = true
          or notice_profiles.role in ('admin', 'sub_admin')
        )
        and coalesce(notice_profiles.is_rejected, false) = false
        and coalesce(notice_profiles.is_suspended_permanently, false) = false
        and not (
          notice_profiles.suspension_starts_at is not null
          and notice_profiles.suspension_ends_at is not null
          and now() between notice_profiles.suspension_starts_at and notice_profiles.suspension_ends_at
        )
    )
  )
  and exists (
    select 1
    from public.profiles as profiles
    where profiles.id = auth.uid()
      and (
        coalesce(profiles.is_approved, false) = true
        or coalesce(profiles.is_admin, false) = true
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
