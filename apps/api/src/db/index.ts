import { drizzle } from "drizzle-orm/nel";
import { Pool } from "pg";
import * as schema from "./schema";
import { ConfigService } from "@nestjs/config";

const createPool = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
};

let pool: Pool | null = null;

export const getDatabase = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

export const db = (configService?: any) => {
  const databaseUrl =
    configService?.get("DATABASE_URL") || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return drizzle(pool, { schema });
};

export type Database = ReturnType<typeof db>;
export { schema };
