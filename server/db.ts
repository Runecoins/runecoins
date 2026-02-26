import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = drizzle(pool, { schema });
