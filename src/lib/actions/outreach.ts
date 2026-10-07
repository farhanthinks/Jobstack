"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  outreachSchema,
  responseDetailsSchema,
  type OutreachInput,
  type ResponseDetailsInput,
} from "@/lib/validations/outreach";
import type { OutreachStatus } from "@/types/database";

// Uses local date components rather than `toISOString().slice(0, 10)` —
// the ISO string is UTC, which silently shifts the date back a day for any
// timezone ahead of UTC during its early morning hours (e.g. picking "today"
// at 12:30am IST would otherwise save as "yesterday").
function toDateString(date: Date | undefined) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toRow(input: OutreachInput) {
  return {
    person_name: input.personName,
    linkedin_url: input.linkedinUrl,
    person_type: input.personType,
    person_type_other:
      input.personType === "other" ? input.personTypeOther?.trim() || null : null,
    company_name: input.companyName,
    current_position: input.currentPosition || null,
    ...(input.companyLocation ? { company_location: input.companyLocation.trim() } : {}),
    ...(input.email ? { email: input.email.trim() } : {}),
    ...(input.phoneNumber ? { phone_number: input.phoneNumber.trim() } : {}),
    outreach_type: input.outreachType || "other",
    message_sent: input.messageSent,
    date_sent: toDateString(input.dateSent),
    status: input.status || "sent",
    response_date: toDateString(input.responseDate),
    response_notes: input.responseNotes || null,
    follow_up_date: toDateString(input.followUpDate),
    follow_up_time: input.followUpTime || null,
    follow_up_status: input.followUpStatus || null,
    notes: input.notes || null,
    tags: input.tags
      ? input.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null,
  };
}

// Keeps a single auto-generated Outreach Task in sync with an outreach
// record's follow-up date/time: creates it the first time a follow-up date
// is set, updates the same row (matched via `tasks.outreach_id`) on later
// edits instead of inserting a duplicate, and removes it if the follow-up
// date is cleared. `tasks.outreach_id` has `on delete cascade`, so deleting
// the outreach record itself cleans up the task without extra code here.
async function syncFollowUpTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  outreachId: string,
  data: {
    personName: string;
    companyName: string;
    followUpDate: string | null;
    followUpTime: string | null;
  }
) {
  if (!data.followUpDate) {
    await supabase.from("tasks").delete().eq("outreach_id", outreachId);
    return;
  }

  const syncedFields = {
    category: "outreach" as const,
    type: "outreach_follow_up" as const,
    title: `Follow up with ${data.personName} at ${data.companyName}`,
    due_date: data.followUpDate,
    reminder_time: data.followUpTime,
    contact_name: data.personName,
    contact_company: data.companyName,
    outreach_id: outreachId,
  };

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("outreach_id", outreachId)
    .maybeSingle();

  if (existing) {
    await supabase.from("tasks").update(syncedFields).eq("id", existing.id);
  } else {
    await supabase.from("tasks").insert({
      ...syncedFields,
      priority: "medium" as const,
      status: "pending" as const,
      outreach_channel: "linkedin" as const,
    });
  }
}

export async function createOutreach(
  input: OutreachInput
): Promise<{ error: string | null }> {
  const parsed = outreachSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outreach")
    .insert(toRow(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await syncFollowUpTask(supabase, data.id, {
    personName: parsed.data.personName,
    companyName: parsed.data.companyName,
    followUpDate: toDateString(parsed.data.followUpDate),
    followUpTime: parsed.data.followUpTime || null,
  });

  revalidatePath("/outreach");
  revalidatePath("/tasks");
  return { error: null };
}

export async function updateOutreach(
  id: string,
  input: OutreachInput
): Promise<{ error: string | null }> {
  const parsed = outreachSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("outreach").update(toRow(parsed.data)).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await syncFollowUpTask(supabase, id, {
    personName: parsed.data.personName,
    companyName: parsed.data.companyName,
    followUpDate: toDateString(parsed.data.followUpDate),
    followUpTime: parsed.data.followUpTime || null,
  });

  revalidatePath("/outreach");
  revalidatePath("/tasks");
  return { error: null };
}

export async function updateOutreachStatus(
  id: string,
  status: OutreachStatus
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("outreach").update({ status }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/outreach");
  return { error: null };
}

export async function updateOutreachResponse(
  id: string,
  input: ResponseDetailsInput
): Promise<{ error: string | null }> {
  const parsed = responseDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach")
    .update({
      response_date: toDateString(parsed.data.responseDate),
      response_notes: parsed.data.responseNotes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/outreach");
  return { error: null };
}

export async function deleteOutreach(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("outreach").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/outreach");
  revalidatePath("/tasks");
  return { error: null };
}
