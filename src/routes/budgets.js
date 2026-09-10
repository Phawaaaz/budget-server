const express = require("express");
const budgets = require("../repositories/budgets");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await budgets.list({ month: req.query.month }));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { categoryId, limit, month } = req.body;
    if (!categoryId || !limit || !month) {
      return res.status(400).json({ error: "categoryId, limit, and month are required" });
    }
    res.status(201).json(await budgets.create({ categoryId, limit, month }));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "This category already has a budget for that month" });
    }
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updated = await budgets.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Budget not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await budgets.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: "Budget not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
