-- IqraSpace Site - contact form message storage (Cloudflare D1).
-- Replaces supabase/migrations/0001_contact_messages.sql (kept as history).
-- Written only by worker/index.js through the DB binding; there is no
-- public access path. Read it with `wrangler d1 execute` or the dashboard.
CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
