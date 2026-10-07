"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { format, isPast } from "date-fns";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import { TASK_PRIORITY_META } from "@/lib/task-priority";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog";

export function TaskListItem({
  task,
  job,
  jobs,
  outreachLinkedinUrl,
}: {
  task: Task;
  job?: { company_name: string; position: string } | null;
  jobs: { id: string; company_name: string; position: string }[];
  outreachLinkedinUrl?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const done = task.status === "done";
  const overdue = !done && task.due_date && isPast(new Date(task.due_date));

  const secondary =
    task.category === "application"
      ? job
        ? `${job.position} · ${job.company_name}`
        : null
      : [task.contact_name, task.contact_company].filter(Boolean).join(" · ") || null;

  function handleToggle() {
    startTransition(async () => {
      const { error } = await setTaskStatus(
        task.id,
        done ? "pending" : "done",
        task.job_id
      );
      if (error) {
        toast.error(error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteTask(task.id, task.job_id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Task deleted.");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {/* The row's onClick opens Task Details. The dialogs below (TaskFormSheet,
          TaskDetailsDialog, AlertDialog) render via React portals, but React still
          bubbles their synthetic events up through this component's tree — not the
          DOM tree — so they're rendered as siblings here, outside the clickable row,
          to keep their internal clicks (e.g. a dialog's Close button) from re-opening
          Task Details immediately after closing. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailsOpen(true);
          }
        }}
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/40",
          done && "opacity-60"
        )}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={done}
            disabled={isPending}
            onCheckedChange={handleToggle}
            aria-label={done ? "Mark as pending" : "Mark as done"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              done && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </p>
          {secondary && (
            <p className="truncate text-xs text-muted-foreground">{secondary}</p>
          )}
        </div>

        <span
          className={cn(
            "hidden shrink-0 text-xs text-muted-foreground sm:inline",
            overdue && "font-medium text-destructive"
          )}
        >
          {task.due_date ? format(new Date(task.due_date), "MMM d") : "No due date"}
        </span>

        <Badge className={cn("shrink-0 text-xs font-normal", TASK_PRIORITY_META[task.priority].badgeClassName)}>
          {TASK_PRIORITY_META[task.priority].label}
        </Badge>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Task actions">
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TaskFormSheet jobs={jobs} task={task} open={editOpen} onOpenChange={setEditOpen} />
      <TaskDetailsDialog
        task={task}
        job={job}
        jobs={jobs}
        outreachLinkedinUrl={outreachLinkedinUrl}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
    </>
  );
}
