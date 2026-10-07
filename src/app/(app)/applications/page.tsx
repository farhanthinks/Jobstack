import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PipelineWorkspace } from "@/components/jobs/pipeline-workspace";
import { AddAppliedJobDialog } from "@/components/jobs/add-applied-job-dialog";
import type { JobCardData } from "@/components/jobs/job-card";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: followUps }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, resume:documents!jobs_resume_document_id_fkey(file_name)")
      .neq("status", "saved")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("job_id, due_date")
      .eq("type", "follow_up")
      .eq("status", "pending")
      .not("job_id", "is", null)
      .not("due_date", "is", null)
      .order("due_date", { ascending: true }),
  ]);

  const followUpByJob = new Map<string, string>();
  for (const task of followUps ?? []) {
    if (task.job_id && task.due_date && !followUpByJob.has(task.job_id)) {
      followUpByJob.set(task.job_id, task.due_date);
    }
  }

  const cards: JobCardData[] = (jobs ?? []).map((job) => ({
    ...job,
    resumeFileName: job.resume?.file_name ?? null,
    followUpDueDate: followUpByJob.get(job.id) ?? null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Applications"
        description="Your active applications, from Applied to Offer."
        actions={<AddAppliedJobDialog />}
      />
      <PipelineWorkspace jobs={cards} />
    </div>
  );
}
