const crypto = require("crypto");
const connection = require("../config/database");

function serialize(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    openingBalance: Number(row.opening_balance),
    color: row.color,
  };
}

async function list() {
  const { rows } = await connection.query("SELECT * FROM accounts ORDER BY created_at ASC");
  return rows.map(serialize);
}

async function get(id) {
  const { rows } = await connection.query("SELECT * FROM accounts WHERE id = $1", [id]);
  return rows[0] ? serialize(rows[0]) : null;
}

async function create({ name, kind, openingBalance, color }) {
  const id = crypto.randomUUID();
  const { rows } = await connection.query(
    "INSERT INTO accounts (id, name, kind, opening_balance, color) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [id, name, kind ?? "", openingBalance ?? 0, color ?? "#358760"]
  );
  return serialize(rows[0]);
}

async function update(id, fields) {
  const { rows } = await connection.query(
    `UPDATE accounts SET
       name = COALESCE($2, name),
       kind = COALESCE($3, kind),
       opening_balance = COALESCE($4, opening_balance),
       color = COALESCE($5, color)
     WHERE id = $1 RETURNING *`,
    [id, fields.name, fields.kind, fields.openingBalance, fields.color]
  );
  return rows[0] ? serialize(rows[0]) : null;
}

async function remove(id) {
  const { rowCount } = await connection.query("DELETE FROM accounts WHERE id = $1", [id]);
  return rowCount > 0;
}

async function balance(id) {
  const { rows } = await connection.query(
    `SELECT a.opening_balance,
       COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.amount ELSE -t.amount END), 0) AS net
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.id = $1
     GROUP BY a.opening_balance`,
    [id]
  );
  if (!rows[0]) return null;
  return Number(rows[0].opening_balance) + Number(rows[0].net);
}

module.exports = { list, get, create, update, remove, balance };
