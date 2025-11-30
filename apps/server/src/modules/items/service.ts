import * as repo from "./repository";

import { broadcast } from "../../ws/ws";

export async function getItems({
  cursor,
  fetchSize,
}: {
  cursor: string;
  fetchSize: string;
}) {
  return repo.find({ cursor, fetchSize });
}

export async function createItem(data: Record<string, any>) {
  const row = await repo.insert(data);

  broadcast({ type: "item:created", payload: row });
  await repo.publishNotify("item:created", row);

  return row;
}

export async function updateItem(id: number, patch: Record<string, any>) {
  const row = await repo.update(id, patch);
  if (!row) return null;

  broadcast({ type: "item:updated", payload: row });
  await repo.publishNotify("item:updated", row);

  return row;
}
