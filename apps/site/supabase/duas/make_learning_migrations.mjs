// Generates the Learning-DB flavour of the Duas migrations into the repo-root supabase/migrations
// (the Learning project's migration history, which already uses 0001..0024):
//   0025_duas_schema.sql  (schema, RLS, triggers, RPCs; admin = public.users.role admin/super_admin)
//   0026_duas_seed.sql    (the generated seed)
// Source of truth: ../migrations/0002_duas_schema.sql (+ 0003 seed). Run after build_canonical.mjs:
//   node make_learning_migrations.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { here, repoRoot } from './lib.mjs';

let s = readFileSync(join(here, 'sql', '0002_duas_schema.sql'), 'utf8');

const start = s.indexOf('create table public.dua_admins');
const end = s.indexOf('revoke all on function public.dua_role()');
if (start < 0 || end < 0) throw new Error('staff block markers not found');

const staff = `-- Who may manage Duas: Learning's existing platform roles. public.users.role is set only via
-- set_user_role() (super_admin) or the service-role seed script (see 0017), so a signed-in
-- student/tutor/guardian can never grant themselves this. No separate staff table, no editor tier.
create function public.dua_role() returns text
language sql stable security definer set search_path = public as $$
  select case when u.role in ('admin', 'super_admin') then 'admin' end
  from public.users u where u.id = auth.uid()
$$;

create function public.is_dua_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin'))
$$;

-- Kept so the policies/triggers read the same as the standalone version; with a single tier,
-- staff == admin.
create function public.is_dua_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_dua_admin()
$$;

`;
s = s.slice(0, start) + staff + s.slice(end);
s = s.replace(
  "revoke all on public.dua_admins, public.duas, public.dua_categories,\n              public.dua_category_map, public.dua_audit_log from anon, authenticated;\ngrant select on public.dua_admins to authenticated;\n",
  'revoke all on public.duas, public.dua_categories,\n              public.dua_category_map, public.dua_audit_log from anon, authenticated;\n',
);
s = s.replace(/-- Hosted in apps\/site's Supabase project[\s\S]*?-- Workflow:/, `-- Hosted in the Learning app's Supabase project and managed from its admin area
-- (/learning/admin/duas). Three audiences, three access paths:
--
--   * Mobile app / public  -> ONLY the two RPCs at the bottom
--                             (get_dua_content, dua_content_version), which
--                             return published content. The anon role has NO
--                             direct table privileges at all.
--   * Learning admin UI    -> a signed-in Learning user whose public.users.role is
--                             'admin' or 'super_admin'. RLS checks that role on every
--                             table; the browser only ever holds the anon key + that user's
--                             session. Student/tutor/guardian accounts are rejected.
--                             The service_role key is never used by the admin UI.
--   * Dashboard / SQL      -> project owner (seeding, emergencies).
--
-- No existing Learning table is touched. Workflow:`);
s = s.replace(
  "'editor' staff may\n-- create/edit draft and review rows; only 'admin' staff may publish, archive,\n-- edit already-published rows, or delete (enforced in triggers, not just UI).",
  "admin/super_admin\n-- users may move rows through draft/review and publish, archive, edit published rows or delete\n-- (enforced in triggers/RLS, not just the UI).",
);
if (/dua_admins/.test(s.replace(/--.*$/gm, ''))) throw new Error('dua_admins still referenced');
writeFileSync(join(repoRoot, 'supabase', 'migrations', '0025_duas_schema.sql'), s);

const seed = readFileSync(join(here, 'sql', '0003_duas_seed.sql'), 'utf8');
writeFileSync(join(repoRoot, 'supabase', 'migrations', '0026_duas_seed.sql'), seed);
console.log('wrote supabase/migrations/0025_duas_schema.sql and 0026_duas_seed.sql');
