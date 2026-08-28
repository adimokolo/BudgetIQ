-- Adds in-app notifications, starting with budget-exceeded alerts (the same
-- event that triggers the email alert also writes one of these).
-- Run with: psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f migrations/003_add_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(40) NOT NULL DEFAULT 'budget_exceeded',
    title      VARCHAR(160) NOT NULL,
    body       TEXT,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications (user_id, created_at DESC);
