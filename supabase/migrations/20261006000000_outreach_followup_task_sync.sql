-- Outreach follow-up automation: adds a Follow-up Time field alongside the
-- existing Follow-up Date, and links `tasks` back to the `outreach` record
-- that auto-created it, so editing a follow-up date/time updates the
-- existing Outreach Task instead of creating a duplicate. Deleting the
-- outreach record cascades to remove its auto-created task.

alter table outreach add column follow_up_time time;

alter table tasks add column outreach_id uuid references outreach (id) on delete cascade;
create index tasks_outreach_id_idx on tasks (outreach_id);
