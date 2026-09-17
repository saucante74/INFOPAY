import { Bell, FileText, User } from "lucide-react";

import ThemeToggle from "./ThemeToggle";

/**
 * The four items shown in docs/InfoPay.pdf's navbar. Only "Tableau de
 * bord" corresponds to a page that actually exists — this is a
 * single-route app with no router. The other three are rendered as real,
 * focusable `<button>`s (not `<span>`s, not `disabled`) so they read as
 * genuinely interactive rather than silently inert, but intentionally
 * carry no `onClick`: there is nowhere for them to navigate to yet, and
 * inventing a fake destination would be worse than leaving them as
 * documented placeholders. See RAPPORT.md, "Navigation without a
 * destination", for the full reasoning.
 */
const NAV_LINKS = ["Historique", "Rapports", "Aide"] as const satisfies readonly string[];

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
            Tableau de bord
          </button>
          {NAV_LINKS.map((label) => (
            <button
              key={label}
              type="button"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-soft transition-colors hover:text-ink"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Compte utilisateur"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
