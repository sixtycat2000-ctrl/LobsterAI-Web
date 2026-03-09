#!/usr/bin/env node

import { copyFileSync, readFileSync, writeFileSync, existsSync, readdirSync, lstatSync, rmSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const distDir = join(__dirname, '../server/dist');

// Fix import paths in all JS files
function fixImports(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    try {
      const stats = lstatSync(fullPath);
      if (stats.isDirectory()) {
        fixImports(fullPath);
      } else if (fullPath.endsWith('.js')) {
        let content = readFileSync(fullPath, 'utf-8');

        // Fix import paths - remove the extra "server/" prefix
        content = content.replaceAll(`from "../server/routes`, 'from "./routes');
        content = content.replaceAll(`from \'../server/routes`, 'from \'./routes');
        content = content.replaceAll(`from "../server/routes`, 'from "./routes');
        content = content.replaceAll(`from '../server/routes`, 'from \'./routes');
        content = content.replaceAll(`from "../server/websocket`, 'from "./websocket');
        content = content.replaceAll(`from '../server/websocket`, 'from \'./websocket');
        content = content.replaceAll(`from "../server/services`, 'from "./services');
        content = content.replaceAll(`from '../server/services`, 'from \'./services');
        content = content.replaceAll(`from "../server/shims`, 'from "./shims');
        content = content.replaceAll(`from '../server/shims`, 'from \'./shims');
        content = content.replaceAll(`from "../server/sqliteStore.web`, 'from "./sqliteStore');
        content = content.replaceAll(`from '../server/sqliteStore.web`, 'from \'./sqliteStore');
        content = content.replaceAll(`from "../server/src/main`, 'from "./main');
        content = content.replaceAll(`from '../server/src/main`, 'from \'./main');
        content = content.replaceAll(`from "../server/src/renderer/types`, 'from "./renderer-types');
        content = content.replaceAll(`from '../server/src/renderer/types`, 'from \'./renderer-types');
        content = content.replaceAll(`from "../server/types`, 'from "./types');
        content = content.replaceAll(`from '../server/types`, 'from \'./types');

        writeFileSync(fullPath, content);
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
}

fixImports(distDir);

// Clean up the duplicate server directory
const distServerDir = join(distDir, 'server');
if (existsSync(distServerDir)) {
  rmSync(distServerDir, { recursive: true, force: true });
  console.log('Removed duplicate dist/server directory');
}

// Rename sqliteStore.web.js to sqliteStore.js
const sqliteStoreWeb = join(distDir, 'sqliteStore.web.js');
const sqliteStore = join(distDir, 'sqliteStore.js');
if (existsSync(sqliteStoreWeb)) {
  copyFileSync(sqliteStoreWeb, sqliteStore);
  console.log('Copied sqliteStore.web.js to sqliteStore.js');
}

console.log('Import path fixes complete!');
