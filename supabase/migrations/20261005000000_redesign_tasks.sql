-- Redesign Tasks: split tasks into Application vs Outreach categories,
-- widen the set of task types per category, and add an optional reminder
-- time plus free-text outreach contact fields (no FK to `outreach` — these
-- are entered directly on the task, matching the Add Task form).
--
-- `type` moves from a fixed Postgres enum to text + a check constraint so
-- new task types can be added later with a plain constraint change instead
-- of ALTER TYPE ceremony.

create type task_category as enum ('application', 'outreach');

alter table tasks add column category task_category not null default 'application';
alter table tasks add column reminder_time time;
alter table tasks add column contact_name text;
alter table tasks add column contact_company text;
alter table tasks add column outreach_channel text;

alter table tasks alter column type drop default;
alter table tasks alter column type type text using type::text;
drop type task_type;

alter table tasks add constraint tasks_type_check check (type in (
  'follow_up', 'status_check', 'interview_prep', 'document_submission', 'deadline',
  'linkedin_message', 'connection_request', 'recruiter_email', 'outreach_follow_up', 'custom'
));
alter table tasks alter column type set default 'custom';

alter table tasks add constraint tasks_outreach_channel_check check (
  outreach_channel is null or outreach_channel in ('linkedin', 'email', 'phone', 'other')
);

create index tasks_category_idx on tasks (category);
