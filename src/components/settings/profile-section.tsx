"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateProfileDetails, uploadAvatar } from "@/lib/actions/profile";
import { profileDetailsSchema, type ProfileDetailsInput } from "@/lib/validations/settings";
import type { Profile } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function ProfileSection({
  profile,
  account,
}: {
  profile: Profile;
  account: { email: string; fullName: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const [isUploading, startUpload] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      fullName: account.fullName,
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      linkedinUrl: profile.linkedin_url ?? "",
      portfolioUrl: profile.portfolio_url ?? "",
    },
  });

  async function onSubmit(values: ProfileDetailsInput) {
    const { error } = await updateProfileDetails(values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Profile updated.");
    router.refresh();
  }

  function handleAvatarUpload(formData: FormData) {
    startUpload(async () => {
      const { error } = await uploadAvatar(formData);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Photo updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Your personal details.</p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt={account.fullName} />}
          <AvatarFallback className="text-lg">{initials(account.fullName)}</AvatarFallback>
        </Avatar>
        <form action={handleAvatarUpload}>
          <Input
            id="avatar-file"
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.form?.requestSubmit()}
          />
          <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
            <label htmlFor="avatar-file" className="cursor-pointer">
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pencil className="size-3.5" />
              )}
              Change photo
            </label>
          </Button>
        </form>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input id="fullName" aria-invalid={!!errors.fullName} {...register("fullName")} />
              <FieldError errors={[errors.fullName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" value={account.email} disabled />
              <FieldDescription>Change this under Account &amp; Security.</FieldDescription>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input id="phone" placeholder="+1 555 123 4567" {...register("phone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input id="location" placeholder="San Francisco, CA" {...register("location")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="linkedinUrl">LinkedIn URL</FieldLabel>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/…"
                aria-invalid={!!errors.linkedinUrl}
                {...register("linkedinUrl")}
              />
              <FieldError errors={[errors.linkedinUrl]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="portfolioUrl">Portfolio URL</FieldLabel>
              <Input
                id="portfolioUrl"
                placeholder="https://…"
                aria-invalid={!!errors.portfolioUrl}
                {...register("portfolioUrl")}
              />
              <FieldError errors={[errors.portfolioUrl]} />
            </Field>
          </div>
        </FieldGroup>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
