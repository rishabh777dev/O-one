export interface RPCRequest {
  id: string;
  method: string;
  params?: any;
}

export interface RPCResponse {
  id: string;
  type?: 'stdout' | 'stderr' | 'done' | 'telemetry';
  result?: any;
  error?: string;
  data?: any;
}

export type MessageHandler = (res: RPCResponse) => void;

class O1RPCClient {
  private ws: WebSocket | null = null;
  private hostUrl: string = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost' ? 'ws://localhost:8443' : 'ws://100.92.14.8:8443';
  private handlers: Map<string, MessageHandler> = new Map();
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    this.connect();
  }

  public setHost(ipOrUrl: string) {
    if (ipOrUrl.startsWith('ws://') || ipOrUrl.startsWith('wss://')) {
      this.hostUrl = ipOrUrl;
    } else {
      this.hostUrl = `ws://${ipOrUrl}:8443`;
    }
    this.connect();
  }

  public connect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    try {
      this.ws = new WebSocket(this.hostUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log(`[O1 RPC] Connected to host daemon at ${this.hostUrl}`);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const res: RPCResponse = JSON.parse(event.data as string);
          if (res.id && this.handlers.has(res.id)) {
            const handler = this.handlers.get(res.id);
            if (handler) handler(res);
            if (res.type === 'done' || res.result || res.error) {
              this.handlers.delete(res.id);
            }
          }
        } catch (err) {
          console.error('[O1 RPC] Failed to parse message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('[O1 RPC] Disconnected from host daemon. Retrying in 5s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[O1 RPC] WebSocket error:', err);
      };
    } catch (e) {
      console.warn('[O1 RPC] Connection failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 5000);
    }
  }

  public send(method: string, params?: any, onResponse?: MessageHandler): string {
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const payload: RPCRequest = { id, method, params };

    if (onResponse) {
      this.handlers.set(id, onResponse);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.log(`[O1 RPC] Queued offline message: ${method}`);
    }

    return id;
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const rpcClient = new O1RPCClient();
