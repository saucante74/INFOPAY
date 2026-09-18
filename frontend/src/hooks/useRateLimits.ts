import { useEffect, useSyncExternalStore } from "react";

import { fetchRateLimits } from "../api/client";
import type { RateLimits } from "../api/types";
import { useAuthToken } from "../auth/tokenStore";

/**
 * Module-level store, same `useSyncExternalStore` pattern as
 * `auth/tokenStore.ts`/`auth/authModal.ts` — needed here for the same
 * reason: `Navbar` (which displays the counters) and `UploadZone`/
 * `ChatPanel` (which decrement them after a successful call) are siblings,
 * not parent/child, so component-local `useState` couldn't be shared
 * between them without prop-drilling through `AnalyzerPage` and
 * `RootLayout` for something that's really one piece of app-wide state.
 */
let state: RateLimits | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): RateLimits | null {
  return state;
}

/** Replaces local state with a fresh server read — the source of truth
 * after login, or if a caller ever needs to force a resync. */
async function refreshRateLimits(): Promise<void> {
  state = await fetchRateLimits();
  notify();
}

/**
 * Decrements `remaining` for one scope after a successful upload or chat
 * call, without a round trip to the server.
 *
 * This is safe, not just convenient: `reset_at` tracks when the *oldest*
 * hit in the sliding window expires, and adding one new hit to a window
 * that already has others in it never changes which one is oldest — so
 * nothing about `reset_at` goes stale from this, only `remaining` needs
 * updating. `Math.max(0, ...)` guards the one edge case where a stale
 * local count already showed 0 while the server's window had actually
 * already slid open again; the number briefly under-reports rather than
 * going negative, and the next login/mount reconciles it with a real fetch.
 *
 * A no-op if nothing has been fetched yet (`state` is `null`): there's no
 * displayed counter to keep in sync with in that case.
 */
export function decrementRateLimit(scope: keyof RateLimits): void {
  if (!state) return;
  state = {
    ...state,
    [scope]: { ...state[scope], remaining: Math.max(0, state[scope].remaining - 1) },
  };
  notify();
}

/**
 * The current upload/chat quotas, `null` while logged out or before the
 * first fetch resolves. Fetches once when a token appears (mirrors
 * `usePayslips`'s own gating) and clears local state on logout, so a
 * different account never briefly shows the previous one's numbers.
 *
 * Deliberately fetch-once-then-decrement-locally rather than refetching
 * after every action (see `decrementRateLimit`) — the brief allows either,
 * and a network round trip after every single upload/chat message for a
 * number that can be deduced for free isn't worth the extra latency or the
 * additional failure mode (what does the badge show if that refetch itself
 * fails?).
 */
export function useRateLimits(): RateLimits | null {
  const token = useAuthToken();
  const limits = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!token) {
      state = null;
      notify();
      return;
    }
    // Fire-and-forget, same as `usePayslips`'s initial load: a failed fetch
    // leaves the badge hidden (`limits` stays `null`) rather than surfacing
    // an error for what is a "nice to know," not critical, piece of UI.
    refreshRateLimits().catch(() => {
      // Intentionally silent — see above.
    });
  }, [token]);

  return token ? limits : null;
}
