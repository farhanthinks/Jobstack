"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  interviewFormSchema,
  type InterviewFormInput,
} from "@/lib/validations/interview";
import { INTERVIEW_ROUND_TYPE_LABELS } from "@/lib/interview-meta";
import type { Interview } from "@/types/database";

function toScheduledAt(input: InterviewFormInput): string | null {
  if (!input.scheduledAt) return null;
  const date = new Date(input.scheduledAt);
  if (input.scheduledTime) {
    const [hours, minutes] = input.scheduledTime.split(":").map(Number);
    date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  }
  return date.toISOString();
}

function toRow(input: InterviewFormInput) {
  return {
    job_id: input.jobId,
    round_type: input.roundType,
    mode: input.mode,
    scheduled_at: toScheduledAt(input),
    duration_minutes: input.durationMinutes ? parseInt(input.durationMinutes, 10) : null,
    meeting_link_or_address: input.meetingLinkOrAddress || null,
    location: input.mode === "in_person" ? input.location || null : null,
    interviewer_name: input.interviewerName || null,
    interviewer_email: input.interviewerEmail || null,
    prep_notes: input.prepNotes || null,
    reminder_date: input.reminderDate ? input.reminderDate.toISOString().slice(0, 10) : null,
    reminder_time: input.reminderTime || null,
  };
}

function revalidateInterviewPaths() {
  revalidatePath("/interviews");
  revalidatePath("/applications/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

// Keeps a single auto-generated "Interview preparation" task in sync with an
// interview — every interview gets one automatically, not just ones with an
// explicit reminder: if the user leaves Reminder Date/Time blank, it falls
// back to the interview's own scheduled date/time, the same way
// `syncJobReminderTask` (in src/lib/actions/jobs.ts) syncs a job's deadline
// reminder — matched via a dedicated `tasks.interview_id` FK (one task per
// interview, since a job can have several), mirroring `tasks.outreach_id`.
async function syncInterviewReminderTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  interviewId: string,
  data: {
    jobId: string;
    roundType: Interview["round_type"];
    reminderDate: string | null;
    reminderTime: string | null;
    scheduledAt: string | null;
  }
) {
  let dueDate = data.reminderDate;
  let reminderTime = data.reminderTime;

  if (!dueDate && data.scheduledAt) {
    const scheduled = new Date(data.scheduledAt);
    dueDate = scheduled.toISOString().slice(0, 10);
    reminderTime =
      reminderTime ??
      `${String(scheduled.getHours()).padStart(2, "0")}:${String(
        scheduled.getMinutes()
      ).padStart(2, "0")}:00`;
  }

  if (!dueDate) {
    await supabase.from("tasks").delete().eq("interview_id", interviewId);
    return;
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("company_name, position")
    .eq("id", data.jobId)
    .maybeSingle();

  const roundLabel = INTERVIEW_ROUND_TYPE_LABELS[data.roundType];
  const title = job
    ? `${roundLabel} interview reminder: ${job.position} at ${job.company_name}`
    : `${roundLabel} interview reminder`;

  const syncedFields = {
    category: "application" as const,
    type: "interview_prep" as const,
    title,
    due_date: dueDate,
    reminder_time: reminderTime,
    job_id: data.jobId,
    interview_id: interviewId,
  };

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("interview_id", interviewId)
    .maybeSingle();

  if (existing) {
    await supabase.from("tasks").update(syncedFields).eq("id", existing.id);
  } else {
    await supabase.from("tasks").insert({
      ...syncedFields,
      priority: "medium" as const,
      status: "pending" as const,
    });
  }
}

export async function createInterview(
  input: InterviewFormInput
): Promise<{ data: Interview | null; error: string | null }> {
  const parsed = interviewFormSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .insert(toRow(parsed.data))
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await syncInterviewReminderTask(supabase, data.id, {
    jobId: parsed.data.jobId,
    roundType: parsed.data.roundType,
    reminderDate: data.reminder_date,
    reminderTime: data.reminder_time,
    scheduledAt: data.scheduled_at,
  });

  revalidateInterviewPaths();
  return { data, error: null };
}

export async function updateInterview(
  id: string,
  input: InterviewFormInput
): Promise<{ data: Interview | null; error: string | null }> {
  const parsed = interviewFormSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .update(toRow(parsed.data))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await syncInterviewReminderTask(supabase, id, {
    jobId: parsed.data.jobId,
    roundType: parsed.data.roundType,
    reminderDate: data.reminder_date,
    reminderTime: data.reminder_time,
    scheduledAt: data.scheduled_at,
  });

  revalidateInterviewPaths();
  return { data, error: null };
}

export async function deleteInterview(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("interviews").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateInterviewPaths();
  return { error: null };
}
