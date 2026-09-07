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
    "build/**",
    "next-env.d.ts",
    // Generated Quran content (scripts/sync-content.mjs) — large,
    // single-line JSON data files, not source code. Without this, ESLint
    // tries to parse them as JS/TS (huge minified-looking "files") and
    // effectively hangs — not just noisy, genuinely too slow to finish.
    "src/content/generated/**",
    // pdf.js worker copied by scripts/pdf/copy-pdf-worker.mjs (postinstall)
    // from node_modules — a minified third-party build artifact, not
    // source code (see .gitignore's /public/pdf-worker/ note).
    "public/pdf-worker/**",
    // Capacitor-generated native project (MOBILE.md) — Gradle project
    // files, plus a copy of the static-exported web bundle
    // (android/app/src/main/assets/public) that ESLint would otherwise try
    // to parse as source and choke on (same "huge minified-looking file"
    // problem as src/content/generated above). Android-only for now
    // (mobile/android branch) — add "ios/**" back here once the iOS
    // branch introduces that folder.
    "android/**",
  ]),
]);

export default eslintConfig;
