import type { InterviewMode, InterviewRoundType } from "@/types/database";

export const INTERVIEW_ROUND_TYPE_LABELS: Record<InterviewRoundType, string> = {
  phone: "Phone screen",
  technical: "Technical",
  hr: "HR",
  managerial: "Managerial",
  final: "Final",
  other: "Other",
};

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  online: "Online",
  phone: "Phone",
  in_person: "In-person",
};

export const INTERVIEW_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function formatInterviewDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)} ${hours === 1 ? "hour" : "hours"}`;
}
