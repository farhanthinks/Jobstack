"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateJob } from "@/lib/actions/jobs";
import { JobForm } from "@/components/jobs/job-form";
import type { JobFormInput } from "@/lib/validations/job";
import type { Job } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function toFormValues(job: Job): JobFormInput {
  return {
    companyName: job.company_name,
    position: job.position,
    platform: job.platform,
    jobDescription: job.job_description,
    jobUrl: job.job_url ?? undefined,
    location: job.location ?? undefined,
    salary: job.salary ?? undefined,
    contactEmail: job.contact_email ?? undefined,
    contactPhone: job.contact_phone ?? undefined,
    applicationDeadline: job.application_deadline
      ? new Date(job.application_deadline)
      : undefined,
    reminderDate: job.reminder_date ? new Date(job.reminder_date) : undefined,
    reminderTime: job.reminder_time ? job.reminder_time.slice(0, 5) : undefined,
  };
}

export function EditJobDialog({
  job,
  trigger,
}: {
  job: Job;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Edit application</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <JobForm
            submitLabel="Save changes"
            defaultValues={toFormValues(job)}
            onCancel={() => setOpen(false)}
            onSubmit={async (values) => {
              const { error } = await updateJob(job.id, values);
              if (!error) {
                toast.success("Changes saved.");
                setOpen(false);
                router.refresh();
              }
              return { error };
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
