-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Create posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  content text,
  category_main text,
  category_sub text,
  tags text[],
  featured boolean default false,
  status text default 'draft',
  views int default 0,
  author_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- Policies for profiles
drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
on public.profiles for update
to authenticated
using (id = auth.uid());

-- Policies for posts
drop policy if exists "Read published posts" on public.posts;
create policy "Read published posts"
on public.posts for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Authors read own posts" on public.posts;
create policy "Authors read own posts"
on public.posts for select
to authenticated
using (author_id = auth.uid());

drop policy if exists "Authors insert own posts" on public.posts;
create policy "Authors insert own posts"
on public.posts for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "Authors update own posts" on public.posts;
create policy "Authors update own posts"
on public.posts for update
to authenticated
using (author_id = auth.uid());