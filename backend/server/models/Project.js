import { getPool } from "../db.js";

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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Project {
  static async find(queryOpts = {}) {
    const pool = await getPool();
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
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    return rows.length ? formatProject(rows[0]) : null;
  }

  static async create(data) {
    const pool = await getPool();
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
    const projectId = _id || id;

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
    const projectId = _id || id;

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
    let sql = "UPDATE projects SET ownerId = ? WHERE ownerId = ?";
    const params = [update.$set?.ownerId || update.ownerId, filter.ownerId];

    const [result] = await pool.query(sql, params);
    return { modifiedCount: result.affectedRows };
  }
}

export default Project;
