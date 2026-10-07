"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createTask, updateTask } from "@/lib/actions/tasks";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Task, TaskCategory } from "@/types/database";
import type { TaskFormInput } from "@/lib/validations/task";

function toFormValues(task: Task): TaskFormInput {
  return {
    category: task.category,
    title: task.title,
    type: task.type,
    priority: task.priority,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    reminderTime: task.reminder_time ? task.reminder_time.slice(0, 5) : undefined,
    jobId: task.job_id ?? undefined,
    contactName: task.contact_name ?? undefined,
    contactCompany: task.contact_company ?? undefined,
    outreachChannel: task.outreach_channel ?? undefined,
    notes: task.notes ?? undefined,
  };
}

export function TaskFormSheet({
  jobs,
  lockJobId,
  lockCategory,
  task,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  jobs: { id: string; company_name: string; position: string }[];
  lockJobId?: string;
  lockCategory?: TaskCategory;
  task?: Task;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;
  const isEdit = !!task;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formId = React.useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]">
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4">
          <DialogTitle>{isEdit ? "Edit task" : "Add task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this task." : "Add a follow-up, deadline, or outreach reminder."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <TaskForm
            formId={formId}
            hideFooter
            onSubmittingChange={setIsSubmitting}
            jobs={jobs}
            lockJobId={lockJobId ?? task?.job_id ?? undefined}
            lockCategory={lockCategory ?? task?.category}
            defaultValues={task ? toFormValues(task) : undefined}
            onSubmit={async (values) => {
              const { error } = isEdit
                ? await updateTask(task!.id, values)
                : await createTask(values);
              if (!error) {
                toast.success(isEdit ? "Task updated." : "Task added.");
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
            {isEdit ? "Save changes" : "Add task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
