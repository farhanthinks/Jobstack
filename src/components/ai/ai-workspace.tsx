"use client";

import * as React from "react";
import { BarChart3, FileText, ListChecks, Mail, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchScorePanel } from "@/components/ai/match-score-panel";
import { MissingSkillsPanel } from "@/components/ai/missing-skills-panel";
import { ResumeGeneratorPanel } from "@/components/ai/resume-generator-panel";
import { CoverLetterPanel } from "@/components/ai/cover-letter-panel";
import { InterviewQuestionsPanel } from "@/components/ai/interview-questions-panel";
import type {
  AtsResumeResult,
  CoverLetterResult,
  InterviewQuestionsResult,
  MatchScoreResult,
  MissingSkillsResult,
} from "@/types/ai";

const RESUME_STORAGE_KEY = "jobstack:ai-resume-text";

function readStoredResume(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(RESUME_STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function AiWorkspace({
  jobId,
  jobDescription,
  defaultResumeLatex,
  matchScore,
  missingSkills,
  atsResume,
  coverLetter,
  interviewQuestions,
}: {
  jobId: string;
  jobDescription: string;
  /** Settings → AI Preferences "Default Master Resume" — a server-side fallback for a new browser/device where localStorage is empty. */
  defaultResumeLatex: string;
  matchScore: MatchScoreResult | null;
  missingSkills: MissingSkillsResult | null;
  atsResume: AtsResumeResult | null;
  coverLetter: CoverLetterResult | null;
  interviewQuestions: InterviewQuestionsResult | null;
}) {
  // Lazy initializer (not an effect) so the saved resume is available on the
  // very first render — reading localStorage inside a useEffect would mean
  // a synchronous setState-in-effect, which this project avoids.
  const [resumeText, setResumeText] = React.useState<string>(() =>
    readStoredResume(defaultResumeLatex)
  );

  function handleResumeChange(value: string) {
    setResumeText(value);
    try {
      localStorage.setItem(RESUME_STORAGE_KEY, value);
    } catch {
      // Private browsing / storage disabled — the paste still works for this session.
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="sharedResume" className="text-sm font-medium">
          Your Resume (LaTeX)
        </label>
        <p className="text-xs text-muted-foreground">
          Paste once — used by every tab below. Kept only in this browser, not uploaded anywhere.
        </p>
        <Textarea
          id="sharedResume"
          rows={8}
          placeholder="Paste your resume's LaTeX source here…"
          value={resumeText}
          onChange={(e) => handleResumeChange(e.target.value)}
          className="field-sizing-fixed resize-none overflow-y-auto font-mono text-xs"
        />
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent>
          <Tabs defaultValue="resume-generator">
            <TabsList className="flex-wrap">
              <TabsTrigger value="match-score">
                <BarChart3 className="size-3.5" />
                Match Score
              </TabsTrigger>
              <TabsTrigger value="missing-skills">
                <ListChecks className="size-3.5" />
                Missing Skills
              </TabsTrigger>
              <TabsTrigger value="resume-generator">
                <Sparkles className="size-3.5" />
                Resume Generator
              </TabsTrigger>
              <TabsTrigger value="cover-letter">
                <Mail className="size-3.5" />
                Cover Letter
              </TabsTrigger>
              <TabsTrigger value="interview-questions">
                <FileText className="size-3.5" />
                Interview Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="match-score" className="pt-4">
              <MatchScorePanel jobId={jobId} resumeText={resumeText} initial={matchScore} />
            </TabsContent>
            <TabsContent value="missing-skills" className="pt-4">
              <MissingSkillsPanel jobId={jobId} resumeText={resumeText} initial={missingSkills} />
            </TabsContent>
            <TabsContent value="resume-generator" className="pt-4">
              <ResumeGeneratorPanel
                jobId={jobId}
                resumeText={resumeText}
                initialJobDescription={jobDescription}
                initial={atsResume}
              />
            </TabsContent>
            <TabsContent value="cover-letter" className="pt-4">
              <CoverLetterPanel jobId={jobId} resumeText={resumeText} initial={coverLetter} />
            </TabsContent>
            <TabsContent value="interview-questions" className="pt-4">
              <InterviewQuestionsPanel
                jobId={jobId}
                resumeText={resumeText}
                initial={interviewQuestions}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
