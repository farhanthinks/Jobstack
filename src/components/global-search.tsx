"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { JobStatus } from "@/types/database";
import { JOB_STATUS_META } from "@/lib/job-status";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

type SearchResult = {
  id: string;
  job_code: string | null;
  company_name: string;
  position: string;
  status: JobStatus;
};

const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 8;

// Escapes PostgREST's ilike wildcard/escape characters so a search term like
// "50% match" or "under_dog" is treated literally, not as a pattern.
function escapeIlikeTerm(term: string) {
  return term.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = React.useRef(0);

  // Clear any pending debounced search on unmount.
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function runSearch(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!term) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const escaped = escapeIlikeTerm(term);
      const pattern = `%${escaped}%`;
      const { data } = await supabase
        .from("jobs")
        .select("id, job_code, company_name, position, status")
        .or(
          [
            `company_name.ilike.${pattern}`,
            `position.ilike.${pattern}`,
            `job_code.ilike.${pattern}`,
            `location.ilike.${pattern}`,
            `contact_name.ilike.${pattern}`,
          ].join(",")
        )
        .order("updated_at", { ascending: false })
        .limit(MAX_RESULTS);

      if (requestId !== requestIdRef.current) return;
      setResults(data ?? []);
      setOpen(true);
      setLoading(false);
    }, SEARCH_DEBOUNCE_MS);
  }

  function goToResult(result: SearchResult) {
    router.push(`/applications/${result.job_code ?? result.id}`);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      goToResult(results[0]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              runSearch(value.trim());
            }}
            onFocus={() => {
              if (query.trim()) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, companies…"
            className="h-8 pl-8"
          />
          {loading && (
            <Loader2 className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--radix-popover-trigger-width) p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {results.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-muted-foreground">
            No matches for &quot;{query.trim()}&quot;.
          </p>
        ) : (
          <div className="flex flex-col">
            {results.map((result) => {
              const meta = JOB_STATUS_META[result.status];
              return (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => goToResult(result)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{result.position}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.company_name}
                      {result.job_code ? ` · ${result.job_code}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
