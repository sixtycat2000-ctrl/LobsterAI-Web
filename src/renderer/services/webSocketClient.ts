/**
 * WebSocket Client for Web Build
 * Replaces IPC event listeners with WebSocket events
 */

type EventCallback<T = unknown> = (data: T) => void;
type CleanupFn = () => void;

interface WebSocketMessage {
  type: string;
  data: unknown;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManuallyClosed = false;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private connectPromise: Promise<void> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.isManuallyClosed = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit(message.type, message.data);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.connectPromise = null;

          if (!this.isManuallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });

    return this.connectPromise;
  }

  disconnect(): void {
    this.isManuallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectPromise = null;
  }

  private emit(type: string, data: unknown): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  on<T = unknown>(type: string, callback: EventCallback<T>): CleanupFn {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback as EventCallback);

    // Auto-connect if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect().catch(console.error);
    }

    // Return cleanup function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback as EventCallback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  send(type: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data } as WebSocketMessage));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// WebSocket event types (matching server events)
export const WS_EVENTS = {
  // Cowork events (matching server websocket.ts)
  COWORK_MESSAGE: 'cowork:stream:message',
  COWORK_MESSAGE_UPDATE: 'cowork:stream:messageUpdate',
  COWORK_PERMISSION: 'cowork:stream:permission',
  COWORK_COMPLETE: 'cowork:stream:complete',
  COWORK_ERROR: 'cowork:stream:error',

  // Scheduled task events
  TASK_STATUS_UPDATE: 'scheduledTask:statusUpdate',
  TASK_RUN_UPDATE: 'scheduledTask:runUpdate',

  // Skill events
  SKILLS_CHANGED: 'skills:changed',

  // File events
  FILE_CHANGED: 'file:changed',
} as const;

// Singleton instance - URL will be configured based on environment
const getDefaultWsUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_HOST || window.location.host;
  const path = import.meta.env.VITE_WS_PATH || '/ws';
  return `${protocol}//${host}${path}`;
};

export const webSocketClient = new WebSocketClient(getDefaultWsUrl());
