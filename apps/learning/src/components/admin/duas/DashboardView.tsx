"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { cx } from "@/components/ui/classNames";
import { errText, loadDashboard, type DashboardData } from "@/lib/duas/api";
import type { DuaListRow } from "@/lib/duas/types";
import { Loading, Notice, PageTitle, StatusBadge, fmtDate, linkCls } from "./bits";

function Stat({ label, value, href, warn }: { label: string; value: number; href: string; warn?: boolean }) {
  return (
    <Link
      href={href}
      className={cx(
        "block rounded-[var(--radius-m)] border bg-surface p-4 transition-colors hover:border-primary",
        warn ? "border-warning/60" : "border-line"
      )}
    >
      <div className={cx("font-display text-[1.9rem]", warn ? "text-warning" : "text-primary-deep")}>{value}</div>
      <div className="text-[0.78rem] font-semibold text-muted">{label}</div>
    </Link>
  );
}

function DuaList({ rows, empty }: { rows: DuaListRow[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm">
          <Link href={`/admin/duas/${d.id}`} className={linkCls}>
            {d.title || d.slug}
          </Link>
          <StatusBadge status={d.status} />
          {d.verification_status === "needs_review" && <Badge tone="amber">needs review</Badge>}
          <span className="text-xs text-muted">{fmtDate(d.updated_at)}</span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadDashboard().then(
      (d) => active && setData(d),
      (e) => active && setError(errText(e))
    );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageTitle
        title="Duas dashboard"
        sub="Remotely-managed supplications shown in the mobile app."
        action={<LinkButton href="/admin/duas/new">New Dua</LinkButton>}
      />
      {error && <Notice kind="error">{error}</Notice>}
      {!data && !error && <Loading />}
      {data && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Total Duas" value={data.total} href="/admin/duas/list" />
            <Stat label="Draft" value={data.draft} href="/admin/duas/list?status=draft" />
            <Stat label="In review" value={data.review} href="/admin/duas/list?status=review" />
            <Stat label="Published" value={data.published} href="/admin/duas/list?status=published" />
            <Stat label="Archived" value={data.archived} href="/admin/duas/list?status=archived" />
            <Stat label={`Categories (${data.categories.active} active)`} value={data.categories.total} href="/admin/duas/categories" />
            <Stat label="Missing Arabic (stubs)" value={data.noArabic} href="/admin/duas/list?missing=arabic" warn={data.noArabic > 0} />
            <Stat label="No category" value={data.uncategorised} href="/admin/duas/list?uncategorised=1" warn={data.uncategorised > 0} />
          </div>
          <Card>
            <h2 className="text-base font-semibold">Items requiring review</h2>
            <p className="mb-2 text-sm text-muted">Status &ldquo;review&rdquo; or verification &ldquo;needs review&rdquo;.</p>
            <DuaList rows={data.attention} empty="Nothing is waiting for review." />
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="mb-2 text-base font-semibold">Recently updated</h2>
              <DuaList rows={data.updated} empty="No Duas yet." />
            </Card>
            <Card>
              <h2 className="mb-2 text-base font-semibold">Recently added</h2>
              <DuaList rows={data.added} empty="No Duas yet." />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
