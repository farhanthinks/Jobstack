"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { ACCENT_PRESETS, getStoredAccent, setStoredAccent, type AccentPreset } from "@/lib/accent";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSection() {
  // `theme` reads as `undefined` on the server and on the first client
  // render alike (next-themes resolves it internally right after), so
  // comparing it directly here never mismatches — no mount-gate needed,
  // matching how the existing theme-toggle.tsx handles this too.
  const { theme, setTheme } = useTheme();

  // Accent, unlike theme, has no SSR step of its own to match — it's read
  // straight from localStorage via a lazy initializer, same pattern used
  // elsewhere in this app (e.g. the AI Assistant's resume textarea).
  const [accent, setAccent] = React.useState<AccentPreset>(getStoredAccent);

  function handleAccentChange(value: AccentPreset) {
    setAccent(value);
    setStoredAccent(value);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">Theme and accent color.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Theme</p>
        <div className="grid max-w-sm grid-cols-3 gap-2">
          {THEME_OPTIONS.map((option) => {
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-xs transition-colors duration-150",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <option.icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Accent color</p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((preset) => {
            const isActive = accent === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                aria-label={preset.label}
                onClick={() => handleAccentChange(preset.value)}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                    isActive ? "ring-foreground" : "ring-transparent"
                  )}
                  style={{ backgroundColor: preset.swatch }}
                >
                  {isActive && <Check className="size-4 text-white" />}
                </span>
                <span className="text-xs text-muted-foreground">{preset.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Applies immediately, saved in this browser.</p>
      </div>
    </div>
  );
}
