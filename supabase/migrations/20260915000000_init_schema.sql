-- Jobstack initial schema
-- Defines the full Phase 1-6 data model up front (tables reference each
-- other across phases), even though only `jobs` gets a UI in Phase 2.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type job_platform as enum ('LinkedIn', 'Naukri', 'Referral', 'Company Site', 'Other');
create type job_status as enum ('saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn');
create type document_type as enum ('master_resume', 'tailored_resume', 'cover_letter', 'other');
create type interview_round_type as enum ('phone', 'technical', 'hr', 'final', 'other');
create type interview_mode as enum ('online', 'in_person');
create type task_type as enum ('follow_up', 'deadline', 'custom');
create type task_priority as enum ('low', 'medium', 'high');
create type task_status as enum ('pending', 'done');
create type ai_generation_type as enum ('match_score', 'missing_skills', 'tailored_resume', 'cover_letter', 'interview_questions');

-- ---------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------

create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company_name text not null,
  position text not null,
  platform job_platform not null default 'Other',
  job_description text not null,
  job_url text,
  location text,
  salary text,
  contact_email text,
  contact_phone text,
  application_deadline date,
  status job_status not null default 'saved',
  resume_document_id uuid,
  cover_letter_document_id uuid,
  match_score int check (match_score is null or (match_score between 0 and 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  applied_at timestamptz
);

create index jobs_user_id_idx on jobs (user_id);
create index jobs_user_id_status_idx on jobs (user_id, status);

-- ---------------------------------------------------------------------
-- documents (created after jobs, referenced back onto jobs below)
-- ---------------------------------------------------------------------

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_id uuid references jobs (id) on delete cascade,
  type document_type not null,
  file_url text,
  file_name text,
  latex_source text,
  created_at timestamptz not null default now()
);

create index documents_user_id_idx on documents (user_id);
create index documents_job_id_idx on documents (job_id);

alter table jobs
  add constraint jobs_resume_document_id_fkey
    foreign key (resume_document_id) references documents (id) on delete set null,
  add constraint jobs_cover_letter_document_id_fkey
    foreign key (cover_letter_document_id) references documents (id) on delete set null;

-- ---------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------

create table interviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  round_type interview_round_type not null default 'other',
  scheduled_at timestamptz,
  mode interview_mode not null default 'online',
  meeting_link_or_address text,
  interviewer_name text,
  prep_notes text,
  created_at timestamptz not null default now()
);

create index interviews_job_id_idx on interviews (job_id);

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_id uuid references jobs (id) on delete cascade,
  title text not null,
  type task_type not null default 'custom',
  due_date date,
  priority task_priority not null default 'medium',
  status task_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index tasks_user_id_idx on tasks (user_id);
create index tasks_job_id_idx on tasks (job_id);

-- ---------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------

create table ai_generations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  type ai_generation_type not null,
  input_snapshot jsonb,
  output jsonb,
  created_at timestamptz not null default now()
);

create index ai_generations_job_id_idx on ai_generations (job_id);

-- ---------------------------------------------------------------------
-- job_status_history — not in the original data model, but required by
-- the "timeline of status changes" on the job detail page (Phase 2).
-- Populated automatically by triggers below; not directly writable.
-- ---------------------------------------------------------------------

create table job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  status job_status not null,
  changed_at timestamptz not null default now()
);

create index job_status_history_job_id_idx on job_status_history (job_id, changed_at);

-- ---------------------------------------------------------------------
-- Triggers: updated_at / applied_at bookkeeping + status history log
-- ---------------------------------------------------------------------

create or replace function jobs_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status is distinct from old.status and new.status = 'applied' and old.applied_at is null then
    new.applied_at = now();
  end if;
  return new;
end;
$$;

create trigger jobs_before_update
before update on jobs
for each row execute function jobs_before_update();

create or replace function jobs_record_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into job_status_history (job_id, status) values (new.id, new.status);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into job_status_history (job_id, status) values (new.id, new.status);
  end if;
  return null;
end;
$$;

create trigger jobs_after_insert_status_history
after insert on jobs
for each row execute function jobs_record_status_history();

create trigger jobs_after_update_status_history
after update on jobs
for each row execute function jobs_record_status_history();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table jobs enable row level security;
alter table documents enable row level security;
alter table interviews enable row level security;
alter table tasks enable row level security;
alter table ai_generations enable row level security;
alter table job_status_history enable row level security;

create policy "Users manage their own jobs" on jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own documents" on documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage interviews for their jobs" on interviews
  for all using (
    exists (select 1 from jobs where jobs.id = interviews.job_id and jobs.user_id = auth.uid())
  )
  with check (
    exists (select 1 from jobs where jobs.id = interviews.job_id and jobs.user_id = auth.uid())
  );

create policy "Users manage their own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage ai_generations for their jobs" on ai_generations
  for all using (
    exists (select 1 from jobs where jobs.id = ai_generations.job_id and jobs.user_id = auth.uid())
  )
  with check (
    exists (select 1 from jobs where jobs.id = ai_generations.job_id and jobs.user_id = auth.uid())
  );

-- Read-only from the client — rows are inserted only by the SECURITY
-- DEFINER trigger above, regardless of caller privileges.
create policy "Users view status history for their jobs" on job_status_history
  for select using (
    exists (select 1 from jobs where jobs.id = job_status_history.job_id and jobs.user_id = auth.uid())
  );
