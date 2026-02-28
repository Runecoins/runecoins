import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida");
}

export const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });
