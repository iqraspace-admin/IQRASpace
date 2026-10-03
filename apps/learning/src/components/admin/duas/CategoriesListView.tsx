"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { categoryListWithStats, errText, reorderCategories, type CategoryStats } from "@/lib/duas/api";
import type { CategoryRow } from "@/lib/duas/types";
import { Loading, Notice, PageTitle, linkCls, td, th } from "./bits";

export function CategoriesListView() {
  const { showToast } = useToast();
  const [data, setData] = useState<{ cats: CategoryRow[]; stats: CategoryStats } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await categoryListWithStats());
    } catch (e) {
      setError(errText(e));
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount via the browser Supabase client (same pattern as the other admin pages).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function move(i: number, d: number) {
    if (!data || busy) return;
    setBusy(true);
    try {
      await reorderCategories(data.cats, i, i + d);
      await load();
    } catch (e) {
      showToast(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle title="Categories" action={<LinkButton href="/admin/duas/categories/new">New category</LinkButton>} />
      {error && <Notice kind="error">{error}</Notice>}
      {!data && !error && <Loading />}
      {data && data.cats.length === 0 && (
        <Card>
          <EmptyState>No categories yet.</EmptyState>
        </Card>
      )}
      {data && data.cats.length > 0 && (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead className="border-b border-line">
              <tr>
                {["Category", "Duas (published)", "Active", "Order", "Actions"].map((h) => (
                  <th key={h} scope="col" className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.cats.map((c, i) => {
                const st = data.stats.get(c.id) || { total: 0, published: 0 };
                return (
                  <tr key={c.id}>
                    <td className={td}>
                      <Link href={`/admin/duas/categories/${encodeURIComponent(c.slug)}`} className={linkCls}>
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted">{c.slug}</div>
                    </td>
                    <td className={td}>
                      {st.total} ({st.published} published)
                    </td>
                    <td className={td}>{c.is_active ? "Yes" : <Badge tone="red">Inactive</Badge>}</td>
                    <td className={td}>{c.sort_order}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1.5">
                        <LinkButton href={`/admin/duas/categories/${encodeURIComponent(c.slug)}`} variant="ghost" size="sm">
                          Edit
                        </LinkButton>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={i === 0 || busy}
                          aria-label={`Move ${c.name} up`}
                          onClick={() => move(i, -1)}
                        >
                          {"↑"} Up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={i === data.cats.length - 1 || busy}
                          aria-label={`Move ${c.name} down`}
                          onClick={() => move(i, 1)}
                        >
                          {"↓"} Down
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
