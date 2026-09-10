const crypto = require("crypto");
const connection = require("../config/database");

function serialize(row) {
  return { id: row.id, pattern: row.pattern, accountId: row.account_id };
}

async function list() {
  const { rows } = await connection.query("SELECT * FROM account_senders ORDER BY created_at ASC");
  return rows.map(serialize);
}

async function create({ pattern, accountId }) {
  const id = crypto.randomUUID();
  const { rows } = await connection.query(
    "INSERT INTO account_senders (id, pattern, account_id) VALUES ($1, $2, $3) RETURNING *",
    [id, pattern.toLowerCase(), accountId]
  );
  return serialize(rows[0]);
}

async function findAccountForSender(fromAddress) {
  const rows = await list();
  const lower = fromAddress.toLowerCase();
  const match = rows.find((row) => lower.includes(row.pattern));
  return match ? match.accountId : null;
}

module.exports = { list, create, findAccountForSender };
