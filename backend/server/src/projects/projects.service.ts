import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

function formatProject(row: any) {
  if (!row) return null;
  return {
    id: row.id.toString(),
    ownerId: row.ownerId,
    name: row.name,
    desc: row.desc || "",
    color: row.color || "#171717",
    private: !!row.private,
    priority: row.priority || "no_priority",
    dueDate: row.dueDate || "",
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(ownerId: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      return this.db.memoryStore.projects
        .filter((p) => !p.private || p.ownerId === ownerId)
        .map(formatProject);
    }
    const [rows]: any = await pool.query(
      "SELECT * FROM projects WHERE private = 0 OR ownerId = ? ORDER BY id DESC",
      [ownerId]
    );
    return rows.map(formatProject);
  }

  async findOne(id: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const p = this.db.memoryStore.projects.find((x) => x.id.toString() === id.toString());
      return p ? formatProject(p) : null;
    }
    const [rows]: any = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    return rows.length ? formatProject(rows[0]) : null;
  }

  async create(ownerId: string, data: any) {
    const pool = await this.db.getPool();
    const projectData = {
      ownerId,
      name: String(data.name).trim(),
      desc: String(data.desc || ""),
      color: String(data.color || "#171717"),
      private: !!data.private,
      priority: data.priority || "no_priority",
      dueDate: String(data.dueDate || ""),
    };

    if (!pool || this.db.isFallback()) {
      const newId = (this.db.memoryStore.projectIdCounter++).toString();
      const project = { id: newId, ...projectData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this.db.memoryStore.projects.unshift(project);
      return formatProject(project);
    }

    const sql = `
      INSERT INTO projects (ownerId, name, \`desc\`, color, private, priority, dueDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      projectData.ownerId,
      projectData.name,
      projectData.desc,
      projectData.color,
      projectData.private ? 1 : 0,
      projectData.priority,
      projectData.dueDate,
    ];

    const [result]: any = await pool.query(sql, params);
    return await this.findOne(result.insertId.toString());
  }

  async claimGuest(ownerId: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      let count = 0;
      this.db.memoryStore.projects.forEach((p) => {
        if (p.ownerId === "guest") { p.ownerId = ownerId; count++; }
      });
      this.db.memoryStore.tasks.forEach((t) => {
        if (t.ownerId === "guest") { t.ownerId = ownerId; count++; }
      });
      return { claimed: count, projects: count, tasks: count };
    }

    const [pRes]: any = await pool.query("UPDATE projects SET ownerId = ? WHERE ownerId = 'guest'", [ownerId]);
    const [tRes]: any = await pool.query("UPDATE tasks SET ownerId = ? WHERE ownerId = 'guest'", [ownerId]);
    return {
      claimed: (pRes.affectedRows || 0) + (tRes.affectedRows || 0),
      projects: pRes.affectedRows || 0,
      tasks: tRes.affectedRows || 0,
    };
  }

  async update(id: string, data: any) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const idx = this.db.memoryStore.projects.findIndex((p) => p.id.toString() === id.toString());
      if (idx === -1) return null;
      const current = this.db.memoryStore.projects[idx];
      const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
      this.db.memoryStore.projects[idx] = updated;
      return formatProject(updated);
    }

    const setClauses: string[] = [];
    const params: any[] = [];
    const fieldMap: Record<string, string> = {
      name: "name",
      desc: "`desc`",
      color: "color",
      private: "private",
      priority: "priority",
      dueDate: "dueDate",
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        params.push(key === "private" ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (setClauses.length === 0) return await this.findOne(id);

    const sql = `UPDATE projects SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(id);

    const [result]: any = await pool.query(sql, params);
    if (result.affectedRows === 0) return null;
    return await this.findOne(id);
  }

  async remove(id: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const idx = this.db.memoryStore.projects.findIndex((p) => p.id.toString() === id.toString());
      if (idx === -1) return null;
      const [deleted] = this.db.memoryStore.projects.splice(idx, 1);
      return formatProject(deleted);
    }

    const project = await this.findOne(id);
    if (!project) return null;

    const [result]: any = await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
      await pool.query("DELETE FROM tasks WHERE projectId = ?", [id]);
      return project;
    }
    return null;
  }
}
