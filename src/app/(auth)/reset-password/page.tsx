import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password — Jobstack",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
      </div>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Request a new one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
