import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router";

/**
 * `Navbar` (`NavLink`) and `Footer`/route pages (`Link`) all need a router
 * context to render at all — real `<BrowserRouter>` would touch
 * `window.history`, which isn't necessary in a test, so every test wraps
 * with `MemoryRouter` instead. Centralised here rather than repeated in
 * every test file that touches routing.
 */
export function renderWithRouter(ui: ReactElement, initialEntry = "/"): RenderResult {
  return render(<MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>);
}

/**
 * Narrows `value` to non-null/non-undefined via a genuine runtime check
 * that throws with a useful message, rather than a `!` or `as` assertion
 * that would only silence the compiler — `no-non-null-assertion` is part of
 * this project's `strict-type-checked` ESLint rule set with no exception
 * for tests, and for good reason here: a query like `document.querySelector`
 * returning `null` usually means the test's setup is wrong, and `!` would
 * turn that into a confusing "cannot read property of null" a few lines
 * later instead of a clear failure at the actual point of the mistake.
 */
export function assertDefined<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * A minimal `window.matchMedia` stand-in. jsdom implements no `matchMedia`
 * at all (unlike most other `window` APIs), so anything that calls it —
 * here, `useTheme`'s system-preference detection — needs this stubbed
 * before it can run under jsdom.
 *
 * `matches` is fixed for the stub's lifetime: no test in this suite needs
 * to simulate the system preference changing *while mounted* (only its
 * value at mount, which `useTheme` reads once via `readSystemTheme()`), so
 * `addEventListener`/`removeEventListener` are real `Set`s that track
 * listeners without ever invoking them — enough for `useTheme`'s cleanup
 * effect to register and unregister without throwing.
 */
export function createMatchMediaStub(matches: boolean): typeof window.matchMedia {
  return (query: string): MediaQueryList => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const mediaQueryList: MediaQueryList = {
      matches,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
      addListener: () => {
        // Deprecated pre-EventTarget API. Unused by useTheme; present only
        // because MediaQueryList's type declares it.
      },
      removeListener: () => {
        // See addListener above.
      },
    };
    return mediaQueryList;
  };
}
