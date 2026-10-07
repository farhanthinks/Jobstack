-- Permanent, system-generated "Job ID" (e.g. MS-SE-001) — assigned once when
-- a job is first created (Saved or Applied) and never changed afterwards.
-- The sequence number is scoped per (user, company code + role code) pair,
-- via job_code_sequences + an atomic upsert function, so re-saving a similar
-- role at the same company increments (…-002, …-003) instead of colliding.

alter table jobs add column if not exists job_code text;
alter table jobs add constraint jobs_user_id_job_code_key unique (user_id, job_code);

create table job_code_sequences (
  user_id uuid not null references auth.users (id) on delete cascade,
  code_prefix text not null,
  last_number integer not null default 0,
  primary key (user_id, code_prefix)
);

alter table job_code_sequences enable row level security;

create policy "Users view their own job code sequences" on job_code_sequences
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies: this table is only ever written to by
-- the SECURITY DEFINER function below, never directly by the client.

create or replace function next_job_code_number(p_user_id uuid, p_prefix text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
begin
  insert into job_code_sequences (user_id, code_prefix, last_number)
  values (p_user_id, p_prefix, 1)
  on conflict (user_id, code_prefix)
  do update set last_number = job_code_sequences.last_number + 1
  returning last_number into v_number;

  return v_number;
end;
$$;

grant execute on function next_job_code_number(uuid, text) to authenticated;
