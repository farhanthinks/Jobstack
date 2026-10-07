"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  Database,
  Info,
  Mail,
  Palette,
  Plug,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { ProfileSection } from "@/components/settings/profile-section";
import { AccountSection } from "@/components/settings/account-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { JobPreferencesSection } from "@/components/settings/job-preferences-section";
import { AiPreferencesSection } from "@/components/settings/ai-preferences-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { RemindersSection } from "@/components/settings/reminders-section";
import { PrivacySection } from "@/components/settings/privacy-section";
import { ConnectionsSection } from "@/components/settings/connections-section";
import { AboutSection } from "@/components/settings/about-section";

export type SettingsSection =
  | "profile"
  | "account"
  | "notifications"
  | "job-preferences"
  | "ai-preferences"
  | "appearance"
  | "reminders"
  | "privacy"
  | "connections"
  | "about";

type Account = {
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  fullName: string;
  avatarUrl: string | null;
};

const NAV: { id: SettingsSection; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account & Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "job-preferences", label: "Job Search Preferences", icon: Briefcase },
  { id: "ai-preferences", label: "AI Preferences", icon: Sparkles },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "reminders", label: "Email & Reminders", icon: Mail },
  { id: "privacy", label: "Data & Privacy", icon: Database },
  { id: "connections", label: "Connected Services", icon: Plug },
  { id: "about", label: "About", icon: Info },
];

export function SettingsShell({
  activeSection,
  profile,
  account,
  resendConfigured,
  groqConfigured,
}: {
  activeSection: SettingsSection;
  profile: Profile;
  account: Account;
  resendConfigured: boolean;
  groqConfigured: boolean;
}) {
  return (
    <div className="grid flex-1 gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {NAV.map((item) => {
          const isActive = item.id === activeSection;
          return (
            <Link
              key={item.id}
              href={`/settings?section=${item.id}`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0 rounded-xl border bg-card p-5">
        {activeSection === "profile" && <ProfileSection profile={profile} account={account} />}
        {activeSection === "account" && <AccountSection account={account} />}
        {activeSection === "notifications" && <NotificationsSection profile={profile} />}
        {activeSection === "job-preferences" && <JobPreferencesSection profile={profile} />}
        {activeSection === "ai-preferences" && <AiPreferencesSection profile={profile} />}
        {activeSection === "appearance" && <AppearanceSection />}
        {activeSection === "reminders" && <RemindersSection profile={profile} account={account} />}
        {activeSection === "privacy" && <PrivacySection />}
        {activeSection === "connections" && (
          <ConnectionsSection resendConfigured={resendConfigured} groqConfigured={groqConfigured} />
        )}
        {activeSection === "about" && <AboutSection />}
      </div>
    </div>
  );
}
