"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/groq";
import { nextDocumentVersion } from "@/lib/actions/documents";
import type {
  AtsResumeResult,
  CoverLetterResult,
  InterviewQuestionsResult,
  MatchScoreResult,
  MissingSkillsResult,
} from "@/types/ai";
import type { AiGenerationType } from "@/types/database";

const MAX_RESUME_CHARS = 16000;

type Context = {
  jobId: string;
  companyName: string;
  position: string;
  jobDescription: string;
  resumeText: string;
};

// No stored "master resume" anymore — the user pastes their resume directly
// into AI Assistant each session; every generator here just needs the job's
// own description plus whatever text was pasted.
async function loadContext(
  jobId: string,
  resumeText: string
): Promise<{ context: Context | null; error: string | null }> {
  if (!resumeText.trim()) {
    return { context: null, error: "Paste your resume above first." };
  }

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, company_name, position, job_description")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) {
    return { context: null, error: "Job not found." };
  }

  return {
    context: {
      jobId,
      companyName: job.company_name,
      position: job.position,
      jobDescription: job.job_description,
      resumeText: resumeText.slice(0, MAX_RESUME_CHARS),
    },
    error: null,
  };
}

/**
 * Settings → AI Preferences lets the user set a tone/style and free-form
 * notes once; this threads them into the system prompt of every generator
 * that produces written content, without touching the "never invent
 * experience" rules, which stay primary and unconditional.
 */
