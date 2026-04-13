import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DrizzleDb = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;
  private drizzleInstance: DrizzleDb | null = null;

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

    this.drizzleInstance = drizzle(this.pool, { schema });
    console.log("Database connection established");
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

  getDrizzle(): DrizzleDb {
    if (!this.drizzleInstance) {
      throw new Error("Database not initialized. Check DATABASE_URL.");
    }
    return this.drizzleInstance;
  }
}

export const databaseProvider = {
  provide: DatabaseService,
  useClass: DatabaseService,
};
