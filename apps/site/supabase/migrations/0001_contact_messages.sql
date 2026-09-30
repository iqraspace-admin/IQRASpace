-- IqraSpace Site — contact form message storage.
--
-- One row per /contact submission (name, email, subject, message).
-- Written only by api/contact.js using the service_role key (never the
-- anon/public key) after server-side validation and a lightweight
-- spam check — there is deliberately no anon/authenticated RLS policy
-- below, so the public Supabase API (the anon key, which is the only
-- key ever shipped to the browser) cannot read or write this table at
-- all. The only ways in are: this project's service_role key (held
-- only in the Vercel serverless function's environment) and the
-- Supabase dashboard (Table Editor), signed in as the project owner —
-- the dashboard is, deliberately, the entire "admin area" for this
-- feature (see apps/site/ADMIN.md).
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);
create index idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index idx_contact_messages_status on public.contact_messages(status);

alter table public.contact_messages enable row level security;
-- No policies created on purpose (see comment above) — RLS with zero
-- policies denies all access through the public API by default.
