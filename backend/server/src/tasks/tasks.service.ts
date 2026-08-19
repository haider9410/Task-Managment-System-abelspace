import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

function parseJson(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatTask(row: any) {
  if (!row) return null;
  return {
    id: row.id.toString(),
    ownerId: row.ownerId,
    projectId: row.projectId || "",
    title: row.title,
    desc: row.desc || "",
    status: row.status || "todo",
    priority: row.priority || "Medium",
    memberId: row.memberId || "m1",
    dueDate: row.dueDate || "",
    tags: parseJson(row.tags, []),
    subtasks: parseJson(row.subtasks, []),
    comments: parseJson(row.comments, []),
    resources: parseJson(row.resources, []),
    watchers: parseJson(row.watchers, []),
    locked: !!row.locked,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(ownerId: string, projectId?: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      return this.db.memoryStore.tasks
        .filter((t) => !projectId || t.projectId === projectId)
        .map(formatTask);
    }

    let sql = "SELECT * FROM tasks WHERE 1=1";
    const params: any[] = [];
    if (projectId) {
      sql += " AND projectId = ?";
      params.push(projectId);
    }
    sql += " ORDER BY id DESC";

    const [rows]: any = await pool.query(sql, params);
    return rows.map(formatTask);
  }

  async findOne(id: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const task = this.db.memoryStore.tasks.find((t) => t.id.toString() === id.toString());
      return task ? formatTask(task) : null;
    }
    const [rows]: any = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    return rows.length ? formatTask(rows[0]) : null;
  }

  async create(ownerId: string, data: any) {
    const pool = await this.db.getPool();
    const taskData = {
      ownerId,
      projectId: String(data.projectId || ""),
      title: String(data.title).trim(),
      desc: String(data.desc || ""),
      status: data.status || "todo",
      priority: data.priority || "Medium",
      memberId: data.memberId || "m1",
      dueDate: data.dueDate || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
      comments: Array.isArray(data.comments) ? data.comments : [],
      resources: Array.isArray(data.resources) ? data.resources : [],
      watchers: Array.isArray(data.watchers) ? data.watchers : [],
      locked: !!data.locked,
    };

    if (!pool || this.db.isFallback()) {
      const newId = (this.db.memoryStore.taskIdCounter++).toString();
      const task = { id: newId, ...taskData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this.db.memoryStore.tasks.unshift(task);
      return formatTask(task);
    }

    const sql = `
      INSERT INTO tasks (ownerId, projectId, title, \`desc\`, status, priority, memberId, dueDate, tags, subtasks, comments, resources, watchers, locked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      taskData.ownerId,
      taskData.projectId,
      taskData.title,
      taskData.desc,
      taskData.status,
      taskData.priority,
      taskData.memberId,
      taskData.dueDate,
      JSON.stringify(taskData.tags),
      JSON.stringify(taskData.subtasks),
      JSON.stringify(taskData.comments),
      JSON.stringify(taskData.resources),
      JSON.stringify(taskData.watchers),
      taskData.locked ? 1 : 0,
    ];

    const [result]: any = await pool.query(sql, params);
    return await this.findOne(result.insertId.toString());
  }

  async update(id: string, data: any) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const idx = this.db.memoryStore.tasks.findIndex((t) => t.id.toString() === id.toString());
      if (idx === -1) return null;
      const current = this.db.memoryStore.tasks[idx];
      const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
      this.db.memoryStore.tasks[idx] = updated;
      return formatTask(updated);
    }

    const setClauses: string[] = [];
    const params: any[] = [];
    const fieldMap: Record<string, string> = {
      title: "title",
      desc: "`desc`",
      status: "status",
      priority: "priority",
      memberId: "memberId",
      projectId: "projectId",
      dueDate: "dueDate",
      locked: "locked",
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        params.push(key === "locked" ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    const jsonFields = ["tags", "subtasks", "comments", "resources", "watchers"];
    for (const field of jsonFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(JSON.stringify(Array.isArray(data[field]) ? data[field] : []));
      }
    }

    if (setClauses.length === 0) return await this.findOne(id);

    const sql = `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(id);

    const [result]: any = await pool.query(sql, params);
    if (result.affectedRows === 0) return null;
    return await this.findOne(id);
  }

  async remove(id: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const idx = this.db.memoryStore.tasks.findIndex((t) => t.id.toString() === id.toString());
      if (idx === -1) return null;
      const [deleted] = this.db.memoryStore.tasks.splice(idx, 1);
      return formatTask(deleted);
    }

    const task = await this.findOne(id);
    if (!task) return null;

    const [result]: any = await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    return result.affectedRows > 0 ? task : null;
  }
}
