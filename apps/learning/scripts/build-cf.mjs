#!/usr/bin/env node
// Cross-platform `build:cf`: next build with NEXT_BASE_PATH=/learning, then
// scripts/prepare-cf.mjs. Public NEXT_PUBLIC_* vars come from the environment
// (CI) or .env.local, exactly as for a normal `npm run build`.
import { spawnSync } from "node:child_process";

const env = { ...process.env, NEXT_BASE_PATH: process.env.NEXT_BASE_PATH || "/learning" };
const run = (args) => {
  const r = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(["scripts/copy-pdfjs-assets.mjs"]);
run(["node_modules/next/dist/bin/next", "build"]);
run(["scripts/prepare-cf.mjs"]);
