"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads a dynamic route segment from the REAL browser URL.
 *
 * This app is a static export (`output: 'export'`). Dynamic routes are built
 * once with a placeholder param (`generateStaticParams` -> `[{ id: "_" }]`) and
 * the Cloudflare Worker (worker/index.js) serves that single shell for every
 * real URL, so `useParams()` would only ever return the placeholder. The real
 * value is whatever follows `marker` in `window.location.pathname`; the
 * basePath prefix (/learning) is irrelevant because we search for the marker.
 *
 * `marker` is the literal path segments preceding the param, e.g. ["share"]
 * or ["admin", "duas", "categories"]. Returns `null` during SSG/hydration
 * (so server and client markup match) and when the URL has no such segment.
 */
export function readRouteParam(pathname: string, marker: readonly string[]): string | null {
  const segs = pathname.split("/").filter(Boolean);
  for (let i = 0; i + marker.length < segs.length; i++) {
    if (marker.every((m, j) => segs[i + j] === m)) {
      const raw = segs[i + marker.length];
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

const subscribe = () => () => {};

export function useRouteParam(marker: readonly string[]): string | null {
  const key = marker.join("/");
  return useSyncExternalStore(
    subscribe,
    () => readRouteParam(window.location.pathname, key.split("/")),
    () => null,
  );
}
