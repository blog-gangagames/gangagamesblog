-- Add slug column to posts table for SEO-friendly URLs

-- Add slug column to posts table
alter table public.posts 
add column if not exists slug text;

-- Create unique index on slug (allowing nulls for existing posts)
create unique index if not exists posts_slug_unique 
on public.posts (slug) 
where slug is not null;

-- Function to generate slug from title
create or replace function public.generate_slug(title text)
returns text
language plpgsql
as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
end;
$$;

-- Function to ensure unique slug
create or replace function public.ensure_unique_slug(base_slug text, post_id bigint default null)
returns text
language plpgsql
as $$
declare
  final_slug text := base_slug;
  counter int := 1;
begin
  -- Check if slug exists (excluding current post if updating)
  while exists (
    select 1 from public.posts 
    where slug = final_slug 
    and (post_id is null or id != post_id)
  ) loop
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  end loop;
  
  return final_slug;
end;
$$;

-- Trigger function to auto-generate slug on insert/update
create or replace function public.posts_generate_slug()
returns trigger
language plpgsql
as $$
begin
  -- Only generate slug if it's null or empty
  if new.slug is null or new.slug = '' then
    new.slug := public.ensure_unique_slug(
      public.generate_slug(new.title),
      new.id
    );
  end if;
  
  return new;
end;
$$;

-- Create trigger for auto-generating slugs
drop trigger if exists posts_generate_slug_trigger on public.posts;
create trigger posts_generate_slug_trigger
  before insert or update on public.posts
  for each row
  execute function public.posts_generate_slug();

-- Generate slugs for existing posts that don't have them
update public.posts 
set slug = public.ensure_unique_slug(public.generate_slug(title), id)
where slug is null or slug = '';