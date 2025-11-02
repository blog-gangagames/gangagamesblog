-- Comments table for posts with simple moderation and public RLS

create table if not exists public.post_comments (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  name text check (char_length(name) <= 100),
  email text check (char_length(email) <= 255),
  website text check (char_length(website) <= 255),
  comment text not null check (char_length(comment) <= 4000),
  status text not null default 'approved' check (status in ('pending','approved','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_comments_post_id_idx on public.post_comments(post_id);

alter table public.post_comments enable row level security;

-- Public can read approved comments only
create policy if not exists "Comments: public read approved"
on public.post_comments for select
to anon, authenticated
using (status = 'approved');

-- Allow public (anon) to create comments
create policy if not exists "Comments: public insert"
on public.post_comments for insert
to anon, authenticated
with check (true);

-- Only admins can update/delete comments (moderation)
create policy if not exists "Comments: admin update"
on public.post_comments for update
to authenticated
using (public.is_admin());

create policy if not exists "Comments: admin delete"
on public.post_comments for delete
to authenticated
using (public.is_admin());

-- Trigger for updated_at
create or replace function public.set_post_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists post_comments_updated_at on public.post_comments;
create trigger post_comments_updated_at
before update on public.post_comments
for each row execute function public.set_post_comments_updated_at();