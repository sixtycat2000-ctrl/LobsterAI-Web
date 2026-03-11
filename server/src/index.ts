import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initWebSocketServer, broadcastToAll, broadcastToRoom } from '../websocket';
import { setupStoreRoutes } from '../routes/store';
import { setupSkillsRoutes } from '../routes/skills';
import { setupMcpRoutes } from '../routes/mcp';
import { setupCoworkRoutes } from '../routes/cowork';
import { setupScheduledTaskRoutes } from '../routes/scheduledTasks';
import { setupPermissionsRoutes } from '../routes/permissions';
import { setupAppRoutes } from '../routes/app';
import { setupLogRoutes } from '../routes/log';
import { setupApiProxyRoutes } from '../routes/apiProxy';
import { setupDialogRoutes } from '../routes/dialog';
import { setupShellRoutes } from '../routes/shell';
import { setupFilesRoutes } from '../routes/files';

// Import existing main process modules
import { SqliteStore } from '../sqliteStore.web';
import { CoworkStore } from '../../src/main/coworkStore';
import { CoworkRunner } from '../../src/main/libs/coworkRunner';
import { SkillManager } from '../../src/main/skillManager';
import { McpStore } from '../../src/main/mcpStore';
import { ScheduledTaskStore } from '../../src/main/scheduledTaskStore';
import { Scheduler } from '../../src/main/libs/scheduler';
import { initLogger, getLogFilePath } from '../../src/main/logger';
import { setStoreGetter } from '../../src/main/libs/claudeSettings';
import { startCoworkOpenAICompatProxy } from '../../src/main/libs/coworkOpenAICompatProxy';
import { getCoworkLogPath } from '../../src/main/libs/coworkLogger';
import { exportLogsZip } from '../../src/main/libs/logExport';
import { APP_NAME } from '../../src/main/appConstants';
import { CoworkSessionId } from '../../src/renderer/types/cowork';

// Types for context passed to routes
export interface RequestContext {
  store: SqliteStore;
  coworkStore: CoworkStore;
  coworkRunner: CoworkRunner;
  skillManager: SkillManager;
  mcpStore: McpStore;
  scheduledTaskStore: ScheduledTaskStore;
  scheduler: Scheduler;
  getWss: () => import('ws').WebSocketServer;
}

// Re-export types used by routes
export type { CoworkSessionId };

// Server options interface
export interface ServerOptions {
  port?: number;
  host?: string;
  dataDir?: string;
  workspace?: string;
}

// Default configuration
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = 'localhost';

// User data directory (web version uses a different path than Electron)
const getUserDataPath = (customDataDir?: string): string => {
  if (customDataDir) {
    if (!fs.existsSync(customDataDir)) {
      fs.mkdirSync(customDataDir, { recursive: true });
    }
    return customDataDir;
  }
  const appDataPath = process.env.LOBSTERAI_DATA_PATH || path.join(os.homedir(), `.${APP_NAME.toLowerCase()}`);
  const userDataPath = path.join(appDataPath, 'web');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return userDataPath;
};

// Global options
let serverOptions: Required<ServerOptions> = {
  port: DEFAULT_PORT,
  host: DEFAULT_HOST,
  dataDir: '',
  workspace: os.homedir(),
};

// Initialize logger
initLogger();

// Global state (similar to main.ts singleton pattern)
let store: SqliteStore | null = null;
let coworkStore: CoworkStore | null = null;
let coworkRunner: CoworkRunner | null = null;
let skillManager: SkillManager | null = null;
let mcpStore: McpStore | null = null;
let scheduledTaskStore: ScheduledTaskStore | null = null;
let scheduler: Scheduler | null = null;
let wss: import('ws').WebSocketServer | null = null;

const initStore = async (): Promise<SqliteStore> => {
  if (!store) {
    store = await SqliteStore.create(getUserDataPath(serverOptions.dataDir));
  }
  return store;
};

