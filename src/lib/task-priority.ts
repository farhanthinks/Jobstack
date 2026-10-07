import type { TaskPriority } from "@/types/database";

export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; badgeClassName: string }
> = {
  low: {
    label: "Low",
    badgeClassName: "bg-secondary text-secondary-foreground",
  },
  medium: {
    label: "Medium",
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  high: {
    label: "High",
    badgeClassName: "bg-destructive/10 text-destructive",
  },
};
