"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { setJobDocument } from "@/lib/actions/documents";
import type { Document } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DocumentRow } from "@/components/documents/document-row";
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";

export function JobDocumentsCard({
  jobId,
  resumeDocumentId,
  coverLetterDocumentId,
  resumeOptions,
  coverLetterOptions,
  history,
  signedUrls,
}: {
  jobId: string;
  resumeDocumentId: string | null;
  coverLetterDocumentId: string | null;
  resumeOptions: (Document & { label: string })[];
  coverLetterOptions: (Document & { label: string })[];
  history: Document[];
  signedUrls: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(
    field: "resume_document_id" | "cover_letter_document_id",
    value: string
  ) {
    startTransition(async () => {
      const { error } = await setJobDocument(
        jobId,
        field,
        value === "none" ? null : value
      );
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Resume used</Label>
          <Select
            value={resumeDocumentId ?? "none"}
            onValueChange={(v) => handleChange("resume_document_id", v)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {resumeOptions.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Cover letter used</Label>
          <Select
            value={coverLetterDocumentId ?? "none"}
            onValueChange={(v) => handleChange("cover_letter_document_id", v)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {coverLetterOptions.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Version history for this job
        </p>
        <UploadDocumentDialog
          jobs={[]}
          lockJobId={jobId}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="size-3.5" />
              Upload version
            </Button>
          }
        />
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No resume or cover letter versions uploaded for this job yet.
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              signedUrl={signedUrls[doc.file_url ?? ""]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
