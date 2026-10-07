"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Loader2, Mail, Phone, Plus, User } from "lucide-react";
import { toast } from "sonner";

import { updateHrDetails } from "@/lib/actions/jobs";
import { hrDetailsSchema, type HrDetailsInput } from "@/lib/validations/job";
import type { Job } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function toFormValues(job: Job): HrDetailsInput {
  return {
    contactName: job.contact_name ?? undefined,
    contactEmail: job.contact_email ?? undefined,
    contactPhone: job.contact_phone ?? undefined,
    contactLinkedin: job.contact_linkedin ?? undefined,
  };
}

export function HrDetailsDialog({ job }: { job: Job }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HrDetailsInput>({
    resolver: zodResolver(hrDetailsSchema),
    defaultValues: toFormValues(job),
  });

  async function handle(values: HrDetailsInput) {
    setServerError(null);
    const { error } = await updateHrDetails(job.id, values);
    if (error) {
      setServerError(error);
      return;
    }
    toast.success("HR details saved.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setServerError(null);
          reset(toFormValues(job));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Add HR details">
          <Plus className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>HR / recruiter details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handle)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="hr-contactName" className="items-center">
                <User className="size-3.5 text-muted-foreground" />
                HR name
              </FieldLabel>
              <Input id="hr-contactName" placeholder="Jane Doe" {...register("contactName")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="hr-contactEmail" className="items-center">
                <Mail className="size-3.5 text-muted-foreground" />
                Contact email
              </FieldLabel>
              <Input
                id="hr-contactEmail"
                type="email"
                placeholder="recruiter@company.com"
                aria-invalid={!!errors.contactEmail}
                {...register("contactEmail")}
              />
              <FieldError errors={[errors.contactEmail]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="hr-contactPhone" className="items-center">
                <Phone className="size-3.5 text-muted-foreground" />
                Contact phone
              </FieldLabel>
              <Input
                id="hr-contactPhone"
                placeholder="+91 98765 43210"
                {...register("contactPhone")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="hr-contactLinkedin" className="items-center">
                <Link2 className="size-3.5 text-muted-foreground" />
                LinkedIn / Profile URL
              </FieldLabel>
              <Input
                id="hr-contactLinkedin"
                placeholder="https://linkedin.com/in/…"
                aria-invalid={!!errors.contactLinkedin}
                {...register("contactLinkedin")}
              />
              <FieldError errors={[errors.contactLinkedin]} />
            </Field>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          </FieldGroup>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
