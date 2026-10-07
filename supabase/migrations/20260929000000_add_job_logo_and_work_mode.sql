-- Company logo for the Application Details header, plus a Work Mode field
-- (Remote / Hybrid / Onsite) shown alongside Location/Salary/Applied date.
--
-- Logo priority is Uploaded -> Manual URL -> Auto-fetched -> placeholder, so
-- each source is kept in its own column rather than one shared field —
-- setting a lower-priority source must not clobber a higher-priority one
-- that's already set, and the app needs to know which sources exist to let
-- the user remove them individually.

create type work_mode as enum ('remote', 'hybrid', 'onsite');

alter table jobs add column if not exists work_mode work_mode;
alter table jobs add column if not exists logo_uploaded_url text;
alter table jobs add column if not exists logo_url text;
alter table jobs add column if not exists logo_auto_url text;

-- Public bucket (unlike the private "documents" bucket) — company logos are
-- branding assets, not personal documents, and are rendered as plain <img>
-- tags across job cards without a signed-URL round trip.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Anyone can view logos"
on storage.objects
for select
using (bucket_id = 'logos');

create policy "Users manage logos in their own folder"
on storage.objects
for insert
with check (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update their own logos"
on storage.objects
for update
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete their own logos"
on storage.objects
for delete
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
