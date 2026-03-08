/**
 * Server Bootstrap Script for tsx
 * Sets up module shims and starts the server
 */

// Register electron shim before any other imports
import { createRequire } from 'module';
import * as Module from 'module';

const require = createRequire(import.meta.url);

// Patch Module._load to intercept electron imports
const originalLoad = (Module as any)._load;

(Module as any)._load = function(request: string, parent: any, isMain: boolean) {
  if (request === 'electron') {
    return require('./shims/electron.cjs');
  }
  return originalLoad.apply(this, [request, parent, isMain]);
};

// Now import the main server (must be after shim registration)
import './index';
