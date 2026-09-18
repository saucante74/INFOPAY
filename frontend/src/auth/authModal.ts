import { useSyncExternalStore } from "react";

import { getToken } from "./tokenStore";

/**
 * Shared open/closed state for the login modal, plus the one action that
 * was waiting on it (if any) — same `useSyncExternalStore` module-store
 * pattern as `tokenStore.ts`, not a Context provider, for consistency with
 * the rest of `src/auth/`.
 *
 * This is the single place that decides "does this attempt need a login
 * first", so `Navbar`, `UploadZone` and `ChatPanel` all call `requireAuth`
 * instead of each checking `useAuthToken()` and rendering their own gate.
 */
interface AuthModalState {
  isOpen: boolean;
  /** Runs once, automatically, right after a successful login — how the
   * upload/message that triggered the modal resumes without the caller
   * having to poll or re-check auth state itself. `null` for a plain
   * "Se connecter" click, which has nothing to resume. */
  pendingAction: (() => void) | null;
}

let state: AuthModalState = { isOpen: false, pendingAction: null };
const listeners = new Set<() => void>();

function setState(next: AuthModalState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): AuthModalState {
  return state;
}

/**
 * The entry point every gated action calls. Already logged in: `action`
 * (if given) runs immediately, synchronously — a caller can always write
 * `requireAuth(() => doTheThing())` without a separate "am I logged in"
 * branch. Not logged in: the modal opens and `action` is stashed to run
 * once login succeeds (see `resolveAuthModal`).
 */
export function requireAuth(action?: () => void): void {
  if (getToken()) {
    action?.();
    return;
  }
  setState({ isOpen: true, pendingAction: action ?? null });
}

/** A manual close (✕, Escape, backdrop click) — discards any pending action. */
export function closeAuthModal(): void {
  setState({ isOpen: false, pendingAction: null });
}

/** Called by the modal itself once login succeeds: runs the pending
 * action exactly once, then closes. */
export function resolveAuthModal(): void {
  const { pendingAction } = state;
  setState({ isOpen: false, pendingAction: null });
  pendingAction?.();
}

export function useAuthModalState(): AuthModalState {
  return useSyncExternalStore(subscribe, getState);
}
