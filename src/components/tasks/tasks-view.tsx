"use client";

import * as React from "react";
import { isSameDay, isToday, startOfDay } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  List,
  ListTodo,
  type LucideIcon,
  Plus,
  Search,
  Send,
} from "lucide-react";

import type { Task, TaskCategory } from "@/types/database";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarMonthView } from "@/components/calendar-month-view";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog";

type TaskWithJob = Task & {
  jobs: { company_name: string; position: string } | null;
  outreach: { linkedin_url: string } | null;
};

type DueFilter = "all" | "today" | "upcoming" | "overdue";

const DUE_FILTERS: { value: DueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
];

function matchesDueFilter(task: Task, filter: DueFilter): boolean {
  if (filter === "all") return true;
  if (!task.due_date) return false;
  const due = startOfDay(new Date(task.due_date));
  const today = startOfDay(new Date());
  if (filter === "today") return isToday(due);
  if (filter === "overdue") return task.status === "pending" && due < today;
  return due > today;
}

function matchesQuery(task: TaskWithJob, query: string): boolean {
  if (!query) return true;
  const haystack = [
    task.title,
    task.notes,
    task.jobs?.company_name,
    task.jobs?.position,
    task.contact_name,
    task.contact_company,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function sortTasks(tasks: TaskWithJob[]): TaskWithJob[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "done" ? 1 : -1;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

function SectionEmptyState({
  icon: Icon,
  title,
  description,
  category,
  jobs,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  category: TaskCategory;
  jobs: { id: string; company_name: string; position: string }[];
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-7 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      </div>
      <TaskFormSheet
        jobs={jobs}
        lockCategory={category}
        trigger={
          <Button variant="outline" size="sm" className="mt-1.5">
            <Plus className="size-3.5" />
            Add Task
          </Button>
        }
      />
    </div>
  );
}

function TaskSection({
  title,
  category,
  icon,
  emptyTitle,
  emptyDescription,
  allTasks,
  filteredTasks,
  jobs,
}: {
  title: string;
  category: TaskCategory;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  allTasks: TaskWithJob[];
  filteredTasks: TaskWithJob[];
  jobs: { id: string; company_name: string; position: string }[];
}) {
  const sorted = React.useMemo(() => sortTasks(filteredTasks), [filteredTasks]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {sorted.length > 0 && (
          <span className="text-xs text-muted-foreground">{sorted.length}</span>
        )}
      </div>
      {sorted.length === 0 ? (
        allTasks.length === 0 ? (
          <SectionEmptyState
            icon={icon}
            title={emptyTitle}
            description={emptyDescription}
            category={category}
            jobs={jobs}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} match these filters.
          </p>
        )
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border">
          {sorted.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              job={task.jobs}
              jobs={jobs}
              outreachLinkedinUrl={task.outreach?.linkedin_url ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function TasksView({
  tasks,
  jobs,
  initialSelectedTaskId,
}: {
  tasks: TaskWithJob[];
  jobs: { id: string; company_name: string; position: string }[];
  initialSelectedTaskId?: string;
}) {
  const [view, setView] = React.useState<"list" | "calendar">("list");
  const [dueFilter, setDueFilter] = React.useState<DueFilter>("all");
  const [query, setQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [linkedTaskId, setLinkedTaskId] = React.useState(initialSelectedTaskId ?? null);
  const linkedTask = React.useMemo(
    () => tasks.find((t) => t.id === linkedTaskId) ?? null,
    [tasks, linkedTaskId]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => matchesDueFilter(t, dueFilter) && matchesQuery(t, q));
  }, [tasks, dueFilter, query]);

  const allApplicationTasks = React.useMemo(
    () => tasks.filter((t) => t.category === "application"),
    [tasks]
  );
  const allOutreachTasks = React.useMemo(
    () => tasks.filter((t) => t.category === "outreach"),
    [tasks]
  );
  const applicationTasks = React.useMemo(
    () => filtered.filter((t) => t.category === "application"),
    [filtered]
  );
  const outreachTasks = React.useMemo(
    () => filtered.filter((t) => t.category === "outreach"),
    [filtered]
  );

  const eventDates = React.useMemo(
    () => tasks.filter((t) => t.due_date).map((t) => new Date(t.due_date as string)),
    [tasks]
  );

  const selectedDayTasks = React.useMemo(
    () =>
      sortTasks(
        tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), selectedDate))
      ),
    [tasks, selectedDate]
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Tasks"
        description="Stay on top of your application and outreach activities"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors duration-150 ease-out",
                  view === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
                List
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors duration-150 ease-out",
                  view === "calendar"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="size-3.5" />
                Calendar
              </button>
            </div>
            <TaskFormSheet
              jobs={jobs}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  Add Task
                </Button>
              }
            />
          </div>
        }
      />

      {view === "list" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
              {DUE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setDueFilter(f.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-sm transition-colors duration-150 ease-out",
                    dueFilter === f.value
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
                className="h-8 pl-8"
              />
            </div>
          </div>

          <div className="space-y-6">
            <TaskSection
              title="Application Tasks"
              category="application"
              icon={ListTodo}
              emptyTitle="No application tasks yet"
              emptyDescription="Create a task to track follow-ups, interviews, or application deadlines."
              allTasks={allApplicationTasks}
              filteredTasks={applicationTasks}
              jobs={jobs}
            />
            <TaskSection
              title="Outreach Tasks"
              category="outreach"
              icon={Send}
              emptyTitle="No outreach tasks yet"
              emptyDescription="Create a task to manage recruiter messages, networking, and follow-ups."
              allTasks={allOutreachTasks}
              filteredTasks={outreachTasks}
              jobs={jobs}
            />
          </div>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <CalendarMonthView
            eventDates={eventDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <div className="space-y-2">
            {selectedDayTasks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                <CalendarClock className="size-5" />
                Nothing due this day.
              </div>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border">
                {selectedDayTasks.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    job={task.jobs}
                    jobs={jobs}
                    outreachLinkedinUrl={task.outreach?.linkedin_url ?? null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <TaskDetailsDialog
        task={linkedTask}
        job={linkedTask?.jobs}
        jobs={jobs}
        outreachLinkedinUrl={linkedTask?.outreach?.linkedin_url ?? null}
        open={!!linkedTask}
        onOpenChange={(next) => {
          if (!next) setLinkedTaskId(null);
        }}
      />
    </div>
  );
}
