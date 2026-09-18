import { useSyncExternalStore } from "react";

/**
 * The JWT, persisted in `localStorage` and observable from React.
 *
 * `localStorage` rather than an httpOnly cookie: the backend authenticates
 * with an `Authorization: Bearer` header, which means JS has to read the
 * token anyway. A cookie would also require CSRF protection and CORS
 * credentials. The trade-off is XSS exposure, which is kept small here:
 * React escapes all rendered text, `dangerouslySetInnerHTML` is used
 * nowhere in `src/`, and the token expires after 24 h. See RAPPORT.md.
 */
const STORAGE_KEY = "infopay-token";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage disabled (private browsing, blocked site data): behave as
    // logged out rather than crash.
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Same fallback as getToken: the login can't persist, the user stays
    // on /login.
  }
  notify();
}

export function clearToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Logging out in one tab logs out the others: `storage` only fires for
  // changes made by *other* documents.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The current token; re-renders on login, logout, a 401, or another tab. */
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getToken);
}
