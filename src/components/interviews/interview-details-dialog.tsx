"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, ExternalLink, MapPin, Pencil, Phone, Trash2, Video } from "lucide-react";

import { INTERVIEW_MODE_LABELS, INTERVIEW_ROUND_TYPE_LABELS, formatInterviewDuration } from "@/lib/interview-meta";
import type { Interview } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MODE_ICONS = { online: Video, phone: Phone, in_person: MapPin } as const;

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

export function InterviewDetailsDialog({
  interview,
  job,
  open,
  onOpenChange,
  onEdit,
  onRequestDelete,
}: {
  interview: Interview | null;
  job?: { company_name: string; position: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onRequestDelete: () => void;
}) {
  const ModeIcon = interview ? MODE_ICONS[interview.mode] : Video;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        {interview && (
          <>
            <DialogHeader className="shrink-0 gap-1 border-b px-5 py-4">
              <DialogTitle className="truncate pr-7 text-lg leading-tight font-semibold">
                {INTERVIEW_ROUND_TYPE_LABELS[interview.round_type]} Interview
              </DialogTitle>
              <DialogDescription>
                {job
                  ? `${job.position} · ${job.company_name}`
                  : interview.scheduled_at
                    ? format(new Date(interview.scheduled_at), "MMM d, yyyy 'at' h:mm a")
                    : "Not scheduled"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoField
                  label="Interview mode"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <ModeIcon className="size-3.5 text-muted-foreground" />
                      {INTERVIEW_MODE_LABELS[interview.mode]}
                    </span>
                  }
                />
                <InfoField
                  label="Duration"
                  value={
                    interview.duration_minutes
                      ? formatInterviewDuration(interview.duration_minutes)
                      : "Not set"
                  }
                />
                <InfoField
                  label="Date"
                  value={
                    interview.scheduled_at
                      ? format(new Date(interview.scheduled_at), "MMM d, yyyy")
                      : "Not scheduled"
                  }
                />
                <InfoField
                  label="Time"
                  value={
                    interview.scheduled_at
                      ? format(new Date(interview.scheduled_at), "h:mm a")
                      : "Not set"
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <SectionLabel>Application</SectionLabel>
                {job && (
                  <InfoField
                    label="Linked application"
                    value={`${job.position} · ${job.company_name}`}
                  />
                )}
                <Link
                  href={`/applications/${interview.job_id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View Application
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {(interview.meeting_link_or_address || interview.location) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <SectionLabel>
                      {interview.mode === "in_person" ? "Location" : "Meeting Link"}
                    </SectionLabel>
                    {interview.mode === "in_person" && interview.location ? (
                      <p className="text-sm font-medium">{interview.location}</p>
                    ) : interview.meeting_link_or_address ? (
                      <a
                        href={interview.meeting_link_or_address}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        {interview.meeting_link_or_address}
                        <ExternalLink className="size-3.5 shrink-0" />
                      </a>
                    ) : null}
                  </div>
                </>
              )}

              {(interview.interviewer_name || interview.interviewer_email) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <SectionLabel>Interviewer</SectionLabel>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <InfoField label="Name" value={interview.interviewer_name || "Not set"} />
                      <InfoField
                        label="Email"
                        value={
                          interview.interviewer_email ? (
                            <a
                              href={`mailto:${interview.interviewer_email}`}
                              className="text-primary hover:underline"
                            >
                              {interview.interviewer_email}
                            </a>
                          ) : (
                            "Not set"
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-1">
                <SectionLabel>Preparation Notes</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  {interview.prep_notes || "No notes added."}
                </p>
              </div>

              {(interview.reminder_date || interview.reminder_time) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoField
                      label="Reminder date"
                      value={
                        interview.reminder_date
                          ? format(new Date(interview.reminder_date), "MMM d, yyyy")
                          : "Not set"
                      }
                    />
                    <InfoField
                      label="Reminder time"
                      value={
                        interview.reminder_time
                          ? formatReminderTime(interview.reminder_time)
                          : "10:00 AM (default)"
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t px-5 py-4">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onEdit}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                onClick={onRequestDelete}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
