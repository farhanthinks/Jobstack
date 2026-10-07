"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { generateMissingSkills } from "@/lib/actions/ai";
import type { MissingSkillsResult } from "@/types/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MissingSkillsPanel({
  jobId,
  resumeText,
  initial,
}: {
  jobId: string;
  resumeText: string;
  initial: MissingSkillsResult | null;
}) {
  const [result, setResult] = React.useState(initial);
  const [isPending, startTransition] = React.useTransition();
  const ready = !!resumeText.trim();

  function handleGenerate() {
    startTransition(async () => {
      const { data, error } = await generateMissingSkills(jobId, resumeText);
      if (error) {
        toast.error(error);
        return;
      }
      setResult(data);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Missing Skills &amp; Keywords</h3>
          <p className="text-sm text-muted-foreground">
            ATS keyword gaps between the JD and your resume.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={!ready || isPending} size="sm">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {result ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {!result ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No analysis yet — click Generate.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Already covered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.matchedSkills.map((skill) => (
                <Badge key={skill} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {result.missingSkills.map((skill) => (
                <Badge key={skill} variant="destructive" className="bg-destructive/10 text-destructive">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
