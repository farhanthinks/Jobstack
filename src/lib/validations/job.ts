import { z } from "zod";
import { startOfDay } from "date-fns";
import { JOB_PLATFORMS, WORK_MODES } from "@/types/database";

export const jobFormSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required."),
    position: z.string().min(1, "Position is required."),
    platform: z.enum(JOB_PLATFORMS),
    jobDescription: z.string().min(1, "Paste the job description."),
    jobUrl: z.union([z.url("Enter a valid URL."), z.literal("")]).optional(),
    location: z.string().optional(),
    workMode: z.enum(WORK_MODES).optional(),
    salary: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z
      .union([z.email("Enter a valid email address."), z.literal("")])
      .optional(),
    contactPhone: z.string().optional(),
    contactLinkedin: z.union([z.url("Enter a valid URL."), z.literal("")]).optional(),
    applicationDeadline: z.date().optional(),
    reminderDate: z.date().optional(),
    reminderTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reminderDate && data.applicationDeadline) {
      const reminder = startOfDay(data.reminderDate).getTime();
      const deadline = startOfDay(data.applicationDeadline).getTime();
      if (reminder > deadline) {
        ctx.addIssue({
          code: "custom",
          message: "Reminder date must be on or before the application deadline.",
          path: ["reminderDate"],
        });
      }
    }
  });

export type JobFormInput = z.infer<typeof jobFormSchema>;

export const hrDetailsSchema = z.object({
  contactName: z.string().optional(),
  contactEmail: z
    .union([z.email("Enter a valid email address."), z.literal("")])
    .optional(),
  contactPhone: z.string().optional(),
  contactLinkedin: z.union([z.url("Enter a valid URL."), z.literal("")]).optional(),
});

export type HrDetailsInput = z.infer<typeof hrDetailsSchema>;

// Platform fields are validated in their own sub-schema (joined via `.and()`
// below) so the "Platform Name" requiredness check still surfaces even when
// other required fields (applicationDate, resumeId) are simultaneously
// unfilled — a top-level `.refine()`/`.superRefine()` on the whole object
// gets skipped once any sibling field fails its base type check.
const platformFieldsSchema = z
  .object({
    platform: z.enum(JOB_PLATFORMS, { error: "Select a platform." }),
    platformOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.platform === "Other" && !data.platformOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a platform name.",
        path: ["platformOther"],
      });
    }
  });

export const addAppliedJobSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required."),
    position: z.string().min(1, "Position is required."),
    jobUrl: z.union([z.url("Enter a valid URL."), z.literal("")]).optional(),
    location: z.string().optional(),
    salary: z.string().optional(),
    contactEmail: z
      .union([z.email("Enter a valid email address."), z.literal("")])
      .optional(),
    contactPhone: z.string().optional(),
    contactName: z.string().optional(),
    contactLinkedin: z.union([z.url("Enter a valid URL."), z.literal("")]).optional(),
    jobDescription: z.string().optional(),
    applicationDate: z.date({ error: "Application date is required." }),
    resumeId: z
      .string({ error: "Select a resume, or choose None." })
      .min(1, "Select a resume, or choose None."),
  })
  .and(platformFieldsSchema);

export type AddAppliedJobInput = z.infer<typeof addAppliedJobSchema>;
