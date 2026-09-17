import { useCallback, useEffect, useState } from "react";

import { fetchPayslips } from "../api/client";
import type { Payslip } from "../api/types";

interface UsePayslipsResult {
  payslips: readonly Payslip[];
  isLoading: boolean;
  /** Appends a payslip that was just uploaded, without refetching the list. */
  addPayslip: (payslip: Payslip) => void;
}

/**
 * Owns the payslip list: loads it once on mount and exposes an append for
 * newly uploaded ones.
 *
 * Deliberately concrete rather than a generic `useAsyncData<T>()`: there is
 * exactly one caller and one resource, so a generic would be speculative
 * generality — the same "don't over-engineer" line CONVENTIONS.md draws for
 * the backend. The return type is still an explicit interface so callers
 * destructure against a contract, not an inferred tuple.
 */
export function usePayslips(): UsePayslipsResult {
  const [payslips, setPayslips] = useState<readonly Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        setIsLoading(false);
      });
  }, []);

  const addPayslip = useCallback((payslip: Payslip) => {
    setPayslips((prev) => [...prev, payslip]);
  }, []);

  return { payslips, isLoading, addPayslip };
}
