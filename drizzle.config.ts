
import { defineConfig } from "drizzle-kit";

// Use SQLite for local development if DATABASE_URL is not set
const isLocal = !process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: isLocal ? "sqlite" : "postgresql",
  dbCredentials: isLocal
    ? {
        url: "file:./local.db",
      }
    : {
        url: process.env.DATABASE_URL,
      },
});
