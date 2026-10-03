-- IqraSpace Duas — remotely-managed supplications content.
--
-- Hosted in the Learning app's Supabase project and managed from its admin area
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
-- No existing Learning table is touched. Workflow: draft -> review -> published (+ archived). admin/super_admin
-- users may move rows through draft/review and publish, archive, edit published rows or delete
-- (enforced in triggers/RLS, not just the UI).
--
-- Every change to duas / dua_categories / dua_category_map is written to
-- dua_audit_log with the full old and new row, so any edit is recoverable.

-- ---------------------------------------------------------------------------
-- Staff table + role helpers
-- ---------------------------------------------------------------------------
-- Who may manage Duas: Learning's existing platform roles. public.users.role is set only via
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

revoke all on function public.dua_role(), public.is_dua_staff(), public.is_dua_admin() from public, anon;
grant execute on function public.dua_role(), public.is_dua_staff(), public.is_dua_admin() to authenticated;

-- Arabic with diacritics, tatweel, Quranic marks, whitespace removed and alef/
-- yaa variants unified — used only to detect duplicate Duas, never displayed.
create function public.normalize_arabic(t text) returns text
language sql immutable as $$
  select regexp_replace(
    translate(coalesce(t, ''), 'أإآٱى', 'ااااي'),
    '[ً-ٰٟۖ-ۭـ\s،؛؟.,;:!"''()\[\]-]+', '', 'g')
$$;

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------
create table public.dua_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) > 0),
  name_ur text,
  name_te text,
  description text not null default '',
  description_ur text,
  description_te text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create table public.duas (
  id uuid primary key default gen_random_uuid(),
  -- Canonical, human-readable, immutable-by-convention identifier. Unique, so
  -- the same canonical Dua can never be inserted twice; a Dua that belongs in
  -- several places gets several dua_category_map rows instead.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) > 0),
  title_ur text,
  arabic text not null default '',
  arabic_normalized text generated always as (public.normalize_arabic(arabic)) stored,
  transliteration_latin text,
  transliteration_telugu text,
  -- Real Urdu-script transliteration. NULL => the app shows the Arabic text
  -- for the "Urdu" reading script (the legacy bundled data stored an exact
  -- copy of the Arabic here; that copy was not carried over).
  transliteration_urdu text,
  translation_en text,
  translation_ur text,
  description text,
  repeat_count int check (repeat_count is null or repeat_count between 1 and 1000),
  source_type text not null default 'hadith' check (source_type in ('quran', 'hadith', 'mixed', 'other')),
  source_collection text,
  -- Human-readable reference exactly as displayed (e.g. 'Bukhari, Muslim').
  source_reference text,
  hadith_number text,
  hadith_grade text,
  -- [{"surah":2,"ayah_from":255,"ayah_to":255}, ...] for Qur'anic content.
  quran_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(quran_refs) = 'array'),
  audio_url text check (audio_url is null or audio_url ~ '^https://'),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  verification_status text not null default 'unchecked'
    check (verification_status in ('verified', 'unchecked', 'needs_review')),
  review_notes text,
  origin text not null default 'iqs'
    check (origin in ('iqs', 'wyn_public_pdf', 'wyn_revised_edition', 'independent')),
  wyn_ids text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  -- Arabic is mandatory for anything a human has put up for review or that
  -- users can see; only drafts (e.g. stubs awaiting verified text) and
  -- archived rows may be empty.
  constraint duas_arabic_required check (status in ('draft', 'archived') or length(btrim(arabic)) > 0),
  -- A non-empty Arabic field must actually be Arabic script, so a translation
  -- can never silently take its place.
  constraint duas_arabic_is_arabic check (arabic = '' or arabic ~ '[؀-ۿ]'),
  constraint duas_published_needs_translation check (status <> 'published' or length(btrim(coalesce(translation_en, ''))) > 0)
);
create index duas_status_idx on public.duas (status);
create index duas_arabic_normalized_idx on public.duas (arabic_normalized);
create index duas_source_reference_idx on public.duas (source_reference);

create table public.dua_category_map (
  dua_id uuid not null references public.duas (id) on delete cascade,
  category_id uuid not null references public.dua_categories (id) on delete restrict,
  sort_order int not null default 0,
  -- Optional per-category overrides: the same canonical Dua can carry a
  -- different occasion heading / note / repeat count in each category it
  -- appears in, without duplicating the Dua itself.
  context_title text,
  context_title_ur text,
  context_note text,
  -- Reference as displayed in this category (e.g. the hadith that gives the
  -- virtue for this occasion), when it differs from the Dua's own.
  context_reference text,
  context_repeat_count int check (context_repeat_count is null or context_repeat_count between 1 and 1000),
  updated_at timestamptz not null default now(),
  primary key (dua_id, category_id)
);
create index dua_category_map_category_idx on public.dua_category_map (category_id, sort_order);

