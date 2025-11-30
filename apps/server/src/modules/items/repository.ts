import { query } from "../../db";
import SERVER_ID from "../../utiles/serverId";

export async function find({
  cursor,
  fetchSize,
}: {
  cursor: string;
  fetchSize: string;
}) {
  const size = Math.min(Number(fetchSize || 50), 1000);

  const rowsResult = cursor
    ? await query(
        `SELECT id, data, created_at, updated_at, version
         FROM items WHERE id > $1 ORDER BY id ASC LIMIT $2`,
        [cursor, size]
      )
    : await query(
        `SELECT id, data, created_at, updated_at, version
         FROM items ORDER BY id ASC LIMIT $1`,
        [size]
      );

  const totalRes = await query("SELECT COUNT(*)::bigint as count FROM items");

  const rows = rowsResult.rows;
  return {
    rows,
    nextCursor: rows.length === size ? rows[rows.length - 1].id : null,
    total: Number(totalRes.rows[0]?.count ?? 0),
  };
}

export async function insert(data: Record<string, any>) {
  const result = await query(
    "INSERT INTO items (data) VALUES ($1) RETURNING id, data, created_at, updated_at, version",
    [data],
  );
  return result.rows[0];
}

export async function update(id: number, patch: Record<string, any>) {
  const res = await query(
    `UPDATE items 
     SET data = data || $1::jsonb, updated_at = now(), version = version + 1 
     WHERE id = $2 
     RETURNING id, data, created_at, updated_at, version`,
    [patch, id],
  );
  return res.rows[0];
}

export async function publishNotify(type: string, row: Record<string, any>) {
  const payload = {
    type,
    payload: row,
    origin: SERVER_ID,
  };
  await query("SELECT pg_notify($1, $2)", ["items", JSON.stringify(payload)]);
}
