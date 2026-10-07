"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowUpRight, Download, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDocument, setActiveMasterResume, setJobDocument } from "@/lib/actions/documents";
import type { Document } from "@/types/database";
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
import { OpenInOverleafButton } from "@/components/documents/open-in-overleaf-button";

const TYPE_LABELS: Record<Document["type"], string> = {
  master_resume: "Master resume",
  tailored_resume: "Tailored resume",
  cover_letter: "Cover letter",
  certificate: "Certificate",
  other: "Other",
};

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

type DocWithJob = Document & {
  jobs?: { company_name: string; position: string; job_code: string | null } | null;
};

export function DocumentDetailsDialog({
  document,
  signedUrl,
  open,
  onOpenChange,
}: {
  document: DocWithJob | null;
  signedUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleSetActiveMaster() {
    if (!document) return;
    startTransition(async () => {
      const { error } = await setActiveMasterResume(document.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Set as your active master resume.");
      router.refresh();
    });
  }

  function handleUseForApplication() {
    if (!document?.job_id) return;
    const field =
      document.type === "tailored_resume" ? "resume_document_id" : "cover_letter_document_id";
    startTransition(async () => {
      const { error } = await setJobDocument(document.job_id!, field, document.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Set as the document used for this application.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!document) return;
    startTransition(async () => {
      const { error } = await deleteDocument(document.id, document.job_id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Document deleted.");
      onOpenChange(false);
      router.refresh();
    });
  }

  const canUseForApplication =
    document?.job_id &&
    (document.type === "tailored_resume" || document.type === "cover_letter");
  const canOpenInOverleaf = document?.type === "tailored_resume" && !!document.latex_source;
  const canSetActiveMaster = document?.type === "master_resume" && !document.is_active_master;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        {document && (
          <>
            <DialogHeader className="shrink-0 gap-1 border-b px-5 py-4">
              <DialogTitle className="truncate pr-7 text-lg leading-tight font-semibold">
                {document.file_name ?? "Document"}
              </DialogTitle>
              <DialogDescription>{TYPE_LABELS[document.type]}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoField label="Version" value={`v${document.version}`} />
                <InfoField
                  label="Created"
                  value={format(new Date(document.created_at), "MMM d, yyyy")}
                />
                {document.ats_score !== null && (
                  <InfoField
                    label="ATS score at generation"
                    value={
                      <Badge className="font-normal">{document.ats_score}/100</Badge>
                    }
                  />
                )}
                {document.source_master_resume_id && (
                  <InfoField label="Source" value="Active master resume" />
                )}
                {document.type === "master_resume" && (
                  <InfoField
                    label="Status"
                    value={
                      document.is_active_master ? (
                        <Badge className="bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400">
                          Active
                        </Badge>
                      ) : (
                        "Inactive"
                      )
                    }
                  />
                )}
              </div>

              {document.jobs && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <SectionLabel>Application</SectionLabel>
                    <InfoField
                      label="Job"
                      value={
                        document.jobs.job_code
                          ? `${document.jobs.job_code} · ${document.jobs.position}`
                          : document.jobs.position
                      }
                    />
                    <InfoField label="Company" value={document.jobs.company_name} />
                    <Link
                      href={`/applications/${document.job_id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      View Application
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t px-5 py-4">
              {signedUrl && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    Open
                  </a>
                </Button>
              )}
              {signedUrl && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={document.file_name ?? undefined}
                  >
                    <Download className="size-3.5" />
                    Download
                  </a>
                </Button>
              )}
              {canOpenInOverleaf && (
                <OpenInOverleafButton texSource={document.latex_source!} />
              )}
              {canSetActiveMaster && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetActiveMaster}
                  disabled={isPending}
                >
                  Set as Active
                </Button>
              )}
              {canUseForApplication && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseForApplication}
                  disabled={isPending}
                >
                  Use for Application
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &ldquo;{document.file_name}&rdquo; will be permanently removed from
                      storage. This can&apos;t be undone.
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
  );
}
