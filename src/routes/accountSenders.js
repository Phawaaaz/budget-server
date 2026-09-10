const express = require("express");
const accountSenders = require("../repositories/accountSenders");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await accountSenders.list());
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { pattern, accountId } = req.body;
    if (!pattern || !accountId) {
      return res.status(400).json({ error: "pattern and accountId are required" });
    }
    res.status(201).json(await accountSenders.create({ pattern, accountId }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
