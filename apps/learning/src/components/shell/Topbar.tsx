"use client";

import { useAuth } from "@/lib/authContext";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClassName } from "@/components/ui/Button";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { SiteHeader } from "./SiteHeader";
import { Icon } from "./icons";
import type { NavItem } from "./navConfig";

/**
 * The signed-in workspace's top bar: the shared IqraSpace header plus the
 * workspace controls (notifications, theme, account) on the right.
 */
export function Topbar({ navItems, onLogout }: { navItems: NavItem[]; onLogout: () => void }) {
  const { profile } = useAuth();
  const name = profile?.full_name ?? "?";

  return (
    <SiteHeader
      variant="app"
      workspaceNav={navItems}
      actions={
        <>
          <NotificationBell />
          <ThemeToggle />
          <span title={name}>
            <Avatar name={name} size={40} />
          </span>
        </>
      }
      mobileActions={<NotificationBell />}
      sheetFooter={
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button type="button" onClick={onLogout} className={buttonClassName("outline", "md", "flex-1")}>
            <Icon name="logout" className="h-[18px] w-[18px]" />
            Log out{profile ? ` · ${name}` : ""}
          </button>
        </div>
      }
    />
  );
}
