/**
 * Test environment setup for LobsterAI WebControl server tests.
 * This module provides utilities to start/stop the Express server for testing.
 */

import http from 'node:http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Use tsx to load TypeScript modules
import { require } from 'tsx/cjs/api';

// Get the project root directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Load ESM modules via tsx
const express = require(path.join(projectRoot, 'node_modules', 'express'), __dirname);
const cors = require(path.join(projectRoot, 'node_modules', 'cors'), __dirname);
const { WebSocketServer } = require(path.join(projectRoot, 'node_modules', 'ws'), __dirname);

// Import the web-compatible SqliteStore
const { SqliteStore } = require(path.join(projectRoot, 'server', 'sqliteStore.web.ts'), __dirname);

// Import route setup functions using tsx for TypeScript files
const { setupStoreRoutes } = require(path.join(projectRoot, 'server', 'routes', 'store.ts'), __dirname);
const { setupSkillsRoutes } = require(path.join(projectRoot, 'server', 'routes', 'skills.ts'), __dirname);
const { setupMcpRoutes } = require(path.join(projectRoot, 'server', 'routes', 'mcp.ts'), __dirname);
const { setupCoworkRoutes } = require(path.join(projectRoot, 'server', 'routes', 'cowork.ts'), __dirname);
const { setupScheduledTaskRoutes } = require(path.join(projectRoot, 'server', 'routes', 'scheduledTasks.ts'), __dirname);
const { setupPermissionsRoutes } = require(path.join(projectRoot, 'server', 'routes', 'permissions.ts'), __dirname);
const { setupAppRoutes } = require(path.join(projectRoot, 'server', 'routes', 'app.ts'), __dirname);
const { setupLogRoutes } = require(path.join(projectRoot, 'server', 'routes', 'log.ts'), __dirname);
const { setupApiProxyRoutes } = require(path.join(projectRoot, 'server', 'routes', 'apiProxy.ts'), __dirname);
const { setupDialogRoutes } = require(path.join(projectRoot, 'server', 'routes', 'dialog.ts'), __dirname);
const { setupShellRoutes } = require(path.join(projectRoot, 'server', 'routes', 'shell.ts'), __dirname);

// Test data directory
let testDataDir = null;

/**
 * Create test data directory
 */
function ensureTestDataDir() {
  if (!testDataDir) {
    testDataDir = path.join(os.tmpdir(), `lobsterai-test-${Date.now()}`);
  }
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  return testDataDir;
}

/**
 * Simple mock implementations for Electron-dependent modules
 */
