/**
 * Service initializer for Web Server
 * Provides singleton instances of core services adapted for web use
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { SqliteStore } from '../src/main/sqliteStore';
import { CoworkStore } from '../src/main/coworkStore';
import { CoworkRunner } from '../src/main/libs/coworkRunner';
import { SkillManager } from '../src/main/skillManager';
import { McpStore } from '../src/main/mcpStore';
import { IMGatewayManager } from '../src/main/im';
import { ScheduledTaskStore } from '../src/main/scheduledTaskStore';
import { Scheduler } from '../src/main/libs/scheduler';
import { APP_NAME } from '../src/main/appConstants';
import type { WebSocketServer } from 'ws';
import { broadcastToAll, broadcastToRoom } from './websocket';
import type { CoworkSessionId } from '../src/renderer/types/cowork';

// User data directory path for web version
const getUserDataPath = (): string => {
  const appDataPath = process.env.LOBSTERAI_DATA_PATH || path.join(os.homedir(), `.${APP_NAME.toLowerCase()}`);
  const userDataPath = path.join(appDataPath, 'web');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return userDataPath;
};

export const userDataPath = getUserDataPath();

// Service singletons
let store: SqliteStore | null = null;
let coworkStore: CoworkStore | null = null;
let coworkRunner: CoworkRunner | null = null;
let skillManager: SkillManager | null = null;
let mcpStore: McpStore | null = null;
let imGatewayManager: IMGatewayManager | null = null;
let scheduledTaskStore: ScheduledTaskStore | null = null;
let scheduler: Scheduler | null = null;

// IPC sanitization constants
const IPC_STRING_MAX_CHARS = 4_000;
const IPC_MESSAGE_CONTENT_MAX_CHARS = 120_000;
const IPC_MAX_DEPTH = 5;
const IPC_MAX_KEYS = 80;
const IPC_MAX_ITEMS = 40;

// Sanitization utilities
export const truncateIpcString = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n...[truncated in web API]`;
};

const sanitizeIpcPayload = (value: unknown, depth = 0, seen?: WeakSet<object>): unknown => {
  const localSeen = seen ?? new WeakSet<object>();
  if (
    value === null
    || typeof value === 'number'
    || typeof value === 'boolean'
    || typeof value === 'undefined'
  ) {
    return value;
  }
  if (typeof value === 'string') {
    return truncateIpcString(value, IPC_STRING_MAX_CHARS);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return '[function]';
  }
  if (depth >= IPC_MAX_DEPTH) {
    return '[truncated-depth]';
  }
  if (Array.isArray(value)) {
    const result = value.slice(0, IPC_MAX_ITEMS).map((entry) => sanitizeIpcPayload(entry, depth + 1, localSeen));
    if (value.length > IPC_MAX_ITEMS) {
      result.push(`[truncated-items:${value.length - IPC_MAX_ITEMS}]`);
    }
    return result;
  }
  if (typeof value === 'object') {
    if (localSeen.has(value as object)) {
      return '[circular]';
    }
    localSeen.add(value as object);
    const entries = Object.entries(value as Record<string, unknown>);
    const result: Record<string, unknown> = {};
    for (const [key, entry] of entries.slice(0, IPC_MAX_KEYS)) {
      result[key] = sanitizeIpcPayload(entry, depth + 1, localSeen);
    }
    if (entries.length > IPC_MAX_KEYS) {
      result.__truncated_keys__ = entries.length - IPC_MAX_KEYS;
    }
    return result;
  }
  return String(value);
};

export const sanitizeCoworkMessageForIpc = (message: any): any => {
  if (!message || typeof message !== 'object') {
    return message;
  }

  let sanitizedMetadata: unknown;
  if (message.metadata && typeof message.metadata === 'object') {
    const { imageAttachments, ...rest } = message.metadata as Record<string, unknown>;
    const sanitizedRest = sanitizeIpcPayload(rest) as Record<string, unknown> | undefined;
    sanitizedMetadata = {
      ...(sanitizedRest && typeof sanitizedRest === 'object' ? sanitizedRest : {}),
      ...(Array.isArray(imageAttachments) && imageAttachments.length > 0
        ? { imageAttachments }
        : {}),
    };
  } else {
    sanitizedMetadata = undefined;
  }

  return {
    ...message,
    content: typeof message.content === 'string'
      ? truncateIpcString(message.content, IPC_MESSAGE_CONTENT_MAX_CHARS)
      : '',
    metadata: sanitizedMetadata,
  };
};

export const sanitizePermissionRequestForIpc = (request: any): any => {
  if (!request || typeof request !== 'object') {
    return request;
  }
  return {
    ...request,
    toolInput: sanitizeIpcPayload(request.toolInput ?? {}),
  };
};

// Service getters
export const initStore = async (): Promise<SqliteStore> => {
  if (!store) {
    store = await SqliteStore.create(userDataPath);
  }
  return store;
};

export const getStore = (): SqliteStore => {
  if (!store) {
    throw new Error('Store not initialized. Call initStore() first.');
  }
  return store;
};

export const getCoworkStore = (): CoworkStore => {
  if (!coworkStore) {
    const sqliteStore = getStore();
    coworkStore = new CoworkStore(sqliteStore.getDatabase(), sqliteStore.getSaveFunction());
    const cleaned = coworkStore.autoDeleteNonPersonalMemories();
    if (cleaned > 0) {
      console.info(`[cowork-memory] Auto-deleted ${cleaned} non-personal/procedural memories`);
    }
  }
  return coworkStore;
};

export const getCoworkRunner = (): CoworkRunner => {
  if (!coworkRunner) {
    coworkRunner = new CoworkRunner(getCoworkStore());

    // Provide MCP server configuration to the runner
    coworkRunner.setMcpServerProvider(() => {
      return getMcpStore().getEnabledServers();
    });

    // Set up event listeners to forward via WebSocket
    coworkRunner.on('message', (sessionId: CoworkSessionId, message: any) => {
      const safeMessage = sanitizeCoworkMessageForIpc(message);
      broadcastToRoom('cowork', sessionId, {
        type: 'cowork:stream:message',
        data: { sessionId, message: safeMessage },
      });
    });

    coworkRunner.on('messageUpdate', (sessionId: CoworkSessionId, messageId: string, content: string) => {
      const safeContent = truncateIpcString(content, 120000);
      broadcastToRoom('cowork', sessionId, {
        type: 'cowork:stream:messageUpdate',
        data: { sessionId, messageId, content: safeContent },
      });
    });

    coworkRunner.on('permissionRequest', (sessionId: CoworkSessionId, request: any) => {
      if (coworkRunner?.getSessionConfirmationMode(sessionId) === 'text') {
        return;
      }
      const safeRequest = sanitizePermissionRequestForIpc(request);
      broadcastToRoom('cowork', sessionId, {
        type: 'cowork:stream:permission',
        data: { sessionId, request: safeRequest },
      });
    });

    coworkRunner.on('complete', (sessionId: CoworkSessionId, claudeSessionId: string | null) => {
      broadcastToRoom('cowork', sessionId, {
        type: 'cowork:stream:complete',
        data: { sessionId, claudeSessionId },
      });
    });

    coworkRunner.on('error', (sessionId: CoworkSessionId, error: string) => {
      broadcastToRoom('cowork', sessionId, {
        type: 'cowork:stream:error',
        data: { sessionId, error },
      });
    });
  }
  return coworkRunner;
};

export const getSkillManager = (): SkillManager => {
  if (!skillManager) {
    skillManager = new SkillManager(getStore);
  }
  return skillManager;
};

export const getMcpStore = (): McpStore => {
  if (!mcpStore) {
    const sqliteStore = getStore();
    mcpStore = new McpStore(sqliteStore.getDatabase(), sqliteStore.getSaveFunction());
  }
  return mcpStore;
};

export const getIMGatewayManager = (): IMGatewayManager => {
  if (!imGatewayManager) {
    const sqliteStore = getStore();
    const runner = getCoworkRunner();
    const store = getCoworkStore();

    imGatewayManager = new IMGatewayManager(
      sqliteStore.getDatabase(),
      sqliteStore.getSaveFunction(),
      {
        coworkRunner: runner,
        coworkStore: store,
      }
    );

    // Initialize with LLM config provider
    imGatewayManager.initialize({
      getLLMConfig: async () => {
        const appConfig = sqliteStore.get<any>('app_config');
        if (!appConfig) return null;

        const providers = appConfig.providers || {};
        for (const [providerName, providerConfig] of Object.entries(providers) as [string, any][]) {
          if (providerConfig.enabled && providerConfig.apiKey) {
            const model = providerConfig.models?.[0]?.id;
            return {
              apiKey: providerConfig.apiKey,
              baseUrl: providerConfig.baseUrl,
              model: model,
              provider: providerName,
            };
          }
        }

        if (appConfig.api?.key) {
          return {
            apiKey: appConfig.api.key,
            baseUrl: appConfig.api.baseUrl,
            model: appConfig.model?.defaultModel,
          };
        }

        return null;
      },
      getSkillsPrompt: async () => {
        return getSkillManager().buildAutoRoutingPrompt();
      },
    });

    // Forward IM events via WebSocket
    imGatewayManager.on('statusChange', (status) => {
      broadcastToAll({
        type: 'im:status:change',
        data: status,
      });
    });

    imGatewayManager.on('message', (message) => {
      broadcastToAll({
        type: 'im:message:received',
        data: message,
      });
    });

    imGatewayManager.on('error', ({ platform, error }) => {
      console.error(`[IM Gateway] ${platform} error:`, error);
    });
  }
  return imGatewayManager;
};

export const getScheduledTaskStore = (): ScheduledTaskStore => {
  if (!scheduledTaskStore) {
    const sqliteStore = getStore();
    scheduledTaskStore = new ScheduledTaskStore(sqliteStore.getDatabase(), sqliteStore.getSaveFunction());
  }
  return scheduledTaskStore;
};

export const getScheduler = (): Scheduler => {
  if (!scheduler) {
    scheduler = new Scheduler({
      scheduledTaskStore: getScheduledTaskStore(),
      coworkStore: getCoworkStore(),
      getCoworkRunner,
      getIMGatewayManager: () => {
        try { return getIMGatewayManager(); } catch { return null; }
      },
      getSkillsPrompt: async () => {
        return getSkillManager().buildAutoRoutingPrompt();
      },
    });

    // Note: Scheduler does not emit events in web version
    // Status updates are polled via API instead
  }
  return scheduler;
};

// Request context type
export interface RequestContext {
  store: SqliteStore;
  coworkStore: CoworkStore;
  coworkRunner: CoworkRunner;
  skillManager: SkillManager;
  mcpStore: McpStore;
  imGatewayManager: IMGatewayManager;
  scheduledTaskStore: ScheduledTaskStore;
  scheduler: Scheduler;
  getWss: () => WebSocketServer;
}

// Build request context for API routes
export const buildRequestContext = (getWss: () => WebSocketServer): RequestContext => {
  return {
    store: getStore(),
    coworkStore: getCoworkStore(),
    coworkRunner: getCoworkRunner(),
    skillManager: getSkillManager(),
    mcpStore: getMcpStore(),
    imGatewayManager: getIMGatewayManager(),
    scheduledTaskStore: getScheduledTaskStore(),
    scheduler: getScheduler(),
    getWss,
  };
};
