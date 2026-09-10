const crypto = require("crypto");
const connection = require("../config/database");

function serialize(row) {
  return { id: row.id, name: row.name, color: row.color };
}

async function list() {
  const { rows } = await connection.query("SELECT * FROM categories ORDER BY created_at ASC");
  return rows.map(serialize);
}

async function create({ name, color }) {
  const id = crypto.randomUUID();
  const { rows } = await connection.query(
    "INSERT INTO categories (id, name, color) VALUES ($1, $2, $3) RETURNING *",
    [id, name, color ?? "#92958f"]
  );
  return serialize(rows[0]);
}

module.exports = { list, create };
