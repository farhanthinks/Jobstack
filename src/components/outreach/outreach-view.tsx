"use client";

import * as React from "react";
import { format } from "date-fns";
import { Search, Send } from "lucide-react";

import type { Outreach, OutreachStatus } from "@/types/database";
import {
  OUTREACH_PERSON_TYPE_LABELS,
  OUTREACH_STATUS_META,
  OUTREACH_TYPE_LABELS,
} from "@/lib/outreach-status";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { OutreachDetailDialog } from "@/components/outreach/outreach-detail-dialog";

export function OutreachView({
  records,
  initialSelectedId,
}: {
  records: Outreach[];
  initialSelectedId?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OutreachStatus | "all">("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(initialSelectedId ?? null);

  const selected = React.useMemo(
    () => records.find((r) => r.id === selectedId) ?? null,
    [records, selectedId]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (q && !`${r.person_name} ${r.company_name}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, query, statusFilter]);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="No outreach logged yet"
        description="Track LinkedIn messages, recruiter replies, and referral requests here — kept separate from your Applications."
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
            placeholder="Search people or companies…"
            className="h-8 pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OutreachStatus | "all")}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(OUTREACH_STATUS_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No outreach records match these filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Person Type</TableHead>
                <TableHead>Outreach Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => {
                const meta = OUTREACH_STATUS_META[record.status];
                const personTypeLabel =
                  record.person_type === "other" && record.person_type_other
                    ? record.person_type_other
                    : OUTREACH_PERSON_TYPE_LABELS[record.person_type];
                return (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(record.id)}
                  >
                    <TableCell className="font-medium">{record.person_name}</TableCell>
                    <TableCell className="text-muted-foreground">{record.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">{personTypeLabel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {OUTREACH_TYPE_LABELS[record.outreach_type]}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("gap-1 font-normal", meta.badgeClassName)}>
                        <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.date_sent), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.follow_up_date
                        ? format(new Date(record.follow_up_date), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.updated_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <OutreachDetailDialog
        outreach={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
