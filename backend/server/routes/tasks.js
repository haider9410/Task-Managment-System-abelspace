import { Router } from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

const router = Router();

const ownerOf = (req) => (req.headers["x-user-id"] || "guest").toString().slice(0, 200);

router.get("/", async (req, res, next) => {
  try {
    const me = ownerOf(req);
    const privateProjects = await Project.find({ private: true, ownerIdNe: me });
    const privateProjectIds = privateProjects.map((p) => p.id);
    const projectId = req.query.projectId ? String(req.query.projectId) : null;

    const tasks = await Task.find({
      privateProjectIds,
      me,
      projectId,
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      desc,
      status,
      priority,
      memberId,
      projectId,
      dueDate,
      tags,
      subtasks,
      comments,
      resources,
      locked,
      watchers,
    } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const task = await Task.create({
      ownerId: ownerOf(req),
      title: String(title).trim(),
      desc: String(desc ?? ""),
      status: status ?? "todo",
      priority: priority ?? "Medium",
      memberId: memberId ?? "m1",
      projectId: String(projectId ?? ""),
      dueDate: dueDate ?? "",
      tags: Array.isArray(tags) ? tags : [],
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      comments: Array.isArray(comments) ? comments : [],
      resources: Array.isArray(resources) ? resources : [],
      locked: !!locked,
      watchers: Array.isArray(watchers) ? watchers : [],
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const allowed = [
      "title",
      "desc",
      "status",
      "priority",
      "memberId",
      "projectId",
      "dueDate",
      "tags",
      "subtasks",
      "comments",
      "resources",
      "locked",
      "watchers",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.title !== undefined && !String(update.title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const task = await Task.findOneAndUpdate(
      { id: req.params.id, ownerId: ownerOf(req) },
      update
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      id: req.params.id,
      ownerId: ownerOf(req),
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
