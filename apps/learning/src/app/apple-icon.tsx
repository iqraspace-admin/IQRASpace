import { LOGO_ICON_CROP } from "@/lib/branding/logo";
import { renderCroppedIcon } from "@/lib/branding/renderCroppedIcon";

// Apple's recommended touch-icon size. Same crop as icon.tsx — Apple
// ignores transparency/rounds corners itself, so a plain white
// background here is correct.
// Required by `output: "export"` (static image route).
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderCroppedIcon(LOGO_ICON_CROP, size);
}
