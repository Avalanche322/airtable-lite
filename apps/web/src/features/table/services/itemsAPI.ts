import httpService from "../../../shared/utiles/httpService";
import { Item, ItemsPage } from "../types";

export const getAllItems = async ({ cursor, fetchSize = 50 }: { cursor?: number | null; fetchSize?: number } = {}): Promise<ItemsPage> => {
  const params: any = { fetchSize };
  if (typeof cursor !== 'undefined' && cursor !== null) params.cursor = cursor;
  const res = await httpService.get(`/items`, { params });
  const body = res.data as { rows: any[]; nextCursor: number | null; total: number };
  const items: Item[] = (body.rows || []).map((r) => ({ id: r.id, ...r.data, created_at: r.created_at, updated_at: r.updated_at, version: r.version }));
  return { items, nextCursor: body.nextCursor ?? null, total: body.total ?? 0 };
};

export const updateItem = async (id: number, patch: Record<string, any>) => {
  const res = await httpService.patch(`/items/${id}`, patch);
  const body = res.data as { id: number; data: any; created_at?: string; updated_at?: string; version?: number };
  return { id: body.id, ...body.data, created_at: body.created_at, updated_at: body.updated_at, version: body.version } as Item & { updated_at?: string; version?: number };
};