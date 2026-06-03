import { defineConfig } from "drizzle-kit";

// PlanetScale Postgres URLs include `sslrootcert=system`, a libpq-only flag
// that postgres-js forwards as a server startup parameter and pg then rejects
// with 42704. Strip it before handing the URL to drizzle-kit.
const cleaned = new URL(process.env.DATABASE_URL!);
cleaned.searchParams.delete("sslrootcert");

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: cleaned.toString(),
  },
  verbose: true,
});
