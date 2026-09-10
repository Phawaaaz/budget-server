const express = require("express");

const { attachUser } = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const accountsRouter = require("./routes/accounts");
const categoriesRouter = require("./routes/categories");
const transactionsRouter = require("./routes/transactions");
const budgetsRouter = require("./routes/budgets");
const syncRouter = require("./routes/sync");
const rulesRouter = require("./routes/rules");
const accountSendersRouter = require("./routes/accountSenders");

const app = express();

app.use(express.json());
app.use(attachUser);

app.get("/", (req, res) => {
  res.json("welcome to the budget server");
});

app.use("/api/accounts", accountsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/sync", syncRouter);
app.use("/api/rules", rulesRouter);
app.use("/api/account-senders", accountSendersRouter);

app.use(errorHandler);

module.exports = app;
