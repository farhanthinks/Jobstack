import { Calendar, CheckCircle2, Mail, Sparkles, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function ConnectionCard({
  icon: Icon,
  name,
  description,
  connected,
  comingSoon,
}: {
  icon: typeof Mail;
  name: string;
  description: string;
  connected: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {connected ? (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive">
            <XCircle className="size-3" />
            Not connected
          </Badge>
        )}
        <Button variant="outline" size="sm" disabled title={comingSoon ? "Coming soon" : "Configured by the app, not per-user"}>
          {comingSoon ? "Coming soon" : connected ? "Managed" : "Unavailable"}
        </Button>
      </div>
    </div>
  );
}

export function ConnectionsSection({
  resendConfigured,
  groqConfigured,
}: {
  resendConfigured: boolean;
  groqConfigured: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Connected Services</h2>
        <p className="text-sm text-muted-foreground">
          Jobstack&apos;s own integrations. Email and AI generation are
          app-wide services, not per-account connections — there&apos;s
          nothing to connect/disconnect yourself. No API keys are ever shown
          here.
        </p>
      </div>

      <div className="space-y-3">
        <ConnectionCard
          icon={Mail}
          name="Email / Resend"
          description="Sends reminder emails for tasks, interviews, and follow-ups."
          connected={resendConfigured}
        />
        <ConnectionCard
          icon={Sparkles}
          name="AI Assistant / Groq"
          description="Powers match scoring, resume generation, and interview prep."
          connected={groqConfigured}
        />
        <ConnectionCard
          icon={Calendar}
          name="Google Calendar"
          description="Sync interviews and deadlines to your calendar."
          connected={false}
          comingSoon
        />
      </div>
    </div>
  );
}
