"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { errText, getDua, listDuas, loadCategories, PAGE_SIZE, type ListParams } from "@/lib/duas/api";
import { ORIGINS, STATUSES, VERIFICATION, type CategoryRow, type DuaListRow } from "@/lib/duas/types";
import { DuaPreview } from "./DuaPreview";
import { useDuasUi } from "./DuasUi";
import { Loading, Notice, PageTitle, StatusBadge, fmtDate, linkCls, td, th } from "./bits";

const SORTABLE: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  status: "Status",
  updated_at: "Updated",
  created_at: "Created",
  sort_order: "Order",
};

const labelCls = "mb-1 block text-[0.72rem] font-bold uppercase tracking-[0.04em] text-muted";

function readParams(sp: URLSearchParams): ListParams {
  const sort = sp.get("sort") ?? "";
  return {
    q: sp.get("q") || "",
    category: sp.get("category") || "",
    status: sp.get("status") || "",
    verification: sp.get("verification") || "",
    origin: sp.get("origin") || "",
    sort: SORTABLE[sort] ? sort : "updated_at",
    dir: sp.get("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, parseInt(sp.get("page") || "1", 10) || 1),
    missing: sp.get("missing") || "",
    uncategorised: sp.get("uncategorised") || "",
  };
}

export function ListView() {
  const router = useRouter();
  const sp = useSearchParams();
  const ui = useDuasUi();
  const { showToast } = useToast();
  const p = useMemo(() => readParams(sp), [sp]);
  const key = sp.toString();

  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [result, setResult] = useState<{ key: string; rows: DuaListRow[]; total: number } | null>(null);
  const [error, setError] = useState<{ key: string; msg: string } | null>(null);
  const [form, setForm] = useState({ q: p.q, category: p.category, status: p.status, verification: p.verification, origin: p.origin });

  function go(next: Partial<ListParams>) {
    const merged = { ...p, ...next };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v === "" || v == null || k === "sort" || k === "dir") continue;
      if (k === "page" && v === 1) continue;
      q.set(k, String(v));
    }
    if (!(merged.sort === "updated_at" && merged.dir === "desc")) {
      q.set("sort", merged.sort);
      q.set("dir", merged.dir);
    }
    const s = q.toString();
    router.push("/admin/duas/list" + (s ? "?" + s : ""));
  }

  useEffect(() => {
    let active = true;
    loadCategories().then(
      (c) => active && setCats(c),
      (e) => active && setError({ key: "cats", msg: errText(e) })
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    listDuas(p).then(
      (r) => active && setResult({ key, ...r }),
      (e) => active && setError({ key, msg: errText(e) })
    );
    return () => {
      active = false;
    };
  }, [p, key]);

  const loading = !result || result.key !== key;
  const err = error && (error.key === key || error.key === "cats") ? error.msg : null;

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    go({ ...form, q: form.q.trim(), page: 1 });
  }

  async function preview(id: string) {
    try {
      const d = await getDua(id);
      if (!d) return showToast("That Dua no longer exists.");
      await ui.choose({
        title: `Preview: ${d.title}`,
        wide: true,
        body: <DuaPreview data={d} />,
        actions: [{ label: "Close", value: true }],
      });
    } catch (e) {
      showToast(errText(e));
    }
  }

  const sortHead = (k: string) => {
    const active = p.sort === k;
    return (
      <th scope="col" className={th} aria-sort={active ? (p.dir === "asc" ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          className="font-bold uppercase tracking-[0.05em] hover:text-primary"
          onClick={() => go({ sort: k, dir: active && p.dir === "asc" ? "desc" : "asc", page: 1 })}
        >
          {SORTABLE[k]}
          {active ? (p.dir === "asc" ? " ▲" : " ▼") : ""}
        </button>
      </th>
    );
  };

  const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const setF = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageTitle title="Duas" action={<LinkButton href="/admin/duas/new">New Dua</LinkButton>} />
      <Card className="mb-4">
        <form role="search" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="sm:col-span-2 lg:col-span-2">
            <span className={labelCls}>Search</span>
            <Input type="search" value={form.q} onChange={setF("q")} placeholder="Title, slug, Arabic or source reference" />
          </label>
          <label>
            <span className={labelCls}>Category</span>
            <Select value={form.category} onChange={setF("category")}>
              <option value="">Any</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className={labelCls}>Status</span>
            <Select value={form.status} onChange={setF("status")}>
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className={labelCls}>Verification</span>
            <Select value={form.verification} onChange={setF("verification")}>
              <option value="">Any</option>
              {VERIFICATION.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className={labelCls}>Origin</span>
            <Select value={form.origin} onChange={setF("origin")}>
              <option value="">Any</option>
              {ORIGINS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm({ q: "", category: "", status: "", verification: "", origin: "" });
                router.push("/admin/duas/list");
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {(p.missing || p.uncategorised) && (
        <Notice kind="info">
          {p.missing ? "Showing Duas with no Arabic text. " : "Showing Duas with no category. "}
          <Link href="/admin/duas/list" className={linkCls}>
            Clear
          </Link>
        </Notice>
      )}
      {err && <Notice kind="error">{err}</Notice>}
      {loading && !err && <Loading />}
      {result && !loading && (
        <>
          {result.rows.length === 0 ? (
            <Card>
              <EmptyState>No Duas match these filters.</EmptyState>
            </Card>
          ) : (
            <Card padded={false} className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead className="border-b border-line">
                  <tr>
                    {sortHead("title")}
                    {sortHead("status")}
                    <th scope="col" className={th}>
                      Verification
                    </th>
                    <th scope="col" className={th}>
                      Origin
                    </th>
                    {sortHead("updated_at")}
                    <th scope="col" className={th}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.rows.map((d) => (
                    <tr key={d.id}>
                      <td className={td}>
                        <Link href={`/admin/duas/${d.id}`} className={linkCls}>
                          {d.title || "(untitled)"}
                        </Link>
                        <div className="text-xs text-muted">
                          {d.slug}
                          {d.arabic ? "" : " · no Arabic"}
                        </div>
                      </td>
                      <td className={td}>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className={td}>{d.verification_status.replace("_", " ")}</td>
                      <td className={td}>{d.origin}</td>
                      <td className={td}>{fmtDate(d.updated_at)}</td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1.5">
                          <LinkButton href={`/admin/duas/${d.id}`} variant="ghost" size="sm">
                            Edit
                          </LinkButton>
                          <LinkButton href={`/admin/duas/new?from=${d.id}`} variant="ghost" size="sm">
                            Duplicate
                          </LinkButton>
                          <Button type="button" variant="ghost" size="sm" onClick={() => preview(d.id)}>
                            Preview
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
            <Button type="button" variant="outline" size="sm" disabled={p.page <= 1} onClick={() => go({ page: p.page - 1 })}>
              {"‹"} Previous
            </Button>
            <span>
              Page {p.page} of {pages} {"·"} {result.total} Dua{result.total === 1 ? "" : "s"}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={p.page >= pages} onClick={() => go({ page: p.page + 1 })}>
              Next {"›"}
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}
