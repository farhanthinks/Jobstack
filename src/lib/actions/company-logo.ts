"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const FETCH_TIMEOUT_MS = 8000;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function uploadJobLogo(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("file");
  const jobId = formData.get("jobId") as string | null;

  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: "Choose an image to upload." };
  }
  if (!jobId) {
    return { url: null, error: "Missing job." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { url: null, error: "Image is too large (4MB max)." };
  }
  if (file.type && !ALLOWED_LOGO_TYPES.has(file.type)) {
    return { url: null, error: "Use a PNG, JPEG, WebP, or SVG image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { url: null, error: "Not signed in." };
  }

  const path = `${user.id}/${randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);

  const { error } = await supabase
    .from("jobs")
    .update({ logo_uploaded_url: publicUrl })
    .eq("id", jobId);

  if (error) {
    await supabase.storage.from("logos").remove([path]);
    return { url: null, error: error.message };
  }

  revalidatePath("/applications/[id]", "page");
  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  return { url: publicUrl, error: null };
}

export async function setJobLogoUrl(
  jobId: string,
  url: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ logo_url: url || null })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/[id]", "page");
  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  return { error: null };
}

export async function removeJobLogo(
  jobId: string,
  field: "logo_uploaded_url" | "logo_url" | "logo_auto_url"
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  if (field === "logo_uploaded_url") {
    const { data: job } = await supabase
      .from("jobs")
      .select("logo_uploaded_url")
      .eq("id", jobId)
      .maybeSingle();

    const publicUrl = job?.logo_uploaded_url;
    const path = publicUrl ? extractStoragePathFromPublicUrl(publicUrl) : null;
    if (path) {
      await supabase.storage.from("logos").remove([path]);
    }
  }

  const { error } = await supabase
    .from("jobs")
    .update({ [field]: null })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/[id]", "page");
  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  return { error: null };
}

function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = "/storage/v1/object/public/logos/";
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

// Best-effort logo discovery: fetches the job posting page and looks for an
// Open Graph / Twitter image meta tag, falling back to the posting domain's
// favicon (which almost always resolves to *something*, even if generic).
// Sites that require a login to view (LinkedIn job pages among them) will
// often serve a stripped-down page to an unauthenticated fetch — when that
// happens this just comes back empty, same as any other page it can't read.
export async function autoFetchJobLogo(
  jobId: string,
  jobUrl: string
): Promise<{ url: string | null; error: string | null }> {
  let hostname: string;
  try {
    hostname = new URL(jobUrl).hostname;
  } catch {
    return { url: null, error: "That job URL doesn't look valid." };
  }

  let ogImage: string | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(jobUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobstackBot/1.0; +https://jobstack.app)",
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();
      ogImage =
        matchMetaContent(html, "og:image") ??
        matchMetaContent(html, "twitter:image");
    }
  } catch {
    // Network error, timeout, or blocked request — fall through to favicon.
  }

  const logoUrl =
    ogImage ?? `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ logo_auto_url: logoUrl })
    .eq("id", jobId);

  if (error) {
    return { url: null, error: error.message };
  }

  revalidatePath("/applications/[id]", "page");
  revalidatePath("/applications");
  revalidatePath("/saved-jobs");
  return { url: logoUrl, error: null };
}

function matchMetaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
