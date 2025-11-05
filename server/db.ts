import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const sqlite = new Database("./local.db");
const db = drizzle(sqlite, { schema });

console.log("Using SQLite database");

export { db };