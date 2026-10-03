"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f2e25]/55 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative max-h-[88vh] w-full ${
          wide ? "max-w-2xl" : "max-w-lg"
        } overflow-y-auto overflow-x-hidden rounded-[var(--radius-xl)] bg-surface p-6 sm:p-8 shadow-[var(--shadow-l)]`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-paper-alt text-sm text-heading hover:bg-line"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
