import { createClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/analytics/stat-tile";
import { ApplicationsTrendChart } from "@/components/analytics/applications-trend-chart";
import { PipelineFunnelChart } from "@/components/analytics/pipeline-funnel-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job, JobStatusHistoryEntry } from "@/types/database";

function pct(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function days(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}d`;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: history }] = await Promise.all([
    supabase.from("jobs").select("*"),
    supabase.from("job_status_history").select("*"),
  ]);

  const summary = computeAnalytics(
    (jobs as Job[]) ?? [],
    (history as JobStatusHistoryEntry[]) ?? []
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Trends, conversion rates, and pipeline funnel."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Applications sent" value={String(summary.totalApplied)} />
        <StatTile
          label="Response rate"
          value={pct(summary.responseRate)}
          description="Applied → any reply"
        />
        <StatTile
          label="Interview conversion"
          value={pct(summary.interviewRate)}
          description="Applied → interview"
        />
        <StatTile
          label="Offer rate"
          value={pct(summary.offerRate)}
          description="Applied → offer"
        />
        <StatTile
          label="Avg. time to response"
          value={days(summary.avgTimeToResponseDays)}
        />
        <StatTile label="Avg. time to offer" value={days(summary.avgTimeToOfferDays)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications sent</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsTrendChart data={summary.weeklyApplications} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineFunnelChart data={summary.funnel} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
