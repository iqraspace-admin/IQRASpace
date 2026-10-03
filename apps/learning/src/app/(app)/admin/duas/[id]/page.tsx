import { EditDuaRoute } from "@/components/RouteEntry";

// Static export placeholder shell — see src/lib/routeParam.ts.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditDuaPage() {
  return <EditDuaRoute />;
}
