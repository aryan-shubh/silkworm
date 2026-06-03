import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  jsonb,
  doublePrecision,
  index,
  uniqueIndex,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ─────────── enums ─────────── */

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const projectVisibilityEnum = pgEnum("project_visibility", [
  "private",
  "internal",
  "public",
]);

export const runStatusEnum = pgEnum("run_status", [
  "queued",
  "running",
  "finished",
  "failed",
  "crashed",
  "killed",
]);

export const artifactTypeEnum = pgEnum("artifact_type", [
  "model",
  "dataset",
  "code",
  "result",
]);

/* ─────────── auth (Composio-broker identity) ─────────── */

// We hold our own users row; Composio OAuth Connections are the broker.
// `composioUserId` is the external Composio entity/userId we pass on
// connectedAccounts.initiate(...). Sessions live in signed cookies
// (and optionally Upstash) — no DB-backed sessions/accounts/verifications.
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: varchar("name", { length: 128 }),
  image: text("image"),
  composioUserId: varchar("composio_user_id", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
});

/* ─────────── orgs ─────────── */

export const orgs = pgTable("orgs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  logo: text("logo"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const members = pgTable(
  "members",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orgId: varchar("org_id", { length: 36 }).notNull().references((): AnyPgColumn => orgs.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("uniq_member").on(t.orgId, t.userId),
    index("idx_members_user").on(t.userId),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orgId: varchar("org_id", { length: 36 }).notNull().references((): AnyPgColumn => orgs.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    prefix: varchar("prefix", { length: 12 }).notNull(), // sk_live_xxxx
    hash: varchar("hash", { length: 128 }).notNull(), // sha256 of full key
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("idx_api_keys_org").on(t.orgId)],
);

/* ─────────── projects, runs, artifacts ─────────── */

export const projects = pgTable(
  "projects",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orgId: varchar("org_id", { length: 36 }).notNull().references((): AnyPgColumn => orgs.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    framework: varchar("framework", { length: 64 }),
    visibility: projectVisibilityEnum("visibility").default("private").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uniq_project_slug").on(t.orgId, t.slug)],
);

export const runs = pgTable(
  "runs",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // ulid
    projectId: varchar("project_id", { length: 36 }).notNull().references((): AnyPgColumn => projects.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull().references((): AnyPgColumn => users.id, { onDelete: "restrict" }),
    status: runStatusEnum("status").default("queued").notNull(),
    group: varchar("group", { length: 64 }),
    jobType: varchar("job_type", { length: 64 }),
    notes: text("notes"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    summary: jsonb("summary")
      .$type<Record<string, number>>()
      .default({})
      .notNull(),
    systemInfo: jsonb("system_info")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true, mode: "date" }),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    durationMs: bigint("duration_ms", { mode: "number" }),
    exitCode: integer("exit_code"),
  },
  (t) => [
    index("idx_runs_project_started").on(t.projectId, t.startedAt),
    index("idx_runs_project_status").on(t.projectId, t.status),
  ],
);

export const artifacts = pgTable(
  "artifacts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    projectId: varchar("project_id", { length: 36 }).notNull().references((): AnyPgColumn => projects.id, { onDelete: "cascade" }),
    runId: varchar("run_id", { length: 36 }).references((): AnyPgColumn => runs.id, { onDelete: "set null" }),
    name: varchar("name", { length: 128 }).notNull(),
    type: artifactTypeEnum("type").notNull(),
    version: integer("version").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    s3Key: text("s3_key").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("uniq_artifact_version").on(t.projectId, t.name, t.version),
    index("idx_artifact_sha").on(t.sha256),
  ],
);

export const runMetrics = pgTable(
  "run_metrics",
  {
    runId: varchar("run_id", { length: 36 }).notNull().references((): AnyPgColumn => runs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    step: bigint("step", { mode: "number" }).notNull(),
    value: doublePrecision("value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.runId, t.name, t.step] }),
    index("idx_run_metric").on(t.runId, t.name),
  ],
);

/* ─────────── relations ─────────── */

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(members),
}));

export const orgsRelations = relations(orgs, ({ many }) => ({
  members: many(members),
  projects: many(projects),
  apiKeys: many(apiKeys),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  org: one(orgs, { fields: [projects.orgId], references: [orgs.id] }),
  runs: many(runs),
  artifacts: many(artifacts),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  project: one(projects, { fields: [runs.projectId], references: [projects.id] }),
  user: one(users, { fields: [runs.userId], references: [users.id] }),
  metrics: many(runMetrics),
  artifacts: many(artifacts),
}));

export const runMetricsRelations = relations(runMetrics, ({ one }) => ({
  run: one(runs, { fields: [runMetrics.runId], references: [runs.id] }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  project: one(projects, { fields: [artifacts.projectId], references: [projects.id] }),
  run: one(runs, { fields: [artifacts.runId], references: [runs.id] }),
}));

export const membersRelations = relations(members, ({ one }) => ({
  org: one(orgs, { fields: [members.orgId], references: [orgs.id] }),
  user: one(users, { fields: [members.userId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  org: one(orgs, { fields: [apiKeys.orgId], references: [orgs.id] }),
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

/* Note: metrics live in ClickHouse, not here. Schema there:
 *   metrics(project_id, run_id, name, step UInt64, ts DateTime64(3), value Float64)
 *   ORDER BY (project_id, run_id, name, step)
 */
