import { getPool } from "../db.js";

function parseJson(val, defaultVal = []) {
  if (!val) return defaultVal;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

function formatTask(row) {
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
    locked: Boolean(row.locked),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Task {
  static async find(queryOpts = {}) {
    const pool = await getPool();
    let sql = "SELECT * FROM tasks WHERE 1=1";
    const params = [];

    if (queryOpts.privateProjectIds && queryOpts.privateProjectIds.length > 0) {
      const placeholders = queryOpts.privateProjectIds.map(() => "?").join(",");
      sql += ` AND (locked = 0 AND projectId NOT IN (${placeholders}) OR ownerId = ?)`;
      params.push(...queryOpts.privateProjectIds, queryOpts.me);
    } else if (queryOpts.me) {
      sql += " AND (locked = 0 OR ownerId = ?)";
      params.push(queryOpts.me);
    }

    if (queryOpts.projectId) {
      sql += " AND projectId = ?";
      params.push(queryOpts.projectId);
    }

    sql += " ORDER BY createdAt ASC";

    const [rows] = await pool.query(sql, params);
    return rows.map(formatTask);
  }

  static async findById(id) {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    return rows.length ? formatTask(rows[0]) : null;
  }

  static async create(data) {
    const pool = await getPool();
    const tagsJson = JSON.stringify(Array.isArray(data.tags) ? data.tags : []);
    const subtasksJson = JSON.stringify(Array.isArray(data.subtasks) ? data.subtasks : []);
    const commentsJson = JSON.stringify(Array.isArray(data.comments) ? data.comments : []);
    const resourcesJson = JSON.stringify(Array.isArray(data.resources) ? data.resources : []);
    const watchersJson = JSON.stringify(Array.isArray(data.watchers) ? data.watchers : []);

    const sql = `
      INSERT INTO tasks (
        ownerId, projectId, title, \`desc\`, status, priority, memberId, dueDate,
        tags, subtasks, comments, resources, watchers, locked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.ownerId || "guest",
      data.projectId || "",
      data.title,
      data.desc || "",
      data.status || "todo",
      data.priority || "Medium",
      data.memberId || "m1",
      data.dueDate || "",
      tagsJson,
      subtasksJson,
      commentsJson,
      resourcesJson,
      watchersJson,
      data.locked ? 1 : 0,
    ];

    const [result] = await pool.query(sql, params);
    return await this.findById(result.insertId);
  }

  static async findOneAndUpdate({ _id, id, ownerId }, update) {
    const pool = await getPool();
    const taskId = _id || id;

    const setClauses = [];
    const params = [];

    const fieldMap = {
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
      if (update[key] !== undefined) {
        setClauses.push(`${col} = ?`);
        params.push(key === "locked" ? (update[key] ? 1 : 0) : update[key]);
      }
    }

    const jsonFields = ["tags", "subtasks", "comments", "resources", "watchers"];
    for (const field of jsonFields) {
      if (update[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(JSON.stringify(Array.isArray(update[field]) ? update[field] : []));
      }
    }

    if (setClauses.length === 0) {
      return await this.findById(taskId);
    }

    let sql = `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(taskId);

    if (ownerId) {
      sql += " AND ownerId = ?";
      params.push(ownerId);
    }

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return null;
    return await this.findById(taskId);
  }

  static async findOneAndDelete({ _id, id, ownerId }) {
    const pool = await getPool();
    const taskId = _id || id;

    const task = await this.findById(taskId);
    if (!task) return null;

    let sql = "DELETE FROM tasks WHERE id = ?";
    const params = [taskId];

    if (ownerId) {
      sql += " AND ownerId = ?";
      params.push(ownerId);
    }

    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0 ? task : null;
  }

  static async deleteMany(filter = {}) {
    const pool = await getPool();
    let sql = "DELETE FROM tasks WHERE 1=1";
    const params = [];

    if (filter.projectId !== undefined) {
      sql += " AND projectId = ?";
      params.push(String(filter.projectId));
    }
    if (filter.ownerId !== undefined) {
      sql += " AND ownerId = ?";
      params.push(filter.ownerId);
    }

    const [result] = await pool.query(sql, params);
    return { deletedCount: result.affectedRows };
  }

  static async updateMany(filter = {}, update = {}) {
    const pool = await getPool();
    let sql = "UPDATE tasks SET ownerId = ? WHERE ownerId = ?";
    const params = [update.$set?.ownerId || update.ownerId, filter.ownerId];

    const [result] = await pool.query(sql, params);
    return { modifiedCount: result.affectedRows };
  }

  static async insertMany(taskList) {
    const results = [];
    for (const t of taskList) {
      const created = await this.create(t);
      results.push(created);
    }
    return results;
  }
}

export default Task;
