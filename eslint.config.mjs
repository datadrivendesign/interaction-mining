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
    "src/app/(signed-in)/_trace/**",
  ]),
  ...compat.extends("next/core-web-vitals"),
]);
