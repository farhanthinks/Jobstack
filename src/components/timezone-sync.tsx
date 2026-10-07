"use client";

import * as React from "react";
import { syncTimezone } from "@/lib/actions/profile";

/**
 * Silently keeps `profiles.timezone` in sync with the browser's detected
 * IANA timezone, so reminder emails fire at the right local time. Renders
 * nothing — mounted once in the authenticated app shell. Skipped once the
 * user has manually set a timezone in Settings (`autoDetect: false`) — a
 * manual choice should stick, not get silently reverted on the next load.
 */
export function TimezoneSync({
  currentTimezone,
  autoDetect,
}: {
  currentTimezone: string;
  autoDetect: boolean;
}) {
  React.useEffect(() => {
    if (!autoDetect) return;
    let detected: string | undefined;
    try {
      detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (detected && detected !== currentTimezone) {
      syncTimezone(detected);
    }
  }, [currentTimezone, autoDetect]);

  return null;
}
