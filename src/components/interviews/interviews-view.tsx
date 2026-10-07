"use client";

import * as React from "react";
import { isSameDay } from "date-fns";
import { CalendarClock, CalendarDays, History, Plus } from "lucide-react";

import type { Interview } from "@/types/database";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CalendarMonthView } from "@/components/calendar-month-view";
import { InterviewFormSheet } from "@/components/interviews/interview-form-sheet";
import { InterviewListItem } from "@/components/interviews/interview-list-item";

type InterviewWithJob = Interview & {
  jobs: { company_name: string; position: string } | null;
};

type ViewMode = "upcoming" | "past" | "calendar";

function isUpcoming(interview: Interview) {
  if (!interview.scheduled_at) return true;
  return new Date(interview.scheduled_at).getTime() >= Date.now();
}

function sortByScheduled(
  interviews: InterviewWithJob[],
  direction: "asc" | "desc"
): InterviewWithJob[] {
  return [...interviews].sort((a, b) => {
    if (!a.scheduled_at) return direction === "asc" ? -1 : 1;
    if (!b.scheduled_at) return direction === "asc" ? 1 : -1;
    const diff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    return direction === "asc" ? diff : -diff;
  });
}

function EmptyInterviews({
  title,
  description,
  jobs,
}: {
  title: string;
  description: string;
  jobs: { id: string; company_name: string; position: string }[];
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
      <CalendarClock className="size-4 text-muted-foreground" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      <InterviewFormSheet
        jobs={jobs}
        trigger={
          <Button variant="outline" size="sm" className="mt-1.5" disabled={jobs.length === 0}>
            <Plus className="size-3.5" />
            Add Interview
          </Button>
        }
      />
    </div>
  );
}

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof CalendarClock }[] = [
  { value: "upcoming", label: "Upcoming", icon: CalendarClock },
  { value: "past", label: "Past", icon: History },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
];

export function InterviewsView({
  interviews,
  jobs,
}: {
  interviews: InterviewWithJob[];
  jobs: { id: string; company_name: string; position: string }[];
}) {
  const [view, setView] = React.useState<ViewMode>("upcoming");
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());

  const upcoming = React.useMemo(
    () => sortByScheduled(interviews.filter(isUpcoming), "asc"),
    [interviews]
  );
  const past = React.useMemo(
    () => sortByScheduled(interviews.filter((i) => !isUpcoming(i)), "desc"),
    [interviews]
  );

  const eventDates = React.useMemo(
    () => interviews.filter((i) => i.scheduled_at).map((i) => new Date(i.scheduled_at as string)),
    [interviews]
  );

  const selectedDayInterviews = React.useMemo(
    () =>
      interviews.filter(
        (i) => i.scheduled_at && isSameDay(new Date(i.scheduled_at), selectedDate)
      ),
    [interviews, selectedDate]
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Interviews"
        description="Manage your interviews, schedules, and preparation."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors duration-150 ease-out",
                    view === value
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <InterviewFormSheet
              jobs={jobs}
              trigger={
                <Button size="sm" disabled={jobs.length === 0}>
                  <Plus className="size-4" />
                  Add Interview
                </Button>
              }
            />
          </div>
        }
      />

      {view === "upcoming" &&
        (upcoming.length === 0 ? (
          <EmptyInterviews
            title="No interviews scheduled yet"
            description="Add an interview to track rounds, prep notes, and reminders."
            jobs={jobs}
          />
        ) : (
          <div className="divide-y overflow-hidden rounded-lg border">
            {upcoming.map((interview) => (
              <InterviewListItem
                key={interview.id}
                interview={interview}
                job={interview.jobs}
                jobs={jobs}
              />
            ))}
          </div>
        ))}

      {view === "past" &&
        (past.length === 0 ? (
          <EmptyInterviews
            title="No completed interviews yet"
            description="Interviews you've completed will show up here."
            jobs={jobs}
          />
        ) : (
          <div className="divide-y overflow-hidden rounded-lg border">
            {past.map((interview) => (
              <InterviewListItem
                key={interview.id}
                interview={interview}
                job={interview.jobs}
                jobs={jobs}
              />
            ))}
          </div>
        ))}

      {view === "calendar" && (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <CalendarMonthView
            eventDates={eventDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <div className="space-y-2">
            {selectedDayInterviews.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                <CalendarClock className="size-5" />
                Nothing scheduled this day.
              </div>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border">
                {selectedDayInterviews.map((interview) => (
                  <InterviewListItem
                    key={interview.id}
                    interview={interview}
                    job={interview.jobs}
                    jobs={jobs}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
