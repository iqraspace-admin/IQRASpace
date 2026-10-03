// All Supabase calls for the Duas admin. Uses the Learning app's shared browser
// client, i.e. the signed-in user's own session + anon key; the duas* tables'
// RLS (0025_duas_schema.sql) is what actually restricts this to admin /
// super_admin. The service_role key is never involved.

import { supabase } from "@/lib/supabaseClient";
import type { AuditRow, CategoryRow, DuaListRow, DuaRow, MappingRow } from "./types";
import type { MapForm } from "./form";
import { mapToRow } from "./form";
import { hasArabic, normalizeArabic } from "./validate";

type PgError = { code?: string; message: string };
type Res<T> = { data: T | null; error: PgError | null; count?: number | null };

export class ApiError extends Error {
  code?: string;
  constructor(message: string, raw?: PgError) {
    super(message);
    this.code = raw?.code;
  }
}

export function friendlyMessage(err: unknown): string {
  if (!err) return "Unknown error.";
  const e = err as PgError;
  const code = e.code || "";
  const msg = String(e.message || err);
  if (/^Only an admin/i.test(msg)) return msg + ".";
  if (code === "42501" || /row-level security|permission denied/i.test(msg)) {
    return "You do not have permission to do that. Managing Duas needs an admin or super admin account.";
  }
  if (code === "23505") {
    if (/slug/i.test(msg)) return "That slug is already in use. Slugs must be unique — pick a different one.";
    return "A record with the same unique value already exists.";
  }
  if (code === "23503") {
    if (/dua_category_map/i.test(msg) && /category/i.test(msg))
      return "This category still has Duas assigned. Remove them from the category first, then delete it.";
    return "This record is still referenced by other data and cannot be removed.";
  }
  if (code === "23514") {
    if (/duas_arabic_required/.test(msg)) return "Arabic text is required for anything beyond a draft.";
    if (/duas_arabic_is_arabic/.test(msg)) return "The Arabic field must contain Arabic-script text.";
    if (/published_needs_translation/.test(msg)) return "An English translation is required to publish.";
    if (/repeat_count/.test(msg)) return "Repeat count must be between 1 and 1000.";
    if (/audio_url/.test(msg)) return "Audio URL must start with https://";
    if (/slug/.test(msg)) return "Invalid slug format.";
    return "A database rule rejected this value: " + msg;
  }
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Network problem — check your connection and try again.";
  if (/JWT|expired/i.test(msg)) return "Your session has expired. Please sign in again.";
  return msg;
}

export const errText = (e: unknown): string => (e instanceof ApiError ? e.message : friendlyMessage(e));

/** Throw a friendly ApiError when a supabase-js response carries an error. */
function unwrap<T>(res: Res<T>): { data: T; count: number | null } {
  if (res.error) throw new ApiError(friendlyMessage(res.error), res.error);
  return { data: res.data as T, count: res.count ?? null };
}

type Rangeable<T> = { range(from: number, to: number): PromiseLike<Res<T[]>> };

/** Fetch every row of a query in pages (PostgREST caps responses at ~1000 rows). */
async function fetchAll<T>(build: () => Rangeable<T>, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data } = unwrap(await build().range(from, from + pageSize - 1));
    out.push(...data);
    if (data.length < pageSize) break;
  }
  return out;
}

/** Quote a value for a PostgREST or=() filter. */
const pgQuote = (v: string) => '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const escapeLike = (v: string) => v.replace(/[\\%_]/g, (c) => "\\" + c);

const LIST_COLS =
  "id,slug,title,status,verification_status,origin,source_reference,sort_order,updated_at,created_at,arabic";

// ------------------------------------------------------------------ categories
export async function loadCategories(): Promise<CategoryRow[]> {
  return unwrap(
    (await supabase.from("dua_categories").select("*").order("sort_order").order("slug")) as unknown as Res<CategoryRow[]>
  ).data;
}