create table public.dua_audit_log (
  id bigint generated always as identity primary key,
  entity text not null check (entity in ('dua', 'category', 'mapping')),
  entity_id text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[] not null default '{}',
  changed_by uuid,
  changed_at timestamptz not null default now()
);
create index dua_audit_log_entity_idx on public.dua_audit_log (entity, entity_id, changed_at desc);
create index dua_audit_log_changed_at_idx on public.dua_audit_log (changed_at desc);

-- ---------------------------------------------------------------------------
-- Triggers: stamping, role-gated workflow, audit trail
-- ---------------------------------------------------------------------------
-- auth.uid() is NULL for the dashboard/SQL editor/service role (trusted
-- operator paths). Anonymous API callers also have a NULL uid but are stopped
-- earlier by RLS/privileges and never reach these triggers.
create function public.duas_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  is_admin boolean := uid is null or public.is_dua_admin();
begin
  new.updated_at := now();
  new.updated_by := uid;
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, uid);
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.published_at := old.published_at;
  end if;

  if not is_admin then
    if new.status not in ('draft', 'review') then
      raise exception 'Only an admin can publish or archive a Dua' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.status not in ('draft', 'review') then
      raise exception 'Only an admin can edit a published or archived Dua' using errcode = '42501';
    end if;
  end if;

  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger duas_before_write before insert or update on public.duas
  for each row execute function public.duas_before_write();

create function public.dua_categories_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger dua_categories_before_write before insert or update on public.dua_categories
  for each row execute function public.dua_categories_before_write();

-- Editors may (re)assign categories only for Duas that are not live yet.
create function public.dua_category_map_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_dua uuid := coalesce(new.dua_id, old.dua_id);
  target_status text;
begin
  if tg_op <> 'DELETE' then
    new.updated_at := now();
  end if;
  if auth.uid() is not null and not public.is_dua_admin() then
    select status into target_status from public.duas where id = target_dua;
    if target_status is not null and target_status not in ('draft', 'review') then
      raise exception 'Only an admin can change the categories of a published or archived Dua' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger dua_category_map_before_write before insert or update or delete on public.dua_category_map
  for each row execute function public.dua_category_map_before_write();

create function public.dua_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ent text;
  eid text;
  old_j jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_j jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  changed text[] := '{}';
begin
  if tg_table_name = 'duas' then
    ent := 'dua'; eid := coalesce(new_j, old_j) ->> 'id';
  elsif tg_table_name = 'dua_categories' then
    ent := 'category'; eid := coalesce(new_j, old_j) ->> 'id';
  else
    ent := 'mapping';
    eid := (coalesce(new_j, old_j) ->> 'dua_id') || ':' || (coalesce(new_j, old_j) ->> 'category_id');
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(n.key order by n.key), '{}') into changed
    from jsonb_each(new_j) n
    where n.value is distinct from old_j -> n.key
      and n.key not in ('updated_at', 'updated_by', 'arabic_normalized');
    if cardinality(changed) = 0 then
      return new;  -- nothing but bookkeeping columns changed
    end if;
  end if;

  insert into public.dua_audit_log (entity, entity_id, action, old_data, new_data, changed_fields, changed_by)
  values (ent, eid, lower(tg_op), old_j, new_j, changed, auth.uid());
  return coalesce(new, old);
end $$;
create trigger duas_audit after insert or update or delete on public.duas
  for each row execute function public.dua_audit();
create trigger dua_categories_audit after insert or update or delete on public.dua_categories
  for each row execute function public.dua_audit();
create trigger dua_category_map_audit after insert or update or delete on public.dua_category_map
  for each row execute function public.dua_audit();

-- ---------------------------------------------------------------------------
-- Privileges + Row Level Security
-- ---------------------------------------------------------------------------
revoke all on public.duas, public.dua_categories,
              public.dua_category_map, public.dua_audit_log from anon, authenticated;
grant select, insert, update, delete on public.duas, public.dua_categories, public.dua_category_map to authenticated;
grant select on public.dua_audit_log to authenticated;

alter table public.duas enable row level security;
alter table public.dua_categories enable row level security;
alter table public.dua_category_map enable row level security;
alter table public.dua_audit_log enable row level security;

create policy duas_staff_select on public.duas for select to authenticated using (public.is_dua_staff());
create policy duas_staff_insert on public.duas for insert to authenticated with check (public.is_dua_staff());
create policy duas_staff_update on public.duas for update to authenticated
  using (public.is_dua_staff()) with check (public.is_dua_staff());
