"use client";

import * as React from "react";
import { Bookmark, Search } from "lucide-react";

import { JOB_PLATFORMS, type JobPlatform } from "@/types/database";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedJobCard } from "@/components/jobs/saved-job-card";
import { EmptyState } from "@/components/empty-state";
import type { JobCardData } from "@/components/jobs/job-card";

type SortKey = "newest" | "oldest" | "company";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  company: "Company A–Z",
};

export function SavedJobsView({ jobs }: { jobs: JobCardData[] }) {
  const [query, setQuery] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState<JobPlatform | "all">("all");
  const [locationFilter, setLocationFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");

  const locations = React.useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) if (job.location) set.add(job.location);
    return [...set].sort();
  }, [jobs]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = jobs.filter((job) => {
      if (q && !`${job.position} ${job.company_name}`.toLowerCase().includes(q)) return false;
      if (platformFilter !== "all" && job.platform !== platformFilter) return false;
      if (locationFilter !== "all" && job.location !== locationFilter) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      if (sortKey === "company") return a.company_name.localeCompare(b.company_name);
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortKey === "oldest" ? -diff : diff;
    });
    return result;
  }, [jobs, query, platformFilter, locationFilter, sortKey]);

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No saved jobs yet"
        description="Jobs you save but haven't applied to yet will show up here."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs or companies…"
            className="h-8 pl-8"
          />
        </div>

        <Select
          value={platformFilter}
          onValueChange={(v) => setPlatformFilter(v as JobPlatform | "all")}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {JOB_PLATFORMS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger size="sm" className="ml-auto w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No saved jobs match these filters.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => (
            <SavedJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
