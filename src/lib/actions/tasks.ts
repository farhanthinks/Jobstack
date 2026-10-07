"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskFormSchema, type TaskFormInput } from "@/lib/validations/task";
import type { Task, TaskStatus } from "@/types/database";

function toRow(input: TaskFormInput) {
  const isApplication = input.category === "application";
  return {
    category: input.category,
    title: input.title,
    type: input.type,
    priority: input.priority,
    due_date: input.dueDate ? input.dueDate.toISOString().slice(0, 10) : null,
    reminder_time: input.reminderTime || null,
    notes: input.notes?.trim() || null,
    job_id: isApplication ? input.jobId || null : null,
    contact_name: isApplication ? null : input.contactName || null,
    contact_company: isApplication ? null : input.contactCompany || null,
    outreach_channel: isApplication ? null : input.outreachChannel || null,
  };
}

function revalidateTaskPaths(jobId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (jobId) revalidatePath("/applications/[id]", "page");
}

export async function createTask(
  input: TaskFormInput
): Promise<{ data: Task | null; error: string | null }> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(toRow(parsed.data))
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidateTaskPaths(parsed.data.jobId);
  return { data, error: null };
}

export async function updateTask(
  id: string,
  input: TaskFormInput
): Promise<{ data: Task | null; error: string | null }> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const row = toRow(parsed.data);

  // If the due date or reminder time actually changed, the task's email
  // reminder (if any was already sent) is now stale — clear the "sent"
  // marker so it's eligible to fire again at the new time.
  const { data: existing } = await supabase
    .from("tasks")
    .select("due_date, reminder_time")
    .eq("id", id)
    .maybeSingle();
  const rescheduled =
    !!existing &&
    (existing.due_date !== row.due_date ||
      (existing.reminder_time?.slice(0, 5) ?? null) !== row.reminder_time);

  const { data, error } = await supabase
    .from("tasks")
    .update(rescheduled ? { ...row, reminder_sent_at: null } : row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidateTaskPaths(parsed.data.jobId);
  return { data, error: null };
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
  jobId?: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateTaskPaths(jobId);
  return { error: null };
}

export async function deleteTask(
  id: string,
  jobId?: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateTaskPaths(jobId);
  return { error: null };
}
