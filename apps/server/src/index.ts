import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import { initDb, query } from "./db";
import { attachWebsocketServer, broadcast } from "./ws";
import { SERVER_ID } from "./serverId";
import { startPgListener } from "./pgListener";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/items", async (_req, res) => {
  try {
    // Cursor-based pagination: `cursor` is the last-seen `id`; returns rows with id > cursor
    const cursorParam = _req.query.cursor as string | undefined;
    const fetchSizeParam = Number((_req.query.fetchSize as string) ?? 50);

    const cursor = cursorParam ? Number(cursorParam) : undefined;
    let fetchSize = Number.isFinite(fetchSizeParam) && fetchSizeParam > 0 ? Math.floor(fetchSizeParam) : 50;
    if (fetchSize > 1000) fetchSize = 1000;

    let rowsResult;
    if (typeof cursor === 'number' && !Number.isNaN(cursor)) {
      rowsResult = await query('SELECT id, data, created_at, updated_at, version FROM items WHERE id > $1 ORDER BY id ASC LIMIT $2', [cursor, fetchSize]);
    } else {
      rowsResult = await query('SELECT id, data, created_at, updated_at, version FROM items ORDER BY id ASC LIMIT $1', [fetchSize]);
    }

    const totalRes = await query('SELECT COUNT(*)::bigint as count FROM items');
    const total = Number(totalRes.rows[0]?.count ?? 0);

    const rows = rowsResult.rows;
    const nextCursor = rows.length === fetchSize ? rows[rows.length - 1].id : null;
    res.json({ rows, nextCursor, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/items", async (req, res) => {
  const payload = req.body;
  try {
    const result = await query(
      "INSERT INTO items (data) VALUES ($1) RETURNING id, data, created_at",
      [payload],
    );
    const row = result.rows[0];
    // broadcast to ws clients
    broadcast({ type: "item:created", payload: row });
    // publish to other nodes via Postgres NOTIFY (include origin to avoid echo)
    try {
      const notify = {
        type: 'item:created',
        payload: { id: row.id, data: row.data, created_at: row.created_at, updated_at: row.updated_at, version: row.version },
        origin: SERVER_ID,
      };
      await query('SELECT pg_notify($1, $2)', ['items', JSON.stringify(notify)]);
    } catch (e) {
      console.error('pg_notify failed', e);
    }
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db error" });
  }
});

app.patch('/api/items/:id', async (req, res) => {
  const id = Number(req.params.id);
  const patch = req.body;
  try {
    const result = await query(
      'UPDATE items SET data = data || $1::jsonb, updated_at = now(), version = version + 1 WHERE id = $2 RETURNING id, data, created_at, updated_at, version',
      [patch, id]
    );
    const row = result.rows[0];
    if (row) {
      broadcast({ type: 'item:updated', payload: row });
      try {
        const notify = {
          type: 'item:updated',
          payload: { id: row.id, data: row.data, created_at: row.created_at, updated_at: row.updated_at, version: row.version },
          origin: SERVER_ID,
        };
        await query('SELECT pg_notify($1, $2)', ['items', JSON.stringify(notify)]);
      } catch (e) {
        console.error('pg_notify failed', e);
      }
      res.json(row);
    } else {
      res.status(404).json({ error: 'not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);

attachWebsocketServer(server);
// start DB and pg listener, then server
initDb()
  .then(async () => {
    // start a background PG LISTEN/NOTIFY listener so this node receives updates from other nodes
    try {
      await startPgListener();
    } catch (e) {
      console.error('Failed to start pg listener', e);
    }

    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
      console.log(`WebSocket path ws://localhost:${port}/ws`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
