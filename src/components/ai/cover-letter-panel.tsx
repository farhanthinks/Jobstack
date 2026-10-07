"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { generateCoverLetter, saveGeneratedDocument } from "@/lib/actions/ai";
import type { CoverLetterResult } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CoverLetterPanel({
  jobId,
  resumeText,
  initial,
}: {
  jobId: string;
  resumeText: string;
  initial: CoverLetterResult | null;
}) {
  const router = useRouter();
  const [text, setText] = React.useState(initial?.coverLetter ?? "");
  const [hasResult, setHasResult] = React.useState(!!initial);
  const [isPending, startTransition] = React.useTransition();
  const [isSaving, startSaving] = React.useTransition();
  const ready = !!resumeText.trim();

  function handleGenerate() {
    startTransition(async () => {
      const { data, error } = await generateCoverLetter(jobId, resumeText);
      if (error) {
        toast.error(error);
        return;
      }
      setText(data?.coverLetter ?? "");
      setHasResult(true);
    });
  }

  function handleSave() {
    startSaving(async () => {
      const { error } = await saveGeneratedDocument({
        jobId,
        type: "cover_letter",
        fileName: `cover-letter-${Date.now()}.txt`,
        content: text,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Saved to Documents — select it on this job's page to use it.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Cover Letter Generator</h3>
          <p className="text-sm text-muted-foreground">
            Edit freely before saving — nothing is saved automatically.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={!ready || isPending} size="sm">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {hasResult ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {!hasResult ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No cover letter yet — click Generate.
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={isSaving || !text.trim()}>
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save to Documents
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
