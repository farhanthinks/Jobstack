import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getLatestGeneration } from "@/lib/actions/ai";
import { ACTIVE_APPLICATION_STATUSES } from "@/types/database";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { JobPicker } from "@/components/ai/job-picker";
import { AiWorkspace } from "@/components/ai/ai-workspace";
import type {
  AtsResumeResult,
  CoverLetterResult,
  InterviewQuestionsResult,
  MatchScoreResult,
  MissingSkillsResult,
} from "@/types/ai";

export default async function AiAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: jobParam } = await searchParams;
  const supabase = await createClient();

  // Only active, applied jobs are eligible — matches the Interviews page's
  // "Linked application" scoping and the spec's data rule that application
  // selectors must only show currently active/valid applications.
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, company_name, position")
    .in("status", ACTIVE_APPLICATION_STATUSES)
    .order("created_at", { ascending: false });

  const jobOptions = jobs ?? [];

  if (!jobParam && jobOptions.length > 0) {
    redirect(`/ai-assistant?job=${jobOptions[0].id}`);
  }

  const header = (
    <PageHeader
      title="AI Assistant"
      description="Match scores, resume tailoring, cover letters, and interview prep."
      actions={<JobPicker jobs={jobOptions} selectedJobId={jobParam} />}
    />
  );

  if (jobOptions.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {header}
        <EmptyState
          icon={Sparkles}
          title="Add a job first"
          description="The AI Assistant works against a specific job's description — add one to your Applications to get started."
          action={
            <Button size="sm" asChild>
              <Link href="/applications">Add Job</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: job }, { data: profile }, matchScore, missingSkills, atsResume, coverLetter, interviewQuestions] =
    await Promise.all([
      supabase.from("jobs").select("job_description").eq("id", jobParam!).maybeSingle(),
      user
        ? supabase.from("profiles").select("default_resume_latex").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      getLatestGeneration<MatchScoreResult>(jobParam!, "match_score"),
      getLatestGeneration<MissingSkillsResult>(jobParam!, "missing_skills"),
      getLatestGeneration<AtsResumeResult>(jobParam!, "tailored_resume"),
      getLatestGeneration<CoverLetterResult>(jobParam!, "cover_letter"),
      getLatestGeneration<InterviewQuestionsResult>(jobParam!, "interview_questions"),
    ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {header}
      <AiWorkspace
        jobId={jobParam!}
        jobDescription={job?.job_description ?? ""}
        defaultResumeLatex={profile?.default_resume_latex ?? ""}
        matchScore={matchScore}
        missingSkills={missingSkills}
        atsResume={atsResume}
        coverLetter={coverLetter}
        interviewQuestions={interviewQuestions}
      />
    </div>
  );
}
