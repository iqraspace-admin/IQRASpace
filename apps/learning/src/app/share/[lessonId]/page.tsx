import { ShareRoute } from "@/components/RouteEntry";

// Static export: one placeholder shell (out/share/_), served by the Worker for
// every real /share/<id> URL. The real id is read client-side from the URL.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lessonId: "_" }];
}

// Student sharing view (architecture §18). Deliberately outside the (app)
// route group's sidebar/topbar shell.
export default function ShareLessonPage() {
  return <ShareRoute />;
}
