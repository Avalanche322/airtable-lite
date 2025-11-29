import { pool } from './db';
import { broadcast } from './ws';
import { SERVER_ID } from './serverId';

let listeningClient: any = null;
let shouldRun = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentBackoff = 1000;
const MIN_BACKOFF = 1000;
const MAX_BACKOFF = 30000;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer as any);
    reconnectTimer = null;
  }
}

async function attemptConnect() {
  try {
    const client = await pool.connect();
    listeningClient = client;

    // Listen for notifications
    await client.query('LISTEN items');

    client.on('notification', (msg: any) => {
      try {
        if (!msg || !msg.payload) return;
        const parsed = JSON.parse(msg.payload);
        if (parsed && parsed.origin && parsed.origin === SERVER_ID) return;
        broadcast(parsed);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('pgListener notification error', e);
      }
    });

    client.on('error', (err: any) => {
      // eslint-disable-next-line no-console
      console.error('pgListener client error', err);
      scheduleReconnect();
    });

    client.on('end', () => {
      // connection ended, try to reconnect
      // eslint-disable-next-line no-console
      console.warn('pgListener connection ended');
      scheduleReconnect();
    });

    // reset backoff on successful connect
    currentBackoff = MIN_BACKOFF;
    // eslint-disable-next-line no-console
    console.log('Postgres LISTEN/NOTIFY listener started on channel "items"');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to start pg listener', e);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  clearReconnectTimer();
  if (!shouldRun) return;
  const backoff = Math.min(currentBackoff, MAX_BACKOFF);
  // eslint-disable-next-line no-console
  console.debug(`pgListener scheduling reconnect in ${backoff}ms`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    // release any existing client reference
    try {
      if (listeningClient) {
        try {
          listeningClient.removeAllListeners?.();
          listeningClient.release?.();
        } catch (_) {
          /* ignore */
        }
        listeningClient = null;
      }
    } catch (_) {
      /* ignore */
    }
    currentBackoff = Math.min(Math.floor(currentBackoff * 1.5), MAX_BACKOFF);
    attemptConnect();
  }, backoff) as unknown as NodeJS.Timeout;
}

export async function startPgListener() {
  if (shouldRun) return;
  shouldRun = true;
  clearReconnectTimer();
  currentBackoff = MIN_BACKOFF;
  attemptConnect();
}

export async function stopPgListener() {
  shouldRun = false;
  clearReconnectTimer();
  try {
    if (listeningClient) {
      try {
        await listeningClient.query('UNLISTEN items');
      } catch (_) {
        /* ignore */
      }
      try {
        listeningClient.removeAllListeners?.();
      } catch (_) {
        /* ignore */
      }
      try {
        listeningClient.release?.();
      } catch (_) {
        /* ignore */
      }
      listeningClient = null;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Error stopping pg listener', e);
  }
}
