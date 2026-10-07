-- Optional free-text note on a task, e.g. a custom follow-up note captured
-- when logging an applied job via the "Enable Follow-up" toggle.
alter table tasks add column if not exists notes text;
