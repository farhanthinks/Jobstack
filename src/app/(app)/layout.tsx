import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { TimezoneSync } from "@/components/timezone-sync";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, timezone_auto_detect")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Account";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <SidebarProvider>
      <TimezoneSync
        currentTimezone={profile?.timezone ?? DEFAULT_TIMEZONE}
        autoDetect={profile?.timezone_auto_detect ?? true}
      />
      <AppSidebar />
      <SidebarInset>
        <TopBar user={{ name, email: user.email ?? "", avatarUrl }} />
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
