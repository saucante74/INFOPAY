import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { closeAuthModal, requireAuth, resolveAuthModal, useAuthModalState } from "./authModal";
import { setToken } from "./tokenStore";

// localStorage (and therefore the token) is cleared after each test by
// src/test/setup.ts, but `authModal`'s own state is a plain module-level
// variable — reset explicitly so no test starts with a stray open modal
// or pending action left by the previous one.
afterEach(() => {
  closeAuthModal();
});

describe("authModal", () => {
  it("runs the action immediately, without opening, when already logged in", () => {
    setToken("jwt.token.value");
    const { result } = renderHook(() => useAuthModalState());
    const action = vi.fn();

    act(() => {
      requireAuth(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it("opens the modal and stashes the action, without running it, when logged out", () => {
    const { result } = renderHook(() => useAuthModalState());
    const action = vi.fn();

    act(() => {
      requireAuth(action);
    });

    expect(result.current.isOpen).toBe(true);
    expect(action).not.toHaveBeenCalled();
  });

  it("requireAuth() with no argument is a valid manual open (Navbar's 'Se connecter')", () => {
    const { result } = renderHook(() => useAuthModalState());

    act(() => {
      requireAuth();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("closeAuthModal discards the pending action instead of running it", () => {
    const { result } = renderHook(() => useAuthModalState());
    const action = vi.fn();
    act(() => {
      requireAuth(action);
    });

    act(() => {
      closeAuthModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it("resolveAuthModal runs the pending action exactly once, then closes", () => {
    const { result } = renderHook(() => useAuthModalState());
    const action = vi.fn();
    act(() => {
      requireAuth(action);
    });

    act(() => {
      resolveAuthModal();
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);

    // A second resolve (e.g. a stray re-render) must not run it again —
    // the pending action is cleared on the first resolve.
    act(() => {
      resolveAuthModal();
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("resolveAuthModal with no pending action (Navbar's manual 'Se connecter') just closes", () => {
    const { result } = renderHook(() => useAuthModalState());
    act(() => {
      requireAuth();
    });

    act(() => {
      resolveAuthModal();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("a second requireAuth call while already open replaces the pending action", () => {
    const { result } = renderHook(() => useAuthModalState());
    const first = vi.fn();
    const second = vi.fn();
    act(() => {
      requireAuth(first);
    });
    act(() => {
      requireAuth(second);
    });

    act(() => {
      resolveAuthModal();
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });
});
