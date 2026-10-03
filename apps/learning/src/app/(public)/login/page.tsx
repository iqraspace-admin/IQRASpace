"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { landingPathForRole } from "@/lib/roles";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already have a valid session (e.g. reopening the app's link from Zoom,
  // still logged in from before) — skip the form entirely and go straight
  // to the dashboard instead of making the tutor log in again.
  useEffect(() => {
    if (!loading && session) router.replace(landingPathForRole(profile?.role));
  }, [loading, session, profile, router]);

  if (loading || session) {
    return <p className="p-8 text-sm text-muted">Loading…</p>;
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Username-based login (0019_username_auth.sql): resolve the username to
    // whatever email Supabase Auth actually has on file for that account
    // (real, or a synthetic one if none was given at signup) via a narrow,
    // anon-callable RPC that only ever returns that one technical value —
    // then sign in with it exactly like before. A generic "invalid" message
    // covers both "no such username" and "wrong password", same as any
    // normal login form, so this doesn't leak which usernames exist.
    const { data: authEmail, error: lookupError } = await supabase.rpc("get_auth_email_for_username", {
      p_username: username,
    });
    if (lookupError || !authEmail) {
      setSubmitting(false);
      setError("Invalid username or password.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) {
      setSubmitting(false);
      setError("Invalid username or password.");
      return;
    }

    // Role-based redirect (architecture §5 step "Tutor Login -> Dashboard").
    // Tutor/student/guardian land on /dashboard, which renders different
    // content per role internally. admin/super_admin (0017_admin_super_admin_
    // roles.sql) land on /admin instead, purely as a landing-page default —
    // every other route is fully reachable and functional for them too
    // (0018_admin_full_access.sql), so nothing else redirects them away.
    const { data: profileRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user!.id)
      .single();
    setSubmitting(false);
    router.push(landingPathForRole(profileRow?.role));
  }

  return (
    <main id="main" className="pattern-geo flex flex-1 flex-col justify-center px-5 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-[460px] rounded-[var(--radius-l)] border border-line bg-surface p-6 shadow-[var(--shadow-m)] sm:rounded-[var(--radius-xl)] sm:p-10">
        <h1 className="mb-1 text-[29px] leading-[1.15] sm:text-[34px]">Welcome back</h1>
        <p className="mb-0 text-base text-ink-soft">Log in to your teaching workspace.</p>
        <form onSubmit={handleSubmit} className="mt-6">
          <Field label="Username">
            <Input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p role="alert" className="mb-5 rounded-[var(--radius-m)] border border-danger/30 bg-danger-tint px-4 py-3 text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-6 text-[15px] text-ink-soft">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-primary underline underline-offset-[3px] hover:text-primary-deep">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
