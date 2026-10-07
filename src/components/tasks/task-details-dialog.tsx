"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowUpRight, CheckCircle2, Circle, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import { TASK_PRIORITY_META } from "@/lib/task-priority";
import { TASK_OUTREACH_CHANNEL_LABELS, TASK_STATUS_META, TASK_TYPE_LABELS } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function formatReminderTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return format(d, "h:mm a");
}

export function TaskDetailsDialog({
  task,
  job,
  jobs,
  outreachLinkedinUrl,
  open,
  onOpenChange,
}: {
  task: Task | null;
  job?: { company_name: string; position: string } | null;
  jobs: { id: string; company_name: string; position: string }[];
  outreachLinkedinUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const done = task?.status === "done";

  function handleToggleStatus() {
    if (!task) return;
    startTransition(async () => {
      const { error } = await setTaskStatus(task.id, done ? "pending" : "done", task.job_id);
      if (error) {
        toast.error(error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!task) return;
    startTransition(async () => {
      const { error } = await deleteTask(task.id, task.job_id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Task deleted.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          {task && (
            <>
              <DialogHeader className="shrink-0 gap-1 border-b px-5 py-4">
                <DialogTitle className="truncate pr-7 text-lg leading-tight font-semibold">
                  {task.title}
                </DialogTitle>
                <DialogDescription>
                  {task.category === "application" ? "Application Task" : "Outreach Task"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoField label="Task Type" value={TASK_TYPE_LABELS[task.type]} />
                  <InfoField
                    label="Priority"
                    value={
                      <Badge
                        className={cn(
                          "font-normal",
                          TASK_PRIORITY_META[task.priority].badgeClassName
                        )}
                      >
                        {TASK_PRIORITY_META[task.priority].label}
                      </Badge>
                    }
                  />
                  <InfoField
                    label="Due Date"
                    value={task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "Not set"}
                  />
                  <InfoField
                    label="Reminder Time"
                    value={task.reminder_time ? formatReminderTime(task.reminder_time) : "Not set"}
                  />
                </div>

                <Separator />

                {task.category === "application" ? (
                  <div className="space-y-2">
                    <SectionLabel>Application</SectionLabel>
                    {job ? (
                      <InfoField label="Linked Application" value={`${job.position} · ${job.company_name}`} />
                    ) : (
                      <p className="text-sm text-muted-foreground">No application linked.</p>
                    )}
                    {task.job_id && (
                      <Link
                        href={`/applications/${task.job_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View Application
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SectionLabel>Contact</SectionLabel>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <InfoField label="Contact Name" value={task.contact_name || "Not set"} />
                      <InfoField label="Company" value={task.contact_company || "Not set"} />
                      <InfoField
                        label="Outreach Type"
                        value={
                          task.outreach_channel
                            ? TASK_OUTREACH_CHANNEL_LABELS[task.outreach_channel]
                            : "Not set"
                        }
                      />
                    </div>
                    {outreachLinkedinUrl && (
                      <a
                        href={outreachLinkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View LinkedIn Profile
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-1">
                  <SectionLabel>Notes</SectionLabel>
                  <p className="text-sm text-muted-foreground">{task.notes || "No notes added."}</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <SectionLabel>Status</SectionLabel>
                  <Badge className={cn("font-normal", TASK_STATUS_META[task.status].badgeClassName)}>
                    {TASK_STATUS_META[task.status].label}
                  </Badge>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 border-t px-5 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleToggleStatus}
                  disabled={isPending}
                >
                  {done ? <Circle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                  {done ? "Mark Pending" : "Mark Complete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    onOpenChange(false);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &ldquo;{task.title}&rdquo; will be permanently removed. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {task && <TaskFormSheet jobs={jobs} task={task} open={editOpen} onOpenChange={setEditOpen} />}
    </>
  );
}
