import type { TaskCategory, TaskOutreachChannel, TaskStatus, TaskType } from "@/types/database";

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  application: "Application",
  outreach: "Outreach",
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string; badgeClassName: string }> = {
  pending: {
    label: "Pending",
    badgeClassName: "bg-secondary text-secondary-foreground",
  },
  done: {
    label: "Completed",
    badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  follow_up: "Follow-up",
  status_check: "Application status check",
  interview_prep: "Interview preparation",
  document_submission: "Document submission",
  deadline: "Application deadline",
  linkedin_message: "LinkedIn message",
  connection_request: "Connection request",
  recruiter_email: "Recruiter email",
  outreach_follow_up: "Outreach follow-up",
  custom: "Custom",
};

export const TASK_OUTREACH_CHANNEL_LABELS: Record<TaskOutreachChannel, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  phone: "Phone",
  other: "Other",
};
