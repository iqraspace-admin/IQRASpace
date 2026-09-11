"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shared accessible-dialog behavior for the reader's portal-rendered
 * dialogs (Reading Settings, Jump to Surah): Escape closes, Tab is
 * trapped within the panel while it's open, and background scroll is
 * locked (either dialog can be taller than the viewport on phones,
 * where it's a bottom sheet rather than a side panel). Extracted out of
 * ReaderSettingsPanel (which originally had this inline) so a second
 * dialog can reuse it verbatim instead of drifting into subtly
 * different accessible-modal behavior.
 *
 * Deliberately depends on `open` alone, not `onClose`/`panelRef` too —
 * both are effectively stable for this hook's purposes (a ref object
 * never changes identity; `onClose` closing over a fresh render is fine
 * since the effect only ever runs at open/close transitions) and adding
 * them would re-run the effect (and re-steal focus into the panel) on
 * every unrelated re-render while the dialog is open.
 */
export function useModalA11y(open: boolean, panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    panelRef.current?.focus();
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
