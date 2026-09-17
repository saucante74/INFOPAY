import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

// Flat config, written out explicitly rather than pulled from the
// `typescript-eslint` meta-package's `config()` helper: the same reasoning
// the backend applies to its hand-written LangGraph graph — keep the wiring
// legible instead of hiding it behind a prebuilt abstraction. It also means
// the only typescript-eslint packages installed are the parser and the
// plugin, nothing else.
export default [
  {
    // Generated from the backend's OpenAPI schema — not ours to lint.
    // Regenerate with `npm run generate:api-types` (see CONVENTIONS.md).
    ignores: ["dist/**", "coverage/**", "src/api/schema.ts"],
  },

  js.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // Type-aware linting. Without this the `no-unsafe-*` rules below are
        // inert, and `any` leaking in from an untyped library would pass
        // silently — which is the whole thing this migration is guarding
        // against.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...tsPlugin.configs["strict-type-checked"].rules,
      ...tsPlugin.configs["stylistic-type-checked"].rules,
      ...reactHooks.configs.recommended.rules,

      // Ports the two rules the previous oxlint config enforced.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // No escape hatches: an `any` or a silent `@ts-ignore` should fail the
      // lint run, not just look untidy.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],
    },
  },

  {
    // Node-side config files: no browser globals, no type-aware React rules.
    files: ["vite.config.ts", "eslint.config.js", "postcss.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