function createMockCoworkStore() {
  const sessions = new Map();
  const messages = new Map();
  const memories = [];
  const config = {
    workingDirectory: '',
    systemPrompt: '',
    executionMode: 'local',
    memoryEnabled: true,
    memoryGuardLevel: 'standard',
  };

  return {
    getConfig: () => config,
    setConfig: (newConfig) => Object.assign(config, newConfig),
    createSession: (title, cwd, systemPrompt, executionMode, skillIds) => {
      const id = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const session = {
        id,
        title,
        cwd,
        systemPrompt,
        executionMode: executionMode || 'local',
        activeSkillIds: skillIds || [],
        status: 'idle',
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      sessions.set(id, session);
      messages.set(id, []);
      return session;
    },
    getSession: (id) => sessions.get(id),
    listSessions: () => Array.from(sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt),
    updateSession: (id, updates) => {
      const session = sessions.get(id);
      if (session) {
        Object.assign(session, updates, { updatedAt: Date.now() });
      }
    },
    deleteSession: (id) => {
      sessions.delete(id);
      messages.delete(id);
    },
    deleteSessions: (ids) => ids.forEach(id => {
      sessions.delete(id);
      messages.delete(id);
    }),
    setSessionPinned: (id, pinned) => {
      const session = sessions.get(id);
      if (session) {
        session.pinned = pinned;
        session.updatedAt = Date.now();
      }
    },
    addMessage: (sessionId, message) => {
      const sessionMessages = messages.get(sessionId);
      if (sessionMessages) {
        sessionMessages.push({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ...message,
          timestamp: Date.now(),
        });
      }
    },
    listUserMemories: () => memories,
    createUserMemory: (data) => {
      const memory = {
        id: `memory-${Date.now()}`,
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      memories.push(memory);
      return memory;
    },
    updateUserMemory: (data) => {
      const index = memories.findIndex(m => m.id === data.id);
      if (index >= 0) {
        memories[index] = { ...memories[index], ...data, updatedAt: Date.now() };
        return memories[index];
      }
      return null;
    },
    deleteUserMemory: (id) => {
      const index = memories.findIndex(m => m.id === id);
      if (index >= 0) {
        memories.splice(index, 1);
        return true;
      }
      return false;
    },
    getUserMemoryStats: () => ({
      total: memories.length,
      created: memories.filter(m => m.status === 'created').length,
      stale: memories.filter(m => m.status === 'stale').length,
      deleted: memories.filter(m => m.status === 'deleted').length,
    }),
    listRecentCwds: (limit = 8) => [],
    autoDeleteNonPersonalMemories: () => 0,
  };
}

function createMockCoworkRunner() {
  return {
    startSession: async () => {},
    continueSession: async () => {},
    stopSession: () => {},
    respondToPermission: () => {},
    setMcpServerProvider: () => {},
    getSessionConfirmationMode: () => 'modal',
    on: () => {},
  };
}

function createMockSkillManager() {
  const skills = [];
  return {
    listSkills: () => skills,
    setSkillEnabled: (id, enabled) => skills,
    deleteSkill: (id) => skills,
    downloadSkill: async (source) => ({ success: false, error: 'Mock implementation' }),
    getSkillsRoot: () => path.join(os.tmpdir(), 'lobsterai-skills'),
    buildAutoRoutingPrompt: () => '',
    getSkillConfig: (id) => ({ success: false, error: 'Not found' }),
    setSkillConfig: (id, config) => ({ success: false, error: 'Not found' }),
    testEmailConnectivity: async (id, config) => ({ success: false, error: 'Mock implementation' }),
    handleWorkingDirectoryChange: () => {},
  };
}

function createMockMcpStore() {
  const servers = [];
  return {
    listServers: () => servers,
    createServer: (data) => {
      servers.push({ ...data, enabled: true, createdAt: Date.now() });
      return servers;
    },
    updateServer: (id, data) => {
      const server = servers.find(s => s.id === id);
      if (server) Object.assign(server, data);
      return servers;
    },
    deleteServer: (id) => {
      const index = servers.findIndex(s => s.id === id);
      if (index >= 0) servers.splice(index, 1);
      return servers;
    },
    setEnabled: (id, enabled) => {
      const server = servers.find(s => s.id === id);
      if (server) server.enabled = enabled;
      return servers;
    },
    getEnabledServers: () => servers.filter(s => s.enabled),
  };
}

function createMockScheduledTaskStore() {
  const tasks = [];
  const runs = [];
  return {
    listTasks: () => tasks,
    getTask: (id) => tasks.find(t => t.id === id),
    createTask: (data) => {
      const task = {
        id: `task-${Date.now()}`,
        ...data,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      tasks.push(task);
      return task;
    },
    updateTask: (id, data) => {
      const task = tasks.find(t => t.id === id);
      if (task) Object.assign(task, data, { updatedAt: new Date().toISOString() });
      return task;
    },
    deleteTask: (id) => {
      const index = tasks.findIndex(t => t.id === id);
      if (index >= 0) tasks.splice(index, 1);
      return true;
    },
    toggleTask: (id, enabled) => {
      const task = tasks.find(t => t.id === id);
      if (task) task.enabled = enabled;
      return { task, warning: null };
    },
    listRuns: (taskId, limit, offset) => runs.filter(r => r.taskId === taskId),
    listAllRuns: (limit, offset) => runs,
    countRuns: (taskId) => runs.filter(r => r.taskId === taskId).length,
  };
}

function createMockScheduler() {
  return {
    reschedule: () => {},
    runManually: async () => {},
    stopTask: () => true,
    on: () => {},
  };
}

/**
 * Create and start a test server instance
 */
async function createTestServer(port = 0) {
  const dataDir = ensureTestDataDir();

  // Initialize store using web-compatible version
  const store = await SqliteStore.create(dataDir);

  // Create mock instances for Electron-dependent modules
  const coworkStore = createMockCoworkStore();
  const coworkRunner = createMockCoworkRunner();
  const skillManager = createMockSkillManager();
  const mcpStore = createMockMcpStore();
  const scheduledTaskStore = createMockScheduledTaskStore();
  const scheduler = createMockScheduler();

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Store user data path in app for routes to access
  app.set('userDataPath', dataDir);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Create request context middleware
  let wss;

  const requestContextMiddleware = (req, res, next) => {
    req.context = {
      store,
      coworkStore,
      coworkRunner,
      skillManager,
      mcpStore,
      scheduledTaskStore,
      scheduler,
      getWss: () => wss,
    };
    next();
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

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('[Test Server] Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  });

  // Create HTTP server
  const server = http.createServer(app);

  // Create WebSocket server
  wss = new WebSocketServer({ server, path: '/ws' });

  // Set up WebSocket connection handler to send welcome message
  wss.on('connection', (ws) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system:connected',
      data: { clientId },
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle ping
        if (message.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            data: { timestamp: Date.now() },
          }));
        }
      } catch (err) {
        // Ignore invalid JSON
      }
    });
  });

  // Start server
  await new Promise((resolve) => {
    server.listen(port, () => {
      resolve();
    });
  });

  const address = server.address();
  const actualPort = address.port;

  return {
    server,
    app,
    wss,
    store,
    coworkStore,
    baseUrl: `http://localhost:${actualPort}`,
    port: actualPort,
    close: async () => {
      // Close WebSocket server
      await new Promise((resolve) => {
        wss.close(() => resolve());
      });

      // Close HTTP server
      await new Promise((resolve) => {
        server.close(() => resolve());
      });

      // Clean up test data directory
      if (testDataDir && fs.existsSync(testDataDir)) {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      }
    },
  };
}

export { createTestServer };
