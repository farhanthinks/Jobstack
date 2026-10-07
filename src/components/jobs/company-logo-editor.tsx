"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import {
  autoFetchJobLogo,
  removeJobLogo,
  setJobLogoUrl,
  uploadJobLogo,
} from "@/lib/actions/company-logo";
import { getJobLogoUrl } from "@/lib/job-logo";
import type { Job } from "@/types/database";
import { CompanyAvatar } from "@/components/jobs/company-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function LogoSourceRow({
  label,
  value,
  onRemove,
  removing,
}: {
  label: string;
  value: string;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-2 text-xs">
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external/user-supplied domains, can't be allowlisted for next/image */}
      <img src={value} alt="" className="size-6 rounded bg-white object-contain" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="truncate text-muted-foreground">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={removing}
        onClick={onRemove}
        aria-label={`Remove ${label.toLowerCase()}`}
      >
        {removing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      </Button>
    </div>
  );
}

export function CompanyLogoEditor({ job }: { job: Job }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState(job.logo_url ?? "");
  const [isPending, startTransition] = React.useTransition();
  const [removingField, setRemovingField] = React.useState<string | null>(null);

  const activeLogoUrl = getJobLogoUrl(job);

  function handleUpload(formData: FormData) {
    formData.set("jobId", job.id);
    startTransition(async () => {
      const { error } = await uploadJobLogo(formData);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Logo uploaded.");
      router.refresh();
    });
  }

  function handleSaveUrl() {
    startTransition(async () => {
      const { error } = await setJobLogoUrl(job.id, urlInput.trim());
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Logo URL saved.");
      router.refresh();
    });
  }

  function handleAutoFetch() {
    if (!job.job_url) return;
    startTransition(async () => {
      const { error } = await autoFetchJobLogo(job.id, job.job_url!);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Fetched a logo from the job URL.");
      router.refresh();
    });
  }

  function handleRemove(field: "logo_uploaded_url" | "logo_url" | "logo_auto_url") {
    setRemovingField(field);
    startTransition(async () => {
      const { error } = await removeJobLogo(job.id, field);
      setRemovingField(null);
      if (error) {
        toast.error(error);
        return;
      }
      if (field === "logo_url") setUrlInput("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Edit company logo"
      >
        <CompanyAvatar name={job.company_name} logoUrl={activeLogoUrl} className="size-20 text-2xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Pencil className="size-5 text-white" />
        </span>
      </button>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Company logo</DialogTitle>
          <DialogDescription className="truncate text-xs">
            Priority: uploaded logo → logo URL → auto-fetched → placeholder.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-2">
          {job.logo_uploaded_url && (
            <LogoSourceRow
              label="Uploaded logo"
              value={job.logo_uploaded_url}
              removing={removingField === "logo_uploaded_url"}
              onRemove={() => handleRemove("logo_uploaded_url")}
            />
          )}
          {job.logo_url && (
            <LogoSourceRow
              label="Logo URL"
              value={job.logo_url}
              removing={removingField === "logo_url"}
              onRemove={() => handleRemove("logo_url")}
            />
          )}
          {job.logo_auto_url && (
            <LogoSourceRow
              label="Auto-fetched logo"
              value={job.logo_auto_url}
              removing={removingField === "logo_auto_url"}
              onRemove={() => handleRemove("logo_auto_url")}
            />
          )}
        </div>

        <Tabs defaultValue="upload">
          <TabsList className="w-full">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">Logo URL</TabsTrigger>
            <TabsTrigger value="auto">Auto-fetch</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="pt-1">
            <form action={handleUpload} className="space-y-2">
              <Field>
                <FieldLabel htmlFor="logo-file">Image file</FieldLabel>
                <Input
                  id="logo-file"
                  name="file"
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                />
                <FieldDescription>PNG, JPEG, WebP, or SVG — up to 4MB.</FieldDescription>
              </Field>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Upload
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="url" className="pt-1">
            <div className="space-y-2">
              <Field>
                <FieldLabel htmlFor="logo-url">Image URL</FieldLabel>
                <Input
                  id="logo-url"
                  placeholder="https://…/logo.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </Field>
              <Button type="button" size="sm" disabled={isPending} onClick={handleSaveUrl}>
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                Save URL
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="auto" className="pt-1">
            <div className="space-y-2">
              <FieldDescription>
                {job.job_url
                  ? "Looks for a logo on the job posting page, falling back to the site's favicon. Sites that require a login to view (including most LinkedIn job pages) often can't be read this way."
                  : "Add a Job URL in Application details first — auto-fetch needs it."}
              </FieldDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || !job.job_url}
                onClick={handleAutoFetch}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Fetch from Job URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
