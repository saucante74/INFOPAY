import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router";

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
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-surface-raised">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          {/* `logo-mark.svg`: a white silhouette derived from
              public/logo.svg (its background square stripped, every path
              recolored to white — see RAPPORT.md, "Logo"). Placed inside
              the same `bg-accent` badge FileText used, so it inherits that
              pairing's already-verified WCAG contrast (5.47:1, both
              themes) instead of the source file's own baked-in near-white
              background, which reads as a broken white square in dark
              mode. */}
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
            <img src="/logo-mark.svg" alt="" className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold">InfoPay AI</span>
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
          {token && (
            <button
              type="button"
              onClick={() => {
                clearToken();
                void navigate("/login");
              }}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
