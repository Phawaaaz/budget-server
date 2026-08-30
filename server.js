require("dotenv").config();

const app = require("./src/app");
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function startServer() {
  try {
    await connection.query("SELECT NOW()");

    console.log("✅ Database connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    process.exit(1);
  }
}

startServer();
 
async function stopServer() {
  try {
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