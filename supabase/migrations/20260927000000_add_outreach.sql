-- Outreach: tracks LinkedIn/recruiter/referral outreach separately from the
-- jobs application pipeline. An outreach record may optionally link to an
-- existing job (Saved or Applied), but nothing here writes back to `jobs`.

create type outreach_person_type as enum ('hr', 'recruiter', 'other');
create type outreach_type as enum ('referral_request', 'job_inquiry', 'hr_contact', 'networking', 'other');
create type outreach_status as enum ('sent', 'seen', 'replied', 'no_response', 'rejected');
create type outreach_followup_status as enum ('pending', 'sent', 'completed');

create table outreach (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_name text not null,
  linkedin_url text not null,
  person_type outreach_person_type not null default 'other',
  person_type_other text,
  company_name text not null,
  current_position text,
  outreach_type outreach_type not null default 'other',
  job_id uuid references jobs (id) on delete set null,
  message_sent text not null,
  date_sent date not null,
  status outreach_status not null default 'sent',
  response_date date,
  response_notes text,
  follow_up_date date,
  follow_up_status outreach_followup_status,
  notes text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_user_id_idx on outreach (user_id);
create index outreach_job_id_idx on outreach (job_id);
create index outreach_user_id_status_idx on outreach (user_id, status);

create or replace function outreach_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger outreach_before_update
before update on outreach
for each row execute function outreach_before_update();

alter table outreach enable row level security;

create policy "Users manage their own outreach" on outreach
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
