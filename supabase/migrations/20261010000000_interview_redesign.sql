-- Interviews redesign: new "Managerial" round type and "Phone" mode (the
-- new form separates "Phone" as a mode rather than a round type), plus
-- duration/location/interviewer-email/reminder fields. Reminder date/time
-- are synced into a dedicated Task (type 'interview_prep') the same way
-- jobs.reminder_date syncs into an auto task — `tasks.interview_id` marks
-- that one synced task per interview, mirroring `tasks.outreach_id`.

alter type interview_round_type add value if not exists 'managerial';
alter type interview_mode add value if not exists 'phone';

alter table interviews add column interviewer_email text;
alter table interviews add column duration_minutes integer;
alter table interviews add column location text;
alter table interviews add column reminder_date date;
alter table interviews add column reminder_time time;

alter table tasks add column interview_id uuid references interviews (id) on delete cascade;
create index tasks_interview_id_idx on tasks (interview_id);
