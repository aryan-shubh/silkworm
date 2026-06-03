import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy singleton — defer client construction until the first call, so that
 * importing this module on a Vercel build (or any environment without
 * DATABASE_URL set) doesn't crash.
 */
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — required to use the database.");
  }
  // PlanetScale Postgres URLs ship with `sslrootcert=system`, a libpq-only
  // directive. postgres-js forwards unknown URL params as server startup
  // parameters, and the pg server rejects this one with code 42704. Drop it
  // here and configure TLS via the ssl option instead.
  const cleaned = new URL(url);
  cleaned.searchParams.delete("sslrootcert");
  _client = postgres(cleaned.toString(), { ssl: "require", prepare: false });
  _db = drizzle(_client, { schema });
  return _db;
}

export type DB = ReturnType<typeof getDb>;
