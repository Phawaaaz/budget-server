const crypto = require("crypto");
const connection = require("../config/database");

const SELECT = `
  SELECT b.*, c.name AS category_name
  FROM budgets b
  JOIN categories c ON c.id = b.category_id
`;

function serialize(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    category: row.category_name,
    limit: Number(row.limit_amount),
    month: row.month,
  };
}

async function list({ month } = {}) {
  const params = [];
  let where = "";
  if (month) {
    params.push(month);
    where = "WHERE b.month = $1";
  }
  const { rows } = await connection.query(`${SELECT} ${where} ORDER BY b.created_at ASC`, params);
  return rows.map(serialize);
}

async function get(id) {
  const { rows } = await connection.query(`${SELECT} WHERE b.id = $1`, [id]);
  return rows[0] ? serialize(rows[0]) : null;
}

async function create({ categoryId, limit, month }) {
  const id = crypto.randomUUID();
  await connection.query(
    "INSERT INTO budgets (id, category_id, limit_amount, month) VALUES ($1, $2, $3, $4)",
    [id, categoryId, limit, month]
  );
  return get(id);
}

async function update(id, { limit }) {
  const { rows } = await connection.query(
    "UPDATE budgets SET limit_amount = COALESCE($2, limit_amount) WHERE id = $1 RETURNING id",
    [id, limit]
  );
  return rows[0] ? get(id) : null;
}

async function remove(id) {
  const { rowCount } = await connection.query("DELETE FROM budgets WHERE id = $1", [id]);
  return rowCount > 0;
}

module.exports = { list, get, create, update, remove };
