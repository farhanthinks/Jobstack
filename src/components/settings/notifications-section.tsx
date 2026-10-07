"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateNotificationPreferences } from "@/lib/actions/profile";
import type { NotificationPreferencesInput } from "@/lib/validations/settings";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const TOGGLES: { key: keyof NotificationPreferencesInput; label: string; description: string }[] = [
  {
    key: "notifyTaskReminders",
    label: "Task reminders",
    description: "General task due-date reminders.",
  },
  {
    key: "notifyApplicationFollowups",
    label: "Application follow-up reminders",
    description: "Follow-ups, status checks, and document submissions.",
  },
  {
    key: "notifyInterviewReminders",
    label: "Interview reminders",
    description: "Interview prep tasks for upcoming rounds.",
  },
  {
    key: "notifySavedJobDeadlines",
    label: "Saved job deadline reminders",
    description: "Application deadlines coming up.",
  },
  {
    key: "notifyOutreachReminders",
    label: "Outreach reminders",
    description: "LinkedIn messages, connection requests, recruiter follow-ups.",
  },
];

export function NotificationsSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [values, setValues] = React.useState<NotificationPreferencesInput>({
    notifyTaskReminders: profile.notify_task_reminders,
    notifyApplicationFollowups: profile.notify_application_followups,
    notifyInterviewReminders: profile.notify_interview_reminders,
    notifySavedJobDeadlines: profile.notify_saved_job_deadlines,
    notifyOutreachReminders: profile.notify_outreach_reminders,
    notifyGeneralEmails: profile.notify_general_emails,
  });

  function set(key: keyof NotificationPreferencesInput, value: boolean) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const { error } = await updateNotificationPreferences(values);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Notification preferences saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose which reminder emails you receive.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-medium">General email notifications</p>
          <p className="text-xs text-muted-foreground">
            Master switch — off mutes every reminder email below.
          </p>
        </div>
        <Switch
          checked={values.notifyGeneralEmails}
          onCheckedChange={(checked) => set("notifyGeneralEmails", checked)}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        {TOGGLES.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{toggle.label}</p>
              <p className="text-xs text-muted-foreground">{toggle.description}</p>
            </div>
            <Switch
              checked={values[toggle.key]}
              disabled={!values.notifyGeneralEmails}
              onCheckedChange={(checked) => set(toggle.key, checked)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
