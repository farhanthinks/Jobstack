import { z } from "zod";
import { INTERVIEW_MODES, INTERVIEW_ROUND_TYPES } from "@/types/database";

export const interviewFormSchema = z.object({
  jobId: z.string().min(1, "Select a job."),
  roundType: z.enum(INTERVIEW_ROUND_TYPES),
  mode: z.enum(INTERVIEW_MODES),
  scheduledAt: z.date().optional(),
  scheduledTime: z.string().optional(),
  durationMinutes: z.string().optional(),
  meetingLinkOrAddress: z.string().optional(),
  location: z.string().optional(),
  interviewerName: z.string().optional(),
  interviewerEmail: z
    .union([z.email("Enter a valid email address."), z.literal("")])
    .optional(),
  prepNotes: z.string().optional(),
  reminderDate: z.date().optional(),
  reminderTime: z.string().optional(),
});

export type InterviewFormInput = z.infer<typeof interviewFormSchema>;
