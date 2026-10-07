import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, LayoutDashboard } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";
import { INTERVIEW_ROUND_TYPE_LABELS } from "@/lib/interview-meta";
import { cn } from "@/lib/utils";
import { ACTIVE_APPLICATION_STATUSES } from "@/types/database";
import type { Interview, InterviewRoundType, Job, JobStatusHistoryEntry, Task } from "@/types/database";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/analytics/stat-tile";
import { ApplicationsTrendChart } from "@/components/analytics/applications-trend-chart";
import { PipelineFunnelChart } from "@/components/analytics/pipeline-funnel-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { InlineEmpty } from "@/components/dashboard/inline-empty";

function pct(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

type UpcomingInterview = Interview & {
  jobs: { id: string; company_name: string; position: string } | null;
};

type FollowUpItem = {
  id: string;
  label: string;
  sublabel: string;
  date: string;
  href: string;
  overdue: boolean;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const [
    { data: jobs },
    { data: history },
    { count: interviewCount },
    { data: upcomingInterviews },
    { data: dueTasks },
    { data: pendingFollowUps },
    { data: upcomingDeadlines },
    { data: savedJobs },
  ] = await Promise.all([
    supabase.from("jobs").select("*"),
    supabase.from("job_status_history").select("*"),
    supabase.from("interviews").select("*", { count: "exact", head: true }),
    supabase
      .from("interviews")
      .select("*, jobs(id, company_name, position)")
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("tasks")
      .select("*")
      .eq("status", "pending")
      .lte("due_date", todayDateStr)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("outreach")
      .select("id, person_name, company_name, follow_up_date")
      .eq("follow_up_status", "pending")
      .not("follow_up_date", "is", null)
      .order("follow_up_date", { ascending: true })
      .limit(5),
    supabase
      .from("jobs")
      .select("id, company_name, position, application_deadline")
      .not("application_deadline", "is", null)
      .in("status", ACTIVE_APPLICATION_STATUSES)
      .order("application_deadline", { ascending: true })
      .limit(5),
    supabase
      .from("jobs")
      .select("id, company_name, position, platform, created_at")
      .eq("status", "saved")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const typedJobs = (jobs as Job[]) ?? [];
  const summary = computeAnalytics(typedJobs, (history as JobStatusHistoryEntry[]) ?? []);

  if (typedJobs.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Dashboard" description="An overview of your job search." />
        <EmptyState
          icon={LayoutDashboard}
          title="No applications yet"
          description="Add your first job to your Applications to start seeing trends here."
          action={
            <Button size="sm" asChild>
              <Link href="/applications">Add Job</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const activeApplications = typedJobs.filter((j) =>
    (ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(j.status)
  ).length;
  const offers = typedJobs.filter((j) => j.status === "offer").length;

  const followUps: FollowUpItem[] = [
    ...(pendingFollowUps ?? []).map((o) => ({
      id: `outreach-${o.id}`,
      label: `Follow up with ${o.person_name}`,
      sublabel: o.company_name,
      date: o.follow_up_date as string,
      href: "/outreach",
      overdue: (o.follow_up_date as string) < todayDateStr,
    })),
    ...(upcomingDeadlines ?? []).map((j) => ({
      id: `deadline-${j.id}`,
      label: `${j.position} deadline`,
      sublabel: j.company_name,
      date: j.application_deadline as string,
      href: `/applications/${j.id}`,
      overdue: (j.application_deadline as string) < todayDateStr,
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const interviews = (upcomingInterviews as UpcomingInterview[] | null) ?? [];
  const tasks = (dueTasks as Task[] | null) ?? [];
  const saved = savedJobs ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="An overview of your job search."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/analytics">
              Full analytics <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Applications" value={String(summary.totalApplied)} />
        <StatTile label="Active Applications" value={String(activeApplications)} />
        <StatTile label="Interviews" value={String(interviewCount ?? 0)} />
        <StatTile label="Offers" value={String(offers)} />
        <StatTile label="Response Rate" value={pct(summary.responseRate)} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineFunnelChart data={summary.funnel} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsTrendChart data={summary.weeklyApplications} />
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {interviews.length > 0 ? (
          <DashboardSection title="Interviews" viewAllHref="/interviews">
            {interviews.map((iv) => (
              <Link
                key={iv.id}
                href={iv.jobs ? `/applications/${iv.jobs.id}` : "/interviews"}
                className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 truncate">
                  {INTERVIEW_ROUND_TYPE_LABELS[iv.round_type as InterviewRoundType]}
                  {iv.jobs ? ` · ${iv.jobs.position} · ${iv.jobs.company_name}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {iv.scheduled_at ? format(new Date(iv.scheduled_at), "MMM d, h:mm a") : "—"}
                </span>
              </Link>
            ))}
          </DashboardSection>
        ) : (
          <InlineEmpty
            message="No interviews scheduled"
            href="/applications"
            linkLabel="View Applications"
          />
        )}

        {tasks.length > 0 ? (
          <DashboardSection title="Today's Tasks" viewAllHref="/tasks">
            {tasks.map((task) => {
              const overdue = !!task.due_date && task.due_date < todayDateStr;
              return (
                <Link
                  key={task.id}
                  href={`/tasks?id=${task.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 truncate">{task.title}</span>
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      overdue ? "font-medium text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {task.due_date ? format(new Date(task.due_date), "MMM d") : "No date"}
                  </span>
                </Link>
              );
            })}
          </DashboardSection>
        ) : (
          <InlineEmpty message="No tasks due today" href="/tasks" linkLabel="View Tasks" />
        )}

        {followUps.length > 0 ? (
          <DashboardSection title="Follow-ups & Deadlines" viewAllHref="/outreach">
            {followUps.map((f) => (
              <Link
                key={f.id}
                href={f.href}
                className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 truncate">
                  {f.label} · {f.sublabel}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    f.overdue ? "font-medium text-destructive" : "text-muted-foreground"
                  )}
                >
                  {format(new Date(f.date), "MMM d")}
                </span>
              </Link>
            ))}
          </DashboardSection>
        ) : (
          <InlineEmpty
            message="No follow-ups or deadlines"
            href="/outreach"
            linkLabel="View Outreach"
          />
        )}

        {saved.length > 0 ? (
          <DashboardSection title="Saved Jobs" viewAllHref="/saved-jobs">
            {saved.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-3 px-1 py-1.5 text-sm">
                <span className="min-w-0 truncate">
                  {job.position} · {job.company_name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{job.platform}</span>
              </div>
            ))}
          </DashboardSection>
        ) : (
          <InlineEmpty message="No saved jobs yet" href="/saved-jobs" linkLabel="View Saved Jobs" />
        )}
      </div>
    </div>
  );
}