export async function categoryNameMap(): Promise<Map<string, string>> {
  const { data } = unwrap((await supabase.from("dua_categories").select("id,name")) as unknown as Res<{ id: string; name: string }[]>);
  return new Map(data.map((c) => [c.id, c.name]));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  return unwrap((await supabase.from("dua_categories").select("*").eq("slug", slug).maybeSingle()) as unknown as Res<CategoryRow>).data;
}

export type CategoryStats = Map<string, { total: number; published: number }>;

export async function categoryListWithStats(): Promise<{ cats: CategoryRow[]; stats: CategoryStats }> {
  const [cats, maps] = await Promise.all([
    fetchAll<CategoryRow>(() => supabase.from("dua_categories").select("*").order("sort_order").order("slug") as unknown as Rangeable<CategoryRow>),
    fetchAll<{ category_id: string; dua_id: string; duas: { status: string } | null }>(
      () =>
        supabase.from("dua_category_map").select("category_id,dua_id,duas(status)").order("category_id").order("dua_id") as unknown as Rangeable<{
          category_id: string;
          dua_id: string;
          duas: { status: string } | null;
        }>
    ),
  ]);
  const stats: CategoryStats = new Map();
  for (const m of maps) {
    const st = stats.get(m.category_id) || { total: 0, published: 0 };
    st.total++;
    if (m.duas?.status === "published") st.published++;
    stats.set(m.category_id, st);
  }
  return { cats, stats };
}

export async function insertCategory(data: Record<string, unknown>): Promise<void> {
  unwrap((await supabase.from("dua_categories").insert(data)) as unknown as Res<null>);
}

/** Optimistic-concurrency update. Returns false when the row changed/vanished. */
export async function updateCategory(id: string, loadedUpdatedAt: string, data: Record<string, unknown>): Promise<boolean> {
  const { data: row } = unwrap(
    (await supabase.from("dua_categories").update(data).eq("id", id).eq("updated_at", loadedUpdatedAt).select("id").maybeSingle()) as unknown as Res<{ id: string }>
  );
  return !!row;
}

export async function deleteCategory(id: string): Promise<void> {
  unwrap((await supabase.from("dua_categories").delete().eq("id", id)) as unknown as Res<null>);
}

/** Swap items i and j, then rewrite sort_order in steps of 10 for rows whose value changes. */
export async function reorderCategories(list: CategoryRow[], i: number, j: number): Promise<void> {
  const next = reorderedSortOrders(list, i, j);
  for (const { row, so } of next)
    unwrap((await supabase.from("dua_categories").update({ sort_order: so }).eq("id", row.id)) as unknown as Res<null>);
}

export async function reorderMappings(list: CategoryDuaRow[], i: number, j: number): Promise<void> {
  const next = reorderedSortOrders(list, i, j);
  for (const { row, so } of next)
    unwrap(
      (await supabase.from("dua_category_map").update({ sort_order: so }).eq("dua_id", row.dua_id).eq("category_id", row.category_id)) as unknown as Res<null>
    );
}

function reorderedSortOrders<T extends { sort_order: number }>(list: T[], i: number, j: number): { row: T; so: number }[] {
  if (j < 0 || j >= list.length) return [];
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  const updates: { row: T; so: number }[] = [];
  next.forEach((row, idx) => {
    const so = (idx + 1) * 10;
    if (row.sort_order !== so) updates.push({ row, so });
  });
  return updates;
}

export type CategoryDuaRow = Pick<MappingRow, "dua_id" | "category_id" | "sort_order" | "context_title"> & {
  duas: { id: string; slug: string; title: string; status: string };
};

export async function categoryDuas(categoryId: string): Promise<CategoryDuaRow[]> {
  return fetchAll<CategoryDuaRow>(
    () =>
      supabase
        .from("dua_category_map")
        .select("dua_id,category_id,sort_order,context_title,duas(id,slug,title,status)")
        .eq("category_id", categoryId)
        .order("sort_order")
        .order("dua_id") as unknown as Rangeable<CategoryDuaRow>
  );
}

