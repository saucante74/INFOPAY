/**
 * `../api/client` is mocked wholesale: this hook's contract is "fetch once
 * when a token appears, expose what it resolves to, and let
 * `decrementRateLimit` update it locally afterward" — not anything about
 * axios or HTTP.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearToken, setToken } from "../auth/tokenStore";
import { makeRateLimits } from "../test/fixtures";
import { decrementRateLimit, useRateLimits } from "./useRateLimits";

vi.mock("../api/client", () => ({
  fetchRateLimits: vi.fn(),
}));

import { fetchRateLimits } from "../api/client";

const mockFetchRateLimits = vi.mocked(fetchRateLimits);

beforeEach(() => {
  mockFetchRateLimits.mockReset();
});

// localStorage (and therefore the token) is cleared after each test by
// src/test/setup.ts, but the module-level rate-limits store isn't reset by
// anything else — logging out (which every test does implicitly via that
// cleanup) is exactly what clears it, so no separate afterEach is needed.

describe("useRateLimits", () => {
  it("reports null, and never fetches, without a token", () => {
    const { result } = renderHook(() => useRateLimits());

    expect(result.current).toBeNull();
    expect(mockFetchRateLimits).not.toHaveBeenCalled();
  });

  it("fetches once a token exists and exposes the resolved quotas", async () => {
    setToken("jwt.token.value");
    const limits = makeRateLimits();
    mockFetchRateLimits.mockResolvedValueOnce(limits);

    const { result } = renderHook(() => useRateLimits());

    await waitFor(() => {
      expect(result.current).toEqual(limits);
    });
    expect(mockFetchRateLimits).toHaveBeenCalledTimes(1);
  });

  it("clears to null when the token disappears (logout, or a 401)", async () => {
    setToken("jwt.token.value");
    mockFetchRateLimits.mockResolvedValueOnce(makeRateLimits());
    const { result } = renderHook(() => useRateLimits());
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    act(() => {
      clearToken();
    });

    expect(result.current).toBeNull();
  });

  it("leaves the badge hidden when the initial fetch fails, without throwing", async () => {
    setToken("jwt.token.value");
    mockFetchRateLimits.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useRateLimits());

    // Nothing to await on success here, so just let the rejection settle.
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBeNull();
  });

  it("decrementRateLimit lowers only the given scope's remaining count", async () => {
    setToken("jwt.token.value");
    mockFetchRateLimits.mockResolvedValueOnce(
      makeRateLimits({
        upload: { remaining: 5, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
        chat: { remaining: 9, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
      })
    );
    const { result } = renderHook(() => useRateLimits());
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    act(() => {
      decrementRateLimit("upload");
    });

    expect(result.current?.upload.remaining).toBe(4);
    expect(result.current?.chat.remaining).toBe(9); // untouched
  });

  it("decrementRateLimit never goes below zero", async () => {
    setToken("jwt.token.value");
    mockFetchRateLimits.mockResolvedValueOnce(
      makeRateLimits({ upload: { remaining: 0, limit: 20, reset_at: "2025-01-31T12:00:00Z" } })
    );
    const { result } = renderHook(() => useRateLimits());
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    act(() => {
      decrementRateLimit("upload");
    });

    expect(result.current?.upload.remaining).toBe(0);
  });

  it("decrementRateLimit is a no-op before anything has been fetched", () => {
    // No token set, so useRateLimits() never fetches — this simulates
    // UploadZone/ChatPanel calling it while logged out or before the
    // initial fetch resolves, which must not throw.
    expect(() => {
      decrementRateLimit("chat");
    }).not.toThrow();
  });
});
