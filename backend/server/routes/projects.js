import { Router } from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const router = Router();

const ownerOf = (req) =>
  (req.headers["x-user-id"] || "guest").toString().slice(0, 200);

router.get("/", async (req, res, next) => {
  try {
    const me = ownerOf(req);
    const projects = await Project.find({ me });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, desc, color, private: isPrivate, priority, dueDate } =
      req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }
    const project = await Project.create({
      ownerId: ownerOf(req),
      name: String(name).trim(),
      desc: String(desc ?? ""),
      color: String(color ?? "#171717"),
      private: !!isPrivate,
      priority: priority ?? "no_priority",
      dueDate: String(dueDate ?? ""),
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.post("/claim-guest", async (req, res, next) => {
  try {
    const me = ownerOf(req);
    const projects = await Project.updateMany(
      { ownerId: "guest" },
      { ownerId: me }
    );
    const tasks = await Task.updateMany(
      { ownerId: "guest" },
      { ownerId: me }
    );
    res.json({
      claimed: (projects.modifiedCount || 0) + (tasks.modifiedCount || 0),
      projects: projects.modifiedCount || 0,
      tasks: tasks.modifiedCount || 0,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const allowed = ["name", "desc", "color", "private", "priority", "dueDate"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.name !== undefined && !String(update.name).trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }
    const project = await Project.findOneAndUpdate(
      { id: req.params.id, ownerId: ownerOf(req) },
      update
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      id: req.params.id,
      ownerId: ownerOf(req),
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    await Task.deleteMany({ projectId: String(project.id) });
    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
