import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import { randomUUID } from 'crypto';

// Message types for WebSocket communication
export type WSMessageType =
  | 'system:connected'
  | 'system:error'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'cowork:stream:message'
  | 'cowork:stream:messageUpdate'
  | 'cowork:stream:permission'
  | 'cowork:stream:complete'
  | 'cowork:stream:error'
  | 'cowork:sandbox:downloadProgress'
  | 'im:status:change'
  | 'im:message:received'
  | 'scheduledTask:statusUpdate'
  | 'scheduledTask:runUpdate'
  | 'skills:changed'
  | 'api:stream:data'
  | 'api:stream:done'
  | 'api:stream:error'
  | 'api:stream:abort'
  | 'appUpdate:downloadProgress';

export interface WSMessage {
  type: WSMessageType;
  data: unknown;
  id?: string;
}

// Room-based subscription management
// Clients can subscribe to specific rooms (e.g., cowork session IDs)
interface WSClient {
  id: string;
  ws: WebSocket;
  rooms: Set<string>;
}

let wss: WebSocketServer | null = null;
const clients = new Map<WebSocket, WSClient>();
const roomSubscriptions = new Map<string, Set<WSClient>>();

// Initialize WebSocket server
export const initWebSocketServer = (server: HTTPServer): WebSocketServer => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = randomUUID();
    const client: WSClient = {
      id: clientId,
      ws,
      rooms: new Set(),
    };

    clients.set(ws, client);
    console.log(`[WebSocket] Client connected: ${clientId}`);

    // Send welcome message
    sendToClient(ws, {
      type: 'system:connected',
      data: { clientId },
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        handleClientMessage(client, message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      // Unsubscribe from all rooms
      client.rooms.forEach((room) => {
        const roomClients = roomSubscriptions.get(room);
        if (roomClients) {
          roomClients.delete(client);
          if (roomClients.size === 0) {
            roomSubscriptions.delete(room);
          }
        }
      });

      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for client ${clientId}:`, error);
    });

    // Respond to ping messages
    ws.on('ping', () => {
      ws.pong();
    });
  });

  wss.on('error', (error) => {
    console.error('[WebSocket] Server error:', error);
  });

  return wss;
};

// Handle incoming messages from clients
const handleClientMessage = (client: WSClient, message: WSMessage) => {
  switch (message.type) {
    case 'subscribe':
      // Subscribe to a room (e.g., cowork session)
      const roomId = message.data as string;
      if (roomId) {
        subscribeToRoom(client, roomId);
      }
      break;

    case 'unsubscribe':
      // Unsubscribe from a room
      const unsubscribeRoomId = message.data as string;
      if (unsubscribeRoomId) {
        unsubscribeFromRoom(client, unsubscribeRoomId);
      }
      break;

    case 'ping':
      sendToClient(client.ws, {
        type: 'pong',
        data: { timestamp: Date.now() },
      });
      break;

    default:
      console.warn(`[WebSocket] Unknown message type: ${message.type}`);
  }
};

// Subscribe a client to a room
export const subscribeToRoom = (client: WSClient, roomId: string) => {
  client.rooms.add(roomId);

  if (!roomSubscriptions.has(roomId)) {
    roomSubscriptions.set(roomId, new Set());
  }
  roomSubscriptions.get(roomId)!.add(client);

  console.log(`[WebSocket] Client ${client.id} subscribed to room: ${roomId}`);
};

// Unsubscribe a client from a room
export const unsubscribeFromRoom = (client: WSClient, roomId: string) => {
  client.rooms.delete(roomId);

  const roomClients = roomSubscriptions.get(roomId);
  if (roomClients) {
    roomClients.delete(client);
    if (roomClients.size === 0) {
      roomSubscriptions.delete(roomId);
    }
  }

  console.log(`[WebSocket] Client ${client.id} unsubscribed from room: ${roomId}`);
};

// Send a message to a specific client
const sendToClient = (ws: WebSocket, message: WSMessage): boolean => {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      return false;
    }
  }
  return false;
};

// Broadcast a message to all connected clients
export const broadcastToAll = (message: WSMessage): void => {
  let successCount = 0;
  clients.forEach((client) => {
    if (sendToClient(client.ws, message)) {
      successCount++;
    }
  });
  console.log(`[WebSocket] Broadcast to ${successCount}/${clients.size} clients: ${message.type}`);
};

// Broadcast a message to all clients subscribed to a specific room
export const broadcastToRoom = (roomNamespace: string, roomId: string, message: WSMessage): void => {
  const fullRoomId = `${roomNamespace}:${roomId}`;
  const roomClients = roomSubscriptions.get(fullRoomId);

  if (!roomClients || roomClients.size === 0) {
    console.log(`[WebSocket] No clients in room: ${fullRoomId}`);
    return;
  }

  let successCount = 0;
  roomClients.forEach((client) => {
    if (sendToClient(client.ws, message)) {
      successCount++;
    }
  });

  console.log(`[WebSocket] Broadcast to ${successCount}/${roomClients.size} clients in room ${fullRoomId}: ${message.type}`);
};

// Send a message to a specific client by ID
export const sendToClientById = (clientId: string, message: WSMessage): boolean => {
  for (const client of clients.values()) {
    if (client.id === clientId) {
      return sendToClient(client.ws, message);
    }
  }
  return false;
};

// Get active WebSocket server instance
export const getWss = (): WebSocketServer | null => wss;

// Get connected clients count
export const getClientsCount = (): number => clients.size;

// Get room subscriber count
export const getRoomSubscribersCount = (roomNamespace: string, roomId: string): number => {
  const fullRoomId = `${roomNamespace}:${roomId}`;
  return roomSubscriptions.get(fullRoomId)?.size || 0;
};

// Export types for use in other modules
export type { WSClient };
