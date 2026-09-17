import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts rather than merged into it: vite.config.ts
// stays purely about the dev server/build, `test` is Vitest-only config that
// `vite build` would otherwise carry around for no reason. Same "one file,
// one responsibility" principle already applied to the CI workflows
// (mypy.yml / api-tests.yml / frontend-checks.yml).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Explicit imports (`import { describe, it, expect } from "vitest"`) in
    // every test file, not Vitest's injected globals: consistent with this
    // project's "no implicit anything" strict-TypeScript stance — a test
    // file's dependencies should be visible at the top of the file, the
    // same way `verbatimModuleSyntax` already forces for the rest of src/.
    globals: false,
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/api/schema.ts", "src/**/*.test.{ts,tsx}"],
    },
  },
});
