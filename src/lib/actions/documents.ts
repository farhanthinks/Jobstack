"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/extract-text";
import type { Document, DocumentType } from "@/types/database";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/x-tex",
  "text/plain",
]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Documents are never overwritten — each upload/generation for the same
 * (job, type) pair gets the next version number instead, so history stays
 * intact (Resume_v1, Resume_v2, ...). `job_id: null` versions independently
 * per type too (e.g. master resume uploads).
 */
export async function nextDocumentVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string | null,
  type: DocumentType
): Promise<number> {
  let query = supabase.from("documents").select("version").eq("type", type);
  query = jobId ? query.eq("job_id", jobId) : query.is("job_id", null);

  const { data } = await query.order("version", { ascending: false }).limit(1).maybeSingle();
  return (data?.version ?? 0) + 1;
}

export async function uploadDocument(
  formData: FormData
): Promise<{ data: Document | null; error: string | null }> {
  const file = formData.get("file");
  const type = formData.get("type") as DocumentType | null;
  const jobId = (formData.get("jobId") as string | null) || null;

  if (!(file instanceof File) || file.size === 0) {
    return { data: null, error: "Choose a file to upload." };
  }
  if (!type) {
    return { data: null, error: "Missing document type." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { data: null, error: "File is too large (10MB max)." };
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return { data: null, error: "Use a PDF, Word, or .tex file." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not signed in." };
  }

  const path = `${user.id}/${randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  // Extracted so AI Assistant features (Phase 5) have plain text to work
  // with, regardless of whether the resume was uploaded as PDF/DOCX/text.
  let extractedText: string | null = null;
  if (type === "master_resume") {
    const buffer = Buffer.from(await file.arrayBuffer());
    extractedText = await extractTextFromFile(buffer, file.type, file.name);
  }

  const version = await nextDocumentVersion(supabase, jobId, type);

  // Uploading/replacing a master resume makes it the active one — unset the
  // previous active row first so the "at most one active master" unique
  // index doesn't reject the new insert.
  if (type === "master_resume") {
    await supabase
      .from("documents")
      .update({ is_active_master: false })
      .eq("user_id", user.id)
      .eq("type", "master_resume")
      .eq("is_active_master", true);
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      job_id: jobId,
      type,
      file_url: path,
      file_name: file.name,
      latex_source: extractedText,
      version,
      is_active_master: type === "master_resume",
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("documents").remove([path]);
    return { data: null, error: error.message };
  }

  revalidatePath("/documents");
  if (jobId) revalidatePath("/applications/[id]", "page");
  return { data, error: null };
}

/** Lets the user reactivate an older master resume version instead of the newest upload always winning. */
export async function setActiveMasterResume(
  documentId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { error: unsetError } = await supabase
    .from("documents")
    .update({ is_active_master: false })
    .eq("user_id", user.id)
    .eq("type", "master_resume")
    .eq("is_active_master", true);
  if (unsetError) {
    return { error: unsetError.message };
  }

  const { error } = await supabase
    .from("documents")
    .update({ is_active_master: true })
    .eq("id", documentId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documents");
  return { error: null };
}

export async function deleteDocument(
  id: string,
  jobId?: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  if (doc?.file_url) {
    await supabase.storage.from("documents").remove([doc.file_url]);
  }

  revalidatePath("/documents");
  if (jobId) revalidatePath("/applications/[id]", "page");
  return { error: null };
}

export async function setJobDocument(
  jobId: string,
  field: "resume_document_id" | "cover_letter_document_id",
  documentId: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ [field]: documentId })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/[id]", "page");
  return { error: null };
}
