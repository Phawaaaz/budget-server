require("dotenv").config();

const app = require("./src/app");
const connection = require("./src/config/database");

const port = process.env.PORT || 3000;
let server;

async function startServer() {
  try {
    await connection.query("SELECT NOW()");
    console.log("✅ Database connected successfully");

    server = app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    process.exit(1);
  }
}

async function stopServer() {
  try {
    if (server) server.close();
    await connection.end();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error closing database connection");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", stopServer);
process.on("SIGTERM", stopServer);

startServer();
