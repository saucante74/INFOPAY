import { LogIn, LogOut } from "lucide-react";
import { NavLink } from "react-router";

import { requireAuth } from "../auth/authModal";
import { clearToken, useAuthToken } from "../auth/tokenStore";
import ThemeToggle from "./ThemeToggle";

/**
 * `text-ink`, not `text-accent`, for the active state: the label needs to
 * stay legible on its own (text-accent on the dark navbar background
 * measures 3.02:1, short of the 4.5:1 normal-text WCAG threshold — see
 * RAPPORT.md). The underline carries the accent color instead, alongside
 * `NavLink`'s own `aria-current="page"` and the bolder weight, so "active"
 * is never signalled by color alone (WCAG SC 1.4.1).
 */
function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive
    ? "font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
    : "text-ink-soft transition-colors hover:text-ink";
}

export default function Navbar() {
  const token = useAuthToken();

  return (
    <header className="border-b border-border bg-surface-raised">
      {/* Matches `RootLayout`'s `<main>` width — see RAPPORT.md. */}
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          {/* `logo-mark.svg`: a genuinely transparent, hand-authored vector
              icon (a document outline + a teal checkmark seal), confirmed
              by rendering it with an explicitly transparent background and
              reading the output's alpha channel — 96.7% of the canvas came
              back alpha=0, unlike every previous logo asset used here (see
              RAPPORT.md, "Logo"). That's what makes displaying it directly,
              with no colored badge or background-matched chip, correct
              this time: there is no opaque content to hide. */}
          <img src="/logo-mark.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-bold text-ink">InfoPay AI</span>
        </div>

        <nav aria-label="Navigation principale" className="flex items-center gap-6 text-sm">
          {/* `end`: without it, NavLink treats "/" as a prefix match and
              would also report active on every other route. */}
          <NavLink to="/" end className={navLinkClassName}>
            Analyseur
          </NavLink>
          <NavLink to="/aide" className={navLinkClassName}>
            Aide
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {/* No navigation either way: logging out no longer sends you
              anywhere (there's nowhere it needs to — "/" is public), and
              "Se connecter" opens the shared modal in place rather than a
              route change, so whatever page you were reading stays put. */}
          {token ? (
            <button
              type="button"
              onClick={clearToken}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                requireAuth();
              }}
              aria-label="Se connecter"
              title="Se connecter"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <LogIn className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
