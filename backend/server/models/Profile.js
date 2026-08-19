import { getPool, isFallback, memoryStore } from "../db.js";

function formatProfile(row) {
  if (!row) return null;
  return {
    id: row.id.toString(),
    ownerId: row.ownerId,
    email: row.email || "",
    name: row.name || "",
    title: row.title || "",
    username: row.username || "",
    picture: row.picture || "",
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

export class Profile {
  static async findOne(filter = {}) {
    const pool = await getPool();
    if (!pool || isFallback()) {
      if (filter.ownerId) {
        const p = memoryStore.profiles[filter.ownerId];
        return p ? formatProfile(p) : null;
      }
      return null;
    }
    if (filter.ownerId) {
      const [rows] = await pool.query("SELECT * FROM profiles WHERE ownerId = ?", [filter.ownerId]);
      return rows.length ? formatProfile(rows[0]) : null;
    }
    return null;
  }

  static async create(data) {
    const pool = await getPool();
    if (!pool || isFallback()) {
      const id = (memoryStore.profileIdCounter++).toString();
      const profile = {
        id,
        ownerId: data.ownerId,
        email: data.email || "",
        name: data.name || "",
        title: data.title || "",
        username: data.username || "",
        picture: data.picture || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.profiles[data.ownerId] = profile;
      return formatProfile(profile);
    }

    const sql = `
      INSERT INTO profiles (ownerId, email, name, title, username, picture)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.ownerId,
      data.email || "",
      data.name || "",
      data.title || "",
      data.username || "",
      data.picture || "",
    ];

    const [result] = await pool.query(sql, params);
    return await this.findOne({ ownerId: data.ownerId });
  }

  static async findOneAndUpdate({ ownerId }, update, opts = {}) {
    const existing = await this.findOne({ ownerId });
    if (!existing && opts.upsert) {
      return await this.create({ ownerId, ...update });
    }
    if (!existing) return null;

    const pool = await getPool();
    if (!pool || isFallback()) {
      const current = memoryStore.profiles[ownerId] || existing;
      const updated = {
        ...current,
        ...update,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.profiles[ownerId] = updated;
      return formatProfile(updated);
    }

    const setClauses = [];
    const params = [];

    const allowed = ["email", "name", "title", "username", "picture"];
    for (const key of allowed) {
      if (update[key] !== undefined) {
        setClauses.push(`${key} = ?`);
        params.push(update[key]);
      }
    }

    if (setClauses.length === 0) return existing;

    const sql = `UPDATE profiles SET ${setClauses.join(", ")} WHERE ownerId = ?`;
    params.push(ownerId);

    await pool.query(sql, params);
    return await this.findOne({ ownerId });
  }

  static async findOneAndDelete({ ownerId }) {
    const pool = await getPool();
    const existing = await this.findOne({ ownerId });
    if (!existing) return null;

    if (!pool || isFallback()) {
      delete memoryStore.profiles[ownerId];
      return existing;
    }

    await pool.query("DELETE FROM profiles WHERE ownerId = ?", [ownerId]);
    return existing;
  }
}

export default Profile;
