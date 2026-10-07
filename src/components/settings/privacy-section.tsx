import Link from "next/link";
import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Data &amp; Privacy</h2>
        <p className="text-sm text-muted-foreground">
          What Jobstack stores and how to take it with you or remove it.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Export Jobstack data</p>
          <p className="text-xs text-muted-foreground">
            Downloads a JSON file of your applications, tasks, interviews,
            outreach, and document metadata.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/export" download>
            <Download className="size-3.5" />
            Export data
          </a>
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Privacy controls</p>
        <p className="text-xs text-muted-foreground">
          Jobstack stores only what you enter directly — your applications,
          tasks, interviews, outreach contacts, and documents you upload or
          generate. Nothing is shared with third parties beyond the services
          you can see under Connected Services (email delivery and AI
          generation), and only the minimum needed to perform that specific
          action (e.g. a resume and job description sent to the AI provider
          when you click Generate).
        </p>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 p-3">
        <div>
          <p className="text-sm font-medium text-destructive">Delete account &amp; data</p>
          <p className="text-xs text-muted-foreground">
            Permanently deletes your account and everything in it. Handled
            under Account &amp; Security so there&apos;s one place this
            happens, not two.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/settings?section=account">
            <Trash2 className="size-3.5" />
            Go to Account &amp; Security
          </Link>
        </Button>
      </div>
    </div>
  );
}
