import { DuaCategoryRoute } from "@/components/RouteEntry";

// Static export placeholder shell — see src/lib/routeParam.ts.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function DuaCategoryPage() {
  return <DuaCategoryRoute />;
}
