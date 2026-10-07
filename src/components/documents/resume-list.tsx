"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDocument } from "@/lib/actions/documents";
import type { Document } from "@/types/database";
import { Badge } from "@/components/ui/badge";
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

type ResumeDoc = Document & {
  jobs: { company_name: string; position: string; job_code: string | null } | null;
};

function scoreColor(score: number) {
  if (score >= 75) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-destructive/10 text-destructive";
}

function ResumeRow({ document, signedUrl }: { document: ResumeDoc; signedUrl?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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
            <p className="truncate text-sm font-medium">
              {document.file_name ?? "Resume"} <span className="text-muted-foreground">· v{document.version}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[
                document.jobs?.job_code,
                document.jobs?.position,
                document.jobs?.company_name,
                format(new Date(document.created_at), "MMM d, yyyy"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {document.ats_score !== null && (
            <Badge className={scoreColor(document.ats_score)}>ATS {document.ats_score}%</Badge>
          )}
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
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
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

export function ResumeList({
  documents,
  signedUrls,
}: {
  documents: ResumeDoc[];
  signedUrls: Record<string, string>;
}) {
  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No generated resumes yet. Head to the AI Assistant to generate an
        ATS-tailored resume and save it here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <ResumeRow key={doc.id} document={doc} signedUrl={signedUrls[doc.file_url ?? ""]} />
      ))}
    </div>
  );
}
