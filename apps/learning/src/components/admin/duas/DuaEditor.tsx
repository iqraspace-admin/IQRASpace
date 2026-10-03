"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton, type ButtonVariant } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/authContext";
import {
  deleteDua, errText, findDuplicates, getDua, getDuaMappings, insertDua, loadCategories, reconcileMappings, updateDua,
} from "@/lib/duas/api";
import {
  blankForm, formFromRow, formToData, mapFromRow, mapToRow, refsFromRow, type DuaForm, type MapForm, type RefForm,
} from "@/lib/duas/form";
import type { CategoryRow, DuaRow, DuaStatus } from "@/lib/duas/types";
import { slugify, validateDua, validateMapping } from "@/lib/duas/validate";
import { CategoriesPanel, DuaFormFields } from "./DuaFormFields";
import { DuaPreview } from "./DuaPreview";
import { useDuasUi } from "./DuasUi";
import { HistoryList } from "./History";
import { Loading, MsgList, Notice, PageTitle, StatusBadge, fmtDate, linkCls, shortId } from "./bits";

type Seed = {
  loaded: DuaRow | null;
  form: DuaForm;
  refs: RefForm[];
  maps: Record<string, MapForm>;
  fromTitle?: string;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; msg: string }
  | { kind: "missing" }
  | { kind: "ready"; cats: CategoryRow[]; seed: Seed };

const toRecord = (rows: Awaited<ReturnType<typeof getDuaMappings>>): Record<string, MapForm> =>
  Object.fromEntries(rows.map((m) => [m.category_id, mapFromRow(m)]));

/** Load categories + (existing or duplicated-from) Dua and its category assignments. */
function useDuaSeed(id: string | null, fromId: string | null, nonce: number): LoadState {
  const [state, setState] = useState<{ key: string; s: LoadState } | null>(null);
  const key = `${id}|${fromId}|${nonce}`;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cats = await loadCategories();
        let seed: Seed = { loaded: null, form: blankForm(), refs: [], maps: {} };
        if (id) {
          const loaded = await getDua(id);
          if (!loaded) return active && setState({ key, s: { kind: "missing" } });
          seed = { loaded, form: formFromRow(loaded), refs: refsFromRow(loaded), maps: toRecord(await getDuaMappings(id)) };
        } else if (fromId) {
          const from = await getDua(fromId);
          if (from) {
            seed = {
              loaded: null,
              form: { ...formFromRow(from), slug: "", title: `${from.title} (copy)` },
              refs: refsFromRow(from),
              maps: toRecord(await getDuaMappings(from.id)),
              fromTitle: from.title,
            };
          }
        }
        if (active) setState({ key, s: { kind: "ready", cats, seed } });
      } catch (e) {
        if (active) setState({ key, s: { kind: "error", msg: errText(e) } });
      }
    })();
    return () => {
      active = false;
    };
  }, [id, fromId, key]);

  return state && state.key === key ? state.s : { kind: "loading" };
}

export function NewDuaView() {
  const from = useSearchParams().get("from");
  return <EditorLoader id={null} fromId={from} />;
}

export function EditDuaView({ id }: { id: string }) {
  return <EditorLoader id={id} fromId={null} />;
}

function EditorLoader({ id, fromId }: { id: string | null; fromId: string | null }) {
  const [nonce, setNonce] = useState(0);
  const st = useDuaSeed(id, fromId, nonce);

  if (st.kind === "loading") return <Loading />;
  if (st.kind === "error") return <Notice kind="error">{st.msg}</Notice>;
  if (st.kind === "missing")
    return (
      <div>
        <PageTitle title="Dua not found" />
        <Notice kind="error">This Dua does not exist (it may have been deleted).</Notice>
        <Link href="/admin/duas/list" className={linkCls}>
          Back to Duas
        </Link>
      </div>
    );
  return <DuaEditorForm key={st.seed.loaded?.updated_at ?? "new"} cats={st.cats} seed={st.seed} onReload={() => setNonce((n) => n + 1)} />;
}

type Cfg = { title: string; message: string; confirmLabel: string; danger?: boolean };
const cfg = (title: string, message: string, confirmLabel: string, danger = false): Cfg => ({ title, message, confirmLabel, danger });

