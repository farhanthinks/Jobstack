"use client";

import * as React from "react";
import { CheckCircle2, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { generateAtsResume } from "@/lib/actions/ai";
import type { AtsResumeResult } from "@/types/ai";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 border-emerald-600";
  if (score >= 50) return "text-amber-600 border-amber-600";
  return "text-destructive border-destructive";
}

function downloadTex(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/x-tex" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResumeGeneratorPanel({
  jobId,
  resumeText,
  initialJobDescription,
  initial,
}: {
  jobId: string;
  resumeText: string;
  initialJobDescription: string;
  initial: AtsResumeResult | null;
}) {
  const [jobDescription, setJobDescription] = React.useState(initialJobDescription);
  const [result, setResult] = React.useState(initial);
  const [isPending, startTransition] = React.useTransition();
  const ready = !!resumeText.trim() && !!jobDescription.trim();

  function handleGenerate() {
    startTransition(async () => {
      const { data, error } = await generateAtsResume({
        jobId,
        existingLatex: resumeText,
        jobDescription,
      });
      if (error) {
        toast.error(error);
        return;
      }
      setResult(data);
    });
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tailoredLatex);
      toast.success("LaTeX copied.");
    } catch {
      toast.error("Couldn't copy — try selecting the text manually.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Resume Generator</h3>
        <p className="text-sm text-muted-foreground">
          Paste the job description, then generate an ATS-optimized version of your resume above.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="jobDescription" className="text-xs font-medium text-muted-foreground">
          Job Description
        </label>
        <Textarea
          id="jobDescription"
          rows={8}
          placeholder="Paste the target job description…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="field-sizing-fixed resize-none overflow-y-auto font-mono text-xs"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={!ready || isPending} size="sm">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Generate ATS Resume
        </Button>
      </div>

      {result && (
        <div className="space-y-4 border-t pt-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            ATS Resume Generated
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div
              className={cn(
                "flex size-20 shrink-0 items-center justify-center rounded-full border-4 text-xl font-semibold",
                scoreColor(result.atsScore)
              )}
            >
              {result.atsScore}
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Matched keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((kw) => (
                    <Badge key={kw} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Missing keywords</p>
                {result.missingKeywords.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None — good coverage.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw) => (
                      <Badge key={kw} variant="destructive" className="bg-destructive/10 text-destructive">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Generated LaTeX</p>
            <Textarea
              readOnly
              rows={14}
              value={result.tailoredLatex}
              className="field-sizing-fixed resize-none overflow-y-auto font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="size-3.5" />
              Copy LaTeX
            </Button>
            <Button
              size="sm"
              onClick={() => downloadTex(result.tailoredLatex, "tailored-resume.tex")}
            >
              <Download className="size-3.5" />
              Download .tex
            </Button>
          </div>
        </div>
      )}

      {!result && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No resume generated yet — click Generate ATS Resume.
        </div>
      )}
    </div>
  );
}
