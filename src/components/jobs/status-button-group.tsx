"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateJobStatus } from "@/lib/actions/jobs";
import type { JobStatus } from "@/types/database";
import { JOB_STATUS_META } from "@/lib/job-status";
import { cn } from "@/lib/utils";

const QUICK_STATUSES: JobStatus[] = ["applied", "interview", "offer", "rejected"];

export function StatusButtonGroup({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: JobStatus) {
    if (next === status || isPending) return;
    startTransition(async () => {
      const { error } = await updateJobStatus(jobId, next);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Status updated to ${JOB_STATUS_META[next].label}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-full border bg-muted/40 p-1">
      {QUICK_STATUSES.map((s) => {
        const meta = JOB_STATUS_META[s];
        const active = status === s;
        return (
          <button
            key={s}
            type="button"
            disabled={isPending}
            onClick={() => handleChange(s)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? cn("shadow-sm", meta.badgeClassName)
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)} />
            <span className="truncate">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
