/**
 * Runs once before each test file (see `vitest.config.ts`'s `setupFiles`).
 *
 * Importing the `/vitest` entry point rather than the plain
 * `@testing-library/jest-dom` package does two things at once: it registers
 * the DOM matchers (`toBeInTheDocument()`, `toBeDisabled()`, ...) against
 * Vitest's `expect`, and it augments Vitest's `Assertion` type so those
 * matchers type-check under `tsc -b` — the same strict config the app is
 * built with, per CONVENTIONS.md.
 */
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { createMatchMediaStub } from "./helpers";

/**
 * React Testing Library normally unmounts and clears the DOM after each
 * test on its own, but that auto-registration relies on detecting Vitest's
 * *global* `afterEach` on `globalThis`. `vitest.config.ts` sets
 * `globals: false` (test files import `afterEach` explicitly instead), which
 * means RTL never finds a hook to attach to — so it has to be wired up by
 * hand here, once, for every test file.
 */
afterEach(() => {
  cleanup();
});

/**
 * jsdom implements `window.scrollTo` but not `Element.prototype.scrollTo`
 * (https://github.com/jsdom/jsdom/issues/1695), which `ChatPanel` calls on
 * its message list to auto-scroll to the latest message. Stubbed as a
 * no-op: the auto-scroll itself has no observable effect worth asserting on
 * in jsdom (there is no real layout/scroll position to check), this only
 * exists so the component doesn't throw during render.
 */
Element.prototype.scrollTo = () => {
  // no-op: see the comment above.
};

/**
 * jsdom implements no `window.matchMedia` at all — used by `useTheme` to
 * read the system color-scheme preference. Defaults to "system prefers
 * light" (`matches: false`); tests that need "system prefers dark"
 * reassign `window.matchMedia` locally with `createMatchMediaStub(true)`.
 * Reset in `afterEach` so one test's override never leaks into the next.
 */
window.matchMedia = createMatchMediaStub(false);

afterEach(() => {
  window.matchMedia = createMatchMediaStub(false);
});

/**
 * `useTheme` sets `data-theme` on `document.documentElement` directly (see
 * src/index.css's dark-mode selectors) and persists to `localStorage` —
 * neither is scoped to the React tree RTL's `cleanup()` unmounts, so both
 * would otherwise leak from one ThemeToggle test into the next.
 */
afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});
