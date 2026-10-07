"use client";

import * as React from "react";
import { format } from "date-fns";
import { ExternalLink, MapPin, Wallet } from "lucide-react";

import { CompanyAvatar } from "@/components/jobs/company-avatar";
import { JobDetailSheet } from "@/components/jobs/job-detail-sheet";
import { ApplyDialog } from "@/components/jobs/apply-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobCardData } from "@/components/jobs/job-card";

export function SavedJobCard({ job }: { job: JobCardData }) {
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [applyOpen, setApplyOpen] = React.useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-px hover:border-foreground/15 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:gap-4 sm:p-4"
      >
        <CompanyAvatar name={job.company_name} className="size-9 shrink-0 sm:size-10" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="truncate text-sm font-medium">{job.position}</p>
            <p className="truncate text-xs text-muted-foreground">{job.company_name}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {job.location}
              </span>
            )}
            {job.salary && (
              <span className="flex items-center gap-1">
                <Wallet className="size-3" />
                {job.salary}
              </span>
            )}
            <Badge variant="secondary" className="text-xs font-normal">
              {job.platform}
            </Badge>
            <span>Saved {format(new Date(job.created_at), "MMM d")}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {job.job_url && (
            <Button
              asChild
              size="sm"
              variant="outline"
              onClick={(e) => e.stopPropagation()}
            >
              <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                Visit Job
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setApplyOpen(true);
            }}
          >
            Apply
          </Button>
        </div>
      </div>

      <JobDetailSheet job={job} open={detailOpen} onOpenChange={setDetailOpen} />
      <ApplyDialog
        jobId={job.id}
        companyName={job.company_name}
        position={job.position}
        open={applyOpen}
        onOpenChange={setApplyOpen}
      />
    </>
  );
}
