"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateJob } from "@/lib/actions/jobs";
import { JobForm } from "@/components/jobs/job-form";
import type { JobFormInput } from "@/lib/validations/job";
import type { Job } from "@/types/database";

function toFormValues(job: Job): JobFormInput {
  return {
    companyName: job.company_name,
    position: job.position,
    platform: job.platform,
    jobDescription: job.job_description,
    jobUrl: job.job_url ?? undefined,
    location: job.location ?? undefined,
    workMode: job.work_mode ?? undefined,
    salary: job.salary ?? undefined,
    contactName: job.contact_name ?? undefined,
    contactEmail: job.contact_email ?? undefined,
    contactPhone: job.contact_phone ?? undefined,
    contactLinkedin: job.contact_linkedin ?? undefined,
    applicationDeadline: job.application_deadline
      ? new Date(job.application_deadline)
      : undefined,
    reminderDate: job.reminder_date ? new Date(job.reminder_date) : undefined,
    reminderTime: job.reminder_time ? job.reminder_time.slice(0, 5) : undefined,
  };
}

export function EditJobForm({ job }: { job: Job }) {
  const router = useRouter();

  return (
    <JobForm
      submitLabel="Save changes"
      defaultValues={toFormValues(job)}
      showContactFields={false}
      onSubmit={async (values) => {
        const { error } = await updateJob(job.id, values);
        if (!error) {
          toast.success("Changes saved.");
          router.refresh();
        }
        return { error };
      }}
    />
  );
}
