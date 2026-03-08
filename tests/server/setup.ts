/**
 * Test environment setup for LobsterAI WebControl server tests.
 * This module provides utilities to start/stop the Express server for testing.
 */

const http = require('node:http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { WebSocketServer } = require('ws');

// Use require for CommonJS modules since they don't have ESM exports
const { SqliteStore } = require('../../dist-electron/sqliteStore.js');
const { CoworkStore } = require('../../dist-electron/coworkStore.js');
const { CoworkRunner } = require('../../dist-electron/libs/coworkRunner.js');
const { SkillManager } = require('../../dist-electron/skillManager.js');
const { McpStore } = require('../../dist-electron/mcpStore.js');
const { IMGatewayManager } = require('../../dist-electron/im/index.js');
const { ScheduledTaskStore } = require('../../dist-electron/scheduledTaskStore.js');
const { Scheduler } = require('../../dist-electron/libs/scheduler.js');
const { initLogger } = require('../../dist-electron/logger.js');

// Import route setup functions using require
const { setupStoreRoutes } = require('../../server/routes/store.js');
const { setupSkillsRoutes } = require('../../server/routes/skills.js');
const { setupMcpRoutes } = require('../../server/routes/mcp.js');
const { setupCoworkRoutes } = require('../../server/routes/cowork.js');
const { setupImRoutes } = require('../../server/routes/im.js');
const { setupScheduledTaskRoutes } = require('../../server/routes/scheduledTasks.js');
const { setupPermissionsRoutes } = require('../../server/routes/permissions.js');
const { setupAppRoutes } = require('../../server/routes/app.js');
const { setupLogRoutes } = require('../../server/routes/log.js');
const { setupApiProxyRoutes } = require('../../server/routes/apiProxy.js');
const { setupDialogRoutes } = require('../../server/routes/dialog.js');
const { setupShellRoutes } = require('../../server/routes/shell.js');

// Initialize logger
initLogger();

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
 * Create and start a test server instance
 */
async function createTestServer(port = 0) {
  const dataDir = ensureTestDataDir();

  // Initialize store
  const store = await SqliteStore.create(dataDir);

  // Initialize CoworkStore
  const coworkStore = new CoworkStore(store.getDatabase(), store.getSaveFunction());

  // Initialize SkillManager
  const getStore = () => store;
  const skillManager = new SkillManager(getStore);

  // Initialize McpStore
  const mcpStore = new McpStore(store.getDatabase(), store.getSaveFunction());

  // Initialize CoworkRunner (minimal setup for tests)
  const coworkRunner = new CoworkRunner(coworkStore);
  coworkRunner.setMcpServerProvider(() => mcpStore.getEnabledServers());

  // Initialize IMGatewayManager
  const imGatewayManager = new IMGatewayManager(
    store.getDatabase(),
    store.getSaveFunction(),
    { coworkRunner, coworkStore }
  );

  // Initialize ScheduledTaskStore
  const scheduledTaskStore = new ScheduledTaskStore(store.getDatabase(), store.getSaveFunction());

  // Initialize Scheduler
  const scheduler = new Scheduler({
    scheduledTaskStore,
    coworkStore,
    getCoworkRunner: () => coworkRunner,
    getIMGatewayManager: () => imGatewayManager,
    getSkillsPrompt: async () => skillManager.buildAutoRoutingPrompt(),
  });

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
      imGatewayManager,
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
  setupImRoutes(app);
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

module.exports = { createTestServer };
