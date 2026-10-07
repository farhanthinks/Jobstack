// Hand-authored types mirroring supabase/migrations/20260915000000_init_schema.sql.
// Regenerate with `supabase gen types typescript` once the project is linked
// via the CLI, and this file can be replaced.

export const JOB_PLATFORMS = [
  "LinkedIn",
  "Naukri",
  "Referral",
  "Company Site",
  "Mail",
  "Other",
] as const;
export type JobPlatform = (typeof JOB_PLATFORMS)[number];

export const JOB_STATUSES = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "no_response",
  "rejected",
  "withdrawn",
  "archived",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

// Jobs actually applied to and still in play — excludes not-yet-applied
// ("saved") and dead-end statuses (rejected/withdrawn/no_response/archived).
// Used to scope pickers (e.g. the Interview form's "Linked application")
// to applications it actually makes sense to schedule an interview for.
export const ACTIVE_APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
] as const satisfies readonly JobStatus[];

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const DOCUMENT_TYPES = [
  "master_resume",
  "tailored_resume",
  "cover_letter",
  "certificate",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// "phone" is kept for backward compatibility with existing rows, but the
// Add/Edit Interview form only offers INTERVIEW_TYPE_FORM_OPTIONS below —
// "Phone" moved to being a mode, not a round type, in the redesign.
export const INTERVIEW_ROUND_TYPES = [
  "phone",
  "technical",
  "hr",
  "managerial",
  "final",
  "other",
] as const;
export type InterviewRoundType = (typeof INTERVIEW_ROUND_TYPES)[number];

export const INTERVIEW_TYPE_FORM_OPTIONS = [
  "hr",
  "technical",
  "managerial",
  "final",
  "other",
] as const satisfies readonly InterviewRoundType[];

export const INTERVIEW_MODES = ["online", "phone", "in_person"] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const TASK_CATEGORIES = ["application", "outreach"] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_TYPES = [
  "follow_up",
  "status_check",
  "interview_prep",
  "document_submission",
  "deadline",
  "linkedin_message",
  "connection_request",
  "recruiter_email",
  "outreach_follow_up",
  "custom",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

// `type` options are scoped per category — both lists share "custom".
export const APPLICATION_TASK_TYPES = [
  "follow_up",
  "status_check",
  "interview_prep",
  "document_submission",
  "deadline",
  "custom",
] as const satisfies readonly TaskType[];

export const OUTREACH_TASK_TYPES = [
  "linkedin_message",
  "connection_request",
  "recruiter_email",
  "outreach_follow_up",
  "custom",
] as const satisfies readonly TaskType[];

export const TASK_OUTREACH_CHANNELS = ["linkedin", "email", "phone", "other"] as const;
export type TaskOutreachChannel = (typeof TASK_OUTREACH_CHANNELS)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["pending", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const AI_GENERATION_TYPES = [
  "match_score",
  "missing_skills",
  "tailored_resume",
  "cover_letter",
  "interview_questions",
] as const;
export type AiGenerationType = (typeof AI_GENERATION_TYPES)[number];

export interface Job {
  id: string;
  user_id: string;
  /** Permanent, system-generated identifier like "MS-SE-001" — set once at creation, never edited. */
  job_code: string | null;
  company_name: string;
  position: string;
  platform: JobPlatform;
  platform_other: string | null;
  job_description: string;
  job_url: string | null;
  location: string | null;
  work_mode: WorkMode | null;
  salary: string | null;
  /** Company logo, in priority order: uploaded > manual URL > auto-fetched. */
  logo_uploaded_url: string | null;
  logo_url: string | null;
  logo_auto_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  contact_linkedin: string | null;
  application_deadline: string | null;
  reminder_date: string | null;
  reminder_time: string | null;
  status: JobStatus;
  resume_document_id: string | null;
  cover_letter_document_id: string | null;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  applied_at: string | null;
}

export interface Document {
  id: string;
  user_id: string;
  job_id: string | null;
  type: DocumentType;
  file_url: string | null;
  file_name: string | null;
  latex_source: string | null;
  version: number;
  ats_score: number | null;
  source_master_resume_id: string | null;
  is_active_master: boolean;
  created_at: string;
}

export interface Interview {
  id: string;
  job_id: string;
  round_type: InterviewRoundType;
  scheduled_at: string | null;
  mode: InterviewMode;
  meeting_link_or_address: string | null;
  interviewer_name: string | null;
  interviewer_email: string | null;
  duration_minutes: number | null;
  location: string | null;
  prep_notes: string | null;
  reminder_date: string | null;
  reminder_time: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  job_id: string | null;
  outreach_id: string | null;
  interview_id: string | null;
  category: TaskCategory;
  title: string;
  type: TaskType;
  due_date: string | null;
  reminder_time: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string | null;
  contact_name: string | null;
  contact_company: string | null;
  outreach_channel: TaskOutreachChannel | null;
  reminder_sent_at: string | null;
  is_auto_job_reminder: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  timezone: string;
  timezone_auto_detect: boolean;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  notify_task_reminders: boolean;
  notify_application_followups: boolean;
  notify_interview_reminders: boolean;
  notify_saved_job_deadlines: boolean;
  notify_outreach_reminders: boolean;
  notify_general_emails: boolean;
  preferred_job_titles: string[] | null;
  preferred_locations: string[] | null;
  preferred_work_modes: WorkMode[] | null;
  preferred_salary_range: string | null;
  preferred_platforms: JobPlatform[] | null;
  default_resume_latex: string | null;
  ai_content_style: string | null;
  ai_resume_notes: string | null;
  reminder_email: string | null;
  default_reminder_time: string;
  created_at: string;
}

export interface AiGeneration {
  id: string;
  job_id: string;
  type: AiGenerationType;
  input_snapshot: unknown;
  output: unknown;
  created_at: string;
}

export interface JobStatusHistoryEntry {
  id: string;
  job_id: string;
  status: JobStatus;
  changed_at: string;
}

// ---------------------------------------------------------------------
// Outreach — LinkedIn/recruiter/referral outreach, tracked separately
// from the jobs application pipeline (supabase/migrations/20260927000000_add_outreach.sql).
// ---------------------------------------------------------------------

export const OUTREACH_PERSON_TYPES = ["hr", "recruiter", "other"] as const;
export type OutreachPersonType = (typeof OUTREACH_PERSON_TYPES)[number];

export const OUTREACH_TYPES = [
  "referral_request",
  "job_inquiry",
  "hr_contact",
  "networking",
  "other",
] as const;
export type OutreachType = (typeof OUTREACH_TYPES)[number];

export const OUTREACH_STATUSES = ["sent", "seen", "replied", "no_response"] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_FOLLOWUP_STATUSES = ["pending", "sent", "completed"] as const;
export type OutreachFollowupStatus = (typeof OUTREACH_FOLLOWUP_STATUSES)[number];

export interface Outreach {
  id: string;
  user_id: string;
  person_name: string;
  linkedin_url: string;
  person_type: OutreachPersonType;
  person_type_other: string | null;
  company_name: string;
  company_location: string | null;
  current_position: string | null;
  email: string | null;
  phone_number: string | null;
  outreach_type: OutreachType;
  message_sent: string;
  date_sent: string;
  status: OutreachStatus;
  response_date: string | null;
  response_notes: string | null;
  follow_up_date: string | null;
  follow_up_time: string | null;
  follow_up_status: OutreachFollowupStatus | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}
