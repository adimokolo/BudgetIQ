-- Migration: adds email verification (OTP) and forgot-password support
-- to a database that was created before this feature existed.
-- Safe to run on a fresh database too (schema.sql already includes all of this).
--
-- Run with: psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f migrations/001_add_auth_verification.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS otp_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(64) NOT NULL,
    purpose     VARCHAR(30) NOT NULL DEFAULT 'email_verification',
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user ON otp_codes (user_id, purpose);

CREATE TABLE IF NOT EXISTS password_resets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets (user_id);

-- Mark any pre-existing test users (created before verification existed) as
-- already verified, so they aren't suddenly locked out.
UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;
