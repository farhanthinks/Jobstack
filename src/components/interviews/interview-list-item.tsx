"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MapPin, MoreVertical, Pencil, Phone, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

import { deleteInterview } from "@/lib/actions/interviews";
import { INTERVIEW_MODE_LABELS, INTERVIEW_ROUND_TYPE_LABELS } from "@/lib/interview-meta";
import type { Interview } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { InterviewFormSheet } from "@/components/interviews/interview-form-sheet";
import { InterviewDetailsDialog } from "@/components/interviews/interview-details-dialog";

const MODE_ICONS = { online: Video, phone: Phone, in_person: MapPin } as const;

export function InterviewListItem({
  interview,
  job,
  jobs,
}: {
  interview: Interview;
  job?: { company_name: string; position: string } | null;
  jobs: { id: string; company_name: string; position: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const ModeIcon = MODE_ICONS[interview.mode];

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteInterview(interview.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Interview deleted.");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
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
        className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/40"
      >
        <Badge variant="secondary" className="shrink-0 font-normal">
          {INTERVIEW_ROUND_TYPE_LABELS[interview.round_type]}
        </Badge>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {job
              ? `${job.position} · ${job.company_name}`
              : interview.scheduled_at
                ? format(new Date(interview.scheduled_at), "MMM d, yyyy 'at' h:mm a")
                : "Not scheduled"}
          </p>
          {job && (
            <p className="truncate text-xs text-muted-foreground">
              {interview.scheduled_at
                ? format(new Date(interview.scheduled_at), "MMM d, yyyy 'at' h:mm a")
                : "Not scheduled"}
            </p>
          )}
        </div>

        <Badge variant="outline" className="hidden shrink-0 gap-1 font-normal sm:inline-flex">
          <ModeIcon className="size-3" />
          {INTERVIEW_MODE_LABELS[interview.mode]}
        </Badge>

        <span className="hidden shrink-0 text-xs font-medium text-primary sm:inline">
          View Details
        </span>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Interview actions">
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

      <InterviewFormSheet
        jobs={jobs}
        interview={interview}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <InterviewDetailsDialog
        interview={interview}
        job={job}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={() => {
          setDetailsOpen(false);
          setEditOpen(true);
        }}
        onRequestDelete={() => {
          setDetailsOpen(false);
          setDeleteOpen(true);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the round and its prep notes. This can&apos;t be undone.
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
