import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/nel";
import { NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: NeonQueryFunction<typeof schema> | null = null;
  private db: ReturnType<typeof drizzle> | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const databaseUrl = this.configService.get<string>("DATABASE_URL");

    if (!databaseUrl) {
      console.warn("DATABASE_URL not set - database will not be available");
      return;
    }

    this.client = drizzle(databaseUrl);
    this.db = this.client;
  }

  onModuleDestroy() {
    // Neon/Supabase handles connection pooling automatically
  }

  getClient() {
    if (!this.client) {
      throw new Error("Database client not initialized. Check DATABASE_URL.");
    }
    return this.client;
  }

  getDb() {
    if (!this.db) {
      throw new Error("Database not initialized. Check DATABASE_URL.");
    }
    return this.db;
  }
}

export const databaseProvider = {
  provide: DatabaseService,
  useClass: DatabaseService,
};
