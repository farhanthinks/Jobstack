import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only, cross-user work (the reminder cron
 * job, mainly) that runs outside any signed-in user's session and must
 * bypass RLS. Never import this from client components or expose it to the
 * browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
