import { z } from "zod";
import { JOB_PLATFORMS, WORK_MODES } from "@/types/database";

export const profileDetailsSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
});
export type ProfileDetailsInput = z.infer<typeof profileDetailsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "At least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const notificationPreferencesSchema = z.object({
  notifyTaskReminders: z.boolean(),
  notifyApplicationFollowups: z.boolean(),
  notifyInterviewReminders: z.boolean(),
  notifySavedJobDeadlines: z.boolean(),
  notifyOutreachReminders: z.boolean(),
  notifyGeneralEmails: z.boolean(),
});
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export const jobSearchPreferencesSchema = z.object({
  preferredJobTitles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredWorkModes: z.array(z.enum(WORK_MODES)).optional(),
  preferredSalaryRange: z.string().optional(),
  preferredPlatforms: z.array(z.enum(JOB_PLATFORMS)).optional(),
});
export type JobSearchPreferencesInput = z.infer<typeof jobSearchPreferencesSchema>;

export const AI_CONTENT_STYLES = ["concise", "detailed", "formal", "conversational"] as const;

export const aiPreferencesSchema = z.object({
  defaultResumeLatex: z.string().optional(),
  aiContentStyle: z.enum(AI_CONTENT_STYLES).optional(),
  aiResumeNotes: z.string().optional(),
});
export type AiPreferencesInput = z.infer<typeof aiPreferencesSchema>;

export const reminderSettingsSchema = z.object({
  reminderEmail: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  defaultReminderTime: z.string().min(1, "Pick a default time."),
  timezone: z.string().min(1, "Pick a timezone."),
});
export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;
