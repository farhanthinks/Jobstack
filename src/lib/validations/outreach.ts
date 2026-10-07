import { z } from "zod";
import {
  OUTREACH_FOLLOWUP_STATUSES,
  OUTREACH_PERSON_TYPES,
  OUTREACH_STATUSES,
  OUTREACH_TYPES,
} from "@/types/database";

// Person-type fields are validated in their own sub-schema (joined via
// `.and()` below) so the "custom type" requiredness check still surfaces
// even when other required fields are simultaneously unfilled — a
// top-level `.superRefine()` on the whole object gets skipped once any
// sibling field fails its base type check.
const personTypeFieldsSchema = z
  .object({
    personType: z.enum(OUTREACH_PERSON_TYPES, { error: "Select a person type." }),
    personTypeOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.personType === "other" && !data.personTypeOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a person type.",
        path: ["personTypeOther"],
      });
    }
  });

export const outreachSchema = z
  .object({
    personName: z.string().min(1, "Person name is required."),
    linkedinUrl: z.url("Enter a valid LinkedIn profile URL."),
    companyName: z.string().min(1, "Company is required."),
    companyLocation: z.string().optional(),
    currentPosition: z.string().optional(),
    email: z.union([z.email("Enter a valid email address."), z.literal("")]).optional(),
    phoneNumber: z.string().optional(),
    outreachType: z.enum(OUTREACH_TYPES).optional(),
    messageSent: z.string().min(1, "Enter the message you sent."),
    dateSent: z.date({ error: "Date sent is required." }),
    status: z.enum(OUTREACH_STATUSES).optional(),
    responseDate: z.date().optional(),
    responseNotes: z.string().optional(),
    followUpDate: z.date().optional(),
    followUpTime: z.string().optional(),
    followUpStatus: z.enum(OUTREACH_FOLLOWUP_STATUSES).optional(),
    notes: z.string().optional(),
    tags: z.string().optional(),
  })
  .and(personTypeFieldsSchema);

export type OutreachInput = z.infer<typeof outreachSchema>;

// Used by the small "Response Details" popup that opens when a status is
// changed to Replied (or is reopened manually from the detail view) — kept
// separate from `outreachSchema` since it only ever touches these two fields.
export const responseDetailsSchema = z.object({
  responseDate: z.date().optional(),
  responseNotes: z.string().optional(),
});

export type ResponseDetailsInput = z.infer<typeof responseDetailsSchema>;
