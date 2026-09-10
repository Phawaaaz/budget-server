// Integration test for the sync pipeline: real Postgres (schema applied
// fresh), fake Gmail client (no network/OAuth). Requires DATABASE_URL to
// point at a disposable test database -- see README/.env.example.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const hasDatabase = Boolean(process.env.DATABASE_URL);
const connection = hasDatabase ? require("../src/config/database") : null;
const emailConnections = hasDatabase ? require("../src/repositories/emailConnections") : null;
const accountSenders = hasDatabase ? require("../src/repositories/accountSenders") : null;
const categoryRules = hasDatabase ? require("../src/repositories/categoryRules") : null;
const accounts = hasDatabase ? require("../src/repositories/accounts") : null;
const emailSync = hasDatabase ? require("../src/services/emailSync") : null;

function fakeGmailClient(messagesById) {
  return {
    clientFromConnection: () => ({}),
    async listMessageIds() {
      return Object.keys(messagesById);
    },
    async getMessage(auth, id) {
      return messagesById[id];
    },
  };
}

before(async () => {
  if (!hasDatabase) return;
  const schema = fs.readFileSync(path.join(__dirname, "../src/db/schema.sql"), "utf8");
  await connection.query(schema);
  await connection.query(
    "TRUNCATE transactions, budgets, receipt_items, account_senders, category_rules, email_connections, accounts RESTART IDENTITY CASCADE"
  );
});

after(async () => {
  if (hasDatabase) await connection.end();
});

test("syncConnection parses, categorizes, maps to account, and dedups", { skip: !hasDatabase }, async () => {
  const account = await accounts.create({ name: "GTBank", kind: "Everyday", openingBalance: 0, color: "#000" });
  await accountSenders.create({ pattern: "paystack.com", accountId: account.id });
  await categoryRules.create({ matchMerchant: "paystack", categoryId: "income" });

  const conn = await emailConnections.upsert({
    provider: "gmail",
    emailAddress: "fawaz@example.com",
    accessToken: "fake-access-token",
    refreshToken: "fake-refresh-token",
    defaultAccountId: account.id,
  });

  const messages = {
    "msg-1": {
      id: "msg-1",
      from: "no-reply@paystack.com",
      subject: "Payout of ₦250,000.00 was successful",
      text: "Your payout of ₦250,000.00 has been sent to your bank account.",
      date: "2026-08-25T09:00:00Z",
    },
    "msg-2": {
      id: "msg-2",
      from: "newsletter@example.com",
      subject: "Nothing financial here",
      text: "Just a regular newsletter, no amounts.",
      date: "2026-08-26T09:00:00Z",
    },
  };

  const gmail = fakeGmailClient(messages);
  const first = await emailSync.syncConnection(conn, gmail);

  assert.equal(first.fetched, 2);
  assert.equal(first.created, 1);
  assert.equal(first.skipped, 1);

  const stored = await connection.query("SELECT * FROM transactions WHERE external_message_id = 'msg-1'");
  assert.equal(stored.rows.length, 1);
  assert.equal(stored.rows[0].account_id, account.id);
  assert.equal(stored.rows[0].category_id, "income");
  assert.equal(stored.rows[0].reviewed, false);
  assert.equal(stored.rows[0].source, "Email");
  assert.equal(Number(stored.rows[0].amount), 250000);

  // Re-running the same sync against the same message must not duplicate it.
  const second = await emailSync.syncConnection({ ...conn, lastSyncedAt: null }, gmail);
  assert.equal(second.created, 0);
  assert.equal(second.skipped, 2);

  const countAfter = await connection.query("SELECT COUNT(*)::int AS count FROM transactions");
  assert.equal(countAfter.rows[0].count, 1);
});

test("syncConnection skips messages with no sender mapping and no default account", { skip: !hasDatabase }, async () => {
  await connection.query("TRUNCATE transactions, account_senders, category_rules, email_connections RESTART IDENTITY CASCADE");

  const conn = await emailConnections.upsert({
    provider: "gmail",
    emailAddress: "fawaz@example.com",
    accessToken: "fake-access-token",
    refreshToken: "fake-refresh-token",
    defaultAccountId: null,
  });

  const gmail = fakeGmailClient({
    "msg-3": {
      id: "msg-3",
      from: "no-reply@paystack.com",
      subject: "Payment Received",
      text: "You received a payment of ₦10,000.",
      date: "2026-09-01T00:00:00Z",
    },
  });

  const result = await emailSync.syncConnection(conn, gmail);
  assert.equal(result.created, 0);
  assert.equal(result.skipped, 1);
});