create policy duas_admin_delete on public.duas for delete to authenticated using (public.is_dua_admin());

create policy dua_categories_staff_select on public.dua_categories for select to authenticated
  using (public.is_dua_staff());
create policy dua_categories_admin_insert on public.dua_categories for insert to authenticated
  with check (public.is_dua_admin());
create policy dua_categories_admin_update on public.dua_categories for update to authenticated
  using (public.is_dua_admin()) with check (public.is_dua_admin());
create policy dua_categories_admin_delete on public.dua_categories for delete to authenticated
  using (public.is_dua_admin());

create policy dua_category_map_staff_select on public.dua_category_map for select to authenticated
  using (public.is_dua_staff());
create policy dua_category_map_staff_insert on public.dua_category_map for insert to authenticated
  with check (public.is_dua_staff());
create policy dua_category_map_staff_update on public.dua_category_map for update to authenticated
  using (public.is_dua_staff()) with check (public.is_dua_staff());
create policy dua_category_map_staff_delete on public.dua_category_map for delete to authenticated
  using (public.is_dua_staff());

create policy dua_audit_log_staff_select on public.dua_audit_log for select to authenticated
  using (public.is_dua_staff());
-- No insert/update/delete policy on dua_audit_log: it is written only by the
-- SECURITY DEFINER audit trigger and is therefore append-only for everyone.

-- ---------------------------------------------------------------------------
-- Public read API (what the mobile app calls with the anon key)
-- ---------------------------------------------------------------------------
-- Changes whenever any published Dua, active category, or mapping to a
-- published Dua is added/edited/removed — a cheap freshness check so the app
-- need not download the full snapshot on every launch.
create function public.dua_content_version() returns text
language sql stable security definer set search_path = public as $$
  select md5(coalesce(string_agg(x, '|' order by x), '')) from (
    select 'd:' || d.id || ':' || d.updated_at as x
      from public.duas d where d.status = 'published'
    union all
    select 'c:' || c.id || ':' || c.updated_at
      from public.dua_categories c where c.is_active
    union all
    select 'm:' || m.dua_id || ':' || m.category_id || ':' || m.updated_at
      from public.dua_category_map m
      join public.duas d on d.id = m.dua_id and d.status = 'published'
      join public.dua_categories c on c.id = m.category_id and c.is_active
  ) t
$$;

-- One consistent snapshot of everything users may see. Categories with no
-- published Duas are omitted so an empty category never reaches the app.
create function public.get_dua_content() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'version', public.dua_content_version(),
    'generated_at', now(),
    'categories', coalesce(jsonb_agg(cat.obj order by cat.sort_order, cat.slug), '[]'::jsonb)
  )
  from (
    select c.slug, c.sort_order,
      jsonb_build_object(
        'slug', c.slug,
        'name', c.name,
        'name_ur', c.name_ur,
        'name_te', c.name_te,
        'description', c.description,
        'description_ur', c.description_ur,
        'description_te', c.description_te,
        'sort_order', c.sort_order,
        'duas', (
          select jsonb_agg(
            jsonb_build_object(
              'slug', d.slug,
              'title', coalesce(m.context_title, d.title),
              'title_ur', case when m.context_title is not null then m.context_title_ur else d.title_ur end,
              'arabic', d.arabic,
              'transliteration_latin', d.transliteration_latin,
              'transliteration_telugu', d.transliteration_telugu,
              'transliteration_urdu', d.transliteration_urdu,
              'translation_en', d.translation_en,
              'translation_ur', d.translation_ur,
              'description', coalesce(m.context_note, d.description),
              'repeat_count', coalesce(m.context_repeat_count, d.repeat_count),
              'source_type', d.source_type,
              'source_collection', d.source_collection,
              'reference', coalesce(m.context_reference, d.source_reference),
              'hadith_number', d.hadith_number,
              'hadith_grade', d.hadith_grade,
              'quran_refs', d.quran_refs,
              'audio_url', d.audio_url,
              'sort_order', m.sort_order
            ) order by m.sort_order, d.sort_order, d.slug)
          from public.dua_category_map m
          join public.duas d on d.id = m.dua_id and d.status = 'published'
          where m.category_id = c.id
        )
      ) as obj
    from public.dua_categories c
    where c.is_active
      and exists (
        select 1 from public.dua_category_map m
        join public.duas d on d.id = m.dua_id and d.status = 'published'
        where m.category_id = c.id)
  ) cat
$$;

revoke all on function public.dua_content_version(), public.get_dua_content() from public;
grant execute on function public.dua_content_version(), public.get_dua_content() to anon, authenticated;
