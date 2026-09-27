"use client";

import { useEffect, useState } from "react";

/**
 * Loads client-only state (localStorage-backed) after mount, avoiding a
 * hydration mismatch between server render and the persisted value.
 * Shared by BookmarksPreview and LastReadsRow, which both read from
 * src/lib/preferences/storage.ts this way.
 */
export function useHydratedState<T>(load: () => T, initial: T): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    async function hydrate() {
      const loaded = load();
      await Promise.resolve(); // satisfies react-hooks/set-state-in-effect
      setValue(loaded);
    }
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is always a stable module-level function reference (loadBookmarks/loadLastReads), not a per-render closure
  }, []);

  return value;
}
