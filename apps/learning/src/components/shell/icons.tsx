import type { ReactNode } from "react";

/**
 * Line icons in the website's icon style: 24px grid, 1.8 stroke, round caps
 * and joins, `currentColor`. Replaces the emoji the sidebar/header used
 * before — the site never uses emoji for UI.
 */
const PATHS: Record<string, ReactNode> = {
  home: <path d="M4 11l8-7 8 7M6 10v9h12v-9M10 19v-5h4v5" />,
  students: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M16 5.2a3 3 0 010 5.6M17.5 14.3c1.9.5 3 2.3 3.4 4.7" />
    </>
  ),
  classes: (
    <>
      <path d="M4 5.5A1.5 1.5 0 015.5 4H19v13H5.5A1.5 1.5 0 004 18.5z" />
      <path d="M4 18.5A1.5 1.5 0 005.5 20H19v-3" />
    </>
  ),
  lessons: <path d="M12 6.5C10.3 5.2 8 4.8 4 5v13c4-.2 6.3.2 8 1.5 1.7-1.3 4-1.7 8-1.5V5c-4-.2-6.3.2-8 1.5zM12 6.5v13" />,
  file: (
    <>
      <path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z" />
      <path d="M14 3.5V8h4M9.5 13h5M9.5 16h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.2" />
    </>
  ),
  chart: <path d="M4 19.5h16M7 16v-4M12 16V7M17 16v-6" />,
  note: (
    <>
      <path d="M5 4.5h11l3 3V19.5H5z" />
      <path d="M8.5 10.5h7M8.5 14h7" />
    </>
  ),
  video: (
    <>
      <rect x="3.5" y="6.5" width="12" height="11" rx="2.5" />
      <path d="M15.5 10.5l5-3v9l-5-3z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" />
    </>
  ),
  shield: <path d="M12 3.5l7 2.5v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />,
  users: (
    <>
      <rect x="3.5" y="4" width="17" height="6" rx="1.8" />
      <rect x="3.5" y="14" width="17" height="6" rx="1.8" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  duas: <path d="M12 20s-7-4.3-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.7-7 10-7 10z" />,
  quran: (
    <>
      <path d="M12 6.5C10.3 5.2 8 4.8 4 5v13c4-.2 6.3.2 8 1.5 1.7-1.3 4-1.7 8-1.5V5c-4-.2-6.3.2-8 1.5zM12 6.5v13" />
      <path d="M12 9.2l.8 1.3 1.5-.3-.3 1.5 1.3.8-1.3.8.3 1.5-1.5-.3-.8 1.3-.8-1.3-1.5.3.3-1.5-1.3-.8 1.3-.8-.3-1.5 1.5.3z" strokeWidth="1" />
    </>
  ),
  bell: <path d="M6 16.5V11a6 6 0 1112 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 004 0" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  external: <path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v4.5a1 1 0 01-1 1H5.5a1 1 0 01-1-1V8a1 1 0 011-1H10" />,
  logout: <path d="M10 4.5H6a1.5 1.5 0 00-1.5 1.5v12A1.5 1.5 0 006 19.5h4M15 8l4 4-4 4M19 12H9.5" />,
  tick: <path d="M4 12.5l5 5L20 6.5" />,
  mic: <path d="M12 4a2.8 2.8 0 00-2.8 2.8v4.4a2.8 2.8 0 005.6 0V6.8A2.8 2.8 0 0012 4zM6 11a6 6 0 0012 0M12 17v3" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
