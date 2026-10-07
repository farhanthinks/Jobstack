"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({
  eventDates,
  selectedDate,
  onSelectDate,
}: {
  eventDates: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const [month, setMonth] = React.useState(() => startOfMonth(selectedDate));

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  function hasEvent(day: Date) {
    return eventDates.some((d) => isSameDay(d, day));
  }

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-medium">{format(month, "MMMM yyyy")}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex h-10 flex-col items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
                !inMonth && "text-muted-foreground/40",
                selected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday(day) && !selected && "font-semibold text-primary"
              )}
            >
              {format(day, "d")}
              {hasEvent(day) && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full bg-primary",
                    selected && "bg-primary-foreground"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
