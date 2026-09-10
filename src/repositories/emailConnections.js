const crypto = require("crypto");
const connection = require("../config/database");

function serialize(row) {
  return {
    id: row.id,
    provider: row.provider,
    emailAddress: row.email_address,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    defaultAccountId: row.default_account_id,
    lastSyncedAt: row.last_synced_at,
    connectedAt: row.connected_at,
  };
}

async function getActive() {
  const { rows } = await connection.query(
    "SELECT * FROM email_connections ORDER BY connected_at DESC LIMIT 1"
  );
  return rows[0] ? serialize(rows[0]) : null;
}

async function upsert({ provider, emailAddress, accessToken, refreshToken, tokenExpiresAt, defaultAccountId }) {
  const existing = await getActive();
  if (existing && existing.provider === provider && existing.emailAddress === emailAddress) {
    const { rows } = await connection.query(
      `UPDATE email_connections SET
         access_token = $2,
         refresh_token = COALESCE($3, refresh_token),
         token_expires_at = $4,
         default_account_id = COALESCE($5, default_account_id)
       WHERE id = $1 RETURNING *`,
      [existing.id, accessToken, refreshToken ?? null, tokenExpiresAt ?? null, defaultAccountId ?? null]
    );
    return serialize(rows[0]);
  }
  const id = crypto.randomUUID();
  const { rows } = await connection.query(
    `INSERT INTO email_connections
       (id, provider, email_address, access_token, refresh_token, token_expires_at, default_account_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, provider, emailAddress, accessToken, refreshToken ?? null, tokenExpiresAt ?? null, defaultAccountId ?? null]
  );
  return serialize(rows[0]);
}

async function markSynced(id, when = new Date()) {
  await connection.query("UPDATE email_connections SET last_synced_at = $2 WHERE id = $1", [id, when]);
}

module.exports = { getActive, upsert, markSynced };
