const express = require("express");
const gmailClient = require("../email/gmailClient");
const emailConnections = require("../repositories/emailConnections");
const emailSync = require("../services/emailSync");

const router = express.Router();

router.get("/status", async (req, res, next) => {
  try {
    const active = await emailConnections.getActive();
    res.json({
      connected: Boolean(active),
      provider: active?.provider ?? null,
      email: active?.emailAddress ?? null,
      lastSyncedAt: active?.lastSyncedAt ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// Entry point for the OAuth flow: redirects the browser to Google's
// consent screen. GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI must be configured.
router.get("/google/start", (req, res) => {
  res.redirect(gmailClient.getAuthUrl());
});

// Google redirects here with an authorization code after consent.
router.get("/google/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Missing authorization code" });

    const tokens = await gmailClient.getTokensFromCode(code);
    const auth = gmailClient.clientFromConnection({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
    const emailAddress = await gmailClient.getProfileEmail(auth);

    const connection = await emailConnections.upsert({
      provider: "gmail",
      emailAddress,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    res.json({ connected: true, email: connection.emailAddress });
  } catch (err) {
    next(err);
  }
});

// Triggers one sync pass on demand. There's no push/webhook yet, so this
// is the pipeline's entry point until a scheduled poller is added.
router.post("/run", async (req, res, next) => {
  try {
    const active = await emailConnections.getActive();
    if (!active) return res.status(400).json({ error: "No email account connected" });
    const result = await emailSync.syncConnection(active, gmailClient);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
