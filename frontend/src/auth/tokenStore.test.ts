import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { clearToken, getToken, setToken, useAuthToken } from "./tokenStore";

// localStorage is cleared after each test by src/test/setup.ts.

describe("tokenStore", () => {
  it("persists, reads and clears the token", () => {
    expect(getToken()).toBeNull();
    setToken("jwt.token.value");
    expect(getToken()).toBe("jwt.token.value");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("re-renders subscribers on login and logout", () => {
    const { result } = renderHook(() => useAuthToken());
    expect(result.current).toBeNull();

    act(() => {
      setToken("jwt.token.value");
    });
    expect(result.current).toBe("jwt.token.value");

    act(() => {
      clearToken();
    });
    expect(result.current).toBeNull();
  });

  it("follows a logout performed in another tab", () => {
    setToken("jwt.token.value");
    const { result } = renderHook(() => useAuthToken());

    act(() => {
      // Another tab's logout: storage changes, and this document only
      // hears about it through the `storage` event.
      localStorage.removeItem("infopay-token");
      window.dispatchEvent(new StorageEvent("storage", { key: "infopay-token" }));
    });

    expect(result.current).toBeNull();
  });
});
