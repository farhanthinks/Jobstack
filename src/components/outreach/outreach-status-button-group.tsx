"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateOutreachStatus } from "@/lib/actions/outreach";
import type { OutreachStatus } from "@/types/database";
import { OUTREACH_STATUS_META } from "@/lib/outreach-status";
import { cn } from "@/lib/utils";

const STATUSES: OutreachStatus[] = ["sent", "seen", "replied", "no_response"];

export function OutreachStatusButtonGroup({
  outreachId,
  status,
  onStatusChange,
}: {
  outreachId: string;
  status: OutreachStatus;
  onStatusChange?: (next: OutreachStatus) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: OutreachStatus) {
    if (next === status || isPending) return;
    startTransition(async () => {
      const { error } = await updateOutreachStatus(outreachId, next);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Status updated to ${OUTREACH_STATUS_META[next].label}.`);
      onStatusChange?.(next);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-4 gap-1 rounded-full border bg-muted/40 p-1">
      {STATUSES.map((s) => {
        const meta = OUTREACH_STATUS_META[s];
        const active = status === s;
        return (
          <button
            key={s}
            type="button"
            disabled={isPending}
            onClick={() => handleChange(s)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-1.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60",
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
