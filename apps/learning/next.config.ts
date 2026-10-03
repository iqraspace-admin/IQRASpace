import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app lives in a monorepo-ish layout (root package.json only holds the
  // Supabase CLI devDependency — see /package.json and docs/architecture.md §19).
  // Pin Turbopack's root here so it doesn't get confused by the extra
  // package-lock.json one level up.
  turbopack: {
    root: path.join(__dirname),
  },

  // Static export: no Node server at runtime. The build output (out/) is
  // served by Cloudflare Workers Static Assets (see wrangler.jsonc, worker/ and
  // scripts/prepare-cf.mjs). The four dynamic routes export one placeholder
  // shell each ("_") and read the real id from the URL on the client.
  output: "export",

  // Served at https://iqraspace.org/learning in production (set by
  // `npm run build:cf`); unset for local dev, which serves from the bare origin.
  basePath: process.env.NEXT_BASE_PATH || undefined,

};

export default nextConfig;
