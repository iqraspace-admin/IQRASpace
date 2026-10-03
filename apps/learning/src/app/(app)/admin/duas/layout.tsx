import type { ReactNode } from "react";
import { DuasShell } from "@/components/admin/duas/DuasShell";

// Every /admin/duas/* route inherits the (app) auth + shell, then this
// admin/super_admin-only gate and the Duas sub-navigation.
export default function DuasAdminLayout({ children }: { children: ReactNode }) {
  return <DuasShell>{children}</DuasShell>;
}
