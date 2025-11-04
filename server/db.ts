
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const isLocal = !process.env.DATABASE_URL;

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleSqlite>;

if (isLocal) {
  // Use SQLite for local development
  const sqlite = new Database("./local.db");
  db = drizzleSqlite(sqlite, { schema });
  console.log("Using SQLite database for local development");
} else {
  // Use PostgreSQL for production
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql, { schema });
  console.log("Using PostgreSQL database");
}

export { db };
