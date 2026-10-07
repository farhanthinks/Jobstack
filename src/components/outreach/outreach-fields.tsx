"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import type { OutreachInput } from "@/lib/validations/outreach";
import { OUTREACH_FOLLOWUP_STATUS_META, OUTREACH_TYPE_LABELS } from "@/lib/outreach-status";
import {
  OUTREACH_FOLLOWUP_STATUSES,
  OUTREACH_PERSON_TYPES,
  OUTREACH_TYPES,
} from "@/types/database";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERSON_TYPE_LABELS: Record<(typeof OUTREACH_PERSON_TYPES)[number], string> = {
  hr: "HR",
  recruiter: "Recruiter",
  other: "Other",
};

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

export function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function OptionalMark() {
  return <span className="font-normal text-muted-foreground"> (Optional)</span>;
}

export function OutreachFields({
  register,
  errors,
  watch,
  setValue,
}: {
  register: UseFormRegister<OutreachInput>;
  errors: FieldErrors<OutreachInput>;
  watch: UseFormWatch<OutreachInput>;
  setValue: UseFormSetValue<OutreachInput>;
}) {
  const personType = watch("personType");

  return (
    <FieldGroup className="gap-6">
      <div className="space-y-4">
        <SectionLabel>Contact Details</SectionLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="personName">
              Person Name <RequiredMark />
            </FieldLabel>
            <Input
              id="personName"
              placeholder="Jane Doe"
              aria-invalid={!!errors.personName}
              {...register("personName")}
            />
            <FieldError errors={[errors.personName]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="linkedinUrl">
              LinkedIn Profile URL <RequiredMark />
            </FieldLabel>
            <Input
              id="linkedinUrl"
              placeholder="https://linkedin.com/in/…"
              aria-invalid={!!errors.linkedinUrl}
              {...register("linkedinUrl")}
            />
            <FieldError errors={[errors.linkedinUrl]} />
          </Field>
        </div>

        <Field>
          <FieldLabel>
            Person Type <RequiredMark />
          </FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {OUTREACH_PERSON_TYPES.map((type) => {
              const selected = personType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setValue("personType", type, { shouldValidate: true });
                    if (type !== "other") {
                      setValue("personTypeOther", "", { shouldValidate: true });
                    }
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors duration-150 ease-out",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {PERSON_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
          <FieldError errors={[errors.personType]} />
        </Field>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            personType === "other" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <Field className="pt-0.5 pb-3.5">
              <FieldLabel htmlFor="personTypeOther">
                Person Type Name <RequiredMark />
              </FieldLabel>
              <Input
                id="personTypeOther"
                placeholder="Enter person type…"
                aria-invalid={!!errors.personTypeOther}
                {...register("personTypeOther")}
              />
              <FieldError errors={[errors.personTypeOther]} />
            </Field>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="companyName">
              Company <RequiredMark />
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
            <FieldLabel htmlFor="currentPosition">Current Position</FieldLabel>
            <Input
              id="currentPosition"
              placeholder="Engineering Manager"
              {...register("currentPosition")}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="companyLocation">Company Location</FieldLabel>
            <Input
              id="companyLocation"
              placeholder="Bengaluru, IN"
              {...register("companyLocation")}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">
              Email
              <OptionalMark />
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="phoneNumber">
            Phone Number
            <OptionalMark />
          </FieldLabel>
          <Input id="phoneNumber" placeholder="+91 98765 43210" {...register("phoneNumber")} />
        </Field>
      </div>

      <Separator />

      <div className="space-y-4">
        <SectionLabel>Outreach Details</SectionLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="outreachType">Outreach Type</FieldLabel>
            <Select
              value={watch("outreachType") ?? ""}
              onValueChange={(v) =>
                setValue("outreachType", v as OutreachInput["outreachType"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="outreachType" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {OUTREACH_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {OUTREACH_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="dateSent">
              Date Sent <RequiredMark />
            </FieldLabel>
            <DatePicker
              id="dateSent"
              value={watch("dateSent")}
              onChange={(date) => date && setValue("dateSent", date, { shouldValidate: true })}
              placeholder="Select a date"
            />
            <FieldError errors={[errors.dateSent]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="messageSent">
            Message Sent <RequiredMark />
          </FieldLabel>
          <Textarea
            id="messageSent"
            rows={5}
            placeholder="Paste the message you sent…"
            aria-invalid={!!errors.messageSent}
            {...register("messageSent")}
          />
          <FieldError errors={[errors.messageSent]} />
        </Field>
      </div>

      <Separator />

      <div className="space-y-4">
        <SectionLabel>Follow-up</SectionLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="followUpDate">Follow-up Date</FieldLabel>
            <DatePicker
              id="followUpDate"
              value={watch("followUpDate")}
              onChange={(date) => setValue("followUpDate", date)}
              placeholder="No follow-up set"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="followUpTime">
              Follow-up Time
              <OptionalMark />
            </FieldLabel>
            <Input id="followUpTime" type="time" {...register("followUpTime")} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="followUpStatus">Follow-up Status</FieldLabel>
          <Select
            value={watch("followUpStatus") ?? ""}
            onValueChange={(v) =>
              setValue("followUpStatus", v as OutreachInput["followUpStatus"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="followUpStatus" className="w-full">
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              {OUTREACH_FOLLOWUP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      OUTREACH_FOLLOWUP_STATUS_META[status].dotClassName
                    )}
                  />
                  {OUTREACH_FOLLOWUP_STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {watch("followUpDate") && (
          <FieldDescription>
            A matching Outreach Task will be created automatically on the Tasks page, and kept
            in sync if you change this date or time later.
          </FieldDescription>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <SectionLabel>Optional</SectionLabel>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea id="notes" rows={3} placeholder="Any other context…" {...register("notes")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="tags">Tags</FieldLabel>
          <Input id="tags" placeholder="referral, high-priority" {...register("tags")} />
          <FieldDescription>Separate multiple tags with commas.</FieldDescription>
        </Field>
      </div>
    </FieldGroup>
  );
}
