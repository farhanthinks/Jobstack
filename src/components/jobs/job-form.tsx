"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlarmClock,
  Briefcase,
  Building,
  Building2,
  CalendarDays,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { jobFormSchema, type JobFormInput } from "@/lib/validations/job";
import { JOB_PLATFORMS, WORK_MODES } from "@/types/database";
import { WORK_MODE_LABELS } from "@/lib/job-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function JobForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  onCancel,
  formId,
  hideFooter = false,
  onSubmittingChange,
  showContactFields = true,
}: {
  defaultValues?: Partial<JobFormInput>;
  onSubmit: (values: JobFormInput) => Promise<{ error: string | null }>;
  submitLabel?: string;
  onCancel?: () => void;
  /** Sets the <form> id so an external (e.g. fixed dialog) footer button can submit via `form={formId}`. */
  formId?: string;
  /** Hides the built-in Cancel/Submit row — for callers supplying their own fixed footer. */
  hideFooter?: boolean;
  /** Reports submitting state — for callers driving their own fixed footer button. */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  /** Hides HR name/contact email/phone/LinkedIn inputs — for callers with a separate HR Details display. */
  showContactFields?: boolean;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobFormInput>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      platform: "Other",
      ...defaultValues,
    },
  });

  React.useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handle(values: JobFormInput) {
    setServerError(null);
    const { error } = await onSubmit(values);
    if (error) {
      setServerError(error);
    }
  }

  async function handleCopyDescription() {
    const text = watch("jobDescription") ?? "";
    if (!text.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Job description copied.");
    } catch {
      toast.error("Couldn't copy — try selecting the text manually.");
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(handle)} noValidate className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="companyName" className="items-center">
              <Building className="size-3.5 text-muted-foreground" />
              Company
            </FieldLabel>
            <Input
              id="companyName"
              placeholder="Acme Inc."
              aria-invalid={!!errors.companyName}
              {...register("companyName")}
            />
            <FieldError errors={[errors.companyName]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="position" className="items-center">
              <Briefcase className="size-3.5 text-muted-foreground" />
              Position
            </FieldLabel>
            <Input
              id="position"
              placeholder="Senior Frontend Engineer"
              aria-invalid={!!errors.position}
              {...register("position")}
            />
            <FieldError errors={[errors.position]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="platform" className="items-center">
              <Globe className="size-3.5 text-muted-foreground" />
              Platform
            </FieldLabel>
            <Select
              value={watch("platform")}
              onValueChange={(value) =>
                setValue("platform", value as JobFormInput["platform"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_PLATFORMS.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[errors.platform]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="jobUrl" className="items-center">
              <ExternalLink className="size-3.5 text-muted-foreground" />
              Job URL
            </FieldLabel>
            <Input
              id="jobUrl"
              placeholder="https://…"
              aria-invalid={!!errors.jobUrl}
              {...register("jobUrl")}
            />
            <FieldError errors={[errors.jobUrl]} />
          </Field>
        </div>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="jobDescription" className="items-center">
              <FileText className="size-3.5 text-muted-foreground" />
              Job description
            </FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCopyDescription}
              aria-label="Copy job description"
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
          <Textarea
            id="jobDescription"
            rows={10}
            placeholder="Paste the full job description…"
            aria-invalid={!!errors.jobDescription}
            className="field-sizing-fixed resize-none overflow-y-auto"
            {...register("jobDescription")}
          />
          <FieldDescription>
            Used later by AI Assistant features — match score, keyword gaps,
            tailoring.
          </FieldDescription>
          <FieldError errors={[errors.jobDescription]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="location" className="items-center">
              <MapPin className="size-3.5 text-muted-foreground" />
              Location
            </FieldLabel>
            <Input
              id="location"
              placeholder="Remote · Bengaluru, IN"
              {...register("location")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="workMode" className="items-center">
              <Building2 className="size-3.5 text-muted-foreground" />
              Work mode
            </FieldLabel>
            <Select
              value={watch("workMode") ?? "unspecified"}
              onValueChange={(value) =>
                setValue(
                  "workMode",
                  value === "unspecified" ? undefined : (value as JobFormInput["workMode"]),
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger id="workMode" className="w-full">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">Not specified</SelectItem>
                {WORK_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {WORK_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="salary" className="items-center">
              <Wallet className="size-3.5 text-muted-foreground" />
              Salary
            </FieldLabel>
            <Input id="salary" placeholder="₹28–35 LPA" {...register("salary")} />
          </Field>
        </div>

        {showContactFields && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="contactName" className="items-center">
                  <User className="size-3.5 text-muted-foreground" />
                  HR name
                </FieldLabel>
                <Input id="contactName" placeholder="Jane Doe" {...register("contactName")} />
              </Field>

              <Field>
                <FieldLabel htmlFor="contactEmail" className="items-center">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Contact email
                </FieldLabel>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="recruiter@company.com"
                  aria-invalid={!!errors.contactEmail}
                  {...register("contactEmail")}
                />
                <FieldError errors={[errors.contactEmail]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="contactPhone" className="items-center">
                  <Phone className="size-3.5 text-muted-foreground" />
                  Contact phone
                </FieldLabel>
                <Input
                  id="contactPhone"
                  placeholder="+91 98765 43210"
                  {...register("contactPhone")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="contactLinkedin" className="items-center">
                  <Link2 className="size-3.5 text-muted-foreground" />
                  LinkedIn / Profile URL
                </FieldLabel>
                <Input
                  id="contactLinkedin"
                  placeholder="https://linkedin.com/in/…"
                  aria-invalid={!!errors.contactLinkedin}
                  {...register("contactLinkedin")}
                />
                <FieldError errors={[errors.contactLinkedin]} />
              </Field>
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="applicationDeadline" className="items-center">
              <CalendarDays className="size-3.5 text-muted-foreground" />
              Application deadline
            </FieldLabel>
            <DatePicker
              id="applicationDeadline"
              value={watch("applicationDeadline")}
              onChange={(date) => {
                setValue("applicationDeadline", date);
                setValue("reminderDate", undefined, { shouldValidate: true });
              }}
              placeholder="No deadline"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="reminderDate" className="items-center">
              <AlarmClock className="size-3.5 text-muted-foreground" />
              Application reminder date
            </FieldLabel>
            <DatePicker
              id="reminderDate"
              value={watch("reminderDate")}
              onChange={(date) => setValue("reminderDate", date, { shouldValidate: true })}
              maxDate={watch("applicationDeadline")}
              disabled={!watch("applicationDeadline")}
              placeholder={
                watch("applicationDeadline") ? "No reminder" : "Set a deadline first"
              }
            />
            <FieldError errors={[errors.reminderDate]} />
          </Field>
        </div>

        {watch("reminderDate") && (
          <Field>
            <FieldLabel htmlFor="reminderTime" className="items-center">
              <AlarmClock className="size-3.5 text-muted-foreground" />
              Reminder time{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="reminderTime" type="time" className="sm:max-w-[200px]" {...register("reminderTime")} />
            <FieldDescription>Defaults to 10:00 AM if left blank.</FieldDescription>
          </Field>
        )}

        {serverError && (
          <FieldContent>
            <FieldDescription className="text-destructive">
              {serverError}
            </FieldDescription>
          </FieldContent>
        )}
      </FieldGroup>

      {!hideFooter && (
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
