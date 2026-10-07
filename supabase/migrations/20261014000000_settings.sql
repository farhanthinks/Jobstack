-- Settings page: profile details, notification preferences, job-search
-- preferences, AI preferences, and reminder defaults. `full_name`/avatar
-- deliberately stay out of this table — they live in auth.users'
-- user_metadata already (set at signup), and the TopBar reads them from
-- there, so Settings writes through supabase.auth.updateUser() instead of
-- duplicating them here.

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists linkedin_url text;
alter table profiles add column if not exists portfolio_url text;

-- Lets a manual timezone edit in Settings stick instead of being silently
-- overwritten by the next browser-detected auto-sync (src/components/timezone-sync.tsx).
alter table profiles add column if not exists timezone_auto_detect boolean not null default true;

alter table profiles add column if not exists notify_task_reminders boolean not null default true;
alter table profiles add column if not exists notify_application_followups boolean not null default true;
alter table profiles add column if not exists notify_interview_reminders boolean not null default true;
alter table profiles add column if not exists notify_saved_job_deadlines boolean not null default true;
alter table profiles add column if not exists notify_outreach_reminders boolean not null default true;
alter table profiles add column if not exists notify_general_emails boolean not null default true;

alter table profiles add column if not exists preferred_job_titles text[];
alter table profiles add column if not exists preferred_locations text[];
alter table profiles add column if not exists preferred_work_modes work_mode[];
alter table profiles add column if not exists preferred_salary_range text;
alter table profiles add column if not exists preferred_platforms job_platform[];

-- Paste-based "default resume" fallback for the AI Assistant's shared
-- resume box (localStorage-only) — not a stored document, consistent with
-- this session's move away from stored master-resume documents.
alter table profiles add column if not exists default_resume_latex text;
alter table profiles add column if not exists ai_content_style text;
alter table profiles add column if not exists ai_resume_notes text;

alter table profiles add column if not exists reminder_email text;
alter table profiles add column if not exists default_reminder_time time not null default '10:00:00';
