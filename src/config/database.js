require("dotenv").config();

const { Pool } = require("pg");

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
});

connection.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

module.exports = connection;
