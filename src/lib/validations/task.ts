import { z } from "zod";
import { TASK_CATEGORIES, TASK_OUTREACH_CHANNELS, TASK_PRIORITIES, TASK_TYPES } from "@/types/database";

export const taskFormSchema = z.object({
  category: z.enum(TASK_CATEGORIES),
  title: z.string().min(1, "Title is required."),
  type: z.enum(TASK_TYPES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.date().optional(),
  reminderTime: z.string().optional(),
  jobId: z.string().optional(),
  contactName: z.string().optional(),
  contactCompany: z.string().optional(),
  outreachChannel: z.enum(TASK_OUTREACH_CHANNELS).optional(),
  notes: z.string().optional(),
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;
