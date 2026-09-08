-- BudgetIQ bank synchronization (Mono)

CREATE TABLE IF NOT EXISTS mono_webhook_events (
    event_id VARCHAR(180) PRIMARY KEY,
    event_name VARCHAR(120) NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(40) NOT NULL DEFAULT 'mono',
    mono_account_id VARCHAR(120) UNIQUE,
    link_ref VARCHAR(120) UNIQUE NOT NULL,
    account_name VARCHAR(160),
    account_number_masked VARCHAR(30),
    bank_name VARCHAR(120),
    bank_code VARCHAR(20),
    account_type VARCHAR(80),
    currency VARCHAR(8) DEFAULT 'NGN',
    balance NUMERIC(18,2),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    data_status VARCHAR(30),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_ref ON bank_accounts(link_ref);

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'manual';

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS external_id VARCHAR(160);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_external_source
    ON transactions(user_id, source, external_id)
    WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_account
    ON transactions(account_id);

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
