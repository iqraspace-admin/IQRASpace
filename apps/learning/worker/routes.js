// Pure route matching for the Cloudflare Worker (no Worker/Request APIs, so it
// is unit-testable under plain node). See worker/index.js.
//
// The Next.js static export contains ONE placeholder shell per dynamic route
// (param value "_"). A request for a real URL such as /learning/share/<uuid>
// is mapped to that shell's pathname; the browser URL is unchanged and the
// client reads the real id from window.location (src/lib/routeParam.ts).

export const DEFAULT_BASE_PATH = "/learning";
export const PLACEHOLDER = "_";

// Segments after /admin/duas that are real static pages, not a [id].
const DUAS_STATIC = new Set(["new", "list", "activity", "categories"]);
// Segments after /admin/duas/categories that are real static pages, not a [slug].
const CATEGORY_STATIC = new Set(["new"]);

/**
 * @param {string} pathname  URL pathname, e.g. "/learning/share/abc"
 * @param {string} [base]    basePath the app is served under ("" for none)
 * @returns {string | null}  pathname of the placeholder shell, or null when the
 *                           path is not a dynamic route (serve it as-is).
 */
export function matchDynamicRoute(pathname, base = DEFAULT_BASE_PATH) {
  if (typeof pathname !== "string") return null;
  if (base) {
    if (pathname !== base && !pathname.startsWith(base + "/")) return null;
  }
  const rest = pathname.slice(base.length); // "" or "/share/abc/"
  const segs = rest.split("/").filter((s, i, a) => !(s === "" && (i === 0 || i === a.length - 1)));
  if (segs.some((s) => s === "")) return null; // "//" inside the path

  const shell = (...parts) => `${base}/${parts.join("/")}`;

  if (segs.length === 2 && segs[0] === "share") return shell("share", PLACEHOLDER);
  if (segs.length === 2 && segs[0] === "teach") return shell("teach", PLACEHOLDER);

  if (segs[0] === "admin" && segs[1] === "duas") {
    if (segs.length === 3 && !DUAS_STATIC.has(segs[2])) {
      return shell("admin", "duas", PLACEHOLDER);
    }
    if (segs.length === 4 && segs[2] === "categories" && !CATEGORY_STATIC.has(segs[3])) {
      return shell("admin", "duas", "categories", PLACEHOLDER);
    }
  }
  return null;
}
