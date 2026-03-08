/**
 * Electron Shim for Web Server
 * Provides mock implementations of Electron APIs for server-side use
 */

import path from 'path';
import os from 'os';

// Mock app API
const getUserDataPath = (): string => {
  const appDataPath = process.env.LOBSTERAI_DATA_PATH || path.join(os.homedir(), '.lobsterai');
  const userDataPath = path.join(appDataPath, 'web');
  return userDataPath;
};

export const app = {
  getPath: (name: string): string => {
    switch (name) {
      case 'userData':
        return getUserDataPath();
      case 'logs':
        return path.join(getUserDataPath(), 'logs');
      case 'temp':
        return os.tmpdir();
      case 'home':
        return os.homedir();
      case 'exe':
        return process.execPath;
      case 'appData':
        return path.join(os.homedir(), '.lobsterai');
      default:
        return getUserDataPath();
    }
  },
  getVersion: () => '0.2.2',
  getName: () => 'LobsterAI',
  isReady: () => true,
  whenReady: () => Promise.resolve(),
  quit: () => process.exit(0),
  on: () => {},
  getAppPath: () => process.cwd(),
};

// Mock BrowserWindow class
export class BrowserWindow {
  static getAllWindows = () => [];
  static getFocusedWindow = () => null;
  constructor() {}
  loadURL() {}
  loadFile() {}
  on() { return this; }
  once() { return this; }
  webContents = {
    send: () => {},
    on: () => {},
    openDevTools: () => {},
  };
}

// Mock session
export const session = {
  defaultSession: {
    webRequest: {
      onBeforeSendHeaders: () => {},
      onHeadersReceived: () => {},
    },
    protocol: {
      registerStringProtocol: () => {},
      handle: () => {},
    },
    cookies: {
      get: () => Promise.resolve([]),
      set: () => Promise.resolve(),
    },
  },
  fromPartition: () => ({
    webRequest: {
      onBeforeSendHeaders: () => {},
      onHeadersReceived: () => {},
    },
  }),
};

// Mock ipcMain
export const ipcMain = {
  handle: () => {},
  on: () => {},
  once: () => {},
  removeHandler: () => {},
};

// Mock dialog
export const dialog = {
  showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
  showSaveDialog: async () => ({ canceled: true, filePath: undefined }),
  showMessageBox: async () => ({ response: 0 }),
  showErrorBox: () => {},
};

// Mock shell
export const shell = {
  openExternal: async () => true,
  openPath: async () => '',
  showItemInFolder: () => {},
};

// Mock nativeTheme
export const nativeTheme = {
  shouldUseDarkColors: false,
  on: () => {},
};

// Mock nativeImage
export const nativeImage = {
  createFromPath: () => ({ toDataURL: () => '' }),
  createFromDataURL: () => ({ toDataURL: () => '' }),
  createEmpty: () => ({ toDataURL: () => '' }),
};

// Mock Menu
export const Menu = {
  buildFromTemplate: () => ({ popup: () => {} }),
  setApplicationMenu: () => {},
};

// Mock Tray
export class Tray {
  constructor() {}
  setToolTip() {}
  setContextMenu() {}
  on() {}
}

// Mock systemPreferences
export const systemPreferences = {
  getUserDefault: () => 'dark',
  on: () => {},
};

// Type exports
export type { WebContents };
