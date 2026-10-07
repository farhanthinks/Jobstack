"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { updateAiPreferences } from "@/lib/actions/profile";
import { AI_CONTENT_STYLES } from "@/lib/validations/settings";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STYLE_LABELS: Record<(typeof AI_CONTENT_STYLES)[number], string> = {
  concise: "Concise",
  detailed: "Detailed",
  formal: "Formal",
  conversational: "Conversational",
};

export function AiPreferencesSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [defaultResumeLatex, setDefaultResumeLatex] = React.useState(profile.default_resume_latex ?? "");
  const [aiContentStyle, setAiContentStyle] = React.useState(profile.ai_content_style ?? "");
  const [aiResumeNotes, setAiResumeNotes] = React.useState(profile.ai_resume_notes ?? "");

  function handleSave() {
    startTransition(async () => {
      const { error } = await updateAiPreferences({
        defaultResumeLatex,
        aiContentStyle: (aiContentStyle || undefined) as (typeof AI_CONTENT_STYLES)[number] | undefined,
        aiResumeNotes,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("AI preferences saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">AI Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Tune how the AI Assistant generates content for you.
        </p>
      </div>

      <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
        <p>
          The AI only ever uses information you&apos;ve actually given it — your
          pasted resume, the job description, and these preferences. It never
          invents experience, skills, companies, education, or achievements.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="defaultResumeLatex">Default Master Resume</FieldLabel>
          <Textarea
            id="defaultResumeLatex"
            rows={8}
            placeholder="Paste your LaTeX resume here…"
            value={defaultResumeLatex}
            onChange={(e) => setDefaultResumeLatex(e.target.value)}
            className="field-sizing-fixed resize-none overflow-y-auto font-mono text-xs"
          />
          <FieldDescription>
            Not stored as a document — this just pre-fills the AI
            Assistant&apos;s resume box the first time you open it on a new
            browser or device. Nothing changes if you&apos;ve already pasted a
            resume there.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="aiContentStyle">AI content style</FieldLabel>
          <Select value={aiContentStyle || "none"} onValueChange={(v) => setAiContentStyle(v === "none" ? "" : v)}>
            <SelectTrigger id="aiContentStyle" className="w-full sm:w-64">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              {AI_CONTENT_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {STYLE_LABELS[style]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Tone applied to cover letters and interview prep.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="aiResumeNotes">Resume optimization preferences</FieldLabel>
          <Textarea
            id="aiResumeNotes"
            rows={3}
            placeholder="e.g. Emphasize leadership experience, keep bullets under two lines…"
            value={aiResumeNotes}
            onChange={(e) => setAiResumeNotes(e.target.value)}
          />
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
