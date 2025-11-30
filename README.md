# Airtable-lite — Test Task

This repository contains a small Airtable-like grid demo used for a frontend engineering test. It includes:

- A Node.js BFF (Express + TypeScript)
- PostgreSQL (seed script for generating test data)
- Web frontend (Vite + React + TanStack Table + MUI)
- Realtime via WebSockets + Postgres LISTEN/NOTIFY for multi-node sync
- Docker Compose orchestration (DB, BFF, frontend)

---

## Quick links

- BFF: `apps/server`
- Frontend: `apps/web`
- DB seed: `apps/server/src/seed.ts`
- Docker Compose: `docker-compose.yml`

---

## Prerequisites

- Node.js 20+ and `pnpm` (repo uses pnpm workspaces)
- Docker & Docker Compose (for running the full stack)

Install workspace deps from the repo root:

```bash
pnpm install
```

---

## Run locally (development)

Run Postgres + BFF (dev) + frontend (dev):

1. Start Postgres (via docker):

```bash
docker compose up -d db
```

2. Start local BFF and FE (dev):

```bash
# run frontend and backend from the root
pnpm run dev
```

3. (Optional) Start local BFF or FE (dev):

```bash
cd apps/server
# run frontend
pnpm run dev
```

or

```bash
cd apps/web
# run frontend
pnpm run dev
```

Navigate to the app URL shown by Vite (typically `http://localhost:5173`).

---

## Run full stack with Docker Compose

This brings up Postgres, the BFF, and a built frontend served by nginx.

```bash
docker compose up --build
```

- Frontend (nginx): http://localhost:3000
- BFF: http://localhost:4000
- Postgres: localhost:5432

The `bff` service will run database migration/seed on first start if `SEED=true` is set in the compose file (it's enabled by default in the provided `docker-compose.yml`).

---

## Multi-node realtime test (manual)

Goal: verify that realtime updates replicate across BFF nodes (behind a load balancer). We use Postgres `LISTEN/NOTIFY` so all nodes subscribed to the `items` channel rebroadcast notifications to their local WebSocket clients.

Steps:

1. Start Postgres.
2. Start two BFF instances (different `PORT` and `SERVER_ID` values) — see example above.
3. Start two frontends, each pointing to a different BFF instance (edit `httpService.ts` per frontend instance as described above).
4. In Window A edit a cell and commit; Window B should receive the update via its connected BFF node. If both windows edit the same cell concurrently, the client uses a `version` field to detect conflicts:
   - Optimistic updates are applied immediately in the editor
   - If the server returns a different value/version, the row is marked with a conflict badge — click the badge to accept the server value

Notes:

- The test requires the frontend instances to be built/started against different BFF ports so each browser connects to a different server node. For a more automated setup we could make the frontend's API/WS URLs configurable via env variables.

---

## Seeding data

The repository includes a seed script that inserts a configurable number of rows (default 50k). You can run it manually from the server package:

```bash
cd apps/server
pnpm build
node dist/seed.js 50000
```

When running via Docker Compose the service is configured to run the seed when the container starts (see `SEED` env var in `docker-compose.yml`).

---

## Architecture (brief)

- BFF: `apps/server/src`

  - `index.ts` — Express HTTP endpoints and WebSocket attach
  - `db.ts` — pg Pool helper and DB initialization
  - `pgListener.ts` — LISTEN/NOTIFY listener with reconnect/backoff
  - `ws.ts` — WebSocket server attach & broadcast utility
  - `seed.ts` — seed script to populate `items` table

- Frontend: `apps/web/src`
  - `features/table` — virtualized TanStack table + editable cells
  - `shared/realtime` — lightweight WebSocket client & React hook
  - `shared/utiles/httpService.ts` — axios wrapper (API base URL for the frontend)

---

## Known limitations & next steps

- The frontend's API base URL is currently a constant in `httpService.ts`. Making this configurable via `VITE_` env vars would simplify running multiple frontends concurrently.
- NOTIFY payload size is limited by Postgres — for very large `data` JSONB we should send only `id`/`version` and let nodes fetch full rows on demand.
- Conflict resolution is manual (user clicks the badge to accept server value). We could provide merge/keep-my-change UI or auto-merge heuristics.
- Tests are not included yet — unit tests for merge/optimistic logic and an E2E smoke script would be valuable.
- Get the columns/filters as metadata from the API rather than hardcoding them on the frontend.
