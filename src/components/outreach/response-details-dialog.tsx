"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateOutreachResponse } from "@/lib/actions/outreach";
import {
  responseDetailsSchema,
  type ResponseDetailsInput,
} from "@/lib/validations/outreach";
import type { Outreach } from "@/types/database";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ResponseDetailsDialog({
  outreach,
  open,
  onOpenChange,
}: {
  outreach: Outreach | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const {
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
    formState: { isSubmitting },
  } = useForm<ResponseDetailsInput>({
    resolver: zodResolver(responseDetailsSchema),
  });

  React.useEffect(() => {
    if (!open || !outreach) return;
    reset({
      responseDate: outreach.response_date ? new Date(outreach.response_date) : new Date(),
      responseNotes: outreach.response_notes ?? undefined,
    });
  }, [open, outreach, reset]);

  async function onSubmit(values: ResponseDetailsInput) {
    if (!outreach) return;
    const { error } = await updateOutreachResponse(outreach.id, values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Response details saved.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Response Details</DialogTitle>
          <DialogDescription>
            When did they reply, and what did they say?
          </DialogDescription>
        </DialogHeader>

        <form
          id="response-details-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <Field>
            <FieldLabel htmlFor="responseDate">Response Date</FieldLabel>
            <DatePicker
              id="responseDate"
              value={watch("responseDate")}
              onChange={(date) => setValue("responseDate", date)}
              placeholder="Select a date"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="responseNotes">Reply / Response Notes</FieldLabel>
            <Textarea
              id="responseNotes"
              rows={4}
              placeholder="What did they say?"
              {...register("responseNotes")}
            />
          </Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
          <Button type="submit" form="response-details-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
