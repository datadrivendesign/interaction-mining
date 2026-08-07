import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default defineConfig([
  globalIgnores([
    "**/*.json",
    "**/*.md",
    ".next/**",
    ".venv/**",
    "dist/**",
    "out/**",
    // Gitignored agent scratch space: plans, and throwaway spikes that vendor
    // third-party builds. CI never sees it, but linting it locally reports
    // problems in code nobody here wrote or ships.
    "plans/**",
    "src/app/(signed-in)/_trace/**",
  ]),
  ...compat.extends("next/core-web-vitals"),
]);
