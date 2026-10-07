"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createJob } from "@/lib/actions/jobs";
import { JobForm } from "@/components/jobs/job-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddSavedJobDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Saved Job
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px]"
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4">
          <DialogTitle>Add Saved Job</DialogTitle>
          <DialogDescription>
            Keep track of a job you&apos;re interested in before you apply.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <JobForm
            formId="add-saved-job-form"
            hideFooter
            onSubmittingChange={setIsSubmitting}
            onSubmit={async (values) => {
              const { error } = await createJob(values);
              if (!error) {
                toast.success(`${values.companyName} saved.`);
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
          <Button type="submit" form="add-saved-job-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Add Saved Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
