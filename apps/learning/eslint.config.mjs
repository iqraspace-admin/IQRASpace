import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "dist/**",
    ".wrangler/**",
    "build/**",
    "next-env.d.ts",
    // Vendored pdfjs-dist runtime assets, copied by scripts/copy-pdfjs-assets.mjs
    // (predev/prebuild) — gitignored, not source, not seen by a fresh CI checkout
    // before lint runs, but present locally after any `npm run dev`/`build`.
    "public/pdfjs/**",
  ]),
]);

export default eslintConfig;
