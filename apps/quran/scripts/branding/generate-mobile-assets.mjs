// Builds assets/{icon.png,splash.png,splash-dark.png} from the same
// canonical brand source (public/brand/logo.png) and the same crop box
// src/lib/branding/logo.ts already uses for every other generated icon —
// so the app-icon mark stays the exact same crop everywhere, not a
// separately hand-picked one. `npx capacitor-assets generate` reads these
// three files and produces every iOS/Android icon and splash-screen size
// from them (see MOBILE.md).
//
// Run again (`npm run assets:mobile`) any time public/brand/logo.png is
// replaced; the output is committed like any other generated brand asset
// (same reasoning as icon.tsx et al. in DEPLOYMENT.md).
import { createCanvas, loadImage } from "canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LOGO_PATH = path.join(ROOT, "public/brand/logo.png");
const OUT_DIR = path.join(ROOT, "assets");

// Kept as a literal copy of src/lib/branding/logo.ts's LOGO_ICON_CROP —
// this script runs outside the Next.js app and can't import from src/.
const CROP = { left: 267, top: 60, width: 720, height: 600 };
const IVORY = "#faf7f0"; // globals.css --color-bg (light)
const DARK = "#101512"; // layout.tsx viewport themeColor (dark)

function drawContained(ctx, img, crop, frame, padFraction) {
  const usable = frame * (1 - padFraction * 2);
  const scale = Math.min(usable / crop.width, usable / crop.height);
  const drawW = crop.width * scale;
  const drawH = crop.height * scale;
  const dx = (frame - drawW) / 2;
  const dy = (frame - drawH) / 2;
  ctx.drawImage(img, crop.left, crop.top, crop.width, crop.height, dx, dy, drawW, drawH);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const img = await loadImage(LOGO_PATH);

  // icon.png — 1024x1024, opaque background (iOS forbids alpha in the
  // submitted App Store icon), logo mark filling most of the frame.
  {
    const size = 1024;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = IVORY;
    ctx.fillRect(0, 0, size, size);
    drawContained(ctx, img, CROP, size, 0.08);
    writeFileSync(path.join(OUT_DIR, "icon.png"), canvas.toBuffer("image/png"));
  }

  // splash.png / splash-dark.png — 2732x2732, small centered mark, matching
  // the light/dark theme colors already used elsewhere in the app.
  for (const [name, bg] of [
    ["splash.png", IVORY],
    ["splash-dark.png", DARK],
  ]) {
    const size = 2732;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    drawContained(ctx, img, CROP, size, 0.38);
    writeFileSync(path.join(OUT_DIR, name), canvas.toBuffer("image/png"));
  }

  console.log("Wrote icon.png, splash.png, splash-dark.png to", OUT_DIR);
}

main();
