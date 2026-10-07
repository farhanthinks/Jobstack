"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateJobCode } from "@/lib/job-code";
import {
  addAppliedJobSchema,
  hrDetailsSchema,
  jobFormSchema,
  type AddAppliedJobInput,
  type HrDetailsInput,
  type JobFormInput,
} from "@/lib/validations/job";
import type { Job, JobStatus } from "@/types/database";

function toRow(input: JobFormInput) {
  return {
    company_name: input.companyName,
    position: input.position,
    platform: input.platform,
    job_description: input.jobDescription,
    job_url: input.jobUrl || null,
    location: input.location || null,
    work_mode: input.workMode || null,
    salary: input.salary || null,
    contact_name: input.contactName || null,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    contact_linkedin: input.contactLinkedin || null,
    application_deadline: input.applicationDeadline
      ? input.applicationDeadline.toISOString().slice(0, 10)
      : null,
    reminder_date: input.reminderDate ? input.reminderDate.toISOString().slice(0, 10) : null,
    reminder_time: input.reminderTime || null,
  };
}

// Keeps a single auto-generated "Application deadline" task in sync with a
// job's reminder date/time, the same way `syncFollowUpTask` (in
// src/lib/actions/outreach.ts) syncs an Outreach Task — the task is what the
// email-reminder cron (`sendDueTaskReminders`) actually watches, so setting
// a reminder here is all that's needed to get an email at that date/time.
async function syncJobReminderTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  data: {
    position: string;
    companyName: string;
    reminderDate: string | null;
    reminderTime: string | null;
  }
) {
  if (!data.reminderDate) {
    await supabase.from("tasks").delete().eq("job_id", jobId).eq("is_auto_job_reminder", true);
    return;
  }

  const syncedFields = {
    category: "application" as const,
    type: "deadline" as const,
    title: `Application deadline reminder: ${data.position} at ${data.companyName}`,
    due_date: data.reminderDate,
    reminder_time: data.reminderTime,
    job_id: jobId,
    is_auto_job_reminder: true,
  };

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("job_id", jobId)
    .eq("is_auto_job_reminder", true)
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

export async function createJob(
  input: JobFormInput
): Promise<{ data: Job | null; error: string | null }> {
  const parsed = jobFormSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not signed in." };
  }

  const jobCode = await generateJobCode(
    supabase,
    user.id,
    parsed.data.companyName,
    parsed.data.position
  );

  const row = toRow(parsed.data);
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...row, ...(jobCode ? { job_code: jobCode } : {}) })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await syncJobReminderTask(supabase, data.id, {
    position: parsed.data.position,
    companyName: parsed.data.companyName,
    reminderDate: row.reminder_date,
    reminderTime: row.reminder_time,
  });

  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { data, error: null };
}

export async function updateJob(
  id: string,
  input: JobFormInput
): Promise<{ data: Job | null; error: string | null }> {
  const parsed = jobFormSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const row = toRow(parsed.data);
  const { data, error } = await supabase
    .from("jobs")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await syncJobReminderTask(supabase, id, {
    position: parsed.data.position,
    companyName: parsed.data.companyName,
    reminderDate: row.reminder_date,
    reminderTime: row.reminder_time,
  });

  revalidatePath("/applications");
  revalidatePath("/applications/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { data, error: null };
}

export async function updateHrDetails(
  id: string,
  input: HrDetailsInput
): Promise<{ error: string | null }> {
  const parsed = hrDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      contact_name: parsed.data.contactName || null,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone || null,
      contact_linkedin: parsed.data.contactLinkedin || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications");
  revalidatePath("/applications/[id]", "page");
  revalidatePath("/saved-jobs");
  return { error: null };
}

export async function updateJobStatus(
  id: string,
  status: JobStatus
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications");
  revalidatePath("/applications/[id]", "page");
  revalidatePath("/saved-jobs");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteJob(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function markAsApplied({
  jobId,
  appliedDate,
  resumeDocumentId,
}: {
  jobId: string;
  appliedDate: Date;
  resumeDocumentId: string | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "applied" as const,
      applied_at: appliedDate.toISOString(),
      resume_document_id: resumeDocumentId,
    })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/saved-jobs");
  revalidatePath("/applications");
  revalidatePath("/applications/[id]", "page");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function createAppliedJob(
  input: AddAppliedJobInput
): Promise<{ error: string | null }> {
  const parsed = addAppliedJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const jobCode = await generateJobCode(
    supabase,
    user.id,
    parsed.data.companyName,
    parsed.data.position
  );

  const { error } = await supabase.from("jobs").insert({
    company_name: parsed.data.companyName,
    position: parsed.data.position,
    platform: parsed.data.platform,
    ...(jobCode ? { job_code: jobCode } : {}),
    ...(parsed.data.platform === "Other"
      ? { platform_other: parsed.data.platformOther?.trim() || null }
      : {}),
    job_description: parsed.data.jobDescription || "",
    job_url: parsed.data.jobUrl || null,
    location: parsed.data.location || null,
    salary: parsed.data.salary || null,
    contact_email: parsed.data.contactEmail || null,
    contact_phone: parsed.data.contactPhone || null,
    ...(parsed.data.contactName ? { contact_name: parsed.data.contactName } : {}),
    ...(parsed.data.contactLinkedin ? { contact_linkedin: parsed.data.contactLinkedin } : {}),
    status: "applied" as const,
    applied_at: parsed.data.applicationDate.toISOString(),
    resume_document_id: parsed.data.resumeId === "none" ? null : parsed.data.resumeId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getMasterResumeOption(): Promise<{ id: string; label: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, file_name")
    .is("job_id", null)
    .eq("type", "master_resume")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? { id: data.id, label: `Master resume — ${data.file_name}` } : null;
}

export async function getResumeOptionsForJob(
  jobId: string
): Promise<{ id: string; label: string }[]> {
  const supabase = await createClient();

  const [{ data: masterResume }, { data: tailored }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, file_name")
      .is("job_id", null)
      .eq("type", "master_resume")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("id, file_name")
      .eq("job_id", jobId)
      .eq("type", "tailored_resume")
      .order("created_at", { ascending: false }),
  ]);

  const options: { id: string; label: string }[] = [];
  if (masterResume) {
    options.push({ id: masterResume.id, label: `Master resume — ${masterResume.file_name}` });
  }
  for (const doc of tailored ?? []) {
    options.push({ id: doc.id, label: `${doc.file_name} (tailored)` });
  }
  return options;
}

