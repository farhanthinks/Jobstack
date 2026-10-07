"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  interviewFormSchema,
  type InterviewFormInput,
} from "@/lib/validations/interview";
import { INTERVIEW_MODES, INTERVIEW_TYPE_FORM_OPTIONS } from "@/types/database";
import {
  INTERVIEW_DURATION_OPTIONS,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_ROUND_TYPE_LABELS,
  formatInterviewDuration,
} from "@/lib/interview-meta";
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

export function InterviewForm({
  jobs,
  lockJobId,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  onCancel,
  formId,
  hideFooter = false,
  onSubmittingChange,
}: {
  jobs: { id: string; company_name: string; position: string }[];
  lockJobId?: string;
  defaultValues?: Partial<InterviewFormInput>;
  onSubmit: (values: InterviewFormInput) => Promise<{ error: string | null }>;
  submitLabel?: string;
  onCancel?: () => void;
  /** Sets the <form> id so an external (e.g. fixed dialog) footer button can submit via `form={formId}`. */
  formId?: string;
  /** Hides the built-in Cancel/Submit row — for callers supplying their own fixed footer. */
  hideFooter?: boolean;
  /** Reports submitting state — for callers driving their own fixed footer button. */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InterviewFormInput>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      roundType: "hr",
      mode: "online",
      jobId: lockJobId,
      ...defaultValues,
    },
  });

  React.useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handle(values: InterviewFormInput) {
    setServerError(null);
    const { error } = await onSubmit(values);
    if (error) setServerError(error);
  }

  const mode = watch("mode");

  return (
    <form id={formId} onSubmit={handleSubmit(handle)} noValidate className="flex flex-1 flex-col">
      <FieldGroup className="flex-1 overflow-y-auto">
        {!lockJobId && (
          <Field>
            <FieldLabel htmlFor="jobId">Linked application</FieldLabel>
            <Select
              value={watch("jobId")}
              onValueChange={(value) =>
                setValue("jobId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="jobId" className="w-full">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.position} · {job.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[errors.jobId]} />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="roundType">Interview type</FieldLabel>
            <Select
              value={watch("roundType")}
              onValueChange={(value) =>
                setValue("roundType", value as InterviewFormInput["roundType"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="roundType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPE_FORM_OPTIONS.map((round) => (
                  <SelectItem key={round} value={round}>
                    {INTERVIEW_ROUND_TYPE_LABELS[round]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="mode">Interview mode</FieldLabel>
            <Select
              value={mode}
              onValueChange={(value) =>
                setValue("mode", value as InterviewFormInput["mode"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {INTERVIEW_MODE_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="scheduledAt">Interview date</FieldLabel>
            <DatePicker
              id="scheduledAt"
              value={watch("scheduledAt")}
              onChange={(date) => setValue("scheduledAt", date)}
              placeholder="Not scheduled"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="scheduledTime">Interview time</FieldLabel>
            <Input id="scheduledTime" type="time" {...register("scheduledTime")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="durationMinutes">Duration</FieldLabel>
            <Select
              value={watch("durationMinutes") || "none"}
              onValueChange={(value) =>
                setValue("durationMinutes", value === "none" ? undefined : value)
              }
            >
              <SelectTrigger id="durationMinutes" className="w-full">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {INTERVIEW_DURATION_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {formatInterviewDuration(minutes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="meetingLinkOrAddress">Meeting link</FieldLabel>
            <Input
              id="meetingLinkOrAddress"
              placeholder="https://meet.google.com/…"
              {...register("meetingLinkOrAddress")}
            />
          </Field>
        </div>

        {mode === "in_person" && (
          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input id="location" placeholder="Office address" {...register("location")} />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="interviewerName">Interviewer name</FieldLabel>
            <Input id="interviewerName" placeholder="Jane Smith" {...register("interviewerName")} />
          </Field>

          <Field>
            <FieldLabel htmlFor="interviewerEmail">Interviewer email</FieldLabel>
            <Input
              id="interviewerEmail"
              type="email"
              placeholder="jane@company.com"
              aria-invalid={!!errors.interviewerEmail}
              {...register("interviewerEmail")}
            />
            <FieldError errors={[errors.interviewerEmail]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="prepNotes">Preparation notes</FieldLabel>
          <Textarea
            id="prepNotes"
            rows={4}
            placeholder="Topics to review, questions to ask…"
            {...register("prepNotes")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="reminderDate">
              Reminder date <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <DatePicker
              id="reminderDate"
              value={watch("reminderDate")}
              onChange={(date) => setValue("reminderDate", date)}
              placeholder="No reminder"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="reminderTime">
              Reminder time <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="reminderTime" type="time" {...register("reminderTime")} />
          </Field>
        </div>

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
