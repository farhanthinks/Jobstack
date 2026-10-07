import { format } from "date-fns";

import { TASK_TYPE_LABELS } from "@/lib/task-meta";
import { TASK_PRIORITY_META } from "@/lib/task-priority";
import type { Task } from "@/types/database";

const BRAND_BLUE = "#2563eb";
const TEXT_MUTED = "#64748b";
const BORDER = "#e2e8f0";

function formatReminderTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return format(d, "h:mm a");
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};width:140px;color:${TEXT_MUTED};font-size:13px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:#0f172a;font-size:14px;font-weight:500;vertical-align:top;">${value}</td>
    </tr>`;
}

export function buildTaskReminderEmail({
  task,
  job,
  viewTaskUrl,
}: {
  task: Task;
  job: { company_name: string; position: string } | null;
  viewTaskUrl: string;
}): { subject: string; html: string } {
  const isApplication = task.category === "application";
  const relatedLabel = isApplication ? "Application" : "Contact / Company";
  const relatedValue = isApplication
    ? job
      ? `${job.position} · ${job.company_name}`
      : "—"
    : [task.contact_name, task.contact_company].filter(Boolean).join(" · ") || "—";

  const rows = [
    row("Task Type", TASK_TYPE_LABELS[task.type]),
    row("Priority", TASK_PRIORITY_META[task.priority].label),
    row(
      "Due Date",
      task.due_date ? format(new Date(task.due_date), "EEEE, MMM d, yyyy") : "—"
    ),
    row(
      "Reminder Time",
      task.reminder_time ? formatReminderTime(task.reminder_time) : "10:00 AM (default)"
    ),
    row(relatedLabel, relatedValue),
  ].join("");

  const subject = `Reminder: ${task.title}`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
                <span style="font-size:15px;font-weight:700;color:${BRAND_BLUE};letter-spacing:-0.01em;">Jobstack</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_BLUE};">
                  Task Reminder
                </p>
                <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#0f172a;">${task.title}</h1>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${rows}
                </table>

                <div style="margin-top:20px;">
                  <p style="margin:0 0 4px;font-size:13px;color:${TEXT_MUTED};">Notes</p>
                  <p style="margin:0;font-size:14px;color:#0f172a;white-space:pre-wrap;">${task.notes || "No notes added."}</p>
                </div>

                <div style="margin-top:28px;">
                  <a href="${viewTaskUrl}" style="display:inline-block;background-color:${BRAND_BLUE};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;">
                    View Task
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background-color:#f8fafc;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:12px;color:${TEXT_MUTED};">
                  You're receiving this because a task reminder came due in Jobstack.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
