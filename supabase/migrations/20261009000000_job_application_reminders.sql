-- Application deadline reminders on the Saved Job form: the reminder
-- date/time live on `jobs` (the source of truth, editable via the form),
-- and are synced into a dedicated Application Task so the existing
-- email-reminder pipeline (`sendDueTaskReminders`) picks them up with no
-- separate sender logic. `is_auto_job_reminder` marks that one synced task
-- per job, distinct from any other manually-created tasks for the same
-- job_id, mirroring how `tasks.outreach_id` marks the auto outreach
-- follow-up task.

alter table jobs add column reminder_date date;
alter table jobs add column reminder_time time;

alter table tasks add column is_auto_job_reminder boolean not null default false;

create unique index tasks_one_auto_job_reminder_per_job on tasks (job_id)
  where is_auto_job_reminder;
