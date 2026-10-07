-- Storage bucket for resumes, cover letters, and the Overleaf LaTeX
-- template. Private bucket — files are served via short-lived signed URLs,
-- never public URLs, since these are personal job-search documents.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Files are stored under `${auth.uid()}/...`, so a user can only touch
-- objects inside their own folder.
create policy "Users manage files in their own folder"
on storage.objects
for all
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
