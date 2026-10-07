"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Supabase's `updateUser({ password })` doesn't itself re-check the current
 * password — the active session is already authenticated — so a genuine
 * "change password" flow re-verifies it explicitly first via a sign-in call.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { error: null };
}

export async function resendVerificationEmail(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in." };

  const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
  if (error) return { error: error.message };

  return { error: null };
}

/** Signs out every session for this account except the one making the request. */
export async function signOutOtherDevices(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { error: error.message };

  return { error: null };
}

/**
 * Permanently deletes the signed-in user's account. Requires the service-role
 * admin client (`src/lib/supabase/admin.ts`) — there's no client-session API
 * for deleting your own `auth.users` row. All owned rows cascade-delete via
 * each table's `on delete cascade` FK to `auth.users`/`profiles`.
 */
export async function deleteOwnAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  return { error: null };
}
