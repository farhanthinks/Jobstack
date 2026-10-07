"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { updateJobStatus } from "@/lib/actions/jobs";
import { BOARD_STATUSES } from "@/lib/job-status";
import type { JobStatus } from "@/types/database";
import { PipelineColumn } from "@/components/jobs/pipeline-column";
import { JobCardPreview, type JobCardData } from "@/components/jobs/job-card";

function groupByStatus(jobs: JobCardData[], overrides: Map<string, JobStatus>) {
  const groups = Object.fromEntries(
    BOARD_STATUSES.map((status) => [status, [] as JobCardData[]])
  ) as Record<JobStatus, JobCardData[]>;

  for (const job of jobs) {
    const status = overrides.get(job.id) ?? job.status;
    if (!groups[status]) continue; // rejected/withdrawn have no board column
    groups[status].push(status === job.status ? job : { ...job, status });
  }
  return groups;
}

export function PipelineBoard({
  jobs,
  onOpen,
}: {
  jobs: JobCardData[];
  onOpen: (job: JobCardData) => void;
}) {
  const [overrides, setOverrides] = React.useState<Map<string, JobStatus>>(
    () => new Map()
  );
  const [activeJob, setActiveJob] = React.useState<JobCardData | null>(null);

  const groups = React.useMemo(
    () => groupByStatus(jobs, overrides),
    [jobs, overrides]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find((j) => j.id === event.active.id);
    setActiveJob(job ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id as string;
    const fromStatus = active.data.current?.status as JobStatus;
    const toStatus = over.id as JobStatus;

    if (fromStatus === toStatus) return;

    setOverrides((prev) => new Map(prev).set(jobId, toStatus));

    const { error } = await updateJobStatus(jobId, toStatus);
    if (error) {
      toast.error("Couldn't update status — reverting.");
      setOverrides((prev) => {
        const next = new Map(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  return (
    <DndContext
      id="pipeline-board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid flex-1 grid-cols-3 gap-3">
        {BOARD_STATUSES.map((status) => (
          <PipelineColumn key={status} status={status} jobs={groups[status]} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{activeJob && <JobCardPreview job={activeJob} />}</DragOverlay>
    </DndContext>
  );
}
