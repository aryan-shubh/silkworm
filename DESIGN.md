# Silkworm — W&B, but better

ML experiment tracking, artifact registry, run comparison, model lineage. Drop-in `wandb` SDK compat.

## Stack
- **Frontend:** Next.js 15 (App Router, RSC) + React 19 + TS + Tailwind v4 + shadcn/ui. Charts via `uPlot` (fast, millions of points) + `react-arborist` for run trees. Fonts: Geist Sans/Mono.
- **Auth:** Better Auth (sessions, orgs, SSO/SAML, API keys, RBAC). Postgres adapter on PlanetScale.
- **DB (OLTP):** PlanetScale (MySQL/Vitess) + Drizzle ORM. Stores users, orgs, projects, runs metadata, artifacts index.
- **Metrics (OLAP/time-series):** ClickHouse Cloud on AWS — run metrics, system stats, logs. Cheaper + faster than Timestream for high-cardinality ML.
- **Vector / Q&A:** Qdrant Cloud — semantic search over runs, configs, logs; powers "ask your experiments" RAG.
- **Cache / queues:** Upstash Redis (sessions, rate limits) + AWS SQS FIFO (ingest pipeline) + EventBridge (webhooks).

## AWS spine
- **S3** — model checkpoints, datasets, media (images/audio/video panels), code snapshots. Lifecycle → Glacier IR after 90d.
- **Kinesis Data Streams** — high-throughput metric ingest from SDK.
- **Lambda** — stream consumers → ClickHouse + S3 (parquet via Firehose).
- **ECS Fargate** — Next.js app + ingest API (Hono on Node 22) behind ALB.
- **CloudFront** — edge for static + signed URLs for S3 artifacts.
- **Athena + Glue** — ad-hoc queries on cold parquet.
- **IAM + STS** — scoped per-project upload tokens to S3.
- **CloudWatch + OTel → Grafana Cloud** for ops.

## Data flow
1. SDK (`pip install silkworm`) buffers metrics → POST to ingest API (HTTP/2, protobuf).
2. API auths via Better Auth API key → drops batch on Kinesis.
3. Lambda fans out: ClickHouse insert (hot, 30d) + Firehose → S3 parquet (cold).
4. Artifacts (checkpoints, datasets) → presigned S3 multipart, indexed in PlanetScale, hashed (CAS dedup).
5. Frontend RSC reads PlanetScale + ClickHouse via tRPC; live runs via SSE from Redis pub/sub.

## Edge / cutting-edge bits
- **Drizzle + PlanetScale serverless driver** — edge-safe queries from RSC.
- **Partykit / Durable Objects-style** live cursor + run-watching via Cloudflare Workers fronting CloudFront (or AWS AppSync if pure-AWS).
- **DuckDB-WASM** in browser for client-side run diff/regroup on parquet pulled from S3.
- **Biome** (lint+format), **Bun** workspace, **Turborepo**, **SST v3** for IaC, **Playwright** E2E, **Vitest** unit.
- **AI:** Anthropic Claude (Sonnet 4.6) for "explain this run" / hyperparam suggestions; embeddings → Qdrant.

## MVP cut (6 weeks)
W1 auth+orgs · W2 ingest+ClickHouse · W3 runs UI+charts · W4 artifacts+S3 · W5 SDK compat shim · W6 RAG + polish.
