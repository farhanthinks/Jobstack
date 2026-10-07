"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { createAppliedJob, getMasterResumeOption } from "@/lib/actions/jobs";
import { addAppliedJobSchema, type AddAppliedJobInput } from "@/lib/validations/job";
import { JOB_PLATFORMS } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

export function AddAppliedJobDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [masterResume, setMasterResume] = React.useState<
    { id: string; label: string } | null | undefined
  >(undefined);

  React.useEffect(() => {
    getMasterResumeOption().then(setMasterResume);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddAppliedJobInput>({
    resolver: zodResolver(addAppliedJobSchema),
  });

  async function onSubmit(values: AddAppliedJobInput) {
    const { error } = await createAppliedJob(values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`${values.companyName} added to Applications under Applied.`);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          Add Applied Job
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]"
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4">
          <DialogTitle>Add Applied Job</DialogTitle>
          <DialogDescription>
            Log a job you&apos;ve already applied to — it goes straight into
            your Applications under Applied.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-applied-job-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <FieldGroup className="gap-6">
            <div className="space-y-4">
              <SectionLabel>Job Details</SectionLabel>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="position">
                    Job Title <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="position"
                    placeholder="Senior Frontend Engineer"
                    aria-invalid={!!errors.position}
                    {...register("position")}
                  />
                  <FieldError errors={[errors.position]} />
                </Field>

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
              </div>

              <Field>
                <FieldLabel>
                  Platform <RequiredMark />
                </FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_PLATFORMS.map((platform) => {
                    const selected = watch("platform") === platform;
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          setValue("platform", platform, { shouldValidate: true });
                          if (platform !== "Other") {
                            setValue("platformOther", "", { shouldValidate: true });
                          }
                        }}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors duration-150 ease-out",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
                <FieldError errors={[errors.platform]} />
              </Field>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  watch("platform") === "Other"
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <Field className="pt-0.5 pb-3.5">
                    <FieldLabel htmlFor="platformOther">
                      Platform Name <RequiredMark />
                    </FieldLabel>
                    <Input
                      id="platformOther"
                      placeholder="Enter platform name…"
                      aria-invalid={!!errors.platformOther}
                      {...register("platformOther")}
                    />
                    <FieldError errors={[errors.platformOther]} />
                  </Field>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input id="location" placeholder="Remote · Bengaluru, IN" {...register("location")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="salary">Salary</FieldLabel>
                  <Input id="salary" placeholder="₹28–35 LPA" {...register("salary")} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="jobUrl">Job URL</FieldLabel>
                <Input
                  id="jobUrl"
                  placeholder="https://…"
                  aria-invalid={!!errors.jobUrl}
                  {...register("jobUrl")}
                />
                <FieldError errors={[errors.jobUrl]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="jobDescription">Job description</FieldLabel>
                <Textarea
                  id="jobDescription"
                  rows={8}
                  placeholder="Paste the full job description…"
                  aria-invalid={!!errors.jobDescription}
                  {...register("jobDescription")}
                />
                <FieldDescription className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                  <Sparkles className="size-3" />
                  AI Assistant uses this to compute your match score, spot
                  missing keywords, and tailor your resume.
                </FieldDescription>
                <FieldError errors={[errors.jobDescription]} />
              </Field>
            </div>

            <Separator />

            <div className="space-y-4">
              <SectionLabel>Recruiter / Contact</SectionLabel>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="contactName">HR Name</FieldLabel>
                  <Input id="contactName" placeholder="Jane Doe" {...register("contactName")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
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
                  <FieldLabel htmlFor="contactPhone">Phone Number</FieldLabel>
                  <Input id="contactPhone" placeholder="+91 98765 43210" {...register("contactPhone")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contactLinkedin">LinkedIn / Profile URL</FieldLabel>
                  <Input
                    id="contactLinkedin"
                    placeholder="https://linkedin.com/in/…"
                    aria-invalid={!!errors.contactLinkedin}
                    {...register("contactLinkedin")}
                  />
                  <FieldError errors={[errors.contactLinkedin]} />
                </Field>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <SectionLabel>Application Details</SectionLabel>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="applicationDate">
                    Application date <RequiredMark />
                  </FieldLabel>
                  <DatePicker
                    id="applicationDate"
                    value={watch("applicationDate")}
                    onChange={(date) =>
                      date && setValue("applicationDate", date, { shouldValidate: true })
                    }
                    placeholder="Select a date"
                  />
                  <FieldError errors={[errors.applicationDate]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="resumeId">
                    Resume used <RequiredMark />
                  </FieldLabel>
                  <Select
                    value={watch("resumeId")}
                    onValueChange={(v) => setValue("resumeId", v, { shouldValidate: true })}
                    disabled={masterResume === undefined}
                  >
                    <SelectTrigger id="resumeId" className="w-full">
                      <SelectValue
                        placeholder={
                          masterResume === undefined ? "Loading…" : "Select a resume"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {masterResume && (
                        <SelectItem value={masterResume.id}>{masterResume.label}</SelectItem>
                      )}
                      <SelectItem value="none">None — add later</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.resumeId]} />
                </Field>
              </div>
            </div>
          </FieldGroup>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-applied-job-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Add Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
