import { Controller, Get } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Controller()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getWelcome() {
    return {
      message: "AbleSpace NestJS Task Management API",
      status: "online",
      db: this.db.isFallback() ? "memory_fallback" : "mysql",
    };
  }

  @Get("api/health")
  async getHealth() {
    const pool = await this.db.getPool();
    let dbStatus = "ok";
    if (!pool || this.db.isFallback()) {
      dbStatus = "memory_fallback";
    } else {
      try {
        await pool.query("SELECT 1");
      } catch {
        dbStatus = "error";
      }
    }

    return {
      status: dbStatus === "error" ? "error" : "ok",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
