const express = require("express");

const app = express();

const db = require("./config/database");

app.use(express.json());

app.get("/", (req, res) => {
  res.json("welcome to the budget server");
});

module.exports = app;
