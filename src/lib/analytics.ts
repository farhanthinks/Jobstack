import { startOfWeek, subWeeks, format, isWithinInterval, endOfWeek } from "date-fns";
import type { Job, JobStatusHistoryEntry, JobStatus } from "@/types/database";

// "screening" is kept here (though no longer a selectable pipeline status)
// so historical job_status_history rows from before it was retired still
// count correctly toward response-rate detection.
const RESPONDED_STATUSES: JobStatus[] = ["screening", "interview", "offer", "rejected"];
const FUNNEL_STAGES: JobStatus[] = ["saved", "applied", "interview", "offer"];
const FUNNEL_LABELS: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

export interface WeeklyPoint {
  week: string;
  count: number;
}

export interface FunnelPoint {
  stage: string;
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  totalApplied: number;
  responseRate: number | null;
  interviewRate: number | null;
  offerRate: number | null;
  avgTimeToResponseDays: number | null;
  avgTimeToOfferDays: number | null;
  weeklyApplications: WeeklyPoint[];
  funnel: FunnelPoint[];
}

function historyByJob(history: JobStatusHistoryEntry[]) {
  const map = new Map<string, JobStatusHistoryEntry[]>();
  for (const entry of history) {
    const list = map.get(entry.job_id) ?? [];
    list.push(entry);
    map.set(entry.job_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
  }
  return map;
}

function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

export function computeAnalytics(
  jobs: Job[],
  history: JobStatusHistoryEntry[]
): AnalyticsSummary {
  const byJob = historyByJob(history);
  const appliedJobs = jobs.filter((j) => j.applied_at);
  const totalApplied = appliedJobs.length;

  function firstEntryWithStatus(jobId: string, statuses: JobStatus[]) {
    const entries = byJob.get(jobId) ?? [];
    return entries.find((e) => statuses.includes(e.status));
  }

  const respondedJobs = appliedJobs.filter((j) =>
    firstEntryWithStatus(j.id, RESPONDED_STATUSES)
  );
  const interviewedJobs = appliedJobs.filter((j) =>
    firstEntryWithStatus(j.id, ["interview", "offer"])
  );
  const offeredJobs = appliedJobs.filter((j) => firstEntryWithStatus(j.id, ["offer"]));

  const responseRate = totalApplied > 0 ? (respondedJobs.length / totalApplied) * 100 : null;
  const interviewRate = totalApplied > 0 ? (interviewedJobs.length / totalApplied) * 100 : null;
  const offerRate = totalApplied > 0 ? (offeredJobs.length / totalApplied) * 100 : null;

  const responseTimes = respondedJobs
    .map((j) => {
      const entry = firstEntryWithStatus(j.id, RESPONDED_STATUSES);
      return entry ? daysBetween(j.applied_at!, entry.changed_at) : null;
    })
    .filter((d): d is number => d != null && d >= 0);

  const offerTimes = offeredJobs
    .map((j) => {
      const entry = firstEntryWithStatus(j.id, ["offer"]);
      return entry ? daysBetween(j.applied_at!, entry.changed_at) : null;
    })
    .filter((d): d is number => d != null && d >= 0);

  const avgTimeToResponseDays =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null;
  const avgTimeToOfferDays =
    offerTimes.length > 0 ? offerTimes.reduce((a, b) => a + b, 0) / offerTimes.length : null;

  // Weekly applications trend — last 12 weeks
  const now = new Date();
  const weeklyApplications: WeeklyPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i));
    const weekEnd = endOfWeek(subWeeks(now, i));
    const count = appliedJobs.filter((j) =>
      isWithinInterval(new Date(j.applied_at!), { start: weekStart, end: weekEnd })
    ).length;
    weeklyApplications.push({ week: format(weekStart, "MMM d"), count });
  }

  // Funnel — how many jobs ever reached each stage
  const funnel: FunnelPoint[] = FUNNEL_STAGES.map((stage) => {
    const count = jobs.filter((j) =>
      (byJob.get(j.id) ?? []).some((e) => e.status === stage)
    ).length;
    return { stage, label: FUNNEL_LABELS[stage], count };
  });

  return {
    totalApplied,
    responseRate,
    interviewRate,
    offerRate,
    avgTimeToResponseDays,
    avgTimeToOfferDays,
    weeklyApplications,
    funnel,
  };
}
