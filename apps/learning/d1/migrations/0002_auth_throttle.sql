-- Login / signup throttling (worker/api/throttle.js): fixed-window counters
-- keyed by e.g. "login-user:<username>", "login-ip:<ip>", "signup-ip:<ip>".
CREATE TABLE auth_throttle (
  key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);