async function aiPreferenceSuffix(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_content_style, ai_resume_notes")
    .eq("id", user.id)
    .maybeSingle();

  const parts: string[] = [];
  if (profile?.ai_content_style) {
    parts.push(`Preferred tone/style: ${profile.ai_content_style}.`);
  }
  if (profile?.ai_resume_notes?.trim()) {
    parts.push(`Candidate's own notes on resume optimization: ${profile.ai_resume_notes.trim()}`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

async function logGeneration(
  jobId: string,
  type: AiGenerationType,
  inputSnapshot: Record<string, unknown>,
  output: unknown
) {
  const supabase = await createClient();
  await supabase.from("ai_generations").insert({
    job_id: jobId,
    type,
    input_snapshot: inputSnapshot,
    output,
  });
  revalidatePath(`/ai-assistant`);
}

export async function generateMatchScore(
  jobId: string,
  resumeText: string
): Promise<{ data: MatchScoreResult | null; error: string | null }> {
  const { context, error: ctxError } = await loadContext(jobId, resumeText);
  if (!context) return { data: null, error: ctxError };

  const { data, error } = await generateJson<MatchScoreResult>({
    system:
      "You are an ATS and hiring expert. Compare a resume against a job description and score the match. Respond with strict JSON only, matching this shape: " +
      '{"score": number (0-100), "reasoning": string (2-3 sentences), "strengths": string[] (3-5 items), "gaps": string[] (3-5 items)}.',
    prompt: `Job title: ${context.position} at ${context.companyName}\n\nJob description:\n${context.jobDescription}\n\nResume:\n${context.resumeText}`,
  });

  if (error || !data) {
    return { data: null, error: error ?? "Generation failed." };
  }

  const supabase = await createClient();
  await supabase
    .from("jobs")
    .update({ match_score: Math.round(data.score) })
    .eq("id", jobId);

  await logGeneration(
    jobId,
    "match_score",
    { jobDescription: context.jobDescription, resumeText: context.resumeText },
    data
  );

  revalidatePath("/applications/[id]", "page");
  revalidatePath("/applications");
  return { data, error: null };
}

export async function generateMissingSkills(
  jobId: string,
  resumeText: string
): Promise<{ data: MissingSkillsResult | null; error: string | null }> {
  const { context, error: ctxError } = await loadContext(jobId, resumeText);
  if (!context) return { data: null, error: ctxError };

  const { data, error } = await generateJson<MissingSkillsResult>({
    system:
      "You are an ATS keyword extraction expert. Extract required skills/keywords from a job description and diff them against a resume. Respond with strict JSON only: " +
      '{"matchedSkills": string[], "missingSkills": string[]}. Keep each list focused (5-12 items), concrete skills/tools/keywords only, no generic phrases.',
    prompt: `Job description:\n${context.jobDescription}\n\nResume:\n${context.resumeText}`,
  });

  if (error || !data) {
    return { data: null, error: error ?? "Generation failed." };
  }

  await logGeneration(
    jobId,
    "missing_skills",
    { jobDescription: context.jobDescription, resumeText: context.resumeText },
    data
  );

  return { data, error: null };
}

/**
 * The Resume Generator: rewrites the user's pasted LaTeX resume to better
 * match a job description, preserving structure/formatting/personal info —
 * no separate stored template needed, the pasted resume IS the template.
 * Bundles the ATS score + keyword diff into the same call since the UI
 * shows them together as one result.
 */
export async function generateAtsResume({
  jobId,
  existingLatex,
  jobDescription,
}: {
  jobId: string;
  existingLatex: string;
  jobDescription: string;
}): Promise<{ data: AtsResumeResult | null; error: string | null }> {
  if (!existingLatex.trim()) {
    return { data: null, error: "Paste your resume above first." };
  }
  if (!jobDescription.trim()) {
    return { data: null, error: "Paste the job description first." };
  }

  const { data, error } = await generateJson<AtsResumeResult>({
    system:
      "You tailor a candidate's existing LaTeX resume for a specific job. " +
      "Rules: NEVER change the LaTeX structure, commands, section order, or personal details (name, phone, email, location, LinkedIn, portfolio). " +
      "ONLY rewrite resume content — summary/objective, skills, experience bullets, project descriptions — to naturally include relevant ATS keywords from the job description. " +
      "Never invent experience, companies, projects, technologies, education, certifications, achievements, metrics, job titles, or dates that aren't already implied by the original resume. " +
      'Respond with strict JSON only: {"atsScore": number (0-100, match after tailoring), "matchedKeywords": string[] (5-12 items), "missingKeywords": string[] (keywords the resume still can\'t honestly support, 0-8 items), "tailoredLatex": string (the complete, valid, full LaTeX document — ready to paste into Overleaf)}.' +
      (await aiPreferenceSuffix()),
    prompt: `Job description:\n${jobDescription.slice(0, MAX_RESUME_CHARS)}\n\nExisting LaTeX resume:\n${existingLatex.slice(0, MAX_RESUME_CHARS)}`,
    temperature: 0.3,
    maxTokens: 8192,
  });

  if (error || !data) {
    return { data: null, error: error ?? "Generation failed." };
  }

  await logGeneration(
    jobId,
    "tailored_resume",
    { jobDescription, existingLatex },
    data
  );

  return { data, error: null };
}

export async function generateCoverLetter(
  jobId: string,
  resumeText: string
): Promise<{ data: CoverLetterResult | null; error: string | null }> {
  const { context, error: ctxError } = await loadContext(jobId, resumeText);
  if (!context) return { data: null, error: ctxError };

  const { data, error } = await generateJson<CoverLetterResult>({
    system:
      "You write concise, specific cover letters grounded in the candidate's actual resume — never generic filler. " +
      'Respond with strict JSON only: {"coverLetter": string} — 3-4 paragraphs, plain text (no markdown), ready to edit.' +
      (await aiPreferenceSuffix()),
    prompt: `Job title: ${context.position} at ${context.companyName}\n\nJob description:\n${context.jobDescription}\n\nResume:\n${context.resumeText}`,
    temperature: 0.6,
  });

  if (error || !data) {
    return { data: null, error: error ?? "Generation failed." };
  }

  await logGeneration(
    jobId,
    "cover_letter",
    { jobDescription: context.jobDescription, resumeText: context.resumeText },
    data
  );

  return { data, error: null };
}

export async function generateInterviewQuestions(
  jobId: string,
  resumeText: string
): Promise<{ data: InterviewQuestionsResult | null; error: string | null }> {
  const { context, error: ctxError } = await loadContext(jobId, resumeText);
  if (!context) return { data: null, error: ctxError };

  const { data, error } = await generateJson<InterviewQuestionsResult>({
    system:
      "You generate likely interview questions for a candidate based on a job description and resume, organized by round. " +
      'Respond with strict JSON only: {"phone": string[], "technical": string[], "hr": string[], "final": string[]}. ' +
      "phone = screening/behavioral basics (4-6). technical = role-specific technical/coding/system questions grounded in the JD and resume (5-8). hr = culture-fit/behavioral (4-6). final = leadership/strategic/culminating questions (3-5)." +
      (await aiPreferenceSuffix()),
    prompt: `Job title: ${context.position} at ${context.companyName}\n\nJob description:\n${context.jobDescription}\n\nResume:\n${context.resumeText}`,
    temperature: 0.6,
  });

  if (error || !data) {
    return { data: null, error: error ?? "Generation failed." };
  }

  await logGeneration(
    jobId,
    "interview_questions",
    { jobDescription: context.jobDescription, resumeText: context.resumeText },
    data
  );

  return { data, error: null };
}

export async function getLatestGeneration<T>(
  jobId: string,
  type: AiGenerationType
): Promise<T | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_generations")
    .select("output")
    .eq("job_id", jobId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.output as T) ?? null;
}

export async function saveGeneratedDocument({
  jobId,
  type,
  fileName,
  content,
  atsScore,
}: {
  jobId: string;
  type: "tailored_resume" | "cover_letter";
  fileName: string;
  content: string;
  /** Pass the score straight from the Resume Generator's result — avoids a redundant lookup. */
  atsScore?: number | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const version = await nextDocumentVersion(supabase, jobId, type);

  const path = `${user.id}/${randomUUID()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, new Blob([content], { type: "text/plain" }), {
      contentType: "text/plain",
    });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("documents").insert({
    job_id: jobId,
    type,
    file_url: path,
    file_name: fileName,
    latex_source: type === "tailored_resume" ? content : null,
    version,
    ats_score: atsScore ?? null,
  });

  if (error) {
    await supabase.storage.from("documents").remove([path]);
    return { error: error.message };
  }

  revalidatePath("/applications/[id]", "page");
  revalidatePath("/documents");
  return { error: null };
}
