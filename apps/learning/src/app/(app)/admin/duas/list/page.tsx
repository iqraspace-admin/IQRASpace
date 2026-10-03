import { Suspense } from "react";
import { ListView } from "@/components/admin/duas/ListView";

export default function DuasListPage() {
  return (
    <Suspense fallback={<p className="py-6 text-sm text-muted">Loading…</p>}>
      <ListView />
    </Suspense>
  );
}
