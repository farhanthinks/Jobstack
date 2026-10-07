"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CheckCircle2, Loader2, LogOut, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  changePassword,
  deleteOwnAccount,
  resendVerificationEmail,
  signOutOtherDevices,
} from "@/lib/actions/account";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AccountSection({
  account,
}: {
  account: { email: string; emailConfirmed: boolean; createdAt: string };
}) {
  const router = useRouter();
  const [isResending, startResend] = React.useTransition();
  const [isSigningOutOthers, startSignOutOthers] = React.useTransition();
  const [isDeleting, startDelete] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onChangePassword(values: ChangePasswordInput) {
    const { error } = await changePassword(values.currentPassword, values.newPassword);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Password changed.");
    reset();
  }

  function handleResendVerification() {
    startResend(async () => {
      const { error } = await resendVerificationEmail();
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Verification email sent.");
    });
  }

  function handleSignOutOthers() {
    startSignOutOthers(async () => {
      const { error } = await signOutOtherDevices();
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Signed out of all other devices.");
    });
  }

  function handleDeleteAccount() {
    startDelete(async () => {
      const { error } = await deleteOwnAccount();
      if (error) {
        toast.error(error);
        return;
      }
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Account &amp; Security</h2>
        <p className="text-sm text-muted-foreground">
          Password, email verification, and account access.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">{account.email}</p>
          <p className="text-xs text-muted-foreground">
            Member since {format(new Date(account.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        {account.emailConfirmed ? (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Verified
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-destructive/10 text-destructive">
              <XCircle className="size-3" />
              Unverified
            </Badge>
            <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={isResending}>
              {isResending && <Loader2 className="size-3.5 animate-spin" />}
              Resend
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onChangePassword)} noValidate className="space-y-4">
        <h3 className="text-sm font-medium">Change password</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              aria-invalid={!!errors.currentPassword}
              {...register("currentPassword")}
            />
            <FieldError errors={[errors.currentPassword]} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                aria-invalid={!!errors.newPassword}
                {...register("newPassword")}
              />
              <FieldError errors={[errors.newPassword]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>
          </div>
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </div>
      </form>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Sign out of other devices</h3>
          <p className="text-xs text-muted-foreground">
            Ends every signed-in session for this account except this one.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOutOthers} disabled={isSigningOutOthers}>
          {isSigningOutOthers ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          Sign out others
        </Button>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 p-3">
        <div>
          <h3 className="text-sm font-medium text-destructive">Delete account</h3>
          <p className="text-xs text-muted-foreground">
            Permanently deletes your account and all data — applications, tasks, interviews, outreach, and documents. This can&apos;t be undone.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your Jobstack account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your account and everything in it —
                applications, saved jobs, tasks, interviews, outreach, and
                documents. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                Delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
