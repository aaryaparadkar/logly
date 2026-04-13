import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;

  constructor(private configService?: ConfigService) {}

  onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.warn("DATABASE_URL not set - database will not be available");
      return;
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  onModuleDestroy() {
    if (this.pool) {
      this.pool.end();
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error("Database pool not initialized. Check DATABASE_URL.");
    }
    return this.pool;
  }
}

export const databaseProvider = {
  provide: DatabaseService,
  useClass: DatabaseService,
};
