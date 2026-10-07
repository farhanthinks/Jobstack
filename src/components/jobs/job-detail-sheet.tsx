"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowUpRight, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { JobCardData } from "@/components/jobs/job-card";
import { CompanyAvatar } from "@/components/jobs/company-avatar";
import { getJobLogoUrl } from "@/lib/job-logo";
import { StatusButtonGroup } from "@/components/jobs/status-button-group";
import { EditJobDialog } from "@/components/jobs/edit-job-dialog";
import { deleteJob } from "@/lib/actions/jobs";
import { cn } from "@/lib/utils";
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

export function JobDetailSheet({
  job,
  open,
  onOpenChange,
}: {
  job: JobCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = React.useTransition();

  function handleDelete() {
    if (!job) return;
    startDelete(async () => {
      const { error } = await deleteJob(job.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`${job.company_name} removed from your Applications.`);
      onOpenChange(false);
      router.refresh();
    });
  }

  const hasApplicationInfo = !!(job?.applied_at || job?.resumeFileName || job?.followUpDueDate);
  const showDeadlineInApplication = job?.status === "saved" && !!job?.application_deadline;
  const platformLabel =
    job?.platform === "Other" && job.platform_other ? job.platform_other : job?.platform;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-full flex-col gap-0 p-0 duration-200 sm:max-w-[460px]">
        {job && (
          <>
            <DialogHeader className="shrink-0 gap-0 border-b px-5 py-4">
              <div className="flex items-start gap-3 pr-7">
                <CompanyAvatar
                  name={job.company_name}
                  logoUrl={getJobLogoUrl(job)}
                  className="size-9 shrink-0 text-sm"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <DialogTitle className="truncate text-lg leading-tight font-semibold">
                    {job.position}
                  </DialogTitle>
                  <DialogDescription className="truncate">
                    {job.company_name}
                    {job.job_code && (
                      <span className="ml-1.5 font-mono text-muted-foreground/70">
                        · {job.job_code}
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 px-5 py-4">
              <div className="space-y-2">
                <SectionLabel>Status</SectionLabel>
                <StatusButtonGroup jobId={job.id} status={job.status} />
              </div>

              <Separator />

              <div className="space-y-3">
                <SectionLabel>Job Information</SectionLabel>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {job.job_code && (
                    <InfoField
                      label="Job ID"
                      value={<span className="font-mono">{job.job_code}</span>}
                    />
                  )}
                  {job.location && <InfoField label="Location" value={job.location} />}
                  <InfoField label="Platform" value={platformLabel} />
                  {job.salary && <InfoField label="Salary" value={job.salary} />}
                  {job.match_score != null && (
                    <InfoField
                      label="Match score"
                      value={
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Sparkles className="size-3" />
                          {job.match_score}% match
                        </span>
                      }
                    />
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SectionLabel>Application</SectionLabel>
                {hasApplicationInfo || showDeadlineInApplication ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {job.applied_at && (
                      <InfoField
                        label="Applied"
                        value={format(new Date(job.applied_at), "MMM d, yyyy")}
                      />
                    )}
                    {job.followUpDueDate && (
                      <InfoField
                        label="Follow-up"
                        value={format(new Date(job.followUpDueDate), "MMM d, yyyy")}
                      />
                    )}
                    {job.resumeFileName && (
                      <InfoField label="Resume used" value={job.resumeFileName} />
                    )}
                    {showDeadlineInApplication && (
                      <InfoField
                        label="Deadline"
                        value={format(new Date(job.application_deadline!), "MMM d, yyyy")}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not applied yet.</p>
                )}
              </div>
            </div>

            <div className="shrink-0 space-y-2.5 border-t px-5 py-4">
              <div className="flex gap-2">
                <EditJobDialog
                  job={job}
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
                      <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes {job.company_name} and its interviews,
                        tasks, and AI generations. This can&apos;t be undone.
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

              <Button asChild className="w-full">
                <Link href={`/applications/${job.job_code ?? job.id}`}>
                  Open Full Details
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