const getCoworkStore = (): CoworkStore => {
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

const getCoworkRunner = (): CoworkRunner => {
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

const getSkillManager = (): SkillManager => {
  if (!skillManager) {
    // Type assertion: web SqliteStore is compatible with main process version for SkillManager's usage
    skillManager = new SkillManager(getStore as any);
  }
  return skillManager;
};

const getMcpStore = (): McpStore => {
  if (!mcpStore) {
    const sqliteStore = getStore();
    mcpStore = new McpStore(sqliteStore.getDatabase(), sqliteStore.getSaveFunction());
  }
  return mcpStore;
};

const getScheduledTaskStore = (): ScheduledTaskStore => {
  if (!scheduledTaskStore) {
    const sqliteStore = getStore();
    scheduledTaskStore = new ScheduledTaskStore(sqliteStore.getDatabase(), sqliteStore.getSaveFunction());
  }
  return scheduledTaskStore;
};

const getScheduler = (): Scheduler => {
  if (!scheduler) {
    scheduler = new Scheduler({
      scheduledTaskStore: getScheduledTaskStore(),
      coworkStore: getCoworkStore(),
      getCoworkRunner,
      getSkillsPrompt: async () => {
        return getSkillManager().buildAutoRoutingPrompt();
      },
    });

    // Note: Scheduler does not emit events in web version
    // Status updates are polled via API instead
  }
  return scheduler;
};

const getStore = (): SqliteStore => {
  if (!store) {
    throw new Error('Store not initialized. Call initStore() first.');
  }
  return store;
};

// Sanitization utilities (copied from main.ts)
const IPC_STRING_MAX_CHARS = 4_000;
const IPC_MESSAGE_CONTENT_MAX_CHARS = 120_000;
const IPC_MAX_DEPTH = 5;
const IPC_MAX_KEYS = 80;
const IPC_MAX_ITEMS = 40;

const truncateIpcString = (value: string, maxChars: number): string => {
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

const sanitizeCoworkMessageForIpc = (message: any): any => {
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

const sanitizePermissionRequestForIpc = (request: any): any => {
  if (!request || typeof request !== 'object') {
    return request;
  }
  return {
    ...request,
    toolInput: sanitizeIpcPayload(request.toolInput ?? {}),
  };
};

// User data path (export for use in routes)
// Note: This will be set after startServer is called
export const userDataPath = getUserDataPath();

// Create Express app
const app = express();

// Store user data path in app for routes to access
app.set('userDataPath', userDataPath);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[API] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create request context middleware
const requestContextMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await initStore();
    req.context = {
      store: getStore(),
      coworkStore: getCoworkStore(),
      coworkRunner: getCoworkRunner(),
      skillManager: getSkillManager(),
      mcpStore: getMcpStore(),
      scheduledTaskStore: getScheduledTaskStore(),
      scheduler: getScheduler(),
      getWss: () => wss!,
    };
    next();
  } catch (error) {
    console.error('[Middleware] Failed to initialize context:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize request context' });
  }
};

// Apply context middleware to all API routes
app.use('/api', requestContextMiddleware);

// Setup API routes
setupStoreRoutes(app);
setupSkillsRoutes(app);
setupMcpRoutes(app);
setupCoworkRoutes(app);
setupScheduledTaskRoutes(app);
setupPermissionsRoutes(app);
setupAppRoutes(app);
setupLogRoutes(app);
setupApiProxyRoutes(app);
setupDialogRoutes(app);
setupShellRoutes(app);
setupFilesRoutes(app);

// Store workspace path in app for files routes to access
app.set('workspace', serverOptions.workspace);

// Serve static files from production build
const publicPath = path.join(__dirname, '../public');

if (process.env.NODE_ENV === 'production') {
  // Check if public directory exists
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));

    // SPA fallback - serve index.html for client-side routing
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      // Skip API routes and WebSocket upgrade requests
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        return next();
      }
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  } else {
    console.warn('[Server] Warning: Public directory not found at', publicPath);
  }
} else {
  // Development mode: provide info when accessing root path directly
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: APP_NAME,
      message: 'API server is running. In development mode, access the UI via Vite dev server at http://localhost:5176',
      apiEndpoints: {
        health: '/health',
        api: '/api/*',
        websocket: '/ws',
      },
    });
  });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Create HTTP server
const server = http.createServer(app);

// Start server
const startServer = async (options: ServerOptions = {}): Promise<http.Server> => {
  // Merge options with defaults
  serverOptions = {
    port: options.port ?? parseInt(process.env.PORT?.toString() || '') ?? DEFAULT_PORT,
    host: options.host ?? DEFAULT_HOST,
    dataDir: options.dataDir ?? '',
    workspace: options.workspace ?? os.homedir(),
  };

  // Update workspace in app settings
  app.set('workspace', serverOptions.workspace);

  try {
    // Initialize store before starting
    await initStore();

    // Set store getter for claudeSettings
    setStoreGetter(getStore);

    // Start OpenAI compatibility proxy for non-Anthropic providers
    await startCoworkOpenAICompatProxy();
    console.log('[Server] OpenAI compatibility proxy started');

    // Initialize WebSocket server
    wss = initWebSocketServer(server);

    return new Promise((resolve) => {
      server.listen(serverOptions.port, serverOptions.host, () => {
        console.log(`[Server] ${APP_NAME} Web Server running on http://${serverOptions.host}:${serverOptions.port}`);
        console.log(`[Server] WebSocket server initialized`);
        console.log(`[Server] User data path: ${getUserDataPath(serverOptions.dataDir)}`);
        console.log(`[Server] Workspace: ${serverOptions.workspace}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
        resolve(server);
      });
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

// Export for testing
export { app, startServer, getStore, getCoworkStore, getCoworkRunner, broadcastToAll, broadcastToRoom };

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

// Start server if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  startServer();
}
