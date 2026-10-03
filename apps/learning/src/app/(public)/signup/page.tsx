"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Role } from "@/lib/types";
import { buildAuthEmail, friendlyAuthError } from "@/lib/username";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

// Guardian is a Phase 2 fast-follow (architecture §4/§17) — not offered here yet.
const ROLES: { value: Extract<Role, "tutor" | "student">; label: string }[] = [
  { value: "tutor", label: "Tutor" },
  { value: "student", label: "Student" },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // username/full_name/role/contact_email land in auth.users.raw_user_meta_data
    // and are split apart by the handle_new_user trigger
    // (0002_auth_signup_trigger.sql, rewritten by 0019_username_auth.sql) into
    // public.users.username/full_name/role/email (+ tutors/students row).
    // Email is optional — signUp still needs *an* email-shaped identifier for
    // Supabase Auth itself, so a synthetic one is used when none is given.
    const { error } = await supabase.auth.signUp({
      email: buildAuthEmail(username, email),
      password,
      options: { data: { username, full_name: fullName, role, contact_email: email || null } },
    });
    setSubmitting(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main id="main" className="pattern-geo flex flex-1 flex-col justify-center px-5 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-[460px] rounded-[var(--radius-l)] border border-line bg-surface p-6 shadow-[var(--shadow-m)] sm:rounded-[var(--radius-xl)] sm:p-10">
        <h1 className="mb-1 text-[29px] leading-[1.15] sm:text-[34px]">Create your account</h1>
        <p className="mb-0 text-base text-ink-soft">Join as a tutor or a student.</p>
        <form onSubmit={handleSubmit} className="mt-6">
          <Field label="I am a…">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Full name">
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Username" hint="What you'll log in with — no email needed.">
            <Input
              required
              pattern="[a-zA-Z0-9_.-]+"
              title="Letters, numbers, underscores, dots and hyphens only"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="Email (optional)">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p role="alert" className="mb-5 rounded-[var(--radius-m)] border border-danger/30 bg-danger-tint px-4 py-3 text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-6 text-[15px] text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-[3px] hover:text-primary-deep">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
