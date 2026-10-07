-- Outreach is a fully independent feature — no link to jobs/applications.
alter table outreach drop column if exists job_id;
