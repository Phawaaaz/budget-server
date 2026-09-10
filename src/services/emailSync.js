const emailConnections = require("../repositories/emailConnections");
const accountSenders = require("../repositories/accountSenders");
const categoryRules = require("../repositories/categoryRules");
const transactions = require("../repositories/transactions");
const { parseEmail } = require("../email/parsers");

const DEFAULT_EXPENSE_CATEGORY_ID = "other";
const DEFAULT_INCOME_CATEGORY_ID = "income";
const FIRST_SYNC_QUERY = "newer_than:30d (paystack OR alert OR debit OR credit OR receipt)";

// Orchestrates one sync pass for a connected mailbox: list candidate
// messages, parse each into a transaction, resolve which account and
// category it belongs to, and insert it (skipping ones already imported).
// `gmailClient` is passed in rather than required directly so tests can
// substitute a fake one without touching real Gmail or OAuth.
async function syncConnection(connectionRecord, gmailClient) {
  const auth = gmailClient.clientFromConnection(connectionRecord);
  const query = connectionRecord.lastSyncedAt
    ? `after:${Math.floor(new Date(connectionRecord.lastSyncedAt).getTime() / 1000)}`
    : FIRST_SYNC_QUERY;

  const ids = await gmailClient.listMessageIds(auth, { query });
  const results = { fetched: ids.length, created: 0, skipped: 0 };

  for (const id of ids) {
    const email = await gmailClient.getMessage(auth, id);
    const parsed = parseEmail(email);
    if (!parsed) {
      results.skipped += 1;
      continue;
    }

    const accountId = (await accountSenders.findAccountForSender(email.from)) ?? connectionRecord.defaultAccountId;
    if (!accountId) {
      results.skipped += 1;
      continue;
    }

    const categoryId =
      (await categoryRules.findCategoryForMerchant(parsed.merchant)) ??
      (parsed.type === "in" ? DEFAULT_INCOME_CATEGORY_ID : DEFAULT_EXPENSE_CATEGORY_ID);

    const created = await transactions.createFromEmail({
      accountId,
      categoryId,
      merchant: parsed.merchant,
      note: parsed.note,
      amount: parsed.amount,
      type: parsed.type,
      date: parsed.date,
      externalMessageId: email.id,
    });

    if (created) results.created += 1;
    else results.skipped += 1;
  }

  await emailConnections.markSynced(connectionRecord.id);
  return results;
}

module.exports = { syncConnection };
