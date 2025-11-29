// Lightweight WebSocket client with auto-reconnect and simple pub/sub

type MessageHandler = (data: any) => void;

export default class WSClient {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private shouldReconnect = true;
  private handlers: Set<MessageHandler> = new Set();

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect() {
    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.warn('[WS] connect error', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.debug('[WS] connected');
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        for (const h of this.handlers) {
          try {
            h(msg);
          } catch (e) {
            console.error('WS handler error', e);
          }
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    this.ws.onclose = (ev) => {
      console.debug('[WS] closed', ev && (ev as any).code);
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // close will trigger reconnect
      try {
        this.ws?.close();
      } catch (e) {
        /* ignore */
      }
    };
  }

  private scheduleReconnect() {
    // eslint-disable-next-line no-console
    console.debug('[WS] schedule reconnect in', this.reconnectDelay);
    setTimeout(() => {
      if (!this.shouldReconnect) return;
      // eslint-disable-next-line no-console
      console.debug('[WS] reconnecting...');
      this._connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
    }, this.reconnectDelay);
  }

  disconnect() {
    this.shouldReconnect = false;
    try {
      this.ws?.close();
    } catch (e) {
      /* ignore */
    }
    this.ws = null;
  }

  send(data: any) {
    const s = JSON.stringify(data);
    try {
      this.ws?.send(s);
    } catch (e) {
      // ignore or queue if needed
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
