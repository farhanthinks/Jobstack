"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Deterministic color from the company name — used as the placeholder when
// there's no logo (and as the fallback if a logo URL fails to load).
const PALETTE = [
  "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-primary/15 text-primary",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function CompanyAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  /** Uploaded / manual-URL / auto-fetched logo — see getJobLogoUrl(). */
  logoUrl?: string | null;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const colorClass = PALETTE[hashString(name) % PALETTE.length];

  if (logoUrl && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external/user-supplied domains, can't be allowlisted for next/image
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={cn(
          "size-8 shrink-0 rounded-md bg-white object-contain ring-1 ring-foreground/10",
          className
        )}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
        colorClass,
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
