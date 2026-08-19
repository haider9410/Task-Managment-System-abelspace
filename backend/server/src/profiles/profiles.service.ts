import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

function formatProfile(row: any) {
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

@Injectable()
export class ProfilesService {
  constructor(private readonly db: DatabaseService) {}

  async findOne(ownerId: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      const p = this.db.memoryStore.profiles[ownerId];
      if (p) return formatProfile(p);
      const newP = {
        id: (this.db.memoryStore.profileIdCounter++).toString(),
        ownerId,
        email: "",
        name: "",
        title: "",
        username: "",
        picture: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.db.memoryStore.profiles[ownerId] = newP;
      return formatProfile(newP);
    }

    const [rows]: any = await pool.query("SELECT * FROM profiles WHERE ownerId = ?", [ownerId]);
    if (rows.length) return formatProfile(rows[0]);

    await pool.query("INSERT INTO profiles (ownerId) VALUES (?)", [ownerId]);
    const [newRows]: any = await pool.query("SELECT * FROM profiles WHERE ownerId = ?", [ownerId]);
    return formatProfile(newRows[0]);
  }

  async update(ownerId: string, data: any) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      let current = this.db.memoryStore.profiles[ownerId];
      if (!current) {
        current = { id: (this.db.memoryStore.profileIdCounter++).toString(), ownerId };
      }
      const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
      this.db.memoryStore.profiles[ownerId] = updated;
      return formatProfile(updated);
    }

    await this.findOne(ownerId);
    const allowed = ["email", "name", "title", "username", "picture"];
    const setClauses: string[] = [];
    const params: any[] = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        setClauses.push(`${key} = ?`);
        params.push(String(data[key]));
      }
    }

    if (setClauses.length > 0) {
      const sql = `UPDATE profiles SET ${setClauses.join(", ")} WHERE ownerId = ?`;
      params.push(ownerId);
      await pool.query(sql, params);
    }

    return await this.findOne(ownerId);
  }

  async remove(ownerId: string) {
    const pool = await this.db.getPool();
    if (!pool || this.db.isFallback()) {
      delete this.db.memoryStore.profiles[ownerId];
      return { message: "Workspace access removed" };
    }
    await pool.query("DELETE FROM profiles WHERE ownerId = ?", [ownerId]);
    return { message: "Workspace access removed" };
  }
}
