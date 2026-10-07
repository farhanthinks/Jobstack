import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarClock,
  ExternalLink,
  Link2,
  ListTodo,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
  Wallet,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { getSignedDocumentUrls } from "@/lib/documents";
import { WORK_MODE_LABELS } from "@/lib/job-logo";
import type { Job, JobStatusHistoryEntry } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationStatusButtons } from "@/components/jobs/application-status-buttons";
import { CompanyLogoEditor } from "@/components/jobs/company-logo-editor";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { EditJobForm } from "@/components/jobs/edit-job-form";
import { HrDetailsDialog } from "@/components/jobs/hr-details-dialog";
import { StatusTimeline } from "@/components/jobs/status-timeline";
import { InterviewFormSheet } from "@/components/interviews/interview-form-sheet";
import { InterviewListItem } from "@/components/interviews/interview-list-item";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { JobDocumentsCard } from "@/components/documents/job-documents-card";

// Job detail pages are addressed by the permanent, human-readable Job ID
// (e.g. "MS-SE-001") rather than the internal UUID. Old links using the raw
// UUID, or jobs without a Job ID yet, still resolve via this fallback.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The Timeline shows only its most recent entries at a glance; beyond this
// count it gets a fixed height with internal scroll for older entries,
// freeing up vertical space in the sidebar for Documents below it.
const TIMELINE_VISIBLE_ENTRIES = 3;

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq(UUID_RE.test(slug) ? "id" : "job_code", slug)
    .maybeSingle();

  if (!job) {
    notFound();
  }

  const typedJob = job as Job;

  const [
    { data: history },
    { data: interviews },
    { data: tasks },
    { data: masterResume },
    { data: jobDocuments },
  ] = await Promise.all([
    supabase
      .from("job_status_history")
      .select("*")
      .eq("job_id", typedJob.id)
      .order("changed_at", { ascending: false }),
    supabase
      .from("interviews")
      .select("*")
      .eq("job_id", typedJob.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("job_id", typedJob.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .is("job_id", null)
      .eq("type", "master_resume")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("*")
      .eq("job_id", typedJob.id)
      .order("created_at", { ascending: false }),
  ]);
  const typedHistory = (history as JobStatusHistoryEntry[]) ?? [];
  const jobOption = [{ id: typedJob.id, company_name: typedJob.company_name, position: typedJob.position }];

  const jobDocs = jobDocuments ?? [];
  const documentPaths = [
    ...(masterResume?.file_url ? [masterResume.file_url] : []),
    ...jobDocs.map((d) => d.file_url).filter(Boolean),
  ] as string[];
  const signedUrls = await getSignedDocumentUrls(supabase, documentPaths);

  const resumeOptions = [
    ...(masterResume
      ? [{ ...masterResume, label: `Master resume — ${masterResume.file_name}` }]
      : []),
    ...jobDocs
      .filter((d) => d.type === "tailored_resume")
      .map((d) => ({ ...d, label: `${d.file_name} (tailored)` })),
  ];
  const coverLetterOptions = jobDocs
    .filter((d) => d.type === "cover_letter")
    .map((d) => ({ ...d, label: d.file_name ?? "Cover letter" }));

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
      <div>
        <Button variant="ghost" size="lg" className="-ml-2.5 gap-2 px-3 text-base" asChild>
          <Link href="/applications">
            <ArrowLeft className="size-5" />
            Applications
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <CompanyLogoEditor job={typedJob} />
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-xl font-semibold tracking-tight">
                {typedJob.position}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {typedJob.company_name}
                {typedJob.job_code && (
                  <span className="ml-1.5 font-mono text-muted-foreground/70">
                    · {typedJob.job_code}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                {typedJob.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {typedJob.location}
                  </span>
                )}
                {typedJob.work_mode && (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    {WORK_MODE_LABELS[typedJob.work_mode]}
                  </span>
                )}
                {typedJob.salary && (
                  <span className="flex items-center gap-1">
                    <Wallet className="size-3.5" />
                    {typedJob.salary}
                  </span>
                )}
                {typedJob.applied_at && (
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="size-3.5" />
                    Applied {format(new Date(typedJob.applied_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {typedJob.job_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={typedJob.job_url} target="_blank" rel="noopener noreferrer">
                  View Job
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
            <DeleteJobButton jobId={typedJob.id} companyName={typedJob.company_name} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Status</CardTitle>
          <CardDescription>Click a status to update your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationStatusButtons jobId={typedJob.id} status={typedJob.status} />
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application details</CardTitle>
            </CardHeader>
            <CardContent>
              <EditJobForm job={typedJob} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Interviews</CardTitle>
              <InterviewFormSheet
                jobs={jobOption}
                lockJobId={typedJob.id}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="size-3.5" />
                    Add interview
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-2">
              {(interviews ?? []).length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
                  <CalendarClock className="size-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No interview rounds scheduled yet.
                  </p>
                </div>
              ) : (
                (interviews ?? []).map((interview) => (
                  <InterviewListItem
                    key={interview.id}
                    interview={interview}
                    jobs={jobOption}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Tasks</CardTitle>
              <TaskFormSheet
                jobs={jobOption}
                lockJobId={typedJob.id}
                lockCategory="application"
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="size-3.5" />
                    Add task
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-2">
              {(tasks ?? []).length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
                  <ListTodo className="size-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No tasks linked to this application yet.
                  </p>
                </div>
              ) : (
                (tasks ?? []).map((task) => (
                  <TaskListItem key={task.id} task={task} jobs={jobOption} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saved</span>
                <span>
                  {formatDistanceToNow(new Date(typedJob.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {typedJob.applied_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applied</span>
                  <span>{format(new Date(typedJob.applied_at), "MMM d, yyyy")}</span>
                </div>
              )}
              {typedJob.application_deadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span>
                    {format(new Date(typedJob.application_deadline), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">HR Details</CardTitle>
              <HrDetailsDialog job={typedJob} />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-3.5 shrink-0 text-muted-foreground" />
                {typedJob.contact_name ? (
                  <span className="min-w-0 truncate">{typedJob.contact_name}</span>
                ) : (
                  <span className="min-w-0 truncate text-muted-foreground">Not available</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                {typedJob.contact_email ? (
                  <a
                    href={`mailto:${typedJob.contact_email}`}
                    className="min-w-0 truncate text-primary hover:underline"
                  >
                    {typedJob.contact_email}
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-muted-foreground">Not available</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                {typedJob.contact_linkedin ? (
                  <a
                    href={typedJob.contact_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate text-primary hover:underline"
                  >
                    View profile
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-muted-foreground">Not available</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                {typedJob.contact_phone ? (
                  <a
                    href={`tel:${typedJob.contact_phone}`}
                    className="min-w-0 truncate text-primary hover:underline"
                  >
                    {typedJob.contact_phone}
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-muted-foreground">Not available</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {typedHistory.length > TIMELINE_VISIBLE_ENTRIES ? (
                <ScrollArea className="h-48 pr-3">
                  <StatusTimeline entries={typedHistory} />
                </ScrollArea>
              ) : (
                <StatusTimeline entries={typedHistory} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <JobDocumentsCard
                jobId={typedJob.id}
                resumeDocumentId={typedJob.resume_document_id}
                coverLetterDocumentId={typedJob.cover_letter_document_id}
                resumeOptions={resumeOptions}
                coverLetterOptions={coverLetterOptions}
                history={jobDocs}
                signedUrls={signedUrls}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
