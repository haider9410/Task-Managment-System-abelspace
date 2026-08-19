import app, { ensureDb } from "./app.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const { via } = await ensureDb();
    console.log(`Connected to database (${via})`);
    app.listen(PORT, () => {
      console.log(`AbleSpace API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();