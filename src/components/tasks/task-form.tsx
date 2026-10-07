"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { taskFormSchema, type TaskFormInput } from "@/lib/validations/task";
import {
  APPLICATION_TASK_TYPES,
  OUTREACH_TASK_TYPES,
  TASK_OUTREACH_CHANNELS,
  TASK_PRIORITIES,
  type TaskCategory,
} from "@/types/database";
import { TASK_CATEGORY_LABELS, TASK_OUTREACH_CHANNEL_LABELS, TASK_TYPE_LABELS } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
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

export function TaskForm({
  jobs,
  lockJobId,
  lockCategory,
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
  lockCategory?: TaskCategory;
  defaultValues?: Partial<TaskFormInput>;
  onSubmit: (values: TaskFormInput) => Promise<{ error: string | null }>;
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
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      category: lockCategory ?? "application",
      type: "custom",
      priority: "medium",
      jobId: lockJobId,
      ...defaultValues,
    },
  });

  React.useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  async function handle(values: TaskFormInput) {
    setServerError(null);
    const { error } = await onSubmit(values);
    if (error) setServerError(error);
  }

  const category = watch("category");
  const typeOptions = category === "application" ? APPLICATION_TASK_TYPES : OUTREACH_TASK_TYPES;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(handle)}
      noValidate
      className="flex flex-1 flex-col"
    >
      <FieldGroup className="flex-1 overflow-y-auto">
        {!lockCategory && (
          <Field>
            <FieldLabel>Task category</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {(["application", "outreach"] as const).map((value) => {
                const selected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setValue("category", value, { shouldValidate: true });
                      const validTypes: readonly string[] =
                        value === "application" ? APPLICATION_TASK_TYPES : OUTREACH_TASK_TYPES;
                      if (!validTypes.includes(watch("type"))) {
                        setValue("type", "custom", { shouldValidate: true });
                      }
                    }}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors duration-150 ease-out",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {TASK_CATEGORY_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            placeholder="Send thank-you note"
            aria-invalid={!!errors.title}
            {...register("title")}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type">Task type</FieldLabel>
            <Select
              value={watch("type")}
              onValueChange={(value) =>
                setValue("type", value as TaskFormInput["type"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TASK_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="priority">Priority</FieldLabel>
            <Select
              value={watch("priority")}
              onValueChange={(value) =>
                setValue("priority", value as TaskFormInput["priority"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority} className="capitalize">
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
            <DatePicker
              id="dueDate"
              value={watch("dueDate")}
              onChange={(date) => setValue("dueDate", date)}
              placeholder="No due date"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="reminderTime">
              Reminder time{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="reminderTime" type="time" {...register("reminderTime")} />
          </Field>
        </div>

        {category === "application" ? (
          !lockJobId && (
            <Field>
              <FieldLabel htmlFor="jobId">Linked application</FieldLabel>
              <Select
                value={watch("jobId") || "none"}
                onValueChange={(value) =>
                  setValue("jobId", value === "none" ? undefined : value)
                }
              >
                <SelectTrigger id="jobId" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.position} · {job.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Optional — ties this task to an application.</FieldDescription>
            </Field>
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="contactName">Contact</FieldLabel>
                <Input id="contactName" placeholder="Jane Doe" {...register("contactName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="contactCompany">Company</FieldLabel>
                <Input id="contactCompany" placeholder="Acme Inc." {...register("contactCompany")} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="outreachChannel">Outreach channel</FieldLabel>
              <Select
                value={watch("outreachChannel") || "none"}
                onValueChange={(value) =>
                  setValue(
                    "outreachChannel",
                    value === "none" ? undefined : (value as TaskFormInput["outreachChannel"])
                  )
                }
              >
                <SelectTrigger id="outreachChannel" className="w-full">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {TASK_OUTREACH_CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {TASK_OUTREACH_CHANNEL_LABELS[channel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        <Field>
          <FieldLabel htmlFor="notes">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Textarea
            id="notes"
            rows={3}
            placeholder="What to mention or follow up on…"
            {...register("notes")}
          />
        </Field>

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
