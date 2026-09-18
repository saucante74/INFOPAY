import { FileText } from "lucide-react";

import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="border-b border-border bg-surface-raised">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white">
            <FileText className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold">InfoPay AI</span>
        </div>

        <nav aria-label="Navigation principale" className="flex items-center gap-6 text-sm">
          {/* `text-ink`, not `text-accent`: the label needs to stay legible
              on its own (text-accent on the dark navbar background measures
              3.02:1, short of the 4.5:1 normal-text WCAG threshold — see
              RAPPORT.md). The underline carries the accent color instead,
              alongside `aria-current` and the bolder weight, so "active" is
              never signalled by color alone (WCAG SC 1.4.1). */}
          <button
            type="button"
            aria-current="page"
            className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
          >
            Analyseur
          </button>
          {/* "Aide" has no destination yet — a real, focusable <button>
              with no onClick, intentionally, rather than a fake href="#" or
              a disabled/inert element. See RAPPORT.md, "Navigation without a
              destination". */}
          <button type="button" className="text-ink-soft transition-colors hover:text-ink">
            Aide
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
