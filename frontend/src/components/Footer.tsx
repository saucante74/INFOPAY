import { Link } from "react-router";

/** "Contact" was dropped entirely — no page exists for it, and none is planned. */
const FOOTER_LINKS = [
  { label: "Confidentialité", to: "/confidentialite" },
  { label: "Conditions d'utilisation", to: "/conditions-utilisation" },
] as const satisfies readonly { label: string; to: string }[];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-raised">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Same `logo-mark.svg` badge as Navbar — see its comment there. */}
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent">
            <img src="/logo-mark.svg" alt="" className="h-3 w-3" />
          </span>
          {/* Computed, not the mockup's literal "2026", so it never goes
              stale — see RAPPORT.md. */}
          <span>© {new Date().getFullYear()} InfoPay AI. Tous droits réservés.</span>
        </div>

        <div className="flex items-center gap-6">
          {FOOTER_LINKS.map(({ label, to }) => (
            <Link key={label} to={to} className="transition-colors hover:text-ink">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
