const express = require("express");
const categoryRules = require("../repositories/categoryRules");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await categoryRules.list());
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { matchMerchant, categoryId } = req.body;
    if (!matchMerchant || !categoryId) {
      return res.status(400).json({ error: "matchMerchant and categoryId are required" });
    }
    res.status(201).json(await categoryRules.create({ matchMerchant, categoryId }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
