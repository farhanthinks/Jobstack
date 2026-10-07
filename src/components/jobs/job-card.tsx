"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, FileText, Loader2, MapPin, RotateCcw, Sparkles, Wallet } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateJobStatus } from "@/lib/actions/jobs";
import { NO_RESPONSE_THRESHOLD_DAYS } from "@/lib/job-status";
import { getJobLogoUrl } from "@/lib/job-logo";
import type { Job } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyAvatar } from "@/components/jobs/company-avatar";

export type JobCardData = Job & {
  resumeFileName?: string | null;
  followUpDueDate?: string | null;
};

function NoResponseNotice({ job }: { job: JobCardData }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  if (job.status !== "applied" || !job.applied_at) return null;

  const age = differenceInCalendarDays(new Date(), new Date(job.applied_at));
  if (age < 7) return null;

  const overdue = age >= NO_RESPONSE_THRESHOLD_DAYS;

  function handleMove(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const { error } = await updateJobStatus(job.id, "no_response");
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`${job.company_name} moved to No Response.`);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs",
        overdue ? "bg-amber-500/10 text-amber-700 dark:text-amber-500" : "text-muted-foreground"
      )}
    >
      <span className="flex items-center gap-1">
        {overdue && <AlertTriangle className="size-3" />}
        No response · {age}d
      </span>
      {overdue && (
        <Button
          size="sm"
          variant="ghost"
          className="h-5 px-1.5 text-xs"
          onClick={handleMove}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : "Move to No Response"}
        </Button>
      )}
    </div>
  );
}

function FollowUpNotice({ job }: { job: JobCardData }) {
  if (!job.followUpDueDate) return null;
  const due = new Date(job.followUpDueDate);
  if (due > new Date()) return null;

  const isToday = differenceInCalendarDays(due, new Date()) === 0;

  return (
    <div className="flex items-center gap-1 rounded-md bg-primary/5 px-1.5 py-1 text-xs text-primary">
      <RotateCcw className="size-3" />
      Follow up {isToday ? "today" : format(due, "MMM d")}
    </div>
  );
}

function JobCardBody({ job }: { job: JobCardData }) {
  const cardDate = job.applied_at ?? job.created_at;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <CompanyAvatar name={job.company_name} logoUrl={getJobLogoUrl(job)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{job.position}</p>
          <p className="truncate text-xs text-muted-foreground">{job.company_name}</p>
        </div>
        {job.match_score != null && (
          <Badge variant="outline" className="shrink-0 gap-1 text-xs">
            <Sparkles className="size-3" />
            {job.match_score}
          </Badge>
        )}
      </div>

      {(job.location || job.salary) && (
        <div className="space-y-1">
          {job.location && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </p>
          )}
          {job.salary && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3 shrink-0" />
              <span className="truncate">{job.salary}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs font-normal">
            {job.platform}
          </Badge>
          {job.resumeFileName && (
            <Badge
              variant="outline"
              className="gap-1 border-primary/20 bg-primary/5 text-xs font-normal text-primary"
            >
              <FileText className="size-3" />
              <span className="max-w-20 truncate">{job.resumeFileName}</span>
            </Badge>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {format(new Date(cardDate), "MMM d")}
        </span>
      </div>

      <NoResponseNotice job={job} />
      <FollowUpNotice job={job} />
    </div>
  );
}

export function JobCard({
  job,
  onOpen,
}: {
  job: JobCardData;
  onOpen: (job: JobCardData) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { status: job.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(job);
        }
      }}
      className={cn(
        "group touch-none rounded-lg border bg-card p-3 shadow-xs transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-px hover:border-foreground/15 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <JobCardBody job={job} />
    </div>
  );
}

export function JobCardPreview({ job }: { job: JobCardData }) {
  return (
    <div className="scale-[1.02] rounded-lg border bg-card p-3 shadow-lg">
      <JobCardBody job={job} />
    </div>
  );
}
