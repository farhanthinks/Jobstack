"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { Outreach, OutreachStatus } from "@/types/database";
import { CompanyAvatar } from "@/components/jobs/company-avatar";
import { OutreachStatusButtonGroup } from "@/components/outreach/outreach-status-button-group";
import { EditOutreachDialog } from "@/components/outreach/edit-outreach-dialog";
import { ResponseDetailsDialog } from "@/components/outreach/response-details-dialog";
import { deleteOutreach } from "@/lib/actions/outreach";
import {
  OUTREACH_FOLLOWUP_STATUS_META,
  OUTREACH_PERSON_TYPE_LABELS,
  OUTREACH_TYPE_LABELS,
} from "@/lib/outreach-status";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function InfoField({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("min-w-0 space-y-0.5", full && "col-span-2")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

export function OutreachDetailDialog({
  outreach,
  open,
  onOpenChange,
}: {
  outreach: Outreach | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = React.useTransition();
  const [responseDialogOpen, setResponseDialogOpen] = React.useState(false);

  function handleStatusChange(next: OutreachStatus) {
    if (next === "replied") setResponseDialogOpen(true);
  }

  function handleDelete() {
    if (!outreach) return;
    startDelete(async () => {
      const { error } = await deleteOutreach(outreach.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Outreach to ${outreach.person_name} removed.`);
      onOpenChange(false);
      router.refresh();
    });
  }

  const personTypeLabel =
    outreach?.person_type === "other" && outreach.person_type_other
      ? outreach.person_type_other
      : outreach
        ? OUTREACH_PERSON_TYPE_LABELS[outreach.person_type]
        : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 duration-200 sm:max-w-[480px]">
        {outreach && (
          <>
            <DialogHeader className="shrink-0 gap-0 border-b px-5 py-4">
              <div className="flex items-start gap-3 pr-7">
                <CompanyAvatar name={outreach.person_name} className="size-9 shrink-0 text-sm" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <DialogTitle className="truncate text-lg leading-tight font-semibold">
                    {outreach.person_name}
                  </DialogTitle>
                  <DialogDescription className="truncate">
                    {personTypeLabel} · {outreach.company_name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <div className="space-y-2">
                <SectionLabel>Status</SectionLabel>
                <OutreachStatusButtonGroup
                  outreachId={outreach.id}
                  status={outreach.status}
                  onStatusChange={handleStatusChange}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <SectionLabel>Contact</SectionLabel>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoField
                    full={!outreach.current_position}
                    label="LinkedIn"
                    value={
                      <a
                        href={outreach.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View profile
                        <ExternalLink className="size-3" />
                      </a>
                    }
                  />
                  {outreach.current_position && (
                    <InfoField label="Current Position" value={outreach.current_position} />
                  )}
                  {outreach.company_location && (
                    <InfoField label="Company Location" value={outreach.company_location} />
                  )}
                  {outreach.email && (
                    <InfoField
                      label="Email"
                      value={
                        <a
                          href={`mailto:${outreach.email}`}
                          className="text-primary hover:underline"
                        >
                          {outreach.email}
                        </a>
                      }
                    />
                  )}
                  {outreach.phone_number && (
                    <InfoField label="Phone Number" value={outreach.phone_number} />
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SectionLabel>Outreach</SectionLabel>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoField
                    label="Type"
                    value={OUTREACH_TYPE_LABELS[outreach.outreach_type]}
                  />
                  <InfoField
                    label="Date Sent"
                    value={format(new Date(outreach.date_sent), "MMM d, yyyy")}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Message Sent</p>
                  <p className="max-h-40 overflow-y-auto rounded-lg border border-border/50 bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {outreach.message_sent}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionLabel>Response</SectionLabel>
                  <button
                    type="button"
                    onClick={() => setResponseDialogOpen(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {outreach.response_date || outreach.response_notes ? "Edit" : "Add"}
                  </button>
                </div>
                {outreach.response_date || outreach.response_notes ? (
                  <>
                    {outreach.response_date && (
                      <InfoField
                        label="Response Date"
                        value={format(new Date(outreach.response_date), "MMM d, yyyy")}
                      />
                    )}
                    {outreach.response_notes && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm">{outreach.response_notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No response details yet.</p>
                )}
              </div>

              {(outreach.follow_up_date || outreach.follow_up_status) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <SectionLabel>Follow-up</SectionLabel>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {outreach.follow_up_date && (
                        <InfoField
                          label="Follow-up Date"
                          value={format(new Date(outreach.follow_up_date), "MMM d, yyyy")}
                        />
                      )}
                      {outreach.follow_up_status && (
                        <InfoField
                          label="Follow-up Status"
                          value={
                            <Badge
                              className={cn(
                                "font-normal",
                                OUTREACH_FOLLOWUP_STATUS_META[outreach.follow_up_status]
                                  .badgeClassName
                              )}
                            >
                              {OUTREACH_FOLLOWUP_STATUS_META[outreach.follow_up_status].label}
                            </Badge>
                          }
                        />
                      )}
                    </div>
                  </div>
                </>
              )}

              {(outreach.notes || (outreach.tags && outreach.tags.length > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <SectionLabel>Notes</SectionLabel>
                    {outreach.notes && <p className="text-sm">{outreach.notes}</p>}
                    {outreach.tags && outreach.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {outreach.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t px-5 py-4">
              <EditOutreachDialog
                outreach={outreach}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                }
              />
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
                    <AlertDialogTitle>Delete this outreach record?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes your outreach to {outreach.person_name}. This
                      can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
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
      <ResponseDetailsDialog
        outreach={outreach}
        open={responseDialogOpen}
        onOpenChange={setResponseDialogOpen}
      />
    </Dialog>
  );
}
