"use client";

import { format } from "date-fns";
import { Sparkles } from "lucide-react";

import { JOB_STATUS_META } from "@/lib/job-status";
import { getJobLogoUrl } from "@/lib/job-logo";
import { Badge } from "@/components/ui/badge";
import { CompanyAvatar } from "@/components/jobs/company-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobCardData } from "@/components/jobs/job-card";

export function PipelineList({
  jobs,
  onOpen,
}: {
  jobs: JobCardData[];
  onOpen: (job: JobCardData) => void;
}) {
  if (jobs.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No applications match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead>Match</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const meta = JOB_STATUS_META[job.status];
            const cardDate = job.applied_at ?? job.created_at;
            return (
              <TableRow
                key={job.id}
                className="cursor-pointer transition-colors duration-150"
                onClick={() => onOpen(job)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <CompanyAvatar name={job.company_name} logoUrl={getJobLogoUrl(job)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.position}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.company_name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={meta.badgeClassName}>{meta.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {job.platform}
                </TableCell>
                <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                  {job.location || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {job.salary || "—"}
                </TableCell>
                <TableCell>
                  {job.match_score != null ? (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Sparkles className="size-3" />
                      {job.match_score}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {format(new Date(cardDate), "MMM d")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
