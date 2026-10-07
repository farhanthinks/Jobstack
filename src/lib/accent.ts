// Settings → Appearance accent color. Purely a client-side rendering
// preference (like next-themes' own dark/light choice) — no DB column,
// persisted to localStorage and applied via a `data-accent` attribute on
// <html>, matching the CSS presets in src/app/globals.css.

export const ACCENT_PRESETS = [
  { value: "blue", label: "Blue", swatch: "oklch(0.585 0.233 260.4)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.585 0.233 300)" },
  { value: "emerald", label: "Emerald", swatch: "oklch(0.585 0.233 160)" },
  { value: "amber", label: "Amber", swatch: "oklch(0.585 0.233 80)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.585 0.233 20)" },
] as const;

export type AccentPreset = (typeof ACCENT_PRESETS)[number]["value"];

export const ACCENT_STORAGE_KEY = "jobstack:accent";

export function getStoredAccent(): AccentPreset {
  if (typeof window === "undefined") return "blue";
  try {
    const value = localStorage.getItem(ACCENT_STORAGE_KEY);
    return (ACCENT_PRESETS.some((p) => p.value === value) ? value : "blue") as AccentPreset;
  } catch {
    return "blue";
  }
}

export function setStoredAccent(value: AccentPreset) {
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, value);
  } catch {
    // Private browsing / storage disabled — the swatch still applies for this load.
  }
  if (typeof document !== "undefined") {
    if (value === "blue") {
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.setAttribute("data-accent", value);
    }
  }
}
