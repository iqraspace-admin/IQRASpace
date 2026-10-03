"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { MAP_FIELDS, blankMap, type DuaForm, type MapForm, type RefForm } from "@/lib/duas/form";
import { ORIGINS, SOURCE_TYPES, VERIFICATION, type CategoryRow } from "@/lib/duas/types";

type SetField = <K extends keyof DuaForm>(k: K, v: DuaForm[K]) => void;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

const grid2 = "grid gap-x-4 sm:grid-cols-2";
const rtlCls = "text-base";

export function DuaFormFields({
  form, set, refs, setRefs, slugUnlocked, onUnlockSlug, onTitleChange, onSlugChange, canUnlock,
}: {
  form: DuaForm;
  set: SetField;
  refs: RefForm[];
  setRefs: (r: RefForm[]) => void;
  slugUnlocked: boolean;
  canUnlock: boolean;
  onUnlockSlug: () => void;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
}) {
  const input = (k: keyof DuaForm, label: string, o: { hint?: string; type?: string; placeholder?: string } = {}) => (
    <Field label={label} hint={o.hint}>
      <Input
        type={o.type ?? "text"}
        value={form[k]}
        placeholder={o.placeholder}
        autoComplete="off"
        onChange={(e) => set(k, e.target.value)}
      />
    </Field>
  );
  const area = (
    k: keyof DuaForm, label: string,
    o: { rows?: number; dir?: "rtl"; lang?: string; hint?: string; className?: string } = {}
  ) => (
    <Field label={label} hint={o.hint}>
      <Textarea
        rows={o.rows ?? 3}
        dir={o.dir}
        lang={o.lang}
        className={o.className}
        spellCheck={o.lang === "ar" ? false : undefined}
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <Section title="Identity">
        <Field label="Title">
          <Input value={form.title} autoComplete="off" onChange={(e) => onTitleChange(e.target.value)} />
        </Field>
        <Field
          label="Slug (canonical id)"
          hint="Lowercase letters, digits and hyphens. The app identifies this Dua by its slug, so it should never change."
        >
          <div className="flex gap-2">
            <Input
              value={form.slug}
              readOnly={!slugUnlocked}
              spellCheck={false}
              placeholder="e.g. ayat-al-kursi"
              onChange={(e) => onSlugChange(e.target.value)}
            />
            {!slugUnlocked && canUnlock && (
              <Button type="button" variant="ghost" size="sm" onClick={onUnlockSlug}>
                Unlock slug
              </Button>
            )}
          </div>
        </Field>
        <Field label="Title (Urdu)">
          <Input dir="rtl" lang="ur" className={rtlCls} value={form.title_ur} onChange={(e) => set("title_ur", e.target.value)} />
        </Field>
      </Section>

      <Section title="Text">
        {area("arabic", "Arabic text", {
          rows: 5, dir: "rtl", lang: "ar", className: "font-arabic text-xl leading-loose",
          hint: "Required to send for review / publish. Must be Arabic script.",
        })}
        {area("transliteration_latin", "Transliteration (Latin)")}
        {area("transliteration_telugu", "Transliteration (Telugu)", { lang: "te" })}
        {area("transliteration_urdu", "Transliteration (Urdu script)", {
          dir: "rtl", lang: "ur", className: rtlCls,
          hint: "Leave empty to show the Arabic text in the app’s “Urdu” reading script.",
        })}
        {area("translation_en", "Translation (English)")}
        {area("translation_ur", "Translation (Urdu)", { dir: "rtl", lang: "ur", className: rtlCls })}
        {area("description", "Description / note", { rows: 2 })}
      </Section>

      <Section title="Display">
        <div className={grid2}>
          {input("repeat_count", "Repeat count", {
            type: "number",
            hint: "Whole number 1–1000, or empty. Use this instead of “(x3)” in the text.",
          })}
          {input("sort_order", "Sort order", { type: "number" })}
        </div>
      </Section>

      <Section title="Source">
        <div className={grid2}>
          <Field label="Source type">
            <Select value={form.source_type} onChange={(e) => set("source_type", e.target.value)}>
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          {input("source_collection", "Source collection", { placeholder: "e.g. Sahih al-Bukhari" })}
        </div>
        {input("source_reference", "Source reference (as displayed)", { placeholder: "e.g. Bukhari, Muslim", hint: "Required to publish." })}
        <div className={grid2}>
          {input("hadith_number", "Hadith number")}
          {input("hadith_grade", "Hadith grade", { placeholder: "e.g. Sahih" })}
        </div>
        <fieldset className="mb-3.5">
          <legend className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-muted">Quran references</legend>
          <div className="flex flex-col gap-2">
            {refs.map((r, i) => {
              const upd = (k: keyof RefForm, v: string) => setRefs(refs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
              return (
                <div key={i} className="grid grid-cols-3 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <label>
                    <span className="mb-1 block text-xs text-muted">Surah (1&ndash;114)</span>
                    <Input type="number" min={1} max={114} value={r.surah} onChange={(e) => upd("surah", e.target.value)} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-muted">Ayah from</span>
                    <Input type="number" min={1} value={r.ayah_from} onChange={(e) => upd("ayah_from", e.target.value)} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-muted">Ayah to</span>
                    <Input type="number" min={1} value={r.ayah_to} onChange={(e) => upd("ayah_to", e.target.value)} />
                  </label>
                  <Button
                    type="button" variant="ghost" size="sm" className="col-span-3 sm:col-span-1"
                    aria-label={`Remove Quran reference ${i + 1}`}
                    onClick={() => setRefs(refs.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRefs([...refs, { surah: "", ayah_from: "", ayah_to: "" }])}>
                + Add Quran reference
              </Button>
            </div>
          </div>
        </fieldset>
        {input("audio_url", "Audio URL (https only)", { type: "url" })}
      </Section>

      <Section title="Review & provenance">
        <div className={grid2}>
          <Field label="Verification">
            <Select value={form.verification_status} onChange={(e) => set("verification_status", e.target.value)}>
              {VERIFICATION.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Origin">
            <Select value={form.origin} onChange={(e) => set("origin", e.target.value)}>
              {ORIGINS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {area("review_notes", "Review notes", { rows: 2 })}
        {input("wyn_ids", "WYN ids", { placeholder: "comma separated" })}
      </Section>
    </div>
  );
}

/** Category assignments with per-category overrides. */
export function CategoriesPanel({
  cats, maps, setMaps,
}: {
  cats: CategoryRow[];
  maps: Record<string, MapForm>;
  setMaps: (m: Record<string, MapForm>) => void;
}) {
  const setField = (cid: string, k: (typeof MAP_FIELDS)[number], v: string) =>
    setMaps({ ...maps, [cid]: { ...maps[cid], [k]: v } });

  return (
    <Section title="Categories">
      <p className="mb-3 text-sm text-muted">Tick every category this Dua appears in. Overrides apply only inside that category.</p>
      {cats.length === 0 && <p className="text-sm text-muted">No categories exist yet.</p>}
      <div className="flex flex-col gap-3">
        {cats.map((c) => {
          const m = maps[c.id];
          return (
            <div key={c.id} className="rounded-[10px] border border-line p-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={!!m}
                  onChange={(e) => {
                    if (e.target.checked) setMaps({ ...maps, [c.id]: blankMap() });
                    else {
                      const next = { ...maps };
                      delete next[c.id];
                      setMaps(next);
                    }
                  }}
                />
                {c.name}
                {!c.is_active && <span className="text-xs font-normal text-muted">(inactive)</span>}
              </label>
              {m && (
                <div className="mt-3">
                  <div className={grid2}>
                    <Field label="Order in category">
                      <Input type="number" value={m.sort_order} onChange={(e) => setField(c.id, "sort_order", e.target.value)} />
                    </Field>
                    <Field label="Repeat count override">
                      <Input type="number" value={m.context_repeat_count} onChange={(e) => setField(c.id, "context_repeat_count", e.target.value)} />
                    </Field>
                    <Field label="Context title">
                      <Input value={m.context_title} onChange={(e) => setField(c.id, "context_title", e.target.value)} />
                    </Field>
                    <Field label="Context title (Urdu)">
                      <Input dir="rtl" lang="ur" value={m.context_title_ur} onChange={(e) => setField(c.id, "context_title_ur", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Context reference (replaces the source reference in this category)">
                    <Input value={m.context_reference} onChange={(e) => setField(c.id, "context_reference", e.target.value)} />
                  </Field>
                  <Field label="Context note">
                    <Textarea rows={2} value={m.context_note} onChange={(e) => setField(c.id, "context_note", e.target.value)} />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
