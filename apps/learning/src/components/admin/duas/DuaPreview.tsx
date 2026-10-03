"use client";

import { useId, useState } from "react";
import { Select } from "@/components/ui/Field";
import { cx } from "@/components/ui/classNames";
import { applyContext, composeReference, formatQuranRef, type Loose } from "@/lib/duas/validate";

export type PreviewContext = { id: string; name: string; ctx: Loose };

const SCRIPTS = [
  { key: "latin", label: "Latin", col: "transliteration_latin", lang: "en" },
  { key: "telugu", label: "Telugu", col: "transliteration_telugu", lang: "te" },
  { key: "urdu", label: "Urdu", col: "transliteration_urdu", lang: "ur" },
] as const;

const str = (v: unknown) => (v == null ? "" : String(v));

/** Mobile-app-like rendering of a Dua; reflects unsaved values and per-category overrides. */
export function DuaPreview({ data, contexts = [] }: { data: Loose; contexts?: PreviewContext[] }) {
  const [script, setScript] = useState<(typeof SCRIPTS)[number]["key"]>("latin");
  const [ctxId, setCtxId] = useState("");
  const selId = useId();
  const ctxValid = contexts.some((c) => c.id === ctxId) ? ctxId : "";
  const d = applyContext(data, contexts.find((c) => c.id === ctxValid)?.ctx);

  const refs = (Array.isArray(d.quran_refs) ? (d.quran_refs as Loose[]) : []).map(formatQuranRef).filter(Boolean);
  const reference = composeReference(d);
  const sc = SCRIPTS.find((s) => s.key === script)!;
  const tr =
    script === "urdu"
      ? str(d.transliteration_urdu).trim()
        ? { text: str(d.transliteration_urdu), arabic: false }
        : { text: str(d.arabic), arabic: true }
      : { text: str(d[sc.col]), arabic: false };

  return (
    <div className="text-sm">
      {contexts.length > 0 && (
        <div className="mb-3">
          <label htmlFor={selId} className="mb-1 block text-[0.72rem] font-bold uppercase tracking-[0.04em] text-muted">
            Show as in category
          </label>
          <Select id={selId} value={ctxValid} onChange={(e) => setCtxId(e.target.value)}>
            <option value="">Standalone</option>
            {contexts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h3 className="text-base font-semibold">{str(d.title) || "(untitled)"}</h3>
        {d.repeat_count ? (
          <span className="rounded-full bg-primary-tint px-2 py-0.5 text-xs font-bold text-primary-deep">Repeat ×{str(d.repeat_count)}</span>
        ) : null}
      </div>
      {str(d.title_ur) && (
        <p dir="rtl" lang="ur" className="mb-2 text-base">
          {str(d.title_ur)}
        </p>
      )}
      {str(d.description) && <p className="mb-2 text-ink-soft">{str(d.description)}</p>}
      <p dir="rtl" lang="ar" className="font-arabic mb-3 text-[1.6rem] leading-[2.3]">
        {str(d.arabic) || "…"}
      </p>
      <div role="tablist" aria-label="Transliteration script" className="mb-2 inline-flex gap-1 rounded-full bg-paper-alt p-1">
        {SCRIPTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={s.key === script}
            onClick={() => setScript(s.key)}
            className={cx(
              "rounded-full px-3 py-1 text-xs font-bold transition-colors",
              s.key === script ? "bg-surface text-primary-deep shadow-[var(--shadow-s)]" : "text-muted"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {tr.text ? (
        <p
          dir={script === "urdu" ? "rtl" : "ltr"}
          lang={tr.arabic ? "ar" : sc.lang}
          className={cx("mb-3 italic", tr.arabic && "font-arabic text-lg not-italic")}
        >
          {tr.text}
        </p>
      ) : (
        <p className="mb-3 text-muted">No transliteration for this script.</p>
      )}
      {str(d.translation_en) ? <p className="mb-2">{str(d.translation_en)}</p> : <p className="mb-2 text-muted">No English translation.</p>}
      {str(d.translation_ur) && (
        <p dir="rtl" lang="ur" className="mb-2 text-base">
          {str(d.translation_ur)}
        </p>
      )}
      {(reference || refs.length > 0) && <p className="text-xs font-semibold text-accent-deep">{[reference, ...refs].filter(Boolean).join(" · ")}</p>}
      {str(d.audio_url) && <p className="mt-1 break-all text-xs text-muted">Audio: {str(d.audio_url)}</p>}
    </div>
  );
}
