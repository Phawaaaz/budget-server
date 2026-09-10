const express = require("express");
const categories = require("../repositories/categories");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await categories.list());
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    res.status(201).json(await categories.create({ name, color }));
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "A category with this name already exists" });
    next(err);
  }
});

module.exports = router;
