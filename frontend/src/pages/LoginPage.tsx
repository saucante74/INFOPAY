import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";

import { getApiErrorMessage, login } from "../api/client";
import { setToken, useAuthToken } from "../auth/tokenStore";

const INPUT_CLASSES =
  "mt-1.5 w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent";

/**
 * The "/login" route. Once a token exists (just logged in, or already
 * logged in on arrival) it redirects to "/" declaratively, so both cases
 * share one code path.
 */
export default function LoginPage() {
  const token = useAuthToken();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      setToken(await login({ username, password }));
    } catch (caught) {
      // A 401 carries "Identifiant ou mot de passe incorrect." as its detail.
      setError(
        getApiErrorMessage(caught) ??
          "Connexion impossible. Vérifiez que le serveur backend est bien lancé."
      );
      setIsSubmitting(false);
    }
  };

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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          className="mt-6 space-y-6 rounded-lg border border-border bg-surface-raised p-8"
        >
          <label className="block text-sm font-medium text-ink-soft">
            Identifiant
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              className={INPUT_CLASSES}
            />
          </label>

          <label className="block text-sm font-medium text-ink-soft">
            Mot de passe
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className={INPUT_CLASSES}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
