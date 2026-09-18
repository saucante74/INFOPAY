import { useCallback, useEffect, useState } from "react";

import { deletePayslip, fetchPayslips } from "../api/client";
import type { Payslip } from "../api/types";
import { useAuthToken } from "../auth/tokenStore";

interface UsePayslipsResult {
  payslips: readonly Payslip[];
  isLoading: boolean;
  /** Appends a payslip that was just uploaded, without refetching the list. */
  addPayslip: (payslip: Payslip) => void;
  /**
   * Deletes a payslip on the server, then removes it from local state —
   * only on success, so a failed delete leaves the row exactly where it
   * was rather than optimistically disappearing. Rejects on failure; the
   * caller (`PayslipTable`) is the one with a UI to show that in.
   */
  removePayslip: (id: number) => Promise<void>;
}

const EMPTY_PAYSLIPS: readonly Payslip[] = [];

/**
 * Owns the payslip list: loads it once on mount and exposes an append for
 * newly uploaded ones.
 *
 * Deliberately concrete rather than a generic `useAsyncData<T>()`: there is
 * exactly one caller and one resource, so a generic would be speculative
 * generality — the same "don't over-engineer" line CONVENTIONS.md draws for
 * the backend. The return type is still an explicit interface so callers
 * destructure against a contract, not an inferred tuple.
 *
 * Gated on `useAuthToken()` since "/" became public: an anonymous visitor
 * would otherwise fire a `GET /api/payslips` that's guaranteed to 401 (and,
 * per `attachAuth.ts`, pop the login modal on page load for no reason the
 * visitor asked for). The same effect doubles as the "resume" path for
 * this particular piece of state — logging in via the modal changes
 * `token`, which re-runs the effect and fetches for the first time,
 * without any bespoke wiring for this one case.
 */
export function usePayslips(): UsePayslipsResult {
  const token = useAuthToken();
  const [payslips, setPayslips] = useState<readonly Payslip[]>([]);
  // The token value `payslips` was last fetched for. `isLoading` is derived
  // from comparing this to the current `token` (below) rather than tracked
  // as its own boolean flipped synchronously at the top of the effect,
  // which `react-hooks/set-state-in-effect` flags — every `setState` call
  // here happens inside an async `.then()`/`.finally()` callback instead.
  const [loadedForToken, setLoadedForToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Same fire-and-forget load as before: a failure leaves the list empty
    // and the UI shows its "no payslips yet" state rather than an error.
    fetchPayslips()
      .then(setPayslips)
      .catch(() => {
        // Intentionally silent, unchanged from the .jsx version: a failed
        // initial load leaves the list empty and the UI falls through to its
        // "aucun bulletin importé" state rather than surfacing an error.
      })
      .finally(() => {
        setLoadedForToken(token);
      });
  }, [token]);

  const addPayslip = useCallback((payslip: Payslip) => {
    setPayslips((prev) => [...prev, payslip]);
  }, []);

  const removePayslip = useCallback(async (id: number) => {
    await deletePayslip(id);
    setPayslips((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Logged out: always report empty/not-loading, regardless of what's left
  // in state from a previous session (logout, or a 401 mid-session) —
  // there's never a moment where stale data briefly shows for a
  // now-unauthenticated visitor.
  if (!token) {
    return { payslips: EMPTY_PAYSLIPS, isLoading: false, addPayslip, removePayslip };
  }
  return { payslips, isLoading: loadedForToken !== token, addPayslip, removePayslip };
}
