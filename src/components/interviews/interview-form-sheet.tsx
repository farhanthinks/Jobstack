"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createInterview, updateInterview } from "@/lib/actions/interviews";
import { InterviewForm } from "@/components/interviews/interview-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Interview } from "@/types/database";
import type { InterviewFormInput } from "@/lib/validations/interview";

function toFormValues(interview: Interview): InterviewFormInput {
  const scheduled = interview.scheduled_at ? new Date(interview.scheduled_at) : undefined;
  return {
    jobId: interview.job_id,
    roundType: interview.round_type,
    mode: interview.mode,
    scheduledAt: scheduled,
    scheduledTime: scheduled
      ? `${String(scheduled.getHours()).padStart(2, "0")}:${String(
          scheduled.getMinutes()
        ).padStart(2, "0")}`
      : undefined,
    durationMinutes: interview.duration_minutes ? String(interview.duration_minutes) : undefined,
    meetingLinkOrAddress: interview.meeting_link_or_address ?? undefined,
    location: interview.location ?? undefined,
    interviewerName: interview.interviewer_name ?? undefined,
    interviewerEmail: interview.interviewer_email ?? undefined,
    prepNotes: interview.prep_notes ?? undefined,
    reminderDate: interview.reminder_date ? new Date(interview.reminder_date) : undefined,
    reminderTime: interview.reminder_time ? interview.reminder_time.slice(0, 5) : undefined,
  };
}

export function InterviewFormSheet({
  jobs,
  lockJobId,
  interview,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  jobs: { id: string; company_name: string; position: string }[];
  lockJobId?: string;
  interview?: Interview;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;
  const isEdit = !!interview;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formId = React.useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px]">
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4">
          <DialogTitle>{isEdit ? "Edit interview" : "Add interview"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the round details or prep notes."
              : "Schedule a round and keep prep notes with it."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <InterviewForm
            formId={formId}
            hideFooter
            onSubmittingChange={setIsSubmitting}
            jobs={jobs}
            lockJobId={lockJobId ?? interview?.job_id}
            defaultValues={interview ? toFormValues(interview) : undefined}
            onSubmit={async (values) => {
              const { error } = isEdit
                ? await updateInterview(interview!.id, values)
                : await createInterview(values);
              if (!error) {
                toast.success(isEdit ? "Interview updated." : "Interview scheduled.");
                setOpen(false);
                router.refresh();
              }
              return { error };
            }}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add interview"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
