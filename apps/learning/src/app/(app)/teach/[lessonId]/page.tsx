import { TeachRoute } from "@/components/RouteEntry";

// Static export: one placeholder shell (out/teach/_), served by the Worker for
// every real /teach/<id> URL. The real id is read client-side from the URL.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lessonId: "_" }];
}

// Tutor teaching screen (architecture §18 — 3-column layout). All the
// interactive/realtime work lives in TeachClient.
export default function TeachLessonPage() {
  return <TeachRoute />;
}
