import type {
  OutreachFollowupStatus,
  OutreachPersonType,
  OutreachStatus,
  OutreachType,
} from "@/types/database";

export const OUTREACH_STATUS_META: Record<
  OutreachStatus,
  { label: string; dotClassName: string; badgeClassName: string }
> = {
  sent: {
    label: "Sent",
    dotClassName: "bg-slate-400",
    badgeClassName: "bg-secondary text-secondary-foreground",
  },
  seen: {
    label: "Seen",
    dotClassName: "bg-sky-500",
    badgeClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  replied: {
    label: "Replied",
    dotClassName: "bg-emerald-500",
    badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  no_response: {
    label: "No Response",
    dotClassName: "bg-amber-600",
    badgeClassName: "bg-amber-600/10 text-amber-700 dark:text-amber-500",
  },
};

export const OUTREACH_FOLLOWUP_STATUS_META: Record<
  OutreachFollowupStatus,
  { label: string; dotClassName: string; badgeClassName: string }
> = {
  pending: {
    label: "Pending",
    dotClassName: "bg-amber-500",
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  sent: {
    label: "Sent",
    dotClassName: "bg-sky-500",
    badgeClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  completed: {
    label: "Completed",
    dotClassName: "bg-emerald-500",
    badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

export const OUTREACH_PERSON_TYPE_LABELS: Record<OutreachPersonType, string> = {
  hr: "HR",
  recruiter: "Recruiter",
  other: "Other",
};

export const OUTREACH_TYPE_LABELS: Record<OutreachType, string> = {
  referral_request: "Referral Request",
  job_inquiry: "Job Inquiry",
  hr_contact: "HR Contact",
  networking: "Networking",
  other: "Other",
};
