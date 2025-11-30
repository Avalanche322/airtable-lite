import { useEffect, useMemo } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import WSClient from "../realtime/wsClient";
import { Item, ItemsPage } from "../../features/table/types";

// Helper: merge an incoming item into the react-query infinite list cache
function mergeItemIntoCache(queryClient: QueryClient, incoming: Item) {
  const key = ["items"] as const;
  const current = queryClient.getQueryData(key) as { pages: ItemsPage[]};
  if (!current) return;
  const pages = (current.pages || []).map((page) => {
    const items = (page.items || []).map((it) => {
      if (it.id !== incoming.id) return it;

      const existingVersion = it.version ?? 0;
      const incomingVersion = incoming.version ?? 0;

      const pending = it.__pending;

      if (pending) {
        // Another update was in-flight from this client when a server update arrived.
        const pendingPatch = pending.patch || {};
        const patchMatches = Object.keys(pendingPatch).every((k) => {
          return (
            incoming[k as keyof Item] === pendingPatch[k as keyof Item] ||
            (incoming as any).data?.[k] === pendingPatch[k as keyof Item]
          );
        });

        if (patchMatches) {
          // Server applied our patch — accept authoritative incoming and clear pending/conflict
          return { ...incoming, __conflict: false };
        }

        if (incomingVersion > (pending.baseVersion ?? 0)) {
          // Conflict detected: keep optimistic UI but mark conflict and attach server snapshot
          return { ...it, __conflict: true, __serverData: incoming };
        }

        // otherwise ignore older incoming
        return it;
      }

      // no pending: apply incoming if newer
      if (incomingVersion >= existingVersion)
        return { ...it, ...incoming, __conflict: false };
      return it;
    });
    return { ...page, items };
  });

  // if the item wasn't found in any page, inject into first page (newly created)
  const found = pages.some((p: ItemsPage) =>
    p.items.some((it) => it.id === incoming.id)
  );
  if (!found) {
    if (pages.length > 0) {
      pages[0] = { ...pages[0], items: [incoming, ...pages[0].items] };
    } else {
      pages.push({ items: [incoming], nextCursor: null, total: 1 });
    }
  }

  queryClient.setQueryData(key, { ...current, pages });
}

export default function useRealtime() {
  const queryClient = useQueryClient();

  const wsUrl = useMemo(() => {
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const port = "4000";
    return `${protocol}//${loc.hostname}:${port}/ws`;
  }, []);

  useEffect(() => {
    const client = new WSClient(wsUrl);
    client.connect();

    const off = client.onMessage((msg) => {
      if (!msg || typeof msg !== "object") return;
      const { type, payload } = msg;
      if (!type) return;
      if (type === "item:updated" || type === "item:created") {
        try {
          const incoming: Item = {
            id: payload.id,
            title: payload.data?.title,
            score: payload.data?.score,
            status: payload.data?.status,
            created_at: payload.created_at,
            updated_at: payload.updated_at,
            version: payload.version,
            // copy any other data fields so UI can read them
            ...payload.data,
          } as Item;
          mergeItemIntoCache(queryClient, incoming);
        } catch (e) {
          // ignore parse errors
          // eslint-disable-next-line no-console
          console.error("Failed to apply incoming item", e);
        }
      }
    });

    return () => {
      off();
      client.disconnect();
    };
  }, [queryClient, wsUrl]);
}
