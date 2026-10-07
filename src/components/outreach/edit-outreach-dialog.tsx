"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateOutreach } from "@/lib/actions/outreach";
import { outreachSchema, type OutreachInput } from "@/lib/validations/outreach";
import { OutreachFields } from "@/components/outreach/outreach-fields";
import type { Outreach } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function toFormValues(outreach: Outreach): OutreachInput {
  return {
    personName: outreach.person_name,
    linkedinUrl: outreach.linkedin_url,
    personType: outreach.person_type,
    personTypeOther: outreach.person_type_other ?? undefined,
    companyName: outreach.company_name,
    companyLocation: outreach.company_location ?? undefined,
    currentPosition: outreach.current_position ?? undefined,
    email: outreach.email ?? undefined,
    phoneNumber: outreach.phone_number ?? undefined,
    outreachType: outreach.outreach_type,
    messageSent: outreach.message_sent,
    dateSent: new Date(outreach.date_sent),
    status: outreach.status,
    responseDate: outreach.response_date ? new Date(outreach.response_date) : undefined,
    responseNotes: outreach.response_notes ?? undefined,
    followUpDate: outreach.follow_up_date ? new Date(outreach.follow_up_date) : undefined,
    followUpTime: outreach.follow_up_time ? outreach.follow_up_time.slice(0, 5) : undefined,
    followUpStatus: outreach.follow_up_status ?? undefined,
    notes: outreach.notes ?? undefined,
    tags: outreach.tags?.join(", ") ?? undefined,
  };
}

export function EditOutreachDialog({
  outreach,
  trigger,
  onSaved,
}: {
  outreach: Outreach;
  trigger: React.ReactNode;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OutreachInput>({
    resolver: zodResolver(outreachSchema),
    defaultValues: toFormValues(outreach),
  });

  async function onSubmit(values: OutreachInput) {
    const { error } = await updateOutreach(outreach.id, values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Outreach updated.");
    setOpen(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]"
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4">
          <DialogTitle>Edit Outreach</DialogTitle>
          <DialogDescription>
            Update details for your outreach to {outreach.person_name}.
          </DialogDescription>
        </DialogHeader>

        <form
          id={`edit-outreach-form-${outreach.id}`}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <OutreachFields
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={`edit-outreach-form-${outreach.id}`}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
