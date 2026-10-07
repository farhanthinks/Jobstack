import type { SupabaseClient } from "@supabase/supabase-js";

// Words stripped before deriving a code — legal suffixes for companies,
// seniority prefixes for roles — so they don't dilute the abbreviation.
const COMPANY_NOISE_WORDS = [
  "technologies",
  "technology",
  "solutions",
  "systems",
  "software",
  "corporation",
  "corp",
  "incorporated",
  "inc",
  "llc",
  "ltd",
  "limited",
  "company",
  "co",
  "group",
  "labs",
  "pvt",
];

const ROLE_NOISE_WORDS = [
  "senior",
  "sr",
  "junior",
  "jr",
  "lead",
  "staff",
  "principal",
  "associate",
  "intern",
];

function words(raw: string, noise: string[]): string[] {
  return raw
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !noise.includes(w.toLowerCase()));
}

// Multi-word names become initials (e.g. "General Electric" -> GE); a single
// remaining word is truncated to `singleWordLength` letters (e.g.
// "Microsoft" -> "MIC"). Falls back to the unfiltered word list if stripping
// noise words leaves nothing (e.g. a company literally named "Technologies").
function abbreviate(raw: string, noise: string[], singleWordLength: number): string {
  const filtered = words(raw, noise);
  const list = filtered.length > 0 ? filtered : words(raw, []);
  if (list.length === 0) return "GEN";
  if (list.length === 1) return list[0].slice(0, singleWordLength).toUpperCase();
  return list
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function companyCode(companyName: string): string {
  return abbreviate(companyName, COMPANY_NOISE_WORDS, 3);
}

export function roleCode(position: string): string {
  return abbreviate(position, ROLE_NOISE_WORDS, 2);
}

/**
 * Generates a permanent, system-assigned "Job ID" like `MS-SE-001` —
 * COMPANY-ROLE-### — where ### is a 3-digit number that increments per
 * (user, company code + role code) pair via an atomic DB sequence. Returns
 * `null` (rather than throwing) if the sequence RPC fails — e.g. the
 * `next_job_code_number` migration hasn't been applied yet — so job
 * creation keeps working without a Job ID until it has been.
 */
export async function generateJobCode(
  supabase: SupabaseClient,
  userId: string,
  companyName: string,
  position: string
): Promise<string | null> {
  const prefix = `${companyCode(companyName)}-${roleCode(position)}`;
  const { data, error } = await supabase.rpc("next_job_code_number", {
    p_user_id: userId,
    p_prefix: prefix,
  });

  if (error || typeof data !== "number") return null;

  return `${prefix}-${String(data).padStart(3, "0")}`;
}