export async function removeFromCategory(duaId: string, categoryId: string): Promise<void> {
  unwrap((await supabase.from("dua_category_map").delete().eq("dua_id", duaId).eq("category_id", categoryId)) as unknown as Res<null>);
}

export async function addToCategory(duaId: string, categoryId: string, sortOrder: number): Promise<void> {
  unwrap((await supabase.from("dua_category_map").insert({ dua_id: duaId, category_id: categoryId, sort_order: sortOrder })) as unknown as Res<null>);
}

export type DuaPick = { id: string; slug: string; title: string; status: string };

export async function searchDuasByTitleOrSlug(term: string): Promise<DuaPick[]> {
  const like = pgQuote(`%${escapeLike(term.trim())}%`);
  return unwrap(
    (await supabase.from("duas").select("id,slug,title,status").or(`title.ilike.${like},slug.ilike.${like}`).order("title").limit(20)) as unknown as Res<DuaPick[]>
  ).data;
}

// ------------------------------------------------------------------ duas
export type ListParams = {
  q: string;
  category: string;
  status: string;
  verification: string;
  origin: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  missing: string;
  uncategorised: string;
};
export const PAGE_SIZE = 50;

export async function listDuas(p: ListParams): Promise<{ rows: DuaListRow[]; total: number }> {
  const asc = p.dir === "asc";
  if (p.uncategorised) {
    const [ids, mapped] = await Promise.all([
      fetchAll<{ id: string }>(() => supabase.from("duas").select("id").order("id") as unknown as Rangeable<{ id: string }>),
      fetchAll<{ dua_id: string }>(() => supabase.from("dua_category_map").select("dua_id").order("dua_id") as unknown as Rangeable<{ dua_id: string }>),
    ]);
    const m = new Set(mapped.map((r) => r.dua_id));
    const un = ids.map((r) => r.id).filter((id) => !m.has(id));
    const slice = un.slice((p.page - 1) * PAGE_SIZE, p.page * PAGE_SIZE);
    const rows = slice.length
      ? unwrap((await supabase.from("duas").select(LIST_COLS).in("id", slice).order(p.sort, { ascending: asc })) as unknown as Res<DuaListRow[]>).data
      : [];
    return { rows, total: un.length };
  }
  const embed = p.category ? ",dua_category_map!inner(category_id)" : "";
  let q = supabase.from("duas").select(LIST_COLS + embed, { count: "exact" });
  if (p.category) q = q.eq("dua_category_map.category_id", p.category);
  if (p.status) q = q.eq("status", p.status);
  if (p.verification) q = q.eq("verification_status", p.verification);
  if (p.origin) q = q.eq("origin", p.origin);
  if (p.missing === "arabic") q = q.eq("arabic", "");
  if (p.q) {
    const like = pgQuote(`%${escapeLike(p.q)}%`);
    const ors = [`title.ilike.${like}`, `slug.ilike.${like}`, `source_reference.ilike.${like}`, `title_ur.ilike.${like}`];
    if (hasArabic(p.q)) {
      const n = normalizeArabic(p.q);
      if (n) ors.push(`arabic_normalized.ilike.${pgQuote(`%${escapeLike(n)}%`)}`);
    }
    q = q.or(ors.join(","));
  }
  const res = unwrap(
    (await q
      .order(p.sort, { ascending: asc })
      .order("id")
      .range((p.page - 1) * PAGE_SIZE, p.page * PAGE_SIZE - 1)) as unknown as Res<DuaListRow[]>
  );
  return { rows: res.data, total: res.count ?? res.data.length };
}

export async function getDua(id: string): Promise<DuaRow | null> {
  return unwrap((await supabase.from("duas").select("*").eq("id", id).maybeSingle()) as unknown as Res<DuaRow>).data;
}

