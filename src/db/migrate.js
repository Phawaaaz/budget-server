require("dotenv").config();

const fs = require("fs");
const path = require("path");
const connection = require("../config/database");

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  try {
    await connection.query(schema);
    console.log("✅ Migration applied");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

migrate();
