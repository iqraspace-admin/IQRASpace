// `npx capacitor-assets generate` (run by `npm run assets:mobile`) always
// also writes a generic "pwa" icon set (icons/*.webp) and a matching
// public/manifest.webmanifest, regardless of which native platforms are
// present — there's no flag to skip it. Both are dead weight here: this
// app's PWA icons are already served correctly by the existing dynamic
// src/app/manifest.ts + icon.tsx/apple-icon.tsx routes (basePath-aware,
// unlike this static pair), so a leftover static manifest.webmanifest
// would just sit unused, unreferenced, and out of sync. Delete both after
// every asset-generation run rather than leaving them to be found (and
// wondered about) later.
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

rmSync(path.join(ROOT, "icons"), { recursive: true, force: true });
rmSync(path.join(ROOT, "public/manifest.webmanifest"), { force: true });

console.log("Removed unused generated PWA icon set and manifest.webmanifest.");
