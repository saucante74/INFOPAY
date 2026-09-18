import { Navigate } from "react-router";

import LoginForm from "../auth/LoginForm";
import { useAuthToken } from "../auth/tokenStore";

/**
 * The "/login" route: a direct, bookmarkable destination, but no longer the
 * forced landing page for "/" — see RAPPORT.md. Once a token exists (just
 * logged in here, or already logged in on arrival) it redirects to "/"
 * declaratively, so both cases share one code path.
 */
export default function LoginPage() {
  const token = useAuthToken();

  if (token) return <Navigate to="/" replace />;

  return (
    // `flex-1`: `RootLayout`'s `<main>` is itself a flex column, so this is
    // what actually grows to fill the space between Navbar and Footer —
    // `justify-center` then centers the card vertically *within that*,
    // rather than within the whole viewport (which would sit the card
    // under the navbar instead of the page's true visual center).
    //
    // `py-10`, not the previous session's `py-12`: the logo below adds
    // height to the stack, so the outer padding was trimmed slightly to
    // keep the whole composition (logo + heading + form) from growing
    // taller than it needs to — still centered, just less air around it.
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo + heading centered as one block (`text-center`); the form
            below stays left-aligned, its own labels/inputs are naturally
            read top-to-bottom rather than centered — centering a form's
            fields is the actual anti-pattern here, not the intro block. */}
        <div className="text-center">
          {/* `logo-mark.svg`, displayed directly at a larger size than the
              Navbar's (48–64px range) since it's the standalone brand
              mark here rather than a small inline icon next to nav links.
              No frame needed — see Navbar.tsx's comment on why this asset,
              unlike every previous one used here, is genuinely
              transparent. No "InfoPay AI" text here: the icon alone is the
              mark for this page, per user feedback. */}
          <img src="/logo-mark.svg" alt="InfoPay AI" className="mx-auto h-16 w-16" />

          <h1 className="mt-6 text-2xl font-bold">Connexion</h1>
          <p className="mt-1 text-sm text-ink-soft">Connectez-vous pour accéder à l'analyseur.</p>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface-raised p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
