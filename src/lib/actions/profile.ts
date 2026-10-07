"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  AiPreferencesInput,
  JobSearchPreferencesInput,
  NotificationPreferencesInput,
  ProfileDetailsInput,
  ReminderSettingsInput,
} from "@/lib/validations/settings";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Stores the browser-detected IANA timezone for the signed-in user so
 * reminder emails can resolve "10:00 AM on the due date" to the correct UTC
 * instant. No-op if the value hasn't changed.
 */
export async function syncTimezone(timezone: string): Promise<{ error: string | null }> {
  if (!timezone) return { error: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, timezone }, { onConflict: "id" });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function updateProfileDetails(
  input: ProfileDetailsInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: input.fullName },
  });
  if (authError) return { error: authError.message };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      phone: input.phone || null,
      location: input.location || null,
      linkedin_url: input.linkedinUrl || null,
      portfolio_url: input.portfolioUrl || null,
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: "Choose an image to upload." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { url: null, error: "Image is too large (4MB max)." };
  }
  if (file.type && !ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { url: null, error: "Use a PNG, JPEG, or WebP image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Not signed in." };

  const path = `${user.id}/avatar-${randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) return { url: null, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);

  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });
  if (authError) {
    await supabase.storage.from("logos").remove([path]);
    return { url: null, error: authError.message };
  }

  revalidatePath("/settings");
  return { url: publicUrl, error: null };
}

export async function updateNotificationPreferences(
  input: NotificationPreferencesInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      notify_task_reminders: input.notifyTaskReminders,
      notify_application_followups: input.notifyApplicationFollowups,
      notify_interview_reminders: input.notifyInterviewReminders,
      notify_saved_job_deadlines: input.notifySavedJobDeadlines,
      notify_outreach_reminders: input.notifyOutreachReminders,
      notify_general_emails: input.notifyGeneralEmails,
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateJobSearchPreferences(
  input: JobSearchPreferencesInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      preferred_job_titles: input.preferredJobTitles?.length ? input.preferredJobTitles : null,
      preferred_locations: input.preferredLocations?.length ? input.preferredLocations : null,
      preferred_work_modes: input.preferredWorkModes?.length ? input.preferredWorkModes : null,
      preferred_salary_range: input.preferredSalaryRange || null,
      preferred_platforms: input.preferredPlatforms?.length ? input.preferredPlatforms : null,
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateAiPreferences(
  input: AiPreferencesInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      default_resume_latex: input.defaultResumeLatex || null,
      ai_content_style: input.aiContentStyle || null,
      ai_resume_notes: input.aiResumeNotes || null,
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/ai-assistant");
  return { error: null };
}

export async function updateReminderSettings(
  input: ReminderSettingsInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      reminder_email: input.reminderEmail || null,
      default_reminder_time: input.defaultReminderTime,
      timezone: input.timezone,
      // A manual edit here should stick — otherwise the next page load's
      // browser-based auto-detect (src/components/timezone-sync.tsx) would
      // silently revert it.
      timezone_auto_detect: false,
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}
