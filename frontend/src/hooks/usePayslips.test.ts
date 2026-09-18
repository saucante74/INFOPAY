/**
 * `../api/client` is mocked wholesale: this hook's contract is "call
 * fetchPayslips once, expose what it resolves/rejects to", not anything
 * about axios or HTTP.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearToken, setToken } from "../auth/tokenStore";
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

// localStorage (and therefore the token) is cleared after each test by
// src/test/setup.ts.

describe("usePayslips", () => {
  it("does not fetch, and reports empty/not-loading, without a token", () => {
    const { result } = renderHook(() => usePayslips());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.payslips).toEqual([]);
    expect(mockFetchPayslips).not.toHaveBeenCalled();
  });

  it("starts loading with an empty list once a token exists, then resolves with the fetched payslips", async () => {
    setToken("jwt.token.value");
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

  it("fetches for the first time once a token appears after mount (login via the modal)", async () => {
    const payslips = [makePayslip({ mois_annee: "03/2025" })];
    mockFetchPayslips.mockResolvedValueOnce(payslips);

    const { result } = renderHook(() => usePayslips());
    expect(mockFetchPayslips).not.toHaveBeenCalled();

    act(() => {
      setToken("jwt.token.value");
    });

    await waitFor(() => {
      expect(result.current.payslips).toEqual(payslips);
    });
  });

  it("clears the list and stops loading when the token disappears (logout, or a 401)", async () => {
    setToken("jwt.token.value");
    mockFetchPayslips.mockResolvedValueOnce([makePayslip()]);
    const { result } = renderHook(() => usePayslips());
    await waitFor(() => {
      expect(result.current.payslips).toHaveLength(1);
    });

    act(() => {
      clearToken();
    });

    expect(result.current.payslips).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("leaves the list empty when the initial fetch fails, without throwing", async () => {
    setToken("jwt.token.value");
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
    setToken("jwt.token.value");
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
