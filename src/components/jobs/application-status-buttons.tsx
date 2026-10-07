"use client";

import { useRouter } from "next/navigation";
import { Fragment, useTransition } from "react";
import { ArrowRight, Award, Bookmark, CalendarClock, Send, XCircle } from "lucide-react";
import { toast } from "sonner";

import { updateJobStatus } from "@/lib/actions/jobs";
import type { JobStatus } from "@/types/database";
import { cn } from "@/lib/utils";

// A left-to-right progress tracker: Saved -> Applied -> Interview -> Offer,
// ending in a single closed/rejected step. "No Response" is a terminal
// outcome equivalent to "Rejected" here — a job in either state reads as
// this last step being active, and clicking it always sets "rejected"
// directly (the 30-day no-response auto-nudge elsewhere can still set
// "no_response" on its own).
const STATUS_STEPS: { status: JobStatus; label: string; icon: typeof Bookmark }[] = [
  { status: "saved", label: "Saved", icon: Bookmark },
  { status: "applied", label: "Applied", icon: Send },
  { status: "interview", label: "Interview", icon: CalendarClock },
  { status: "offer", label: "Offer", icon: Award },
  { status: "rejected", label: "Rejected", icon: XCircle },
];

const CLOSED_STATUSES: JobStatus[] = ["no_response", "rejected"];

export function ApplicationStatusButtons({
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
      const label = STATUS_STEPS.find((step) => step.status === next)?.label ?? next;
      toast.success(`Status updated to ${label}.`);
      router.refresh();
    });
  }

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <div className="flex w-full items-center justify-center">
        {STATUS_STEPS.map((step, index) => {
          const active =
            step.status === "rejected"
              ? CLOSED_STATUSES.includes(status)
              : status === step.status;
          const Icon = step.icon;
          return (
            <Fragment key={step.status}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleChange(step.status)}
                className={cn(
                  "flex min-w-12 max-w-28 flex-1 items-center justify-center gap-1 rounded-full border px-1.5 py-2.5 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-60",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:bg-muted/40"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate text-xs font-medium">{step.label}</span>
              </button>
              {index < STATUS_STEPS.length - 1 && (
                <ArrowRight className="mx-1.5 size-3 shrink-0 self-center text-muted-foreground/40" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