export async function getDuaMappings(duaId: string): Promise<MappingRow[]> {
  return unwrap((await supabase.from("dua_category_map").select("*").eq("dua_id", duaId)) as unknown as Res<MappingRow[]>).data;
}

export type DupMatch = { id: string; slug: string; title: string; status: string; source_reference: string | null; why: string };

export async function findDuplicates(data: { arabic: string; title: string; source_reference: string | null }, selfId?: string): Promise<DupMatch[]> {
  const found = new Map<string, DupMatch>();
  const add = (rows: Omit<DupMatch, "why">[], why: string) =>
    rows.forEach((r) => found.set(r.id, { ...r, why: found.has(r.id) ? `${found.get(r.id)!.why}; ${why}` : why }));
  const n = normalizeArabic(data.arabic);
  if (n) {
    let q = supabase.from("duas").select("id,slug,title,status,source_reference").eq("arabic_normalized", n);
    if (selfId) q = q.neq("id", selfId);
    add(unwrap((await q) as unknown as Res<Omit<DupMatch, "why">[]>).data, "same Arabic text");
  }
  if (data.source_reference && data.title) {
    let q = supabase.from("duas").select("id,slug,title,status,source_reference").eq("source_reference", data.source_reference).eq("title", data.title);
    if (selfId) q = q.neq("id", selfId);
    add(unwrap((await q) as unknown as Res<Omit<DupMatch, "why">[]>).data, "same title and source reference");
  }
  return [...found.values()];
}

export async function insertDua(data: Record<string, unknown>): Promise<string> {
  return unwrap((await supabase.from("duas").insert(data).select("id").single()) as unknown as Res<{ id: string }>).data.id;
}

/** Optimistic-concurrency update. Returns false when the row changed/vanished since it was loaded. */
export async function updateDua(id: string, loadedUpdatedAt: string, data: Record<string, unknown>): Promise<boolean> {
  const { data: row } = unwrap(
    (await supabase.from("duas").update(data).eq("id", id).eq("updated_at", loadedUpdatedAt).select("id").maybeSingle()) as unknown as Res<{ id: string }>
  );
  return !!row;
}

export async function deleteDua(id: string): Promise<void> {
  unwrap((await supabase.from("duas").delete().eq("id", id)) as unknown as Res<null>);
}

/** Apply category assignment changes; returns per-category failure messages. */
export async function reconcileMappings(
  duaId: string,
  current: Map<string, MapForm>,
  initial: Map<string, MapForm>,
  labelOf: (categoryId: string) => string
): Promise<string[]> {
  const failures: string[] = [];
  for (const [cid, m] of current) {
    const row = mapToRow(m);
    const init = initial.get(cid);
    try {
      if (!init) unwrap((await supabase.from("dua_category_map").insert({ dua_id: duaId, category_id: cid, ...row })) as unknown as Res<null>);
      else if (JSON.stringify(mapToRow(init)) !== JSON.stringify(row)) {
        unwrap((await supabase.from("dua_category_map").update(row).eq("dua_id", duaId).eq("category_id", cid)) as unknown as Res<null>);
      }
    } catch (e) {
      failures.push(`${labelOf(cid)}: ${errText(e)}`);
    }
  }
  for (const cid of initial.keys()) {
    if (current.has(cid)) continue;
    try {
      await removeFromCategory(duaId, cid);
    } catch (e) {
      failures.push(`Remove from ${labelOf(cid)}: ${errText(e)}`);
    }
  }
  return failures;
}

// ------------------------------------------------------------------ dashboard
export type DashboardData = {
  total: number;
  draft: number;
  review: number;
  published: number;
  archived: number;
  noArabic: number;
  categories: { total: number; active: number };
  uncategorised: number;
  attention: DuaListRow[];
  updated: DuaListRow[];
  added: DuaListRow[];
};

