import { PLATFORM } from "@/lib/platformLinks";

// public/brand/logo.png is byte-identical to apps/site's logo.png (and
// apps/quran's copy) — the three apps share one brand asset on purpose. It's a
// plain <img>, not next/image, and needs the explicit basePath prefix for the
// same reason PdfViewer's public/ assets do (NEXT_PUBLIC_BASE_PATH).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The IqraSpace brand lockup, built to match apps/site's `.brand` exactly:
 * 44px (36px on phones) logo mark, "IqraSpace" in the display serif, and the
 * tagline underneath (hidden below 1280px, same as the site). It links to the
 * main website, like the brand does in the Quran Reader.
 */
export function Brand({ showTagline = true, onDark = false }: { showTagline?: boolean; onDark?: boolean }) {
  return (
    <a
      href={PLATFORM.home}
      aria-label="IqraSpace — home"
      className={`flex items-center gap-3 no-underline ${onDark ? "text-white" : "text-heading"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- plain static file under this app's basePath, see BASE_PATH note above */}
      <img
        src={`${BASE_PATH}/brand/logo.png`}
        alt=""
        width={44}
        height={44}
        className="h-9 w-9 shrink-0 rounded-[10px] object-contain sm:h-11 sm:w-11"
      />
      <span className="flex flex-col leading-[1.1]">
        <span className="font-display text-xl font-semibold tracking-[-0.01em] sm:text-[22px]">IqraSpace</span>
        {showTagline && (
          <span
            className={`mt-1 hidden text-[11px] font-medium tracking-[0.04em] xl:block ${
              onDark ? "text-[#e9d9b0]" : "text-ink-soft"
            }`}
          >
            Read. Listen. Learn. Reflect.
          </span>
        )}
      </span>
    </a>
  );
}
