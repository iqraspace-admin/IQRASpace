"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/authContext";
import { categoryNameMap, errText, fetchHistory, restoreFromAudit } from "@/lib/duas/api";
import type { AuditRow } from "@/lib/duas/types";
import { hasArabic, restorableFields, validateCategory, validateDua, validateMapping } from "@/lib/duas/validate";
import { useDuasUi } from "./DuasUi";
import { Loading, MsgList, Notice, fmtDate, linkCls, shortId } from "./bits";

const ACTION_LABEL = { insert: "Created", update: "Updated", delete: "Deleted" } as const;
const ACTION_TONE: Record<string, BadgeTone> = { insert: "green", update: "teal", delete: "red" };

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return "(empty)";
  if (typeof v === "string") return v === "" ? "(empty string)" : v;
  return JSON.stringify(v);
}

function DiffRow({ field, oldV, newV }: { field: string; oldV: unknown; newV: unknown }) {
  const o = fmtVal(oldV);
  const n = fmtVal(newV);
  const long = o.length > 70 || n.length > 70 || /\n/.test(o + n) || hasArabic(o) || hasArabic(n);
  const dir = (s: string) => (hasArabic(s) ? "rtl" : undefined);
  if (long) {
    return (
      <div className="mt-2 text-sm">
        <div className="font-mono text-xs font-bold text-muted">{field}</div>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[8px] bg-danger-tint p-2 text-danger">
            <span className="mb-0.5 block text-[0.65rem] font-bold uppercase">before</span>
            <div dir={dir(o)} className="whitespace-pre-wrap break-words">{o}</div>
          </div>
          <div className="rounded-[8px] bg-success-tint p-2 text-success">
            <span className="mb-0.5 block text-[0.65rem] font-bold uppercase">after</span>
            <div dir={dir(n)} className="whitespace-pre-wrap break-words">{n}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-1.5 text-sm">
      <span className="font-mono text-xs font-bold text-muted">{field}</span>{" "}
      <span className="rounded bg-danger-tint px-1 text-danger line-through">{o}</span>
      {" → "}
      <span className="rounded bg-success-tint px-1 text-success">{n}</span>
    </div>
  );
}

function entityTitle(e: AuditRow, catNames: Map<string, string>, showDuaInMapping?: boolean): string {
  const d = (e.new_data || e.old_data || {}) as Record<string, unknown>;
  if (e.entity === "dua") return `Dua “${d.title || d.slug || e.entity_id.slice(0, 8)}”`;
  if (e.entity === "category") return `Category “${d.name || d.slug || e.entity_id.slice(0, 8)}”`;
  const [duaId, catId] = e.entity_id.split(":");
  const cat = catNames.get(catId) || shortId(catId);
  return `Category mapping (${cat})${showDuaInMapping ? " of Dua " + shortId(duaId) : ""}`;
}

const SUMMARY_KEYS: Record<string, string[]> = {
  mapping: ["sort_order", "context_title", "context_note", "context_reference", "context_repeat_count"],
  dua: ["slug", "title", "status", "source_reference"],
  category: ["slug", "name", "is_active"],
};

function HistoryEntry({
  entry, catNames, linkEntity, showDuaInMapping, onRestored,
}: {
  entry: AuditRow;
  catNames: Map<string, string>;
  linkEntity?: boolean;
  showDuaInMapping?: boolean;
  onRestored: () => void;
}) {
  const { session } = useAuth();
  const ui = useDuasUi();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const who = entry.changed_by ? (entry.changed_by === session?.user.id ? "you" : shortId(entry.changed_by)) : "dashboard / system";
  const canRestore = (entry.action === "update" || entry.action === "delete") && !!entry.old_data;

  async function restore() {
    const fields = restorableFields(entry.entity, entry.old_data);
    const check =
      entry.entity === "dua"
        ? validateDua(fields, { status: fields.status as string })
        : entry.entity === "mapping"
          ? validateMapping(fields)
          : validateCategory(fields);
    if (check.errors.length) {
      await ui.alert(
        "Cannot restore this version",
        <div>
          <p>The saved copy no longer passes validation:</p>
          <MsgList items={check.errors} />
        </div>
      );
      return;
    }
    const label = entry.entity === "dua" ? "Dua" : entry.entity === "mapping" ? "category assignment" : "category";
    const ok = await ui.confirm({
      title: entry.action === "delete" ? `Restore deleted ${label}?` : `Restore previous version of this ${label}?`,
      message:
        entry.action === "delete"
          ? `The ${label} will be re-created with its old id. Category assignments of a deleted Dua are not restored automatically.`
          : `The ${label} will be set back to how it was before the change on ${fmtDate(entry.changed_at)}. This creates a new history entry; nothing is lost.`,
      confirmLabel: "Restore",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await restoreFromAudit(entry, fields);
      showToast("Version restored.");
      onRestored();
    } catch (e) {
      showToast(errText(e));
      await ui.alert("Restore failed", errText(e));
    } finally {
      setBusy(false);
    }
  }

  const d = (entry.new_data || entry.old_data || {}) as Record<string, unknown>;
  const summary = (SUMMARY_KEYS[entry.entity] ?? []).filter((k) => d[k] != null && d[k] !== "").map((k) => `${k}: ${d[k]}`).join(" · ");

  return (
    <li className="rounded-[var(--radius-m)] border border-line bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Badge tone={ACTION_TONE[entry.action]}>{ACTION_LABEL[entry.action] ?? entry.action}</Badge>
        <strong>{entityTitle(entry, catNames, showDuaInMapping)}</strong>
        <span className="text-xs text-muted">
          by {who} {"·"} {fmtDate(entry.changed_at)}
        </span>
      </div>
      {entry.action === "update" ? (
        (entry.changed_fields || []).map((f) => <DiffRow key={f} field={f} oldV={entry.old_data?.[f]} newV={entry.new_data?.[f]} />)
      ) : (
        <div className="mt-1.5 break-words text-sm text-ink-soft">{summary}</div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {linkEntity && entry.entity === "dua" && entry.action !== "delete" && (
          <Link href={`/admin/duas/${entry.entity_id}`} className={`${linkCls} text-sm`}>
            Open Dua
          </Link>
        )}
        {linkEntity && entry.entity === "category" && entry.action !== "delete" && (
          <Link href={`/admin/duas/categories/${encodeURIComponent(String(d.slug))}`} className={`${linkCls} text-sm`}>
            Open category
          </Link>
        )}
        {canRestore && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={restore}>
            {entry.action === "delete" ? "Restore deleted item" : "Restore this version"}
          </Button>
        )}
      </div>
    </li>
  );
}

/** Audit entries for one Dua / category, or (no entity) the latest 100 across everything. */
export function HistoryList({
  entity, entityId, onRestored, linkEntity, showDuaInMapping,
}: {
  entity?: "dua" | "category";
  entityId?: string;
  onRestored: () => void;
  linkEntity?: boolean;
  showDuaInMapping?: boolean;
}) {
  const [state, setState] = useState<{ rows: AuditRow[]; catNames: Map<string, string> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([fetchHistory({ entity, entityId }), categoryNameMap()]).then(
      ([rows, catNames]) => active && setState({ rows, catNames }),
      (e) => active && setError(errText(e))
    );
    return () => {
      active = false;
    };
  }, [entity, entityId, nonce]);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!state) return <Loading label="Loading history…" />;
  if (!state.rows.length) return <p className="text-sm text-muted">{entity ? "No history yet." : "No activity yet."}</p>;
  return (
    <>
      <ul className="space-y-3">
        {state.rows.map((r) => (
          <HistoryEntry
            key={r.id}
            entry={r}
            catNames={state.catNames}
            linkEntity={linkEntity}
            showDuaInMapping={showDuaInMapping}
            onRestored={() => {
              setState(null);
              setNonce((n) => n + 1);
              onRestored();
            }}
          />
        ))}
      </ul>
      {state.rows.length >= 100 && <p className="mt-3 text-sm text-muted">Showing the latest 100 entries.</p>}
    </>
  );
}
