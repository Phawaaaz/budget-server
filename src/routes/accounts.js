const express = require("express");
const accounts = require("../repositories/accounts");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const list = await accounts.list();
    const withBalances = await Promise.all(
      list.map(async (account) => ({ ...account, balance: await accounts.balance(account.id) }))
    );
    res.json(withBalances);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, kind, openingBalance, color } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const account = await accounts.create({ name, kind, openingBalance, color });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const account = await accounts.update(req.params.id, req.body);
    if (!account) return res.status(404).json({ error: "Account not found" });
    res.json(account);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await accounts.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: "Account not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
