-- Adds profile picture support and per-budget alert tracking (so we email
-- a user once when they cross a limit, not on every transaction after).
-- Safe to run against a database that already has migration 001 applied.

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS last_alert_month VARCHAR(7);
-- Stored as 'YYYY-MM'. NULL means no alert has been sent yet this budget's lifetime.
