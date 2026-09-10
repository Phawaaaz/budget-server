-- Core budgeting schema for budget-server.
-- Run with: npm run migrate

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT '',
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#358760',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#92958f',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  merchant TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  date DATE NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'Manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);
CREATE INDEX IF NOT EXISTS transactions_account_idx ON transactions (account_id);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions (category_id);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(14,2) NOT NULL CHECK (limit_amount > 0),
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, month)
);

-- Optional line-item breakdown for a transaction, once email receipts get
-- parsed in enough detail to split a single charge into multiple items.
CREATE TABLE IF NOT EXISTS receipt_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL
);

-- Not wired up yet -- placeholders for the future email-sync pipeline.
CREATE TABLE IF NOT EXISTS email_connections (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_rules (
  id TEXT PRIMARY KEY,
  match_merchant TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (id, name, color) VALUES
  ('food-groceries', 'Food & groceries', '#358760'),
  ('shopping', 'Shopping', '#ed896f'),
  ('transport', 'Transport', '#e7c449'),
  ('bills-subscriptions', 'Bills & subscriptions', '#aaa2ca'),
  ('lifestyle', 'Lifestyle', '#69aebc'),
  ('income', 'Income', '#358760'),
  ('other', 'Other', '#92958f')
ON CONFLICT (id) DO NOTHING;
