-- BudgetIQ Database Schema (PostgreSQL / Amazon RDS)
-- Run with: psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    currency      VARCHAR(8) DEFAULT 'NGN',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Categories (each user has their own set; a few seeded as defaults on signup)
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(80) NOT NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    color       VARCHAR(9) DEFAULT '#6C63FF',
    icon        VARCHAR(40) DEFAULT 'tag',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, name, type)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
    type         VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    description  VARCHAR(255),
    occurred_on  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);

-- Budgets (a monthly spending limit per category, or an overall limit when category_id is NULL)
CREATE TABLE IF NOT EXISTS budgets (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID REFERENCES categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(14,2) NOT NULL CHECK (monthly_limit > 0),
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, category_id)
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
