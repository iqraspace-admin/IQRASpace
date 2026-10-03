"use client";

// Shared UI plumbing for the Duas admin: promise-based dialogs (confirm /
// alert / choose) and the unsaved-changes guard. Provided once by DuasShell.

import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export type DialogAction<T> = { label: string; value: T; variant?: ButtonVariant; disabledUnlessTyped?: boolean };

type DialogSpec = {
  title: string;
  body: ReactNode;
  actions: DialogAction<unknown>[];
  requireText?: string;
  wide?: boolean;
  resolve: (v: unknown) => void;
};

type Ui = {
  choose: <T>(o: {
    title: string;
    body: ReactNode;
    actions: DialogAction<T>[];
    wide?: boolean;
    requireText?: string;
  }) => Promise<T | null>;
  confirm: (o: {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    danger?: boolean;
    requireText?: string;
  }) => Promise<boolean>;
  alert: (title: string, body: ReactNode) => Promise<void>;
  /** Mark the current editor as having unsaved changes (guards navigation / unload). */
  setDirty: (dirty: boolean) => void;
  /** Navigate to an app-relative path, skipping the guard (call setDirty(false) first). */
  go: (path: string) => void;
};

const UiContext = createContext<Ui | null>(null);

export function useDuasUi(): Ui {
  const ui = useContext(UiContext);
  if (!ui) throw new Error("useDuasUi must be used inside DuasShell");
  return ui;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function DuasUiProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const dirtyRef = useRef(false);

  const choose = useCallback<Ui["choose"]>(
    (o) =>
      new Promise((resolve) => {
        setDialog({ ...o, resolve: resolve as (v: unknown) => void });
      }),
    []
  );

  const confirm = useCallback<Ui["confirm"]>(
    async ({ title, message, confirmLabel = "Confirm", danger = false, requireText }) => {
      const r = await choose<boolean>({
        title,
        requireText,
        body: typeof message === "string" ? <p>{message}</p> : message,
        actions: [
          { label: "Cancel", value: false, variant: "ghost" },
          { label: confirmLabel, value: true, variant: danger ? "danger" : "primary", disabledUnlessTyped: !!requireText },
        ],
      });
      return r === true;
    },
    [choose]
  );

  const alert = useCallback<Ui["alert"]>(
    async (title, body) => {
      await choose<boolean>({
        title,
        body: typeof body === "string" ? <p>{body}</p> : body,
        actions: [{ label: "OK", value: true }],
      });
    },
    [choose]
  );

  const go = useCallback((path: string) => router.push(path), [router]);
  const setDirty = useCallback((d: boolean) => {
    dirtyRef.current = d;
  }, []);

  // Guard hard navigations (reload / close tab).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Guard in-app link clicks (sub-nav, sidebar, row links...) while dirty.
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      const ok = await confirm({
        title: "Discard unsaved changes?",
        message: "You have unsaved edits. If you leave this page they will be lost.",
        confirmLabel: "Discard and leave",
        danger: true,
      });
      if (!ok) return;
      dirtyRef.current = false;
      let path = url.pathname + url.search + url.hash;
      if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length) || "/";
      router.push(path);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [confirm, router]);

  const ui = useMemo<Ui>(
    () => ({ choose, confirm, alert, setDirty, go }),
    [choose, confirm, alert, setDirty, go]
  );

  function close(v: unknown) {
    dialog?.resolve(v);
    setDialog(null);
  }

  return (
    <UiContext.Provider value={ui}>
      {children}
      {dialog && <DialogView key={dialog.title + dialog.actions.length} spec={dialog} onClose={close} />}
    </UiContext.Provider>
  );
}

function DialogView({ spec, onClose }: { spec: DialogSpec; onClose: (v: unknown) => void }) {
  const titleId = useId();
  const [typed, setTyped] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>("input,textarea,select") ?? ref.current?.querySelector<HTMLElement>("button[data-primary]");
    first?.focus();
    return () => prev?.focus?.();
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose(null);
    } else if (e.key === "Tab" && ref.current) {
      // Minimal focus trap.
      const f = [...ref.current.querySelectorAll<HTMLElement>("button:not([disabled]),input,textarea,select,a[href]")];
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(null);
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={`max-h-[88vh] w-full ${spec.wide ? "max-w-2xl" : "max-w-lg"} overflow-y-auto rounded-[var(--radius-l)] bg-surface p-6 text-ink shadow-[var(--shadow-l)]`}
      >
        <h2 id={titleId} className="mb-3 text-lg font-semibold">
          {spec.title}
        </h2>
        <div className="space-y-3 text-sm text-ink-soft">
          {spec.body}
          {spec.requireText && (
            <div>
              <p className="mb-1.5">
                Type <code className="rounded bg-paper-alt px-1.5 py-0.5 font-mono text-ink">{spec.requireText}</code> to confirm:
              </p>
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-label={`Type ${spec.requireText} to confirm`}
              />
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {spec.actions.map((a, i) => (
            <Button
              key={i}
              type="button"
              variant={a.variant ?? "primary"}
              data-primary={i === spec.actions.length - 1 ? "" : undefined}
              disabled={!!a.disabledUnlessTyped && typed.trim() !== spec.requireText}
              onClick={() => onClose(a.value)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
