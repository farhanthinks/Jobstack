import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";

import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { buildTaskReminderEmail } from "@/lib/email/task-reminder-email";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import type { Task } from "@/types/database";

const DEFAULT_REMINDER_TIME = "10:00:00";

type NotificationPrefs = {
  timezone: string;
  defaultReminderTime: string;
  reminderEmail: string | null;
  notifyGeneralEmails: boolean;
  notifyTaskReminders: boolean;
  notifyApplicationFollowups: boolean;
  notifyInterviewReminders: boolean;
  notifySavedJobDeadlines: boolean;
  notifyOutreachReminders: boolean;
};

const DEFAULT_PREFS: Omit<NotificationPrefs, "timezone"> = {
  defaultReminderTime: DEFAULT_REMINDER_TIME,
  reminderEmail: null,
  notifyGeneralEmails: true,
  notifyTaskReminders: true,
  notifyApplicationFollowups: true,
  notifyInterviewReminders: true,
  notifySavedJobDeadlines: true,
  notifyOutreachReminders: true,
};

/**
 * Maps a task onto the Settings → Notifications toggle that governs it. The
 * task model doesn't carve cleanly into the 5 categories Settings exposes,
 * so this is a best-effort mapping, not a perfect one: interview prep tasks
 * gate on "Interview reminders", deadline tasks on "Saved Job deadlines",
 * outreach-category tasks on "Outreach reminders", the application-side
 * follow-up/status-check/document-submission types on "Application
 * follow-ups", and everything else (custom tasks) on the general "Task
 * reminders" toggle.
 */
function notificationKeyFor(task: Pick<Task, "category" | "type">): keyof NotificationPrefs {
  if (task.type === "interview_prep") return "notifyInterviewReminders";
  if (task.type === "deadline") return "notifySavedJobDeadlines";
  if (task.category === "outreach") return "notifyOutreachReminders";
  if (["follow_up", "status_check", "document_submission"].includes(task.type)) {
    return "notifyApplicationFollowups";
  }
  return "notifyTaskReminders";
}

type CandidateTask = Task & {
  jobs: { company_name: string; position: string } | null;
};

export interface ReminderRunSummary {
  checked: number;
  sent: number;
  muted: number;
  failed: number;
  errors: string[];
}

/**
 * Finds every pending task whose reminder (explicit `reminder_time`, or
 * 10:00 AM on `due_date` otherwise) has come due in the task owner's own
 * timezone, emails them via Resend, and marks each as sent — all in one
 * pass. Safe to call repeatedly: `reminder_sent_at` prevents duplicates,
 * and a task only re-enters the pool if its due date/time actually changes
 * (see `updateTask` in `src/lib/actions/tasks.ts`, which resets it).
 */
export async function sendDueTaskReminders(): Promise<ReminderRunSummary> {
  const supabase = createAdminClient();
  const now = new Date();

  // A reminder's local wall-clock instant can fall on the UTC calendar day
  // before or after `due_date`, so widen the SQL scan rather than trying to
  // match the exact instant there — the precise check happens below, per
  // task, in that task owner's own timezone.
  const windowStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const { data: candidates, error } = await supabase
    .from("tasks")
    .select("*, jobs(company_name, position)")
    .eq("status", "pending")
    .is("reminder_sent_at", null)
    .not("due_date", "is", null)
    .gte("due_date", windowStart.toISOString().slice(0, 10))
    .lte("due_date", windowEnd.toISOString().slice(0, 10));

  if (error) {
    return { checked: 0, sent: 0, muted: 0, failed: 0, errors: [error.message] };
  }

  const tasks = (candidates ?? []) as CandidateTask[];
  if (tasks.length === 0) {
    return { checked: 0, sent: 0, muted: 0, failed: 0, errors: [] };
  }

  const userIds = [...new Set(tasks.map((t) => t.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, timezone, default_reminder_time, reminder_email, notify_general_emails, notify_task_reminders, notify_application_followups, notify_interview_reminders, notify_saved_job_deadlines, notify_outreach_reminders"
    )
    .in("id", userIds);

  const prefsByUser = new Map<string, NotificationPrefs>(
    userIds.map((id) => [id, { timezone: DEFAULT_TIMEZONE, ...DEFAULT_PREFS }])
  );
  for (const p of profiles ?? []) {
    prefsByUser.set(p.id, {
      timezone: p.timezone,
      defaultReminderTime: p.default_reminder_time ?? DEFAULT_REMINDER_TIME,
      reminderEmail: p.reminder_email,
      notifyGeneralEmails: p.notify_general_emails,
      notifyTaskReminders: p.notify_task_reminders,
      notifyApplicationFollowups: p.notify_application_followups,
      notifyInterviewReminders: p.notify_interview_reminders,
      notifySavedJobDeadlines: p.notify_saved_job_deadlines,
      notifyOutreachReminders: p.notify_outreach_reminders,
    });
  }

  const due = tasks.filter((task) => {
    const prefs = prefsByUser.get(task.user_id);
    const tz = prefs?.timezone ?? DEFAULT_TIMEZONE;
    const time = task.reminder_time
      ? task.reminder_time.slice(0, 8)
      : (prefs?.defaultReminderTime.slice(0, 8) ?? DEFAULT_REMINDER_TIME);
    const instant = fromZonedTime(`${task.due_date}T${time}`, tz);
    return instant.getTime() <= now.getTime();
  });

  let sent = 0;
  let muted = 0;
  let failed = 0;
  const errors: string[] = [];
  const emailByUser = new Map<string, string | null>();

  for (const task of due) {
    const prefs = prefsByUser.get(task.user_id);
    const categoryKey = notificationKeyFor(task);
    if (!prefs?.notifyGeneralEmails || !prefs[categoryKey]) {
      // Muted — don't send, but still mark as handled so it doesn't queue up
      // and fire all at once if the toggle is re-enabled later.
      await supabase
        .from("tasks")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", task.id);
      muted++;
      continue;
    }

    let email = emailByUser.get(task.user_id);
    if (email === undefined) {
      if (prefs.reminderEmail) {
        email = prefs.reminderEmail;
      } else {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          task.user_id
        );
        email = userError ? null : (userData?.user?.email ?? null);
      }
      emailByUser.set(task.user_id, email);
    }

    if (!email) {
      failed++;
      errors.push(`Task ${task.id}: no email on file for this user.`);
      continue;
    }

    const viewTaskUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tasks?id=${task.id}`;
    const { subject, html } = buildTaskReminderEmail({ task, job: task.jobs, viewTaskUrl });

    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject,
      html,
    });

    if (sendError) {
      failed++;
      errors.push(`Task ${task.id}: ${sendError.message}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", task.id);

    if (updateError) {
      failed++;
      errors.push(`Task ${task.id}: email sent but failed to mark as sent — ${updateError.message}`);
      continue;
    }

    sent++;
  }

  if (sent > 0 || muted > 0) {
    // Only meaningful when called from a request-scoped context (the cron
    // route handler); the instrumentation-based background poller invokes
    // this from a bare `setInterval`, where `revalidatePath` throws — the
    // Tasks page is already rendered per-request (it reads the session via
    // cookies) so there's nothing stale to bust in that case anyway.
    try {
      revalidatePath("/tasks");
    } catch {
      // no-op — see above
    }
  }

  return { checked: tasks.length, sent, muted, failed, errors };
}
