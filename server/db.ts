import pg from "pg";

const connectionString = process.env.DATABASE_URL!;

export const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});
