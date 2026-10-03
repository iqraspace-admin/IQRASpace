"use client";

import { useAuth } from "@/lib/authContext";
import { LinkButton } from "@/components/ui/Button";
import { SiteHeader } from "./SiteHeader";

/** Header for the signed-out pages (landing, login, signup): the shared IqraSpace header plus auth entry points. */
export function PublicHeader() {
  const { session, loading } = useAuth();

  const auth = loading ? null : session ? (
    <LinkButton href="/dashboard" size="sm" variant="outline">
      Go to dashboard
    </LinkButton>
  ) : (
    <>
      <LinkButton href="/login" size="sm" variant="ghost">
        Log in
      </LinkButton>
      <LinkButton href="/signup" size="sm" variant="primary">
        Sign up
      </LinkButton>
    </>
  );

  return (
    <SiteHeader
      variant="public"
      actions={auth}
      sheetFooter={auth && <div className="flex flex-col gap-3 [&>a]:w-full">{auth}</div>}
    />
  );
}
