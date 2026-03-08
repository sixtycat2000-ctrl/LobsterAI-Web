/**
 * Test environment setup for LobsterAI WebControl server tests.
 * This module provides utilities to start/stop the Express server for testing.
 */

const http = require('node:http');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use tsx to load TypeScript modules
const tsx = require('tsx/cjs/api');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..', '..');

// Load ESM modules via tsx
const express = tsx.require(path.join(projectRoot, 'node_modules', 'express', 'index.js'), __dirname).default || tsx.require(path.join(projectRoot, 'node_modules', 'express'), __dirname);
const cors = tsx.require(path.join(projectRoot, 'node_modules', 'cors'), __dirname);
const { WebSocketServer } = tsx.require(path.join(projectRoot, 'node_modules', 'ws'), __dirname);

// Use require for CommonJS modules since they don't have ESM exports
const { SqliteStore } = require(path.join(projectRoot, 'dist-electron', 'sqliteStore.js'));
const { CoworkStore } = require(path.join(projectRoot, 'dist-electron', 'coworkStore.js'));
const { CoworkRunner } = require(path.join(projectRoot, 'dist-electron', 'libs', 'coworkRunner.js'));
const { SkillManager } = require(path.join(projectRoot, 'dist-electron', 'skillManager.js'));
const { McpStore } = require(path.join(projectRoot, 'dist-electron', 'mcpStore.js'));
const { IMGatewayManager } = require(path.join(projectRoot, 'dist-electron', 'im', 'index.js'));
const { ScheduledTaskStore } = require(path.join(projectRoot, 'dist-electron', 'scheduledTaskStore.js'));
const { Scheduler } = require(path.join(projectRoot, 'dist-electron', 'libs', 'scheduler.js'));
const { initLogger } = require(path.join(projectRoot, 'dist-electron', 'logger.js'));

// Import route setup functions using tsx for TypeScript files
const { setupStoreRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'store.ts'), __dirname);
const { setupSkillsRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'skills.ts'), __dirname);
const { setupMcpRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'mcp.ts'), __dirname);
const { setupCoworkRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'cowork.ts'), __dirname);
const { setupImRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'im.ts'), __dirname);
const { setupScheduledTaskRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'scheduledTasks.ts'), __dirname);
const { setupPermissionsRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'permissions.ts'), __dirname);
const { setupAppRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'app.ts'), __dirname);
const { setupLogRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'log.ts'), __dirname);
const { setupApiProxyRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'apiProxy.ts'), __dirname);
const { setupDialogRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'dialog.ts'), __dirname);
const { setupShellRoutes } = tsx.require(path.join(projectRoot, 'server', 'routes', 'shell.ts'), __dirname);

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
