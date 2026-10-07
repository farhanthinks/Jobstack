"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateJobSearchPreferences } from "@/lib/actions/profile";
import { JOB_PLATFORMS, WORK_MODES, type JobPlatform, type Profile, type WorkMode } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

function toCsv(values: string[] | null) {
  return (values ?? []).join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function JobPreferencesSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [titles, setTitles] = React.useState(toCsv(profile.preferred_job_titles));
  const [locations, setLocations] = React.useState(toCsv(profile.preferred_locations));
  const [salaryRange, setSalaryRange] = React.useState(profile.preferred_salary_range ?? "");
  const [workModes, setWorkModes] = React.useState<WorkMode[]>(profile.preferred_work_modes ?? []);
  const [platforms, setPlatforms] = React.useState<JobPlatform[]>(profile.preferred_platforms ?? []);

  function toggleWorkMode(mode: WorkMode, checked: boolean) {
    setWorkModes((prev) => (checked ? [...prev, mode] : prev.filter((m) => m !== mode)));
  }

  function togglePlatform(platform: JobPlatform, checked: boolean) {
    setPlatforms((prev) => (checked ? [...prev, platform] : prev.filter((p) => p !== platform)));
  }

  function handleSave() {
    startTransition(async () => {
      const { error } = await updateJobSearchPreferences({
        preferredJobTitles: fromCsv(titles),
        preferredLocations: fromCsv(locations),
        preferredWorkModes: workModes,
        preferredSalaryRange: salaryRange,
        preferredPlatforms: platforms,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Job search preferences saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Job Search Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Used later by the Dashboard, Saved Jobs, and AI Assistant to tailor what you see.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="titles">Preferred job titles / roles</FieldLabel>
          <Input
            id="titles"
            placeholder="Frontend Engineer, Product Designer, …"
            value={titles}
            onChange={(e) => setTitles(e.target.value)}
          />
          <FieldDescription>Comma-separated.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="locations">Preferred locations</FieldLabel>
          <Input
            id="locations"
            placeholder="Bangalore, Remote, …"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
          />
          <FieldDescription>Comma-separated.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Work mode</FieldLabel>
          <div className="flex flex-wrap gap-4">
            {WORK_MODES.map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={workModes.includes(mode)}
                  onCheckedChange={(checked) => toggleWorkMode(mode, !!checked)}
                />
                {WORK_MODE_LABELS[mode]}
              </label>
            ))}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="salaryRange">Salary range</FieldLabel>
          <Input
            id="salaryRange"
            placeholder="$90k–$120k"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Preferred job platforms</FieldLabel>
          <div className="flex flex-wrap gap-4">
            {JOB_PLATFORMS.map((platform) => (
              <label key={platform} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={platforms.includes(platform)}
                  onCheckedChange={(checked) => togglePlatform(platform, !!checked)}
                />
                {platform}
              </label>
            ))}
          </div>
        </Field>
      </FieldGroup>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
