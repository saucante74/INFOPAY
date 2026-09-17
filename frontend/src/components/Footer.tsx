import { FileText } from "lucide-react";

/**
 * Same treatment as Navbar's placeholder links, and for the same reason:
 * no /confidentialite, /conditions or /contact page exists in this
 * single-route app. Real `<button>`s, no `onClick` — see RAPPORT.md,
 * "Navigation without a destination".
 */
const FOOTER_LINKS = [
  "Confidentialité",
  "Conditions d'utilisation",
  "Contact",
] as const satisfies readonly string[];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-raised">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-white">
            <FileText className="h-3 w-3" />
          </span>
          {/* Computed, not the mockup's literal "2026", so it never goes
              stale — see RAPPORT.md. */}
          <span>© {new Date().getFullYear()} InfoPay AI. Tous droits réservés.</span>
        </div>

        <div className="flex items-center gap-6">
          {FOOTER_LINKS.map((label) => (
            <button key={label} type="button" className="transition-colors hover:text-ink">
              {label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
