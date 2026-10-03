"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabaseClient";
import { isAdminRole } from "@/lib/roles";
import { PLATFORM } from "@/lib/platformLinks";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ADMIN_NAV_ITEMS, NAV_ITEMS, pageMetaFor } from "./navConfig";

/**
 * Signed-in layout: the shared IqraSpace header on top, a light workspace
 * sidebar on desktop (its links move into the header's sheet on phones), and
 * a website-style page heading — eyebrow, display-serif title, lead line —
 * above each screen's own content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  // Admin/super_admin get a separate, smaller nav — see navConfig.ts.
  const navItems = isAdminRole(profile?.role) ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const meta = pageMetaFor(pathname);
  // The live teaching screen needs every pixel of height — no page heading there.
  const showHeading = !pathname.startsWith("/teach");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar navItems={navItems} onLogout={handleLogout} />
      <div className="flex min-w-0 flex-1">
        <Sidebar navItems={navItems} onLogout={handleLogout} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
            {showHeading && (
              <div className="mb-8 border-b border-line pb-6">
                <p className="mb-3 flex items-center gap-2.5 text-[13px] font-semibold uppercase leading-none tracking-[0.12em] text-accent-deep">
                  <span className="h-px w-6 bg-accent" />
                  {meta.eyebrow}
                </p>
                <h1 className="mb-0 text-[29px] leading-[1.15] sm:text-[34px] lg:text-[40px]">{meta.title}</h1>
                {meta.subtitle && <p className="mt-2 max-w-[60ch] text-base text-ink-soft sm:text-lg">{meta.subtitle}</p>}
              </div>
            )}
            {children}
          </main>
          <footer className="border-t border-line px-5 py-5 text-sm text-ink-soft sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <span>© 2026 IqraSpace. Free, ad-free, always.</span>
              <nav aria-label="Legal" className="flex gap-5">
                <a href={PLATFORM.privacy} className="hover:text-heading hover:underline">
                  Privacy Policy
                </a>
                <a href={PLATFORM.terms} className="hover:text-heading hover:underline">
                  Terms of Use
                </a>
                <a href={PLATFORM.contact} className="hover:text-heading hover:underline">
                  Contact
                </a>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
