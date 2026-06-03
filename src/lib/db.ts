import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Lazy singleton — defer the pg Pool construction until the first call,
 * so importing this module on a Vercel build (or any environment without
 * DATABASE_URL set) doesn't crash.
 *
 * PlanetScale Postgres requires TLS; the driver doesn't honor libpq-style
 * `sslmode` / `sslrootcert` query params on the URL, so configure SSL
 * explicitly here.
 */
let _db: NodePgDatabase<typeof schema> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — required to use the database.");
  }
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: true },
  });
  _db = drizzle(pool, { schema });
  return _db;
}

export type DB = ReturnType<typeof getDb>;
