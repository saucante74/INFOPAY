import { Link } from "react-router";

/** Catch-all route ("*") — react-router has no default 404 of its own. */
export default function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-sm text-ink-soft">Cette page n'existe pas.</p>
      {/* `text-ink`, not `text-accent`, for the same reason as Navbar's
          active link: text-accent on surface-raised only measures 3.02:1 in
          dark mode, short of the 4.5:1 normal-text WCAG threshold. The
          underline carries the accent color instead — see RAPPORT.md. */}
      <Link
        to="/"
        className="mt-2 text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-4"
      >
        Retour à l'analyseur
      </Link>
    </div>
  );
}