export async function loadDashboard(): Promise<DashboardData> {
  const count = async (apply: (q: ReturnType<typeof base>) => unknown): Promise<number> => {
    const res = (await (apply(base()) as PromiseLike<Res<null>>)) as Res<null>;
    return unwrap(res).count ?? 0;
  };
  const base = () => supabase.from("duas").select("id", { count: "exact", head: true });
  const cols = "id,slug,title,status,verification_status,updated_at,created_at";
  const [total, draft, review, published, archived, noArabic, cats, updated, added, attention, mapRows, idRows] = await Promise.all([
    count((q) => q),
    count((q) => q.eq("status", "draft")),
    count((q) => q.eq("status", "review")),
    count((q) => q.eq("status", "published")),
    count((q) => q.eq("status", "archived")),
    count((q) => q.eq("arabic", "")),
    supabase.from("dua_categories").select("id,is_active") as unknown as Promise<Res<{ id: string; is_active: boolean }[]>>,
    supabase.from("duas").select(cols).order("updated_at", { ascending: false }).limit(10) as unknown as Promise<Res<DuaListRow[]>>,
    supabase.from("duas").select(cols).order("created_at", { ascending: false }).limit(10) as unknown as Promise<Res<DuaListRow[]>>,
    supabase
      .from("duas")
      .select(cols)
      .or("status.eq.review,verification_status.eq.needs_review")
      .order("updated_at", { ascending: false })
      .limit(50) as unknown as Promise<Res<DuaListRow[]>>,
    fetchAll<{ dua_id: string }>(() => supabase.from("dua_category_map").select("dua_id").order("dua_id") as unknown as Rangeable<{ dua_id: string }>),
    fetchAll<{ id: string }>(() => supabase.from("duas").select("id").order("id") as unknown as Rangeable<{ id: string }>),
  ]);
  const catRows = unwrap(cats).data;
  const mapped = new Set(mapRows.map((r) => r.dua_id));
  return {
    total, draft, review, published, archived, noArabic,
    categories: { total: catRows.length, active: catRows.filter((c) => c.is_active).length },
    uncategorised: idRows.filter((r) => !mapped.has(r.id)).length,
    attention: unwrap(attention).data,
    updated: unwrap(updated).data,
    added: unwrap(added).data,
  };
}

// ------------------------------------------------------------------ history
export async function fetchHistory(opts: { entity?: "dua" | "category"; entityId?: string; limit?: number }): Promise<AuditRow[]> {
  const { entity, entityId, limit = 100 } = opts;
  let q = supabase.from("dua_audit_log").select("*").order("changed_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
  if (entity === "dua") {
    q = q.or(`and(entity.eq.dua,entity_id.eq.${entityId}),and(entity.eq.mapping,entity_id.like.${entityId}:*)`);
  } else if (entity === "category") {
    q = q.or(`and(entity.eq.category,entity_id.eq.${entityId}),and(entity.eq.mapping,entity_id.like.*:${entityId})`);
  }
  return unwrap((await q) as unknown as Res<AuditRow[]>).data;
}

/** Write the (already validated + stripped) old_data back. The DB records its own new audit entry. */
export async function restoreFromAudit(entry: AuditRow, fields: Record<string, unknown>): Promise<void> {
  const entity = entry.entity;
  const table = entity === "dua" ? "duas" : entity === "mapping" ? "dua_category_map" : "dua_categories";
  if (entry.action === "delete") {
    unwrap((await supabase.from(table).insert(fields)) as unknown as Res<null>);
    return;
  }
  if (entity === "mapping") {
    const { data } = unwrap(
      (await supabase.from(table).update(fields).eq("dua_id", fields.dua_id as string).eq("category_id", fields.category_id as string).select("dua_id")) as unknown as Res<unknown[]>
    );
    if (!data.length) throw new Error('That assignment no longer exists; restore its "Deleted" entry instead.');
    return;
  }
  const { data } = unwrap((await supabase.from(table).update(fields).eq("id", entry.entity_id).select("id")) as unknown as Res<unknown[]>);
  if (!data.length) throw new Error('That item no longer exists; restore its "Deleted" history entry instead.');
}
