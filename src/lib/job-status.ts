import {
  Archive,
  Award,
  Bookmark,
  CalendarClock,
  Clock,
  Search,
  Send,
  Undo2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { JobStatus } from "@/types/database";

// Saved jobs live on their own page now, not the board. The Pipeline board
// shows only the active application progression — a candidate can only ever
// know Applied / Interview / Offer; anything an employer does internally
// before responding (e.g. "screening") isn't a state the candidate can
// observe, so it's not a selectable pipeline stage.
export const BOARD_STATUSES: JobStatus[] = ["applied", "interview", "offer"];

// Exits from the pipeline — reachable via the "More" menu / status filter,
// never permanent board columns.
export const CLOSED_STATUSES: JobStatus[] = [
  "no_response",
  "rejected",
  "withdrawn",
  "archived",
];

export const NO_RESPONSE_THRESHOLD_DAYS = 30;

export const JOB_STATUS_META: Record<
  JobStatus,
  { label: string; dotClassName: string; badgeClassName: string; icon: LucideIcon }
> = {
  saved: {
    label: "Saved",
    dotClassName: "bg-slate-400",
    badgeClassName: "bg-secondary text-secondary-foreground",
    icon: Bookmark,
  },
  applied: {
    label: "Applied",
    dotClassName: "bg-primary",
    badgeClassName: "bg-primary/10 text-primary",
    icon: Send,
  },
  screening: {
    label: "Reviewing",
    dotClassName: "bg-amber-500",
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Search,
  },
  interview: {
    label: "Interview",
    dotClassName: "bg-sky-500",
    badgeClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    icon: CalendarClock,
  },
  offer: {
    label: "Offer",
    dotClassName: "bg-emerald-500",
    badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Award,
  },
  no_response: {
    label: "No Response",
    dotClassName: "bg-amber-600",
    badgeClassName: "bg-amber-600/10 text-amber-700 dark:text-amber-500",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    dotClassName: "bg-destructive",
    badgeClassName: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  withdrawn: {
    label: "Withdrawn",
    dotClassName: "bg-muted-foreground",
    badgeClassName: "bg-muted text-muted-foreground",
    icon: Undo2,
  },
  archived: {
    label: "Archived",
    dotClassName: "bg-zinc-400",
    badgeClassName: "bg-muted text-muted-foreground",
    icon: Archive,
  },
};
