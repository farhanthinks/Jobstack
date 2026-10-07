"use client";

import * as React from "react";
import { ChevronDown, LayoutGrid, List as ListIcon } from "lucide-react";

import { JOB_PLATFORMS, type JobPlatform, type JobStatus } from "@/types/database";
import { BOARD_STATUSES, CLOSED_STATUSES, JOB_STATUS_META } from "@/lib/job-status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PipelineBoard } from "@/components/jobs/pipeline-board";
import { PipelineList } from "@/components/jobs/pipeline-list";
import { JobDetailSheet } from "@/components/jobs/job-detail-sheet";
import type { JobCardData } from "@/components/jobs/job-card";

type SortKey = "newest" | "oldest" | "company" | "match" | "deadline";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  company: "Company A–Z",
  match: "Highest match score",
  deadline: "Deadline soonest",
};

function sortJobs(jobs: JobCardData[], sortKey: SortKey): JobCardData[] {
  const sorted = [...jobs];
  switch (sortKey) {
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "company":
      return sorted.sort((a, b) => a.company_name.localeCompare(b.company_name));
    case "match":
      return sorted.sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1));
    case "deadline":
      return sorted.sort((a, b) => {
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return (
          new Date(a.application_deadline).getTime() -
          new Date(b.application_deadline).getTime()
        );
      });
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function PipelineWorkspace({ jobs }: { jobs: JobCardData[] }) {
  const [viewMode, setViewMode] = React.useState<"board" | "list">("board");
  const [statusFilter, setStatusFilter] = React.useState<JobStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = React.useState<JobPlatform | "all">("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const selectedJob = React.useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const locations = React.useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      if (job.location) set.add(job.location);
    }
    return [...set].sort();
  }, [jobs]);

  const closedCounts = React.useMemo(() => {
    const counts: Partial<Record<JobStatus, number>> = {};
    for (const status of CLOSED_STATUSES) {
      counts[status] = jobs.filter((j) => j.status === status).length;
    }
    return counts;
  }, [jobs]);

  // Closed statuses are exits, not board stages — force List so the
  // filtered jobs actually have somewhere to render.
  const forcedList = statusFilter !== "all" && CLOSED_STATUSES.includes(statusFilter);
  const effectiveView = forcedList ? "list" : viewMode;

  const filtered = React.useMemo(() => {
    const result = jobs.filter((job) => {
      if (statusFilter === "all") {
        if (CLOSED_STATUSES.includes(job.status)) return false;
      } else if (job.status !== statusFilter) {
        return false;
      }
      if (platformFilter !== "all" && job.platform !== platformFilter) return false;
      if (locationFilter !== "all" && job.location !== locationFilter) return false;
      return true;
    });
    return sortJobs(result, sortKey);
  }, [jobs, statusFilter, platformFilter, locationFilter, sortKey]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border p-0.5">
          <Button
            size="sm"
            variant={effectiveView === "board" ? "secondary" : "ghost"}
            className="h-7 gap-1.5 px-2.5"
            disabled={forcedList}
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="size-3.5" />
            Board
          </Button>
          <Button
            size="sm"
            variant={effectiveView === "list" ? "secondary" : "ghost"}
            className="h-7 gap-1.5 px-2.5"
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="size-3.5" />
            List
          </Button>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as JobStatus | "all")}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {BOARD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {JOB_STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant={forcedList ? "secondary" : "outline"}
              className="h-8 gap-1"
            >
              More
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {CLOSED_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setStatusFilter(status)}
                className="justify-between gap-4"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn("size-1.5 rounded-full", JOB_STATUS_META[status].dotClassName)}
                  />
                  {JOB_STATUS_META[status].label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {closedCounts[status] ?? 0}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {forcedList && (
          <Badge variant="outline" className="gap-1.5">
            Showing {JOB_STATUS_META[statusFilter as JobStatus].label}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setStatusFilter("all")}
            >
              ×
            </button>
          </Badge>
        )}

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger size="sm" className="ml-auto w-44">
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

      <div className={cn("flex flex-1 flex-col", effectiveView === "board" && "overflow-hidden")}>
        {effectiveView === "board" ? (
          <PipelineBoard jobs={filtered} onOpen={(job) => setSelectedJobId(job.id)} />
        ) : (
          <PipelineList jobs={filtered} onOpen={(job) => setSelectedJobId(job.id)} />
        )}
      </div>

      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJobId}
        onOpenChange={(open) => {
          if (!open) setSelectedJobId(null);
        }}
      />
    </div>
  );
}
