// `wrangler dev` needs the assets directory to exist even when you only want
// the API (pair it with `npm run dev` for the UI). Creates an empty dist/ if
// there's no build yet; run `npm run build:cf` to serve the real UI too.
import { mkdirSync } from "node:fs";
mkdirSync(new URL("../dist/", import.meta.url), { recursive: true });
