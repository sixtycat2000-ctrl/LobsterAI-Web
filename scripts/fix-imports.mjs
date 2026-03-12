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
        content = content.replaceAll(`from "../server/src/main`, 'from "./src/main');
        content = content.replaceAll(`from '../server/src/main`, 'from \'./src/main');
        content = content.replaceAll(`from "../server/src/renderer/types`, 'from "./src/renderer/types');
        content = content.replaceAll(`from '../server/src/renderer/types`, 'from \'./src/renderer/types');
        content = content.replaceAll(`from "../server/types`, 'from "./types');
        content = content.replaceAll(`from '../server/types`, 'from \'./types');

        // Fix paths that go up too many levels (../../src/main -> ../src/main)
        content = content.replaceAll(`from "../../src/main`, 'from "../src/main');
        content = content.replaceAll(`from '../../src/main`, 'from \'../src/main');
        content = content.replaceAll(`from "../../src/renderer`, 'from "../src/renderer');
        content = content.replaceAll(`from '../../src/renderer`, 'from \'../src/renderer');

        // Fix server/shims paths - they should resolve to ./shims from dist root
        // The shims are at server/dist/shims/, so from any file in dist, we need to go up to dist/ and then into shims/
        content = content.replaceAll(`from "../server/shims`, 'from "./shims');
        content = content.replaceAll(`from '../server/shims`, 'from \'./shims');
        content = content.replaceAll(`from "../../server/shims`, 'from "../../shims');
        content = content.replaceAll(`from '../../server/shims`, 'from \'../../shims');
        content = content.replaceAll(`from "../../../server/shims`, 'from "../../../shims');
        content = content.replaceAll(`from '../../../server/shims`, 'from \'../../../shims');
        content = content.replaceAll(`from "../../../../server/shims`, 'from "../../../../shims');
        content = content.replaceAll(`from '../../../../server/shims`, 'from \'../../../../shims');

        // Add .js extension to relative imports that don't have it
        // Match: from './xxx' or from '../xxx' where xxx doesn't end with .js or .json
        content = content.replace(/from\s+(['"])(\.\.\/[^'"]+)(['"])/g, (match, q1, path, q2) => {
          if (!path.endsWith('.js') && !path.endsWith('.json')) {
            return `from ${q1}${path}.js${q2}`;
          }
          return match;
        });
        content = content.replace(/from\s+(['"])(\.\/[^'"]+)(['"])/g, (match, q1, path, q2) => {
          if (!path.endsWith('.js') && !path.endsWith('.json')) {
            return `from ${q1}${path}.js${q2}`;
          }
          return match;
        });

        // Fix __dirname and __filename for ES modules
        if (content.includes('__dirname') || content.includes('__filename')) {
          // Check if the file already has the ES module fix (using the alias we inject)
          if (!content.includes('__esmFileURLToPath')) {
            // Add import at the top using unique aliases to avoid conflicts
            content = `import { fileURLToPath as __esmFileURLToPath } from 'url';\nimport { dirname as __esmDirname } from 'path';\nconst __filename = __esmFileURLToPath(import.meta.url);\nconst __dirname = __esmDirname(__filename);\n` + content;
          }
        }

        writeFileSync(fullPath, content);
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
}

fixImports(distDir);

// Move files from dist/server to dist (instead of deleting)
const distServerDir = join(distDir, 'server');
if (existsSync(distServerDir)) {
  // Move all files from dist/server to dist
  function moveFiles(srcDir, destDir) {
    const entries = readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(srcDir, entry.name);
      const destPath = join(destDir, entry.name);
      if (entry.isDirectory()) {
        if (!existsSync(destPath)) {
          mkdirSync(destPath, { recursive: true });
        }
        moveFiles(srcPath, destPath);
      } else {
        if (!existsSync(destPath)) {
          copyFileSync(srcPath, destPath);
        }
      }
    }
  }
  moveFiles(distServerDir, distDir);
  rmSync(distServerDir, { recursive: true, force: true });
  console.log('Moved files from dist/server to dist');
}

// Rename sqliteStore.web.js to sqliteStore.js
const sqliteStoreWeb = join(distDir, 'sqliteStore.web.js');
const sqliteStore = join(distDir, 'sqliteStore.js');
if (existsSync(sqliteStoreWeb)) {
  copyFileSync(sqliteStoreWeb, sqliteStore);
  console.log('Copied sqliteStore.web.js to sqliteStore.js');
}

console.log('Import path fixes complete!');
