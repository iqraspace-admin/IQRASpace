"use client";

import { useT } from "@/lib/i18n/useT";

type Props = {
  /** "sm" (default) is the header/footer lockup, sized and laid out to
      match apps/site's .brand exactly (44/36px mark, 22/20px name). "lg"
      is only for not-found.tsx's standalone centered branding moment —
      apps/site has no equivalent context, so this size is this app's
      own reasonable scale-up, not a mismatch to reconcile. */
  size?: "sm" | "lg";
  /** Shows the tagline under the wordmark — matching apps/site's
      .brand-tag, hidden below 1280px there too (see globals.css's
      .header-tagline rule, same breakpoint). SiteFooter passes false
      since apps/site's own footer brand block omits it too. */
  showTagline?: boolean;
};

// public/brand/logo.png is not a static asset copy — it's byte-identical
// (confirmed via md5sum) to apps/site's own logo.png: this app and the
// main site share the exact same brand asset on purpose.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The header/footer brand lockup — rebuilt to match apps/site's .brand
 * exactly (design spec §3.2), not approximate it: the same logo.png
 * file (not this app's own generated /icon crop, a different source
 * image that rendered a visibly different mark), the same single-color
 * "IqraSpace" wordmark in Newsreader (not the previous two-tone
 * "IQRA"+"SPACE" split), and the same stacked name-over-tagline layout,
 * at the same 44/36px sizes. See the conversation this was corrected in
 * for the side-by-side comparison that prompted it.
 */
export function BrandWordmark({ size = "sm", showTagline = true }: Props) {
  const { t } = useT();
  return (
    <span className={`qr-brand${size === "lg" ? " lg" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image's basePath handling doesn't apply cleanly under this app's own basePath setup; see git history for the prior generated-route workaround this replaces */}
      <img src={`${BASE_PATH}/brand/logo.png`} alt="" width={512} height={512} className="qr-brand-mark" />
      <span className="qr-brand-text">
        <span className="qr-brand-name">IqraSpace</span>
        {showTagline && <span className="qr-brand-tag">{t("headerTagline")}</span>}
      </span>
    </span>
  );
}
