-- Create storage buckets
-- Requires supabase.storage extension to be available
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Storage policies: allow public read, authenticated write
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'media');

drop policy if exists "Authenticated upload media" on storage.objects;
create policy "Authenticated upload media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');

-- Allow authenticated users to update objects they created
drop policy if exists "Authenticated update media" on storage.objects;
create policy "Authenticated update media"
on storage.objects for update
to authenticated
using (bucket_id = 'media');