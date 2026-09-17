import { Moon, Sun } from "lucide-react";

import { useTheme } from "../hooks/useTheme";

/**
 * Manual light/dark override button. Deliberately thin — all the state
 * (system preference, stored override, persistence) lives in `useTheme`;
 * this component only renders the current `resolvedTheme` as an icon and
 * wires up the click.
 */
export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-raised hover:text-ink"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
