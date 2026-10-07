import type { Job } from "@/types/database";

/** Priority: an uploaded file beats a manually pasted URL beats an
 * auto-fetched one — each is stored separately so setting a lower-priority
 * source never clobbers a higher one that's already there. */
export function getJobLogoUrl(
  job: Pick<Job, "logo_uploaded_url" | "logo_url" | "logo_auto_url">
): string | null {
  return job.logo_uploaded_url || job.logo_url || job.logo_auto_url || null;
}

export const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};