function DuaEditorForm({ cats, seed, onReload }: { cats: CategoryRow[]; seed: Seed; onReload: () => void }) {
  const { loaded } = seed;
  const isNew = !loaded;
  const status: DuaStatus = loaded ? loaded.status : "draft";
  const ui = useDuasUi();
  const { showToast } = useToast();
  const { session } = useAuth();

  const [form, setForm] = useState<DuaForm>(seed.form);
  const [refs, setRefs] = useState<RefForm[]>(seed.refs);
  const [maps, setMaps] = useState<Record<string, MapForm>>(seed.maps);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugUnlocked, setSlugUnlocked] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"details" | "history">("details");
  const [dupAck, setDupAck] = useState(false);

  const snap = (f: DuaForm, r: RefForm[], m: Record<string, MapForm>) => JSON.stringify([f, r, Object.entries(m).sort((a, b) => (a[0] < b[0] ? -1 : 1))]);
  const [initialSnap, setInitialSnap] = useState(() => snap(seed.form, seed.refs, seed.maps));
  // A duplicate starts with content the admin has not saved yet.
  const dirty = snap(form, refs, maps) !== initialSnap || (isNew && !!seed.fromTitle);
  useEffect(() => {
    ui.setDirty(dirty);
    return () => ui.setDirty(false);
  }, [dirty, ui]);

  const set = <K extends keyof DuaForm>(k: K, v: DuaForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const catName = (cid: string) => cats.find((c) => c.id === cid)?.name || shortId(cid);

  const data = useMemo(() => formToData(form, refs, status), [form, refs, status]);
  const mapErrors = (m: Record<string, MapForm>) =>
    Object.entries(m).flatMap(([cid, row]) => validateMapping(row, `Category “${catName(cid)}”`).errors);

  const checks = useMemo(() => {
    const r = validateDua(data, { status });
    const publish = validateDua(data, { status: "published" });
    const errors = [...r.errors, ...mapErrors(maps)];
    return { errors, warnings: r.warnings, publishErrors: publish.errors };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, status, maps, cats]);

  const contexts = useMemo(
    () => Object.entries(maps).map(([cid, m]) => ({ id: cid, name: catName(cid), ctx: mapToRow(m) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maps, cats]
  );

  async function save(target: DuaStatus, confirmCfg?: Cfg) {
    if (busy) return;
    const payload = { ...formToData(form, refs, target) };
    const v = validateDua(payload, { status: target });
    const errors = [...v.errors, ...mapErrors(maps)];
    if (errors.length) {
      await ui.alert(
        "Cannot save yet",
        <div>
          <p>Please fix the following:</p>
          <MsgList items={errors} />
        </div>
      );
      return;
    }
    if (confirmCfg && !(await ui.confirm(confirmCfg))) return;

    setBusy(true);
    try {
      const changedKey =
        !loaded ||
        payload.arabic !== loaded.arabic ||
        payload.title !== loaded.title ||
        ((payload.source_reference as string | null) || "") !== (loaded.source_reference || "");
      if (changedKey && !dupAck) {
        const dups = await findDuplicates(
          { arabic: payload.arabic as string, title: payload.title as string, source_reference: payload.source_reference as string | null },
          loaded?.id
        );
        if (dups.length) {
          const choice = await ui.choose<string | null>({
            title: "Possible duplicate",
            wide: true,
            body: (
              <div>
                <p>
                  A Dua with the same content already exists. A Dua that belongs in several places should be one Dua with several category
                  mappings, not copies.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {dups.map((d) => (
                    <li key={d.id}>
                      <strong>{d.title}</strong> ({d.slug}, {d.status}) &mdash; {d.why}
                    </li>
                  ))}
                </ul>
              </div>
            ),
            actions: [
              { label: "Cancel", value: null, variant: "ghost" },
              ...dups.slice(0, 3).map((d) => ({ label: `Open “${d.title}” instead`, value: `goto:${d.id}`, variant: "outline" as ButtonVariant })),
              { label: "Save anyway", value: "save" },
            ],
          });
          if (choice === "save") setDupAck(true);
          else {
            if (choice && choice.startsWith("goto:")) {
              ui.setDirty(false);
              ui.go(`/admin/duas/${choice.slice(5)}`);
            }
            return;
          }
        }
      }

      let duaId: string;
      if (!loaded) {
        duaId = await insertDua(payload);
      } else {
        const ok = await updateDua(loaded.id, loaded.updated_at, payload);
        if (!ok) {
          const r = await ui.choose<"keep" | "reload">({
            title: "Someone else changed this Dua",
            body: (
              <p>
                This Dua was modified (or deleted) after you opened it, so your save was not applied. Reload to see the latest version
                &mdash; your unsaved edits will be lost &mdash; or keep editing and copy your text elsewhere first.
              </p>
            ),
            actions: [
              { label: "Keep editing", value: "keep", variant: "ghost" },
              { label: "Reload latest", value: "reload" },
            ],
          });
          if (r === "reload") {
            ui.setDirty(false);
            onReload();
          }
          return;
        }
        duaId = loaded.id;
      }
      const initialMaps = new Map(Object.entries(seed.loaded ? seed.maps : {}));
      const failures = await reconcileMappings(duaId, new Map(Object.entries(maps)), initialMaps, catName);
      ui.setDirty(false);
      setInitialSnap(snap(form, refs, maps));
      if (failures.length) {
        await ui.alert(
          "Saved, but some category changes failed",
          <div>
            <p>The Dua itself was saved. These category assignments were not applied — the page will reload with the real state:</p>
            <MsgList items={failures} />
          </div>
        );
      } else {
        showToast(v.warnings.length ? `Saved with ${v.warnings.length} warning(s).` : "Saved.");
      }
      if (!loaded) ui.go(`/admin/duas/${duaId}`);
      else onReload();
    } catch (e) {
      await ui.alert("Save failed", errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!loaded) return;
    const ok = await ui.confirm({
      title: "Delete this Dua?",
      danger: true,
      confirmLabel: "Delete permanently",
      requireText: loaded.slug,
      message:
        "This removes the Dua and its category assignments from the app. The full final copy stays in History (Activity) so an admin can restore it, but the Dua will disappear from users’ devices at their next sync.",
    });
    if (!ok) return;
    try {
      await deleteDua(loaded.id);
      ui.setDirty(false);
      showToast("Dua deleted. It can still be restored from Activity.");
      ui.go("/admin/duas/list");
    } catch (e) {
      await ui.alert("Delete failed", errText(e));
    }
  }

  async function unlockSlug() {
    const ok = await ui.confirm({
      title: "Unlock slug?",
      danger: true,
      confirmLabel: "Unlock",
      message:
        "The slug is this Dua’s canonical identifier (the mobile app and bookmarks may rely on it). Change it only to fix a mistake.",
    });
    if (ok) setSlugUnlocked(true);
  }

  const publishCfg = cfg("Publish this Dua?", "It becomes visible in the mobile app at its next content sync.", "Publish");
  const actions: { label: string; variant: ButtonVariant; run: () => void }[] = [];
  const add = (label: string, variant: ButtonVariant, run: () => void) => actions.push({ label, variant, run });
  if (isNew || status === "draft") {
    add("Save draft", "primary", () => save("draft"));
    add("Send to review", "outline", () =>
      save("review", cfg("Send to review?", "The Dua will be marked “in review” for an admin to check and publish.", "Send to review"))
    );
    add("Publish", "outline", () => save("published", publishCfg));
  } else if (status === "review") {
    add("Save", "primary", () => save("review"));
    add("Move back to draft", "ghost", () => save("draft", cfg("Move back to draft?", "The Dua returns to the draft stage.", "Move to draft")));
    add("Publish", "outline", () => save("published", publishCfg));
  } else if (status === "published") {
    add("Save changes", "primary", () =>
      save("published", cfg("Save changes to a published Dua?", "Changes go live in the app at its next sync.", "Save changes"))
    );
    add("Unpublish", "ghost", () =>
      save("draft", cfg("Unpublish this Dua?", "It is removed from the app at its next sync and goes back to draft.", "Unpublish", true))
    );
    add("Archive", "ghost", () =>
      save("archived", cfg("Archive this Dua?", "It is removed from the app and hidden from normal work. You can restore it later.", "Archive", true))
    );
  } else {
    add("Save", "primary", () => save("archived"));
    add("Restore from archive", "outline", () =>
      save("draft", cfg("Restore from archive?", "The Dua returns to draft; it is not published automatically.", "Restore to draft"))
    );
  }

  const updatedBy = loaded?.updated_by ? (loaded.updated_by === session?.user.id ? "you" : shortId(loaded.updated_by)) : null;
  let sub: ReactNode = "Starts as a draft.";
  if (seed.fromTitle) sub = `Duplicating “${seed.fromTitle}” (category assignments copied)`;
  if (loaded)
    sub = (
      <>
        <StatusBadge status={status} /> {"·"} {loaded.slug} {"·"} updated {fmtDate(loaded.updated_at)}
        {updatedBy ? ` by ${updatedBy}` : ""}
      </>
    );

  return (
    <div>
      <PageTitle
        title={loaded ? loaded.title : "New Dua"}
        sub={sub}
        action={
          <LinkButton href="/admin/duas/list" variant="outline">
            All Duas
          </LinkButton>
        }
      />
      {!isNew && (
        <Tabs
          tabs={[
            { value: "details", label: "Details" },
            { value: "history", label: "History" },
          ]}
          active={tab}
          onChange={setTab}
        />
      )}

      {tab === "history" && loaded ? (
        <Card>
          <HistoryList
            entity="dua"
            entityId={loaded.id}
            onRestored={() => {
              ui.setDirty(false);
              onReload();
            }}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex min-w-0 flex-col gap-4">
              <DuaFormFields
                form={form}
                set={set}
                refs={refs}
                setRefs={setRefs}
                slugUnlocked={slugUnlocked}
                canUnlock={!isNew}
                onUnlockSlug={unlockSlug}
                onTitleChange={(t) => {
                  setForm((f) => ({ ...f, title: t, ...(slugTouched ? {} : { slug: slugify(t) }) }));
                }}
                onSlugChange={(s) => {
                  setSlugTouched(true);
                  set("slug", s);
                }}
              />
              <CategoriesPanel cats={cats} maps={maps} setMaps={setMaps} />
            </div>
            <aside className="flex min-w-0 flex-col gap-4 lg:self-start">
              <Card className="lg:sticky lg:top-24">
                <h2 className="mb-3 text-base font-semibold">Preview</h2>
                <DuaPreview data={data} contexts={contexts} />
              </Card>
              <Card>
                <h2 className="mb-2 text-base font-semibold">Checks</h2>
                <div aria-live="polite">
                  {checks.errors.length > 0 && (
                    <Notice kind="error">
                      <strong>Fix before saving</strong>
                      <MsgList items={checks.errors} />
                    </Notice>
                  )}
                  {checks.warnings.length > 0 && (
                    <Notice kind="warn">
                      <strong>Warnings</strong>
                      <MsgList items={checks.warnings} />
                    </Notice>
                  )}
                  {checks.errors.length === 0 && checks.publishErrors.length > 0 && (
                    <Notice kind="info">
                      <strong>Not publishable yet</strong>
                      <MsgList items={checks.publishErrors} />
                    </Notice>
                  )}
                  {checks.errors.length === 0 && checks.warnings.length === 0 && checks.publishErrors.length === 0 && (
                    <Notice kind="success">All checks pass.</Notice>
                  )}
                </div>
              </Card>
            </aside>
          </div>
          <div className="sticky bottom-0 z-20 mt-5 flex flex-wrap items-center gap-2 border-t border-line bg-paper/95 py-3 backdrop-blur">
            {actions.map((a) => (
              <Button key={a.label} type="button" variant={a.variant} disabled={busy} onClick={a.run}>
                {a.label}
              </Button>
            ))}
            {loaded && (
              <Button type="button" variant="danger" disabled={busy} onClick={doDelete} className="sm:ml-auto">
                Delete
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
