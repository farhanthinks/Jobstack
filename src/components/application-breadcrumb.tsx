"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Shows "Applications / <Job Name>" in the top bar on the Application
// Details page. The slug from the URL is shown immediately (no flicker),
// then swapped for the job's actual position title once a lightweight
// lookup resolves.
export function ApplicationBreadcrumb({ slug }: { slug: string }) {
  const [fetchedLabel, setFetchedLabel] = React.useState<string | null>(null);
  const [lastSlug, setLastSlug] = React.useState(slug);

  // Reset the fetched title during render (not in an effect) whenever the
  // slug changes, so a client-side nav between two job pages never shows the
  // previous job's title while the new lookup is in flight.
  if (slug !== lastSlug) {
    setLastSlug(slug);
    setFetchedLabel(null);
  }

  React.useEffect(() => {
    let cancelled = false;

    const supabase = createClient();
    supabase
      .from("jobs")
      .select("position")
      .eq(UUID_RE.test(slug) ? "id" : "job_code", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.position) setFetchedLabel(data.position);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const label = fetchedLabel ?? slug;

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link
        href="/applications"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        Applications
      </Link>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
      <span className="truncate font-medium">{label}</span>
    </nav>
  );
}
