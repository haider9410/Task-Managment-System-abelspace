import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import tasksRouter from "./routes/tasks.js";
import profilesRouter from "./routes/profiles.js";
import projectsRouter from "./routes/projects.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

let dbPromise = null;

export function ensureDb() {
  if (!dbPromise) {
    dbPromise = connectDb().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

app.use(async (_req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

app.get(["/", "/api"], (_req, res) => {
  res.json({
    message: "AbleSpace REST API is active and running",
    status: "ok",
    health: "/api/health",
    endpoints: {
      tasks: "/api/tasks",
      projects: "/api/projects",
      profile: "/api/profile",
    },
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await ensureDb();
    res.json({
      status: "ok",
      db: "mysql",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.use("/api/tasks", tasksRouter);
app.use("/api/profile", profilesRouter);
app.use("/api/projects", projectsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

export default app;