const express = require("express");
const transactions = require("../repositories/transactions");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { month, accountId } = req.query;
    res.json(await transactions.list({ month, accountId }));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { accountId, categoryId, merchant, amount, type, date, note, reviewed, source } = req.body;
    if (!accountId || !categoryId || !merchant || !amount || !type || !date) {
      return res
        .status(400)
        .json({ error: "accountId, categoryId, merchant, amount, type, and date are required" });
    }
    const created = await transactions.create({
      accountId,
      categoryId,
      merchant,
      amount,
      type,
      date,
      note,
      reviewed,
      source,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updated = await transactions.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Transaction not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await transactions.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: "Transaction not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
