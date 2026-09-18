import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";

import { getApiErrorMessage, login } from "../api/client";
import { setToken, useAuthToken } from "../auth/tokenStore";

const INPUT_CLASSES =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";

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
    <div className="mx-auto w-full max-w-sm py-8">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-ink-soft">Connectez-vous pour accéder à l'analyseur.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="mt-6 space-y-4 rounded-lg border border-border bg-surface-raised p-5"
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
          className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </button>
      </form>
    </div>
  );
}
