"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createOutreach } from "@/lib/actions/outreach";
import { outreachSchema, type OutreachInput } from "@/lib/validations/outreach";
import { OutreachFields } from "@/components/outreach/outreach-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddOutreachDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OutreachInput>({
    resolver: zodResolver(outreachSchema),
    defaultValues: { status: "sent" },
  });

  async function onSubmit(values: OutreachInput) {
    const { error } = await createOutreach(values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Outreach to ${values.personName} logged.`);
    reset({ status: "sent" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset({ status: "sent" });
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Outreach
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]"
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4">
          <DialogTitle>Add Outreach</DialogTitle>
          <DialogDescription>
            Log a LinkedIn or recruiter outreach — kept separate from your Applications.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-outreach-form"
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
          <Button type="submit" form="add-outreach-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Add Outreach
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
