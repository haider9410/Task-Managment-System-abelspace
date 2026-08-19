import { getPool, isFallback, memoryStore } from "../db.js";

function formatProject(row) {
  if (!row) return null;
  return {
    id: row.id.toString(),
    ownerId: row.ownerId,
    name: row.name,
    desc: row.desc || "",
    color: row.color || "#171717",
    private: Boolean(row.private),
    priority: row.priority || "no_priority",
    dueDate: row.dueDate || "",
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

export class Project {
  static async find(queryOpts = {}) {
    const pool = await getPool();
    if (!pool || isFallback()) {
      let projects = [...memoryStore.projects];
      if (queryOpts.private === true && queryOpts.ownerIdNe) {
        projects = projects.filter((p) => p.private && p.ownerId !== queryOpts.ownerIdNe);
      } else if (queryOpts.me) {
        projects = projects.filter((p) => !p.private || p.ownerId === queryOpts.me);
      }
      return projects.map(formatProject);
    }

    let sql = "SELECT * FROM projects WHERE 1=1";
    const params = [];

    if (queryOpts.private === true && queryOpts.ownerIdNe) {
      sql += " AND private = 1 AND ownerId != ?";
      params.push(queryOpts.ownerIdNe);
    } else if (queryOpts.me) {
      sql += " AND (private = 0 OR ownerId = ?)";
      params.push(queryOpts.me);
    }

    sql += " ORDER BY createdAt DESC";

    const [rows] = await pool.query(sql, params);
    return rows.map(formatProject);
  }

  static async findDistinctIds(queryOpts = {}) {
    const projects = await this.find(queryOpts);
    return projects.map((p) => p.id);
  }

  static async findById(id) {
    const pool = await getPool();
    if (!pool || isFallback()) {
      const project = memoryStore.projects.find((p) => p.id.toString() === id.toString());
      return project ? formatProject(project) : null;
    }
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    return rows.length ? formatProject(rows[0]) : null;
  }

  static async create(data) {
    const pool = await getPool();
    if (!pool || isFallback()) {
      const id = (memoryStore.projectIdCounter++).toString();
      const newProject = {
        id,
        ownerId: data.ownerId || "guest",
        name: data.name,
        desc: data.desc || "",
        color: data.color || "#171717",
        private: !!data.private,
        priority: data.priority || "no_priority",
        dueDate: data.dueDate || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.projects.push(newProject);
      return formatProject(newProject);
    }

    const sql = `
      INSERT INTO projects (ownerId, name, \`desc\`, color, private, priority, dueDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.ownerId || "guest",
      data.name,
      data.desc || "",
      data.color || "#171717",
      data.private ? 1 : 0,
      data.priority || "no_priority",
      data.dueDate || "",
    ];

    const [result] = await pool.query(sql, params);
    return await this.findById(result.insertId);
  }

  static async findOneAndUpdate({ _id, id, ownerId }, update) {
    const pool = await getPool();
    const projectId = (_id || id).toString();

    if (!pool || isFallback()) {
      const index = memoryStore.projects.findIndex(
        (p) => p.id.toString() === projectId && (!ownerId || p.ownerId === ownerId)
      );
      if (index === -1) return null;
      const current = memoryStore.projects[index];
      const updated = {
        ...current,
        ...update,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.projects[index] = updated;
      return formatProject(updated);
    }

    const setClauses = [];
    const params = [];

    const fieldMap = {
      name: "name",
      desc: "`desc`",
      color: "color",
      private: "private",
      priority: "priority",
      dueDate: "dueDate",
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (update[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        params.push(key === "private" ? (update[key] ? 1 : 0) : update[key]);
      }
    }

    if (setClauses.length === 0) {
      return await this.findById(projectId);
    }

    let sql = `UPDATE projects SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(projectId);

    if (ownerId) {
      sql += " AND ownerId = ?";
      params.push(ownerId);
    }

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return null;
    return await this.findById(projectId);
  }

  static async findOneAndDelete({ _id, id, ownerId }) {
    const pool = await getPool();
    const projectId = (_id || id).toString();

    if (!pool || isFallback()) {
      const index = memoryStore.projects.findIndex(
        (p) => p.id.toString() === projectId && (!ownerId || p.ownerId === ownerId)
      );
      if (index === -1) return null;
      const [deleted] = memoryStore.projects.splice(index, 1);
      return formatProject(deleted);
    }

    const project = await this.findById(projectId);
    if (!project) return null;

    let sql = "DELETE FROM projects WHERE id = ?";
    const params = [projectId];

    if (ownerId) {
      sql += " AND ownerId = ?";
      params.push(ownerId);
    }

    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0 ? project : null;
  }

  static async updateMany(filter = {}, update = {}) {
    const pool = await getPool();
    if (!pool || isFallback()) {
      let modified = 0;
      const targetOwner = update.$set?.ownerId || update.ownerId;
      memoryStore.projects.forEach((p) => {
        if (p.ownerId === filter.ownerId) {
          p.ownerId = targetOwner;
          modified++;
        }
      });
      return { modifiedCount: modified };
    }

    let sql = "UPDATE projects SET ownerId = ? WHERE ownerId = ?";
    const params = [update.$set?.ownerId || update.ownerId, filter.ownerId];

    const [result] = await pool.query(sql, params);
    return { modifiedCount: result.affectedRows };
  }
}

export default Project;
