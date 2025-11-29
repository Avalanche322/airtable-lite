# Server (BFF) — Express + WebSocket + Postgres

This app is a small BFF that demonstrates:

- Express REST endpoints under `/api`
- WebSocket server at `/ws` using `ws`
- Postgres integration via `pg`

Quickstart (monorepo root):

```bash
# from repo root
pnpm install
pnpm --filter @apps/server dev
```

Or run Postgres locally via Docker Compose and then start the server from this package:

```bash
cd apps/server
docker compose up -d
cp .env.example .env
pnpm install
pnpm dev
```

Endpoints:

- `GET /api/health` — health check
- `GET /api/items` — list items
- `POST /api/items` — insert an item (JSON body)

WebSocket:

- Connect to `ws://localhost:4000/ws` and clients will receive broadcasts when items are created.
