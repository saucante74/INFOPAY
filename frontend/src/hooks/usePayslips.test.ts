/**
 * `../api/client` is mocked wholesale: this hook's contract is "call
 * fetchPayslips once, expose what it resolves/rejects to", not anything
 * about axios or HTTP.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makePayslip } from "../test/fixtures";
import { usePayslips } from "./usePayslips";

vi.mock("../api/client", () => ({
  fetchPayslips: vi.fn(),
}));

import { fetchPayslips } from "../api/client";

const mockFetchPayslips = vi.mocked(fetchPayslips);

beforeEach(() => {
  mockFetchPayslips.mockReset();
});

describe("usePayslips", () => {
  it("starts loading with an empty list, then resolves with the fetched payslips", async () => {
    const payslips = [
      makePayslip({ mois_annee: "01/2025" }),
      makePayslip({ mois_annee: "02/2025" }),
    ];
    mockFetchPayslips.mockResolvedValueOnce(payslips);

    const { result } = renderHook(() => usePayslips());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.payslips).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.payslips).toEqual(payslips);
    expect(mockFetchPayslips).toHaveBeenCalledTimes(1);
  });

  it("leaves the list empty when the initial fetch fails, without throwing", async () => {
    mockFetchPayslips.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => usePayslips());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // Matches the hook's documented behaviour: a failed load leaves the
    // list empty so the UI falls through to its "aucun bulletin" state,
    // rather than surfacing the error.
    expect(result.current.payslips).toEqual([]);
  });

  it("addPayslip appends without refetching", async () => {
    mockFetchPayslips.mockResolvedValueOnce([makePayslip({ mois_annee: "01/2025" })]);

    const { result } = renderHook(() => usePayslips());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newPayslip = makePayslip({ mois_annee: "02/2025" });
    act(() => {
      result.current.addPayslip(newPayslip);
    });

    expect(result.current.payslips.map((p) => p.mois_annee)).toEqual(["01/2025", "02/2025"]);
    expect(mockFetchPayslips).toHaveBeenCalledTimes(1);
  });
});
