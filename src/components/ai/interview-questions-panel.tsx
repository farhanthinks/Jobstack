"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { generateInterviewQuestions } from "@/lib/actions/ai";
import type { InterviewQuestionsResult } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROUNDS: { key: keyof InterviewQuestionsResult; label: string }[] = [
  { key: "phone", label: "Phone screen" },
  { key: "technical", label: "Technical" },
  { key: "hr", label: "HR / Behavioral" },
  { key: "final", label: "Final" },
];

export function InterviewQuestionsPanel({
  jobId,
  resumeText,
  initial,
}: {
  jobId: string;
  resumeText: string;
  initial: InterviewQuestionsResult | null;
}) {
  const [result, setResult] = React.useState(initial);
  const [isPending, startTransition] = React.useTransition();
  const ready = !!resumeText.trim();

  function handleGenerate() {
    startTransition(async () => {
      const { data, error } = await generateInterviewQuestions(jobId, resumeText);
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
          <h3 className="text-sm font-medium">Interview Question Generator</h3>
          <p className="text-sm text-muted-foreground">
            Likely questions organized by round type.
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
          No questions yet — click Generate.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ROUNDS.map(({ key, label }) => (
            <div key={key} className="space-y-2 rounded-lg border p-3">
              <Badge variant="secondary">{label}</Badge>
              <ul className="space-y-1.5">
                {result[key].map((q, i) => (
                  <li key={i} className="text-sm text-foreground/90">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
