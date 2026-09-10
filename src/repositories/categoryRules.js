const crypto = require("crypto");
const connection = require("../config/database");

function serialize(row) {
  return { id: row.id, matchMerchant: row.match_merchant, categoryId: row.category_id };
}

async function list() {
  const { rows } = await connection.query("SELECT * FROM category_rules ORDER BY created_at ASC");
  return rows.map(serialize);
}

async function create({ matchMerchant, categoryId }) {
  const id = crypto.randomUUID();
  const { rows } = await connection.query(
    `INSERT INTO category_rules (id, match_merchant, category_id) VALUES ($1, $2, $3)
     ON CONFLICT (match_merchant) DO UPDATE SET category_id = EXCLUDED.category_id
     RETURNING *`,
    [id, matchMerchant.toLowerCase(), categoryId]
  );
  return serialize(rows[0]);
}

async function findCategoryForMerchant(merchant) {
  const rows = await list();
  const lower = merchant.toLowerCase();
  const match = rows.find((row) => lower.includes(row.matchMerchant));
  return match ? match.categoryId : null;
}

module.exports = { list, create, findCategoryForMerchant };
