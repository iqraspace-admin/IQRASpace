import { Suspense } from "react";
import { NewDuaView } from "@/components/admin/duas/DuaEditor";

// ?from=<id> duplicates an existing Dua as a new draft.
export default function NewDuaPage() {
  return (
    <Suspense fallback={<p className="py-6 text-sm text-muted">Loading…</p>}>
      <NewDuaView />
    </Suspense>
  );
}
