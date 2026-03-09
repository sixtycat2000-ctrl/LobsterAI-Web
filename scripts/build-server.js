#!/usr/bin/env node

import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const isDev = process.env.NODE_ENV !== 'production';

async function buildServer() {
  // Ensure dist directory exists
  if (!existsSync('server/dist')) {
    mkdirSync('server/dist', { recursive: true });
  }

  // Build the CLI entry point
  await build({
    entryPoints: ['server/src/cli.ts'],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    outfile: 'server/dist/cli.js',
    external: [
      // Keep these as external dependencies
      '@anthropic-ai/claude-agent-sdk',
      '@anthropic-ai/sdk',
      'express',
      'cors',
      'ws',
      'sql.js',
      'commander',
      'open',
      // Node built-ins
      'fs', 'path', 'os', 'http', 'https', 'events', 'stream',
      'util', 'url', 'crypto', 'child_process', 'net', 'tls',
      'zlib', 'querystring', 'buffer', 'worker_threads'
    ],
    sourcemap: isDev,
    minify: !isDev,
    logLevel: 'info',
  });

  // Build the main server entry point
  await build({
    entryPoints: ['server/src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    outfile: 'server/dist/index.js',
    external: [
      '@anthropic-ai/claude-agent-sdk',
      '@anthropic-ai/sdk',
      'express',
      'cors',
      'ws',
      'sql.js',
      'commander',
      'open',
      'fs', 'path', 'os', 'http', 'https', 'events', 'stream',
      'util', 'url', 'crypto', 'child_process', 'net', 'tls',
      'zlib', 'querystring', 'buffer', 'worker_threads'
    ],
    sourcemap: isDev,
    minify: !isDev,
    logLevel: 'info',
  });

  // Create package.json in dist for ESM support
  writeFileSync('server/dist/package.json', JSON.stringify({ type: 'module' }, null, 2));

  console.log('Server build complete!');
}

buildServer().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
