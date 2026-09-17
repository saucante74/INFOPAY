import { useCallback, useEffect, useState } from "react";

/** An explicit user choice. `null` means "no manual choice — follow the
 * system", matching `data-theme`'s own absent-vs-present states in
 * src/index.css. */
export type ThemeOverride = "light" | "dark" | null;

const STORAGE_KEY = "infopay-theme";

function readStoredOverride(): ThemeOverride {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Private browsing / disabled storage / quota errors: fall back to
    // "no override", exactly as if the user had never chosen — the toggle
    // still works for the session (see toggleTheme), it just won't survive
    // a reload.
    return null;
  }
}

function readSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies (or clears) the `data-theme` attribute that src/index.css's
 * `:root[data-theme="dark"]` rule reads. Mirrors the inline script in
 * index.html that sets this before first paint — see that file's comment
 * for why the duplication is deliberate. */
function applyOverride(override: ThemeOverride): void {
  if (override === null) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", override);
  }
}

interface UseThemeResult {
  /** The theme actually in effect right now: the manual override if one is
   * set, otherwise the live system preference. */
  resolvedTheme: "light" | "dark";
  /** Sets an explicit override, applies it, and persists it. */
  toggleTheme: () => void;
}

/**
 * Owns the app's dark/light state: the manual override (persisted to
 * `localStorage`, applied via `data-theme` on `<html>`) and the live system
 * preference, tracked in case it changes while the tab is open and no
 * override is set.
 *
 * The CSS side (src/index.css) is what actually renders each theme; this
 * hook's job is only to compute which one is currently in effect (for the
 * toggle button's icon) and to let the user set an override.
 */
export function useTheme(): UseThemeResult {
  const [override, setOverride] = useState<ThemeOverride>(readStoredOverride);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(readSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent): void => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    applyOverride(override);
  }, [override]);

  const resolvedTheme = override ?? systemTheme;

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setOverride(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Same fallback as readStoredOverride: the override still takes
      // effect for this session via `data-theme`, it just won't persist.
    }
  }, [resolvedTheme]);

  return { resolvedTheme, toggleTheme };
}
