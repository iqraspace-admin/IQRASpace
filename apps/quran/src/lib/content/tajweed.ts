/**
 * Live per-letter Tajweed coloring — ported from the IqraSpace Flutter
 * app's `lib/core/utils/tajweed_parser.dart` and
 * `lib/core/theme/tajweed_rule_colors.dart`, so both platforms color the
 * same rules the same way. See those files for the full provenance notes
 * (Al Quran Cloud's `quran-tajweed` edition bracket notation, cross-checked
 * against the `alquran-tools` PHP library).
 */

export type TajweedSpan = { text: string; ruleKey: string | null };

const TAG_PATTERN = /\[([a-z]+)(?::\d+)?\[([^\]]*)\]|([^[]+)/g;

// Real, spacing Arabic letters (standard + wasl-alif/wavy-hamza-alef
// Quranic orthography variants) — excludes tatweel and combining marks
// (harakat, dagger alif), same set the Flutter parser uses.
const BASE_LETTER_PATTERN = /[ء-غف-يٱ-ۓ]/;

function lastBaseLetterIndex(text: string): number {
  for (let i = text.length - 1; i >= 0; i--) {
    if (BASE_LETTER_PATTERN.test(text[i])) return i;
  }
  return -1;
}

/** Some tagged runs carry no base letter of their own (e.g. a lone madd
    mark) — reattach them to the previous span's trailing letter so a
    combining mark never renders as its own disconnected color run. See
    the Flutter parser's `_reattachOrphanedMarks` for the full rationale. */
function reattachOrphanedMarks(spans: TajweedSpan[]): TajweedSpan[] {
  const result: TajweedSpan[] = [];
  for (const span of spans) {
    const isOrphanedMark = span.ruleKey !== null && span.text.length > 0 && !BASE_LETTER_PATTERN.test(span.text);
    const letterIndex = isOrphanedMark && result.length > 0 ? lastBaseLetterIndex(result[result.length - 1].text) : -1;
    if (letterIndex !== -1) {
      const previous = result.pop()!;
      const carried = previous.text.slice(letterIndex);
      const shortened = previous.text.slice(0, letterIndex);
      if (shortened.length > 0) result.push({ text: shortened, ruleKey: previous.ruleKey });
      result.push({ text: carried + span.text, ruleKey: span.ruleKey });
    } else {
      result.push(span);
    }
  }
  return result;
}

export function parseTajweedMarkup(rawTaggedText: string): TajweedSpan[] {
  const rawSpans: TajweedSpan[] = [];
  for (const match of rawTaggedText.matchAll(TAG_PATTERN)) {
    if (match[1] !== undefined) {
      rawSpans.push({ text: match[2] ?? "", ruleKey: match[1] });
    } else {
      rawSpans.push({ text: match[3] ?? "", ruleKey: null });
    }
  }
  return reattachOrphanedMarks(rawSpans);
}

const TAJWEED_CODE_TO_RULE_KEY: Record<string, string> = {
  h: "ham_wasl",
  s: "slnt",
  l: "slnt",
  n: "madda_normal",
  p: "madda_permissible",
  m: "madda_necessary",
  q: "qlq",
  o: "madda_obligatory",
  c: "ikhf_shfw",
  f: "ikhf",
  w: "idghm_shfw",
  i: "iqlb",
  a: "idgh_ghn",
  u: "idgh_w_ghn",
  b: "idgh_mus",
  d: "idgh_mus",
  g: "ghn",
};

const TAJWEED_RULE_COLORS: Record<string, string> = {
  ham_wasl: "#AAAAAA",
  slnt: "#AAAAAA",
  madda_normal: "#537FFF",
  madda_permissible: "#4050FF",
  madda_necessary: "#000EBC",
  qlq: "#DD0008",
  madda_obligatory: "#2144C1",
  ikhf_shfw: "#D500B7",
  ikhf: "#9400A8",
  idghm_shfw: "#58B800",
  iqlb: "#26BFFD",
  idgh_ghn: "#169200",
  idgh_w_ghn: "#1B6E3C",
  idgh_mus: "#A1A1A1",
  ghn: "#FF7E1E",
};

export function colorForTajweedCode(rawCode: string | null): string | undefined {
  if (rawCode === null) return undefined;
  const ruleKey = TAJWEED_CODE_TO_RULE_KEY[rawCode];
  if (!ruleKey) return undefined;
  return TAJWEED_RULE_COLORS[ruleKey];
}
