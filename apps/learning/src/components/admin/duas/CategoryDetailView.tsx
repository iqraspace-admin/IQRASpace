"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import {
  addToCategory, categoryDuas, deleteCategory, errText, getCategoryBySlug, insertCategory, removeFromCategory,
  reorderMappings, searchDuasByTitleOrSlug, updateCategory, type CategoryDuaRow, type DuaPick,
} from "@/lib/duas/api";
import { categoryFormFromRow, categoryToData, type CategoryForm } from "@/lib/duas/form";
import type { CategoryRow } from "@/lib/duas/types";
import { slugify, validateCategory } from "@/lib/duas/validate";
import { useDuasUi } from "./DuasUi";
import { HistoryList } from "./History";
import { Loading, MsgList, Notice, PageTitle, StatusBadge, linkCls } from "./bits";

type Tab = "details" | "duas" | "history";

export function CategoryDetailView({ slug }: { slug?: string }) {
  const isNew = slug === undefined;
  const [cat, setCat] = useState<CategoryRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(isNew ? "ready" : "loading");
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (slug === undefined) return;
    let active = true;
    getCategoryBySlug(slug).then(
      (c) => {
        if (!active) return;
        setCat(c);
        setState(c ? "ready" : "missing");
      },
      (e) => {
        if (!active) return;
        setError(errText(e));
        setState("error");
      }
    );
    return () => {
      active = false;
    };
  }, [slug, nonce]);

  if (state === "loading") return <Loading />;
  if (state === "error") return <Notice kind="error">{error}</Notice>;
  if (state === "missing")
    return (
      <div>
        <PageTitle title="Category not found" />
        <Link href="/admin/duas/categories" className={linkCls}>
          Back to categories
        </Link>
      </div>
    );
  return <CategoryEditor key={cat?.updated_at ?? "new"} cat={cat} onReload={() => setNonce((n) => n + 1)} />;
}

