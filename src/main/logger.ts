/**
 * Logger module for web builds
 * Simple console-based logging that writes to file + console
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';

let logStream: fs.WriteStream | null;

// Get log directory
function getLogDir(): string {
  const appName = process.env.npm_package_name || 'LobsterAI';
  return path.join(os.homedir(), '.lobsterai', 'logs');
}

// Get log file path
export function getLogFilePath(): string {
  const appName = process.env.npm_package_name || 'LobsterAI';
  const logDir = getLogDir();
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, `${appName}-main.log`);
}

// Get log stream
function getLogStream(): fs.WriteStream | null {
  if (!logStream) {
    const logFile = getLogFilePath();
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
  }
  return logStream;
}

// Initialize logging system
export function initLogger(): void {
  // Intercept console.* methods
  const originalMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  // Override console methods
  Object.keys(originalMethods).forEach((method) => {
    (console as any)[method] = (...args: any[]) => {
      // Write to log file
      const message = args.length > 0 ? util.format(args[0]) : '';
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] [${method.toUpperCase()}] ${message}\n`;
      const stream = getLogStream();
      if (stream) {
        stream.write(logLine);
      }

      // Also output to console
      originalMethods[method as keyof Console](...args as any[]);
    };
  });
}

// Logger instance
export const logger = {
  info: (...args: any[]) => {
    const message = args.length > 0 ? util.format(args[0]) : '';
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [INFO] ${message}\n`;
    const stream = getLogStream();
    if (stream) {
      stream.write(logLine);
    }
    console.log(...args);
  },
  error: (...args: any[]) => {
    const message = args.length > 0 ? util.format(args[0]) : '';
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [ERROR] ${message}\n`;
    const stream = getLogStream();
    if (stream) {
      stream.write(logLine);
    }
    console.error(...args);
  },
  warn: (...args: any[]) => {
    const message = args.length > 0 ? util.format(args[0]) : '';
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [WARN] ${message}\n`;
    const stream = getLogStream();
    if (stream) {
      stream.write(logLine);
    }
    console.warn(...args);
  },
  debug: (...args: any[]) => {
    const message = args.length > 0 ? util.format(args[0]) : '';
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [DEBUG] ${message}\n`;
    const stream = getLogStream();
    if (stream) {
      stream.write(logLine);
    }
    console.debug(...args);
  },
};
