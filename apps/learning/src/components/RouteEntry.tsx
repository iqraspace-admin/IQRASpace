"use client";

import { TeachClient } from "@/components/teach/TeachClient";
import { ShareClient } from "@/components/teach/ShareClient";
import { EditDuaView } from "@/components/admin/duas/DuaEditor";
import { CategoryDetailView } from "@/components/admin/duas/CategoryDetailView";
import { useRouteParam } from "@/lib/routeParam";

// Client entry points for the four dynamic routes. They read the real id from
// the browser URL (see src/lib/routeParam.ts) because the static export only
// contains a placeholder shell for each route.

const Loading = () => <p className="p-8 text-sm text-muted">Loading…</p>;

export function TeachRoute() {
  const id = useRouteParam(["teach"]);
  return id ? <TeachClient lessonId={id} /> : <Loading />;
}

export function ShareRoute() {
  const id = useRouteParam(["share"]);
  return id ? <ShareClient lessonId={id} /> : <Loading />;
}

export function EditDuaRoute() {
  const id = useRouteParam(["admin", "duas"]);
  return id ? <EditDuaView id={id} /> : <Loading />;
}

export function DuaCategoryRoute() {
  const slug = useRouteParam(["admin", "duas", "categories"]);
  return slug ? <CategoryDetailView slug={slug} /> : <Loading />;
}
