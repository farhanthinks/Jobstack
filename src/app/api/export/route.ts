import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [
    { data: profile },
    { data: jobs },
    { data: tasks },
    { data: interviews },
    { data: outreach },
    { data: documents },
    { data: jobStatusHistory },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("jobs").select("*"),
    supabase.from("tasks").select("*"),
    supabase.from("interviews").select("*"),
    supabase.from("outreach").select("*"),
    // Metadata only — not file bytes, which live in Storage and aren't
    // meaningful outside this account anyway.
    supabase.from("documents").select("id, job_id, type, file_name, version, ats_score, created_at"),
    supabase.from("job_status_history").select("*"),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account_email: user.email,
    profile,
    jobs,
    tasks,
    interviews,
    outreach,
    documents,
    job_status_history: jobStatusHistory,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="jobstack-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
