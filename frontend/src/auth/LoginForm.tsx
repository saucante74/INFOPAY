import { Loader2 } from "lucide-react";
import { useState } from "react";

import { getApiErrorMessage, login } from "../api/client";
import { setToken } from "./tokenStore";

const INPUT_CLASSES =
  "mt-1.5 w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent";

interface LoginFormProps {
  /** Runs once, right after `setToken()`, in addition to it — not instead
   * of it. `setToken` is what actually updates auth state everywhere
   * (Navbar, `RequireAuth`-era pages, `usePayslips`); `onSuccess` is only
   * for context-specific follow-up (`LoginPage` needs none — its own
   * `token` check already redirects reactively; `LoginModal` passes
   * `resolveAuthModal` to close itself and resume whatever was pending). */
  onSuccess?: () => void;
}

/**
 * The actual username/password form, shared between `LoginPage` (the
 * standalone `/login` route) and `LoginModal` (opened by `requireAuth`
 * from anywhere) — factored out so the credential-submission logic and
 * its error handling exist in exactly one place, per CLAUDE.md's
 * "Auth stays isolated" rule.
 */
export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      setToken(await login({ username, password }));
      onSuccess?.();
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
    // No card styling here (border/background/padding) — `LoginPage` wraps
    // this in its own card, `LoginModal` sits inside a dialog that's
    // already a card; adding a second one here would nest cards inside
    // cards for either caller.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="space-y-6"
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
  );
}
