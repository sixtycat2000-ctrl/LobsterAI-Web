/**
 * Server Bootstrap Script for tsx
 * Sets up module shims and starts the server
 */

console.log('[Bootstrap] Starting server...');

// Register electron shim before any other imports
import { createRequire } from 'module';
import * as Module from 'module';

const require = createRequire(import.meta.url);

console.log('[Bootstrap] Setting up electron shim...');

// Patch Module._load to intercept electron imports
const originalLoad = (Module as any)._load;

(Module as any)._load = function(request: string, parent: any, isMain: boolean) {
  if (request === 'electron') {
    console.log('[Bootstrap] Intercepted electron import');
    return require('./shims/electron.cjs');
  }
  return originalLoad.apply(this, [request, parent, isMain]);
};

console.log('[Bootstrap] Importing server...');

// Import the server and start it
import { startServer } from './index';

console.log('[Bootstrap] Calling startServer()...');
startServer();
