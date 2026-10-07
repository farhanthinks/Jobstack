import { NextRequest, NextResponse } from "next/server";
import { sendDueTaskReminders } from "@/lib/reminders";

function isAuthorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${expected}`) return true;

  const queryToken = req.nextUrl.searchParams.get("secret");
  return queryToken === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await sendDueTaskReminders();
  return NextResponse.json(summary);
}
