/**
 * Runs once when the Next.js server process starts. In any environment
 * where the process actually stays alive (`next dev`, `next start` on a
 * persistent server) this keeps task/job reminders firing on their own, so
 * nobody has to remember to hit /api/cron/task-reminders by hand.
 *
 * Skipped on Vercel (`process.env.VERCEL` is set there): serverless
 * functions don't stay running between requests, so a `setInterval` there
 * would just restart on every cold start rather than running on a real
 * schedule — that's what the `vercel.json` cron entry is for instead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VERCEL) {
    return;
  }

  const CHECK_INTERVAL_MS = 60_000;
  const { sendDueTaskReminders } = await import("@/lib/reminders");

  async function tick() {
    try {
      const summary = await sendDueTaskReminders();
      if (summary.sent > 0 || summary.failed > 0) {
        console.log("[reminders]", summary);
      }
    } catch (err) {
      console.error("[reminders] check failed:", err);
    }
  }

  tick();
  setInterval(tick, CHECK_INTERVAL_MS);
}
