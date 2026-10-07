-- Documents versioning: adds per-(job, type) version numbers, an ATS score
-- snapshot, lineage back to the master resume a tailored doc was generated
-- from, an explicit "active" master resume flag (previously implicit —
-- whichever upload was most recent), and a "certificate" document type.

alter type document_type add value if not exists 'certificate';

alter table documents add column version integer not null default 1;
alter table documents add column ats_score integer;
alter table documents add column source_master_resume_id uuid references documents (id) on delete set null;
alter table documents add column is_active_master boolean not null default false;

create index documents_job_type_idx on documents (job_id, type);

-- At most one active master resume per user.
create unique index documents_one_active_master on documents (user_id)
  where is_active_master and type = 'master_resume';
