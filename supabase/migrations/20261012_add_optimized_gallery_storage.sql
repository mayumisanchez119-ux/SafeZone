-- Safe Zone gallery images live in Storage rather than JSON/base64 in the database.
-- Public read is intentional: these are the community photos published by staff.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'safezone-gallery',
  'safezone-gallery',
  true,
  1048576,
  array['image/jpeg']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "safezone gallery admins upload" on storage.objects;
drop policy if exists "safezone gallery admins update" on storage.objects;
drop policy if exists "safezone gallery admins delete" on storage.objects;

create policy "safezone gallery admins upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'safezone-gallery'
  and public.safezone_is_admin()
);

create policy "safezone gallery admins update"
on storage.objects for update to authenticated
using (
  bucket_id = 'safezone-gallery'
  and public.safezone_is_admin()
)
with check (
  bucket_id = 'safezone-gallery'
  and public.safezone_is_admin()
);

create policy "safezone gallery admins delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'safezone-gallery'
  and public.safezone_is_admin()
);
