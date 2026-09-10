const crypto = require("crypto");
const connection = require("../config/database");

const SELECT = `
  SELECT t.*, c.name AS category_name
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
`;

function serialize(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    category: row.category_name,
    merchant: row.merchant,
    note: row.note,
    amount: Number(row.amount),
    type: row.type,
    date: row.date.toISOString().slice(0, 10),
    reviewed: row.reviewed,
    source: row.source,
  };
}

async function list({ month, accountId } = {}) {
  const clauses = [];
  const params = [];
  if (month) {
    params.push(`${month}%`);
    clauses.push(`t.date::text LIKE $${params.length}`);
  }
  if (accountId && accountId !== "all") {
    params.push(accountId);
    clauses.push(`t.account_id = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await connection.query(
    `${SELECT} ${where} ORDER BY t.date DESC, t.created_at DESC`,
    params
  );
  return rows.map(serialize);
}

async function get(id) {
  const { rows } = await connection.query(`${SELECT} WHERE t.id = $1`, [id]);
  return rows[0] ? serialize(rows[0]) : null;
}

async function create({ accountId, categoryId, merchant, note, amount, type, date, reviewed, source }) {
  const id = crypto.randomUUID();
  await connection.query(
    `INSERT INTO transactions (id, account_id, category_id, merchant, note, amount, type, date, reviewed, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, accountId, categoryId, merchant, note ?? "", amount, type, date, reviewed ?? true, source ?? "Manual"]
  );
  return get(id);
}

async function update(id, fields) {
  const { rows } = await connection.query(
    `UPDATE transactions SET
       category_id = COALESCE($2, category_id),
       reviewed = COALESCE($3, reviewed),
       merchant = COALESCE($4, merchant),
       note = COALESCE($5, note)
     WHERE id = $1 RETURNING id`,
    [id, fields.categoryId, fields.reviewed, fields.merchant, fields.note]
  );
  return rows[0] ? get(id) : null;
}

async function remove(id) {
  const { rowCount } = await connection.query("DELETE FROM transactions WHERE id = $1", [id]);
  return rowCount > 0;
}

module.exports = { list, get, create, update, remove };
