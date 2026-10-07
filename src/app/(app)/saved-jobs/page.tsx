import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AddSavedJobDialog } from "@/components/jobs/add-saved-job-dialog";
import { SavedJobsView } from "@/components/jobs/saved-jobs-view";
import type { JobCardData } from "@/components/jobs/job-card";

export default async function SavedJobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, resume:documents!jobs_resume_document_id_fkey(file_name)")
    .eq("status", "saved")
    .order("created_at", { ascending: false });

  const cards: JobCardData[] = (jobs ?? []).map((job) => ({
    ...job,
    resumeFileName: job.resume?.file_name ?? null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Saved Jobs"
        description="Jobs you're interested in but haven't applied to yet."
        actions={<AddSavedJobDialog />}
      />
      <SavedJobsView jobs={cards} />
    </div>
  );
}
