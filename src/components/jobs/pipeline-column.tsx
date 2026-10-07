"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/database";
import { JOB_STATUS_META } from "@/lib/job-status";
import { JobCard, type JobCardData } from "@/components/jobs/job-card";

export function PipelineColumn({
  status,
  jobs,
  onOpen,
}: {
  status: JobStatus;
  jobs: JobCardData[];
  onOpen: (job: JobCardData) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = JOB_STATUS_META[status];

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-2 px-1 py-2">
        <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
        <span className="text-sm font-medium">{meta.label}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground transition-all duration-150">
          {jobs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-16 flex-1 flex-col gap-1.5 rounded-lg border border-transparent p-1 transition-colors duration-150 ease-out",
          jobs.length === 0 && "items-center justify-center",
          isOver && "border-primary/30 bg-primary/5"
        )}
      >
        {jobs.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            No applications
          </p>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}
