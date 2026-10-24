import { NativeModules } from 'react-native';

export interface RPCRequest {
  id: string;
  method: string;
  params?: any;
}

export interface RPCResponse {
  id: string;
  type?: 'stdout' | 'stderr' | 'done' | 'telemetry' | 'stream_token' | 'process_exit' | 'session_info' | 'result';
  token?: string;
  result?: any;
  error?: string;
  data?: any;
  exitCode?: number;
  sessionId?: string;
  sessionTitle?: string;
  sessions?: any[];
  messages?: any[];
  [key: string]: any;
}

export type MessageHandler = (res: RPCResponse) => void;

/**
 * Dynamically detects the exact IP of the host machine currently serving the Metro bundle to the phone.
 * Supports home Wi-Fi (192.168.x.x), mobile hotspot (10.x.x.x), office LAN, and web browser.
 */
export function detectHostIp(): string {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'localhost';
    }
    return window.location.hostname;
  }
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/https?:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== '127.0.0.1' && match[1] !== 'localhost') {
      return match[1];
    }
  }
  return '192.168.1.7';
}

export function getDefaultHostUrl(): string {
  const ip = detectHostIp();
  return `ws://${ip}:8443`;
}

class O1RPCClient {
  private ws: WebSocket | null = null;
  private hostUrl: string = getDefaultHostUrl();
  private handlers: Map<string, MessageHandler> = new Map();
  private telemetryListeners: ((data: any) => void)[] = [];
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private offlineQueue: string[] = [];

  constructor() {
    this.connect();
  }

  public onTelemetry(cb: (data: any) => void) {
    this.telemetryListeners.push(cb);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter((l) => l !== cb);
    };
  }

  public setHost(ipOrUrl: string) {
    const clean = ipOrUrl.trim();
    if (clean.startsWith('ws://') || clean.startsWith('wss://')) {
      this.hostUrl = clean;
    } else if (clean.includes(':')) {
      this.hostUrl = `ws://${clean}`;
    } else {
      this.hostUrl = `ws://${clean}:8443`;
    }
    this.connect();
  }

  public isReady(): boolean {
    return this.isConnected;
  }

  public getHost(): string {
    return this.hostUrl;
  }

  public connect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    try {
      console.log(`[O1 RPC] Connecting to host daemon at ${this.hostUrl}...`);
      this.ws = new WebSocket(this.hostUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log(`[O1 RPC] Connected successfully to host daemon at ${this.hostUrl}`);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Flush offline queue immediately upon establishing connection
        while (this.offlineQueue.length > 0) {
          const queued = this.offlineQueue.shift();
          if (queued && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(queued);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const res: RPCResponse = JSON.parse(event.data as string);

          if (res.type === 'telemetry' && res.data) {
            this.telemetryListeners.forEach((cb) => cb(res.data));
          }

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
        console.log(`[O1 RPC] Connection closed to ${this.hostUrl}. Reconnecting in 3s...`);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        console.log(`[O1 RPC] WebSocket connection handshake state for ${this.hostUrl}`);
      };
    } catch (e) {
      console.log('[O1 RPC] Connection attempt ended, scheduling retry...');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        // Dynamically auto-refresh if current host IP is different from active Metro network
        const autoIp = detectHostIp();
        if (this.hostUrl.includes('10.56.5.83') && autoIp !== '10.56.5.83') {
          this.hostUrl = `ws://${autoIp}:8443`;
        }
        this.connect();
      }, 3000);
    }
  }

  public send(method: string, params?: any, onResponse?: MessageHandler): string {
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const payload: RPCRequest = { id, method, params };
    const serialized = JSON.stringify(payload);

    if (onResponse) {
      this.handlers.set(id, onResponse);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
    } else {
      console.log(`[O1 RPC] Queued offline message: ${method} (will dispatch on connect)`);
      this.offlineQueue.push(serialized);
    }

    return id;
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const rpcClient = new O1RPCClient();
