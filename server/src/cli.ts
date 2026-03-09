#!/usr/bin/env node
import { Command } from 'commander';
import open from 'open';
import os from 'os';
import path from 'path';
import { startServer } from './index.js';

const program = new Command();

program
  .name('lobsterai')
  .description('LobsterAI - AI-powered assistant with local web UI')
  .version('0.3.0')
  .option('-p, --port <number>', 'Port to run server on', '3001')
  .option('--host <string>', 'Host to bind to', 'localhost')
  .option('--no-open', 'Don\'t open browser automatically')
  .option('--data-dir <path>', 'Custom data directory')
  .option('--workspace <path>', 'Workspace directory (default: user home)')
  .action(async (options) => {
    const port = parseInt(options.port);
    const host = options.host;
    const workspace = options.workspace || os.homedir();

    console.log(`🦞 Starting LobsterAI...`);
    console.log(`   Port: ${port}`);
    console.log(`   Host: ${host}`);
    console.log(`   Workspace: ${workspace}`);

    try {
      await startServer({
        port,
        host,
        dataDir: options.dataDir,
        workspace
      });

      const url = `http://${host}:${port}`;
      console.log(`\n✅ LobsterAI is running at ${url}`);

      if (options.open !== false) {
        console.log(`   Opening browser...`);
        await open(url);
      }
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program.parse();
