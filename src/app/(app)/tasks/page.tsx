import { createClient } from "@/lib/supabase/server";
import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createClient();

  const [{ data: tasks }, { data: jobs }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, jobs(company_name, position), outreach(linkedin_url)")
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, company_name, position")
      .order("created_at", { ascending: false }),
  ]);

  const jobOptions = jobs ?? [];

  return <TasksView tasks={tasks ?? []} jobs={jobOptions} initialSelectedTaskId={id} />;
}
