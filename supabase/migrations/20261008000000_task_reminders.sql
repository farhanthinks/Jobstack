-- Email reminders (Resend): tracks each user's timezone (so "10:00 AM on the
-- due date" resolves to the right UTC instant) and marks when a task's
-- reminder email has already gone out, to prevent duplicate sends.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users manage their own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter table tasks add column reminder_sent_at timestamptz;

-- Narrows the cron job's scan to tasks that could plausibly still need a
-- reminder, instead of scanning every row on every run.
create index tasks_pending_reminder_idx on tasks (due_date)
  where status = 'pending' and reminder_sent_at is null;
