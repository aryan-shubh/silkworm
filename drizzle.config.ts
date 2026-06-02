import { defineConfig } from "drizzle-kit";

// PlanetScale connection strings carry sslmode / sslrootcert query params
// that mysql2 doesn't understand. Parse the URL into discrete fields and
// supply rejectUnauthorized: true so TLS works against psdb.cloud.
const url = new URL(process.env.DATABASE_URL!);

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: url.hostname,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
  },
  verbose: true,
});
