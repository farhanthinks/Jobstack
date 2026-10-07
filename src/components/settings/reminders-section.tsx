"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateReminderSettings } from "@/lib/actions/profile";
import { reminderSettingsSchema, type ReminderSettingsInput } from "@/lib/validations/settings";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

function supportedTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

export function RemindersSection({
  profile,
  account,
}: {
  profile: Profile;
  account: { email: string };
}) {
  const router = useRouter();
  const timezones = React.useMemo(() => supportedTimezones(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReminderSettingsInput>({
    resolver: zodResolver(reminderSettingsSchema),
    defaultValues: {
      reminderEmail: profile.reminder_email ?? "",
      defaultReminderTime: profile.default_reminder_time.slice(0, 5),
      timezone: profile.timezone,
    },
  });

  async function onSubmit(values: ReminderSettingsInput) {
    const { error } = await updateReminderSettings({
      ...values,
      defaultReminderTime: values.defaultReminderTime.length === 5
        ? `${values.defaultReminderTime}:00`
        : values.defaultReminderTime,
    });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Reminder settings saved.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Email &amp; Reminders</h2>
        <p className="text-sm text-muted-foreground">
          Used when a task, interview, outreach follow-up, or saved-job
          deadline reminder doesn&apos;t have a specific time of its own.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="reminderEmail">Reminder email address</FieldLabel>
            <Input
              id="reminderEmail"
              placeholder={account.email}
              aria-invalid={!!errors.reminderEmail}
              {...register("reminderEmail")}
            />
            <FieldError errors={[errors.reminderEmail]} />
            <FieldDescription>Leave blank to use your account email ({account.email}).</FieldDescription>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="defaultReminderTime">Default reminder time</FieldLabel>
              <Input
                id="defaultReminderTime"
                type="time"
                aria-invalid={!!errors.defaultReminderTime}
                {...register("defaultReminderTime")}
              />
              <FieldError errors={[errors.defaultReminderTime]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <Input
                id="timezone"
                list="timezone-options"
                aria-invalid={!!errors.timezone}
                {...register("timezone")}
              />
              <datalist id="timezone-options">
                {timezones.map((tz) => (
                  <option key={tz} value={tz} />
                ))}
              </datalist>
              <FieldError errors={[errors.timezone]} />
            </Field>
          </div>
        </FieldGroup>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
