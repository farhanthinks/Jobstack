import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AddOutreachDialog } from "@/components/outreach/add-outreach-dialog";
import { OutreachView } from "@/components/outreach/outreach-view";
import type { Outreach } from "@/types/database";

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createClient();

  const { data: outreach } = await supabase
    .from("outreach")
    .select("*")
    .order("date_sent", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Outreach"
        description="LinkedIn, recruiter, and referral outreach — kept separate from your Applications."
        actions={<AddOutreachDialog />}
      />
      <OutreachView records={(outreach ?? []) as Outreach[]} initialSelectedId={id} />
    </div>
  );
}
