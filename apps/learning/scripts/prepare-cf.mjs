#!/usr/bin/env node
// Packages the static export (out/) for Cloudflare Workers Static Assets:
//   dist/learning/**   <- out/**   (so /learning/_next/... maps to a file)
//   dist/_headers                  (security + cache headers)
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const BASE = (process.env.NEXT_BASE_PATH || "/learning").replace(/^\/|\/$/g, "");

if (!existsSync("out/index.html")) {
  console.error("prepare-cf: out/ missing — run the Next build first (npm run build:cf).");
  process.exit(1);
}

rmSync("dist", { recursive: true, force: true });
mkdirSync(`dist/${BASE}`, { recursive: true });
cpSync("out", `dist/${BASE}`, { recursive: true });

// No CSP on purpose: Google Drive picker/OAuth (apis.google.com,
// accounts.google.com, *.googleusercontent.com, docs.google.com), Google Meet,
// Supabase (https/wss) and the pdf.js worker/wasm make a safe CSP something to
// design and test in a browser first. Only low-risk headers here.
const headers = `/${BASE}/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

/${BASE}/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`;
writeFileSync("dist/_headers", headers);
console.log(`prepare-cf: dist/${BASE}/ + dist/_headers written`);
