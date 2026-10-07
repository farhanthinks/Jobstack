import { format } from "date-fns";

import { cn } from "@/lib/utils";
import type { JobStatusHistoryEntry } from "@/types/database";
import { JOB_STATUS_META } from "@/lib/job-status";

export function StatusTimeline({
  entries,
}: {
  entries: JobStatusHistoryEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No status changes yet.</p>
    );
  }

  return (
    <ol className="relative">
      {entries.length > 1 && (
        <span className="absolute top-[22px] bottom-[22px] left-3.5 w-px bg-border" />
      )}
      {entries.map((entry, index) => {
        const meta = JOB_STATUS_META[entry.status];
        const Icon = meta.icon;
        const isLast = index === entries.length - 1;
        return (
          <li
            key={entry.id}
            className={cn("relative flex items-center gap-3", !isLast && "pb-5")}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                meta.badgeClassName
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex h-7 items-center">
                <p className="text-sm font-medium leading-none">{meta.label}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.changed_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
