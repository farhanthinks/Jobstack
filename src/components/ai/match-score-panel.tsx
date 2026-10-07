"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";

import { generateMatchScore } from "@/lib/actions/ai";
import type { MatchScoreResult } from "@/types/ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 border-emerald-600";
  if (score >= 50) return "text-amber-600 border-amber-600";
  return "text-destructive border-destructive";
}

export function MatchScorePanel({
  jobId,
  resumeText,
  initial,
}: {
  jobId: string;
  resumeText: string;
  initial: MatchScoreResult | null;
}) {
  const router = useRouter();
  const [result, setResult] = React.useState(initial);
  const [isPending, startTransition] = React.useTransition();
  const ready = !!resumeText.trim();

  function handleGenerate() {
    startTransition(async () => {
      const { data, error } = await generateMatchScore(jobId, resumeText);
      if (error) {
        toast.error(error);
        return;
      }
      setResult(data);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Job Match Score</h3>
          <p className="text-sm text-muted-foreground">
            Compares the job description against your pasted resume.
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
          No score yet — click Generate.
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div
            className={cn(
              "flex size-24 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-semibold",
              scoreColor(result.score)
            )}
          >
            {result.score}
          </div>
          <div className="space-y-3">
            <p className="text-sm">{result.reasoning}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Strengths</p>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Gaps</p>
                <ul className="space-y-1">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm">
                      <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
