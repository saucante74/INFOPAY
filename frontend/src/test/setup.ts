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
