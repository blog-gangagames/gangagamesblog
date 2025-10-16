-- Full site schema expansion: profiles, posts, categories, triggers, functions, storage

-- ========= PROFILES =========
-- Link profiles to auth.users and add required columns/constraints
alter table public.profiles
  alter column id drop default;

alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.profiles
  add column if not exists name text,
  add column if not exists user_type text default 'author',
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists signup_date date default now(),
  add column if not exists password_length int,
  add column if not exists last_login timestamptz;

alter table public.profiles
  drop constraint if exists profiles_user_type_check;
alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type in ('admin','author','viewer'));

alter table public.profiles
  alter column email set not null;

create unique index if not exists profiles_email_unique
  on public.profiles (email);

-- Helper to check admin status
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and user_type = 'admin'
  );
$$;

-- Tighten profiles policies: remove public read, allow user/admin access only
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users manage own profile" on public.profiles;

create policy "Profiles: user select own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Profiles: admin select all"
on public.profiles for select
to authenticated
using (public.is_admin());

-- Insert is managed via trigger only; no direct inserts granted

create policy "Profiles: user update own"
on public.profiles for update
to authenticated
using (id = auth.uid());

create policy "Profiles: admin update all"
on public.profiles for update
to authenticated
using (public.is_admin());

-- Trigger to auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, name, signup_date)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''), now())
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ========= POSTS =========
-- Recreate posts to match desired schema precisely
drop table if exists public.posts;

create table public.posts (
  id bigserial primary key,
  title text not null,
  content_html text not null,
  excerpt text,
  main_category text not null,
  subcategory text not null,
  tags text[] default '{}'::text[],
  featured boolean default false,
  status text check (status in ('draft','published','scheduled')) default 'draft',
  image_url text,
  author_id uuid references public.profiles(id) not null,
  views int default 0,
  comments int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

alter table public.posts enable row level security;

-- Drop any legacy policies
drop policy if exists "Read published posts" on public.posts;
drop policy if exists "Authors read own posts" on public.posts;
drop policy if exists "Authors insert own posts" on public.posts;
drop policy if exists "Authors update own posts" on public.posts;

-- New policies per plan
create policy "Posts: public read published"
on public.posts for select
to anon, authenticated
using (status = 'published');

create policy "Posts: authors read own or admin all"
on public.posts for select
to authenticated
using (author_id = auth.uid() or public.is_admin());

create policy "Posts: authors/admin insert"
on public.posts for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.user_type in ('author','admin')
  )
);

create policy "Posts: authors update own"
on public.posts for update
to authenticated
using (author_id = auth.uid());

create policy "Posts: admin update all"
on public.posts for update
to authenticated
using (public.is_admin());

create policy "Posts: authors delete own"
on public.posts for delete
to authenticated
using (author_id = auth.uid());

create policy "Posts: admin delete all"
on public.posts for delete
to authenticated
using (public.is_admin());

-- Trigger to update updated_at on changes
create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
before update on public.posts
for each row execute function public.set_posts_updated_at();

-- Convenience functions
create or replace function public.increment_post_views(post_id bigint)
returns void
language sql
security definer
as $$
  update public.posts
  set views = coalesce(views, 0) + 1
  where id = post_id;
$$;

grant execute on function public.increment_post_views(bigint) to anon, authenticated;

create or replace function public.get_published_posts_by_category(main text, sub text, lim int default 20, off int default 0)
returns setof public.posts
language sql
stable
as $$
  select * from public.posts
  where status = 'published'
    and main_category = main
    and subcategory = sub
  order by published_at desc nulls last, created_at desc
  limit lim offset off;
$$;

grant execute on function public.get_published_posts_by_category(text, text, int, int) to anon, authenticated;


-- ========= CATEGORIES =========
create table if not exists public.categories (
  id serial primary key,
  main text not null,
  sub text not null,
  slug text unique
);

alter table public.categories enable row level security;

create policy "Categories: public read"
on public.categories for select
to anon, authenticated
using (true);

create policy "Categories: admin insert"
on public.categories for insert
to authenticated
with check (public.is_admin());

create policy "Categories: admin update"
on public.categories for update
to authenticated
using (public.is_admin());

create policy "Categories: admin delete"
on public.categories for delete
to authenticated
using (public.is_admin());


-- ========= STORAGE =========
-- Buckets for avatars and post images with public read and scoped writes
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('post_images', 'post_images', true)
on conflict (id) do nothing;

-- Public read for both buckets
create policy "Avatars: public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "PostImages: public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'post_images');

-- Scoped write/update by user path segment or admin
create policy "Avatars: user upload own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Avatars: user update own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Avatars: admin update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and public.is_admin()
);

create policy "PostImages: user upload own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post_images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "PostImages: user update own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'post_images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "PostImages: admin update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'post_images'
  and public.is_admin()
);

-- Optional delete policies (owner or admin)
create policy "Avatars: user delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Avatars: admin delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and public.is_admin()
);

create policy "PostImages: user delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post_images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "PostImages: admin delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post_images'
  and public.is_admin()
);

-- END of full site schema expansion