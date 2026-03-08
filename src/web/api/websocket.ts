/**
 * WebSocket Client for Web Build
 * Provides real-time bidirectional communication with the backend server
 */

type EventCallback<T = unknown> = (data: T) => void;
type CleanupFn = () => void;

interface WebSocketMessage {
  type: string;
  data: unknown;
}

// WebSocket event types (matching IPC events)
export const WS_EVENTS = {
  // Cowork events
  COWORK_MESSAGE: 'cowork:message',
  COWORK_MESSAGE_UPDATE: 'cowork:messageUpdate',
  COWORK_PERMISSION: 'cowork:permission',
  COWORK_COMPLETE: 'cowork:complete',
  COWORK_ERROR: 'cowork:error',
  COWORK_SANDBOX_PROGRESS: 'cowork:sandboxProgress',

  // IM events
  IM_STATUS_CHANGE: 'im:statusChange',
  IM_MESSAGE_RECEIVED: 'im:messageReceived',

  // Scheduled task events
  TASK_STATUS_UPDATE: 'task:statusUpdate',
  TASK_RUN_UPDATE: 'task:runUpdate',

  // Skill events
  SKILLS_CHANGED: 'skills:changed',

  // App events
  UPDATE_DOWNLOAD_PROGRESS: 'app:updateDownloadProgress',
  WINDOW_STATE_CHANGED: 'app:windowStateChanged',
} as const;

// Get default WebSocket URL
const getDefaultWsUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_HOST || window.location.host;
  const path = import.meta.env.VITE_WS_PATH || '/ws';
  return `${protocol}//${host}${path}`;
};

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

  /**
   * Connect to WebSocket server
   */
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
            this.emitLocal(message.type, message.data);
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

          // Auto-reconnect unless manually closed
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

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManuallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectPromise = null;
  }

  /**
   * Emit event to local listeners
   */
  private emitLocal(type: string, data: unknown): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Subscribe to an event
   * Returns a cleanup function
   */
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

  /**
   * Subscribe to a room/channel
   */
  subscribe(room: string): void {
    this.send('subscribe', { room });
  }

  /**
   * Unsubscribe from a room/channel
   */
  unsubscribe(room: string): void {
    this.send('unsubscribe', { room });
  }

  /**
   * Send a message to the server
   */
  emit(event: string, data: unknown): void {
    this.send(event, data);
  }

  /**
   * Send raw message
   */
  send(type: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data } as WebSocketMessage));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get ready state
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient(getDefaultWsUrl());
