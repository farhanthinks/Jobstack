import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SettingsShell, type SettingsSection } from "@/components/settings/settings-shell";
import type { Profile } from "@/types/database";

const DEFAULT_PROFILE: Omit<Profile, "id" | "created_at"> = {
  timezone: "Asia/Kolkata",
  timezone_auto_detect: true,
  phone: null,
  location: null,
  linkedin_url: null,
  portfolio_url: null,
  notify_task_reminders: true,
  notify_application_followups: true,
  notify_interview_reminders: true,
  notify_saved_job_deadlines: true,
  notify_outreach_reminders: true,
  notify_general_emails: true,
  preferred_job_titles: null,
  preferred_locations: null,
  preferred_work_modes: null,
  preferred_salary_range: null,
  preferred_platforms: null,
  default_resume_latex: null,
  ai_content_style: null,
  ai_resume_notes: null,
  reminder_email: null,
  default_reminder_time: "10:00:00",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = profileRow ?? { id: user.id, created_at: user.created_at, ...DEFAULT_PROFILE };

  const name = (user.user_metadata?.full_name as string | undefined) ?? "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Settings" description="Manage your account, preferences, and integrations." />
      <SettingsShell
        activeSection={(section as SettingsSection) ?? "profile"}
        profile={profile}
        account={{
          email: user.email ?? "",
          emailConfirmed: !!user.email_confirmed_at,
          createdAt: user.created_at,
          fullName: name,
          avatarUrl,
        }}
        resendConfigured={!!process.env.RESEND_API_KEY}
        groqConfigured={!!process.env.GROQ_API_KEY}
      />
    </div>
  );
}
