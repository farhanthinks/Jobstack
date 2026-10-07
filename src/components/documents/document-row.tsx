"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDocument } from "@/lib/actions/documents";
import type { Document } from "@/types/database";
import { Button } from "@/components/ui/button";
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
import { DocumentDetailsDialog } from "@/components/documents/document-details-dialog";

const TYPE_LABEL: Record<Document["type"], string> = {
  master_resume: "Master resume",
  tailored_resume: "Tailored resume",
  cover_letter: "Cover letter",
  certificate: "Certificate",
  other: "Other",
};

type DocWithJob = Document & {
  jobs?: { company_name: string; position: string; job_code: string | null } | null;
};

export function DocumentRow({
  document,
  signedUrl,
  subtitle,
}: {
  document: DocWithJob;
  signedUrl?: string;
  /** Overrides the default "{Type} v{version}" subtitle — used by the Master Resume card ("Current"). */
  subtitle?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const resolvedSubtitle =
    subtitle ??
    (document.type === "tailored_resume" || document.type === "cover_letter"
      ? `${TYPE_LABEL[document.type]} v${document.version}`
      : TYPE_LABEL[document.type]);

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteDocument(document.id, document.job_id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Document deleted.");
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
        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors duration-150 hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{document.file_name ?? "Document"}</p>
            <p className="text-xs text-muted-foreground">
              {resolvedSubtitle} · {format(new Date(document.created_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {signedUrl && (
            <Button variant="ghost" size="icon-sm" aria-label="Download" asChild>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete document"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <DocumentDetailsDialog
        document={document}
        signedUrl={signedUrl}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {document.file_name} will be permanently removed from storage. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
