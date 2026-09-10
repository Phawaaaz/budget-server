const { google } = require("googleapis");
const { createOAuthClient, SCOPES } = require("../config/google");

function getAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES });
}

async function getTokensFromCode(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

function clientFromConnection(connectionRecord) {
  const client = createOAuthClient();
  client.setCredentials({
    access_token: connectionRecord.accessToken,
    refresh_token: connectionRecord.refreshToken,
    expiry_date: connectionRecord.tokenExpiresAt ? new Date(connectionRecord.tokenExpiresAt).getTime() : undefined,
  });
  return client;
}

async function getProfileEmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const { data } = await gmail.users.getProfile({ userId: "me" });
  return data.emailAddress;
}

async function listMessageIds(auth, { query, maxResults = 25 } = {}) {
  const gmail = google.gmail({ version: "v1", auth });
  const { data } = await gmail.users.messages.list({ userId: "me", q: query, maxResults });
  return (data.messages || []).map((message) => message.id);
}

async function getMessage(auth, id) {
  const gmail = google.gmail({ version: "v1", auth });
  const { data } = await gmail.users.messages.get({ userId: "me", id, format: "full" });
  return toPlainEmail(data);
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64").toString("utf8");
}

function extractPlainText(payload) {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return decodeBase64Url(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data).replace(/<[^>]+>/g, " ");
  }
  return "";
}

function header(headers, name) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function toPlainEmail(message) {
  const headers = message.payload?.headers ?? [];
  return {
    id: message.id,
    from: header(headers, "From"),
    subject: header(headers, "Subject"),
    date: header(headers, "Date"),
    text: extractPlainText(message.payload),
  };
}

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  clientFromConnection,
  getProfileEmail,
  listMessageIds,
  getMessage,
  extractPlainText,
  header,
  toPlainEmail,
};
