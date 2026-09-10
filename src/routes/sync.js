const express = require("express");

const router = express.Router();

// TODO(email-sync): connect an email provider (Gmail OAuth is the leading
// candidate per PRODUCT.md, but unconfirmed) and parse incoming financial
// emails into transactions, landing uncertain ones as unreviewed. Nothing
// is wired up yet -- these two endpoints are placeholders so the
// frontend's Inbox view has something real to call once this is built.

router.get("/status", (req, res) => {
  res.json({ connected: false, provider: null });
});

router.post("/connect", (req, res) => {
  res.status(501).json({ error: "Email sync is not implemented yet" });
});

module.exports = router;