function CategoryEditor({ cat, onReload }: { cat: CategoryRow | null; onReload: () => void }) {
  const isNew = !cat;
  const ui = useDuasUi();
  const { showToast } = useToast();
  const [initial, setInitial] = useState<CategoryForm>(() => categoryFormFromRow(cat));
  const [form, setForm] = useState<CategoryForm>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugUnlocked, setSlugUnlocked] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("details");

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => {
    ui.setDirty(dirty);
    return () => ui.setDirty(false);
  }, [dirty, ui]);

  const set = <K extends keyof CategoryForm>(k: K, v: CategoryForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (busy) return;
    const data = categoryToData(form);
    const v = validateCategory(data);
    if (v.errors.length) {
      await ui.alert("Cannot save yet", <MsgList items={v.errors} />);
      return;
    }
    setBusy(true);
    try {
      if (!cat) {
        await insertCategory(data);
      } else if (!(await updateCategory(cat.id, cat.updated_at, data))) {
        await ui.alert(
          "Someone else changed this category",
          "It was modified after you opened it, so nothing was saved. Reload to see the latest version."
        );
        return;
      }
      ui.setDirty(false);
      setInitial(form);
      showToast("Category saved.");
      if (!cat || data.slug !== cat.slug) ui.go(`/admin/duas/categories/${encodeURIComponent(String(data.slug))}`);
      else onReload();
    } catch (e) {
      await ui.alert("Save failed", errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!cat) return;
    const ok = await ui.confirm({
      title: "Delete this category?",
      danger: true,
      confirmLabel: "Delete category",
      requireText: cat.slug,
      message: "A category can only be deleted when it has no Duas. History keeps the final copy so an admin can restore it.",
    });
    if (!ok) return;
    try {
      await deleteCategory(cat.id);
      ui.setDirty(false);
      showToast("Category deleted.");
      ui.go("/admin/duas/categories");
    } catch (e) {
      await ui.alert("Cannot delete", errText(e));
    }
  }

  async function unlockSlug() {
    const ok = await ui.confirm({
      title: "Unlock slug?",
      danger: true,
      confirmLabel: "Unlock",
      message: "The slug identifies this category in the app. Change it only to fix a mistake.",
    });
    if (ok) setSlugUnlocked(true);
  }

  const tabs: { value: Tab; label: string }[] = isNew
    ? [{ value: "details", label: "Details" }]
    : [
        { value: "details", label: "Details" },
        { value: "duas", label: "Duas in this category" },
        { value: "history", label: "History" },
      ];

  return (
    <div>
      <PageTitle
        title={cat ? cat.name : "New category"}
        action={
          <LinkButton href="/admin/duas/categories" variant="outline">
            All categories
          </LinkButton>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "details" && (
        <Card>
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Slug" hint="Lowercase letters, digits, hyphens. Used by the app to identify the category.">
            <div className="flex gap-2">
              <Input
                value={form.slug}
                readOnly={!slugUnlocked}
                spellCheck={false}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
              />
              {!slugUnlocked && (
                <Button type="button" variant="ghost" size="sm" onClick={unlockSlug}>
                  Unlock slug
                </Button>
              )}
            </div>
          </Field>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Name (Urdu)">
              <Input dir="rtl" lang="ur" value={form.name_ur} onChange={(e) => set("name_ur", e.target.value)} />
            </Field>
            <Field label="Name (Telugu)">
              <Input lang="te" value={form.name_te} onChange={(e) => set("name_te", e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Description (Urdu)">
              <Textarea dir="rtl" lang="ur" value={form.description_ur} onChange={(e) => set("description_ur", e.target.value)} />
            </Field>
            <Field label="Description (Telugu)">
              <Textarea lang="te" value={form.description_te} onChange={(e) => set("description_te", e.target.value)} />
            </Field>
          </div>
          <div className="grid items-end gap-x-4 sm:grid-cols-2">
            <Field label="Sort order">
              <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
            </Field>
            <label className="mb-3.5 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              Active (shown in the app when it has published Duas)
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={busy}>
              Save category
            </Button>
            {!isNew && (
              <Button type="button" variant="danger" onClick={del} disabled={busy}>
                Delete
              </Button>
            )}
          </div>
        </Card>
      )}

      {tab === "duas" && cat && (
        <Card>
          <CategoryDuas cat={cat} />
        </Card>
      )}
      {tab === "history" && cat && (
        <Card>
          <HistoryList
            entity="category"
            entityId={cat.id}
            onRestored={() => {
              ui.setDirty(false);
              onReload();
            }}
          />
        </Card>
      )}
    </div>
  );
}

function CategoryDuas({ cat }: { cat: CategoryRow }) {
  const ui = useDuasUi();
  const { showToast } = useToast();
  const [rows, setRows] = useState<CategoryDuaRow[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await categoryDuas(cat.id));
    } catch (e) {
      setError(errText(e));
    }
  }, [cat.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      showToast(errText(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!rows) return <Loading />;

  return (
    <div>
      <h2 className="mb-2 text-base font-semibold">
        {rows.length} Dua{rows.length === 1 ? "" : "s"}
      </h2>
      {rows.length === 0 ? (
        <p className="mb-4 text-sm text-muted">No Duas in this category yet.</p>
      ) : (
        <ol className="mb-5 divide-y divide-line">
          {rows.map((r, i) => (
            <li key={r.dua_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0">
                <Link href={`/admin/duas/${r.duas.id}`} className={linkCls}>
                  {r.duas.title}
                </Link>{" "}
                <StatusBadge status={r.duas.status} />
                <span className="text-xs text-muted">
                  {" "}
                  {r.duas.slug}
                  {r.context_title ? ` · context: ${r.context_title}` : ""}
                </span>
              </span>
              <span className="flex gap-1.5">
                <Button
                  type="button" variant="ghost" size="sm" disabled={i === 0 || busy} aria-label={`Move ${r.duas.title} up`}
                  onClick={() => run(() => reorderMappings(rows, i, i - 1))}
                >
                  {"↑"}
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" disabled={i === rows.length - 1 || busy} aria-label={`Move ${r.duas.title} down`}
                  onClick={() => run(() => reorderMappings(rows, i, i + 1))}
                >
                  {"↓"}
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" disabled={busy}
                  onClick={async () => {
                    const ok = await ui.confirm({
                      title: "Remove from category?",
                      message: `“${r.duas.title}” stays as a Dua but will no longer appear in “${cat.name}”.`,
                      confirmLabel: "Remove",
                      danger: true,
                    });
                    if (ok) await run(() => removeFromCategory(r.dua_id, r.category_id));
                  }}
                >
                  Remove
                </Button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <DuaPicker
        rows={rows}
        onAdd={(d) =>
          run(async () => {
            const max = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
            await addToCategory(d.id, cat.id, max + 10);
            showToast(`Added “${d.title}”.`);
          })
        }
      />
    </div>
  );
}

function DuaPicker({ rows, onAdd }: { rows: CategoryDuaRow[]; onAdd: (d: DuaPick) => void }) {
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<{ term: string; list: DuaPick[]; error?: string } | null>(null);

  useEffect(() => {
    const t = term.trim();
    if (t.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      searchDuasByTitleOrSlug(t).then(
        (list) => active && setFound({ term: t, list }),
        (e) => active && setFound({ term: t, list: [], error: errText(e) })
      );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  const mapped = new Set(rows.map((r) => r.dua_id));
  const current = found && found.term === term.trim() ? found : null;
  const avail = current ? current.list.filter((d) => !mapped.has(d.id)) : [];

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">Add an existing Dua</h3>
      <Field label="Search by title or slug">
        <Input type="search" autoComplete="off" value={term} onChange={(e) => setTerm(e.target.value)} />
      </Field>
      <div aria-live="polite">
        {current?.error && <Notice kind="error">{current.error}</Notice>}
        {current && !current.error && avail.length === 0 && (
          <p className="text-sm text-muted">No matching Duas that are not already in this category.</p>
        )}
        <ul className="divide-y divide-line">
          {avail.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>
                {d.title} <StatusBadge status={d.status} /> <span className="text-xs text-muted">{d.slug}</span>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => onAdd(d)}>
                Add
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
