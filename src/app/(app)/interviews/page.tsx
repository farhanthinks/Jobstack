import { createClient } from "@/lib/supabase/server";
import { ACTIVE_APPLICATION_STATUSES } from "@/types/database";
import { InterviewsView } from "@/components/interviews/interviews-view";

export default async function InterviewsPage() {
  const supabase = await createClient();

  const [{ data: interviews }, { data: jobs }] = await Promise.all([
    // No status filter here — an interview should keep showing up even if
    // its job's status later changes (e.g. to rejected). Only the "Linked
    // application" picker for *new* interviews is scoped to active jobs.
    supabase
      .from("interviews")
      .select("*, jobs(company_name, position)")
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    // Only active, applied jobs are eligible to link a new interview to —
    // excludes not-yet-applied ("saved") and dead-end statuses (rejected,
    // withdrawn, no_response, archived).
    supabase
      .from("jobs")
      .select("id, company_name, position")
      .in("status", ACTIVE_APPLICATION_STATUSES)
      .order("created_at", { ascending: false }),
  ]);

  return <InterviewsView interviews={interviews ?? []} jobs={jobs ?? []} />;
}
