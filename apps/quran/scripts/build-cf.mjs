// Cross-platform production build for Cloudflare Workers Static Assets.
// Sets NEXT_BASE_PATH=/quran (no shell env syntax, so it behaves the same
// on Windows/macOS/Linux/CI — Git Bash on Windows would otherwise rewrite
// "/quran" into a Windows path), runs the normal static-export build, then
// assembles dist/ via scripts/prepare-cf.mjs.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, NEXT_BASE_PATH: "/quran" };

function run(commandLine) {
  // Single command string + shell: works for npm/npm.cmd on every OS
  // (Node >= 20.12 refuses to spawn .cmd files without a shell).
  const result = spawnSync(commandLine, { cwd: appRoot, env, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`build-cf: "${commandLine}" failed (exit ${result.status ?? result.signal})`);
    process.exit(result.status ?? 1);
  }
}

run("npm run build");
run("node scripts/prepare-cf.mjs");
