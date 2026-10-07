"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getResumeOptionsForJob, markAsApplied } from "@/lib/actions/jobs";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ApplyDialog({
  jobId,
  companyName,
  position,
  open,
  onOpenChange,
}: {
  jobId: string;
  companyName: string;
  position: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [appliedDate, setAppliedDate] = React.useState<Date>(() => new Date());
  const [resumeId, setResumeId] = React.useState<string>("none");
  const [resumeOptions, setResumeOptions] = React.useState<
    { id: string; label: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);
  const [isPending, startTransition] = React.useTransition();

  // Radix unmounts DialogContent on close, so this effect runs fresh each
  // time the dialog opens — no need to reset state on the `open` prop.
  React.useEffect(() => {
    let cancelled = false;
    getResumeOptionsForJob(jobId).then((options) => {
      if (cancelled) return;
      setResumeOptions(options);
      if (options.length > 0) setResumeId(options[0].id);
      setLoadingOptions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  function handleConfirm() {
    startTransition(async () => {
      const { error } = await markAsApplied({
        jobId,
        appliedDate,
        resumeDocumentId: resumeId === "none" ? null : resumeId,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Moved ${companyName} to Applied`, {
        icon: <CheckCircle2 className="size-4" />,
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Applied</DialogTitle>
          <DialogDescription>
            {position} at {companyName} will move to your Applications under Applied.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="appliedDate">Application date</FieldLabel>
            <DatePicker id="appliedDate" value={appliedDate} onChange={(d) => d && setAppliedDate(d)} />
          </Field>

          <Field>
            <FieldLabel htmlFor="resumeUsed">Resume used</FieldLabel>
            <Select value={resumeId} onValueChange={setResumeId} disabled={loadingOptions}>
              <SelectTrigger id="resumeUsed" className="w-full">
                <SelectValue placeholder={loadingOptions ? "Loading…" : "None"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {resumeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
