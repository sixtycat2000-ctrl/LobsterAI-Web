/**
 * Electron Shim for Web Build
 * Mimics window.electron interface using HTTP/WebSocket
 * This allows existing service files to work with minimal changes
 */

import { apiClient } from './apiClient';
import { webSocketClient, WS_EVENTS } from './webSocketClient';

// Import types from proper type files
import type {
  CoworkSession,
  CoworkMessage,
  CoworkSessionSummary,
  CoworkConfig,
  CoworkConfigUpdate,
  CoworkUserMemoryEntry,
  CoworkMemoryStats,
  CoworkPermissionRequest,
  CoworkPermissionResult,
  CoworkApiConfig,
} from '../types/cowork';
import type { Skill } from '../types/skill';
import type { McpServerConfig as McpServerConfigIPC, McpMarketplaceData } from '../types/mcp';

// Types that are only in electron.d.ts - declare locally
interface EmailConnectivityTestResult {
  success: boolean;
  message: string;
}

// ============================================================================
// Store API
// ============================================================================
const store = {
  async get<T>(key: string): Promise<{ success: boolean; value?: T; error?: string }> {
    return apiClient.get<T>(`/store/${encodeURIComponent(key)}`);
  },

  async set(key: string, value: unknown): Promise<{ success: boolean; error?: string }> {
    return apiClient.put(`/store/${encodeURIComponent(key)}`, value);
  },

  async remove(key: string): Promise<{ success: boolean; error?: string }> {
    return apiClient.delete(`/store/${encodeURIComponent(key)}`);
  },
};

// ============================================================================
// Skills API
// ============================================================================
const skills = {
  async list(): Promise<{ success: boolean; skills?: Skill[]; error?: string }> {
    return apiClient.get('/skills');
  },

  async setEnabled(options: { id: string; enabled: boolean }): Promise<{ success: boolean; skills?: Skill[]; error?: string }> {
    return apiClient.post('/skills/set-enabled', options);
  },

  async delete(id: string): Promise<{ success: boolean; skills?: Skill[]; error?: string }> {
    return apiClient.delete(`/skills/${encodeURIComponent(id)}`);
  },

  async download(source: string): Promise<{ success: boolean; skills?: Skill[]; error?: string }> {
    return apiClient.post('/skills/download', { source });
  },

  async getRoot(): Promise<{ success: boolean; path?: string; error?: string }> {
    return apiClient.get('/skills/root');
  },

  async autoRoutingPrompt(): Promise<{ success: boolean; prompt?: string | null; error?: string }> {
    return apiClient.get('/skills/auto-routing-prompt');
  },

  async getConfig(skillId: string): Promise<{ success: boolean; config?: Record<string, string>; error?: string }> {
    return apiClient.get(`/skills/${encodeURIComponent(skillId)}/config`);
  },

  async setConfig(skillId: string, config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    return apiClient.put(`/skills/${encodeURIComponent(skillId)}/config`, config);
  },

  async testEmailConnectivity(
    skillId: string,
    config: Record<string, string>
  ): Promise<{ success: boolean; result?: EmailConnectivityTestResult; error?: string }> {
    return apiClient.post(`/skills/${encodeURIComponent(skillId)}/test-email`, config);
  },

  onChanged(callback: () => void): () => void {
    return webSocketClient.on(WS_EVENTS.SKILLS_CHANGED, callback);
  },
};

// ============================================================================
// MCP API
// ============================================================================
const mcp = {
  async list(): Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }> {
    return apiClient.get('/mcp/servers');
  },

  async create(data: unknown): Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }> {
    return apiClient.post('/mcp/servers', data);
  },

  async update(id: string, data: unknown): Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }> {
    return apiClient.put(`/mcp/servers/${encodeURIComponent(id)}`, data);
  },

  async delete(id: string): Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }> {
    return apiClient.delete(`/mcp/servers/${encodeURIComponent(id)}`);
  },

  async setEnabled(options: { id: string; enabled: boolean }): Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }> {
    return apiClient.post('/mcp/servers/set-enabled', options);
  },

  async fetchMarketplace(): Promise<{ success: boolean; data?: McpMarketplaceData; error?: string }> {
    return apiClient.get('/mcp/marketplace');
  },
};

// ============================================================================
// API (HTTP fetch/stream)
// ============================================================================
const api = {
  async fetch(options: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<{ ok: boolean; status: number; statusText: string; headers: Record<string, string>; data: any; error?: string }> {
    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
      });
      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Map to API proxy server
  async stream(options: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    requestId: string;
  }): Promise<{ ok: boolean; status: number; statusText: string; error?: string }> {
    const result = await apiClient.post('/api/stream', {
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: options.body,
      requestId: options.requestId,
    });
    return {
      ok: result.success,
      status: result.success ? 200 : 500,
      statusText: result.success ? 'OK' : 'Error',
      error: result.error,
    };
  },

  async cancelStream(requestId: string): Promise<boolean> {
    const result = await apiClient.post('/api/stream/cancel', { requestId });
    return result.success;
  },

  onStreamData(requestId: string, callback: (chunk: string) => void): () => void {
    return webSocketClient.on(`stream:data:${requestId}`, callback);
  },

  onStreamDone(requestId: string, callback: () => void): () => void {
    return webSocketClient.on(`stream:done:${requestId}`, callback);
  },

  onStreamError(requestId: string, callback: (error: string) => void): () => void {
    return webSocketClient.on(`stream:error:${requestId}`, callback);
  },

  onStreamAbort(requestId: string, callback: () => void): () => void {
    return webSocketClient.on(`stream:abort:${requestId}`, callback);
  },
};

// ============================================================================
// Cowork API
// ============================================================================

// File change event type
export interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: number;
}

// File item type for file browser
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedTime?: number;
}

// ============================================================================
// Files API (Web workspace file browser)
// ============================================================================
const files = {
  async list(path: string = ''): Promise<{ success: boolean; items?: FileItem[]; error?: string }> {
    return apiClient.get(`/files/list?path=${encodeURIComponent(path)}`);
  },

  async read(path: string): Promise<{ success: boolean; content?: string; error?: string }> {
    return apiClient.get(`/files/read?path=${encodeURIComponent(path)}`);
  },

  download(path: string): string {
    return `/workspace/${encodeURIComponent(path)}`;
  },

  async validate(path: string): Promise<{ success: boolean; valid?: boolean; error?: string }> {
    return apiClient.get(`/files/validate?path=${encodeURIComponent(path)}`);
  },

  onChanged(callback: (data: FileChangeEvent) => void): () => void {
    return webSocketClient.on('file:changed', callback);
  },
};

// ============================================================================
// Workspace API
// ============================================================================
const workspace = {
  async getPath(): Promise<{ success: boolean; path?: string; error?: string }> {
    return apiClient.get('/app/workspace');
  },
};

// ============================================================================
// Cowork API
// ============================================================================
const cowork = {
  async startSession(options: {
    prompt: string;
    cwd?: string;
    systemPrompt?: string;
    title?: string;
    activeSkillIds?: string[];
    imageAttachments?: Array<{ name: string; mimeType: string; base64Data: string }>;
  }): Promise<{ success: boolean; session?: CoworkSession; error?: string }> {
    return apiClient.post('/cowork/sessions/start', options);
  },

  async continueSession(options: {
    sessionId: string;
    prompt: string;
    systemPrompt?: string;
    activeSkillIds?: string[];
    imageAttachments?: Array<{ name: string; mimeType: string; base64Data: string }>;
  }): Promise<{ success: boolean; session?: CoworkSession; error?: string }> {
    return apiClient.post(`/cowork/sessions/${encodeURIComponent(options.sessionId)}/continue`, {
      prompt: options.prompt,
      systemPrompt: options.systemPrompt,
      activeSkillIds: options.activeSkillIds,
      imageAttachments: options.imageAttachments,
    });
  },

  async stopSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    return apiClient.post(`/cowork/sessions/${encodeURIComponent(sessionId)}/stop`, {});
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    return apiClient.delete(`/cowork/sessions/${encodeURIComponent(sessionId)}`);
  },

  async deleteSessions(sessionIds: string[]): Promise<{ success: boolean; error?: string }> {
    return apiClient.post('/cowork/sessions/batch-delete', { sessionIds });
  },

  async setSessionPinned(options: { sessionId: string; pinned: boolean }): Promise<{ success: boolean; error?: string }> {
    return apiClient.put(`/cowork/sessions/${encodeURIComponent(options.sessionId)}/pin`, {
      pinned: options.pinned,
    });
  },

  async renameSession(options: { sessionId: string; title: string }): Promise<{ success: boolean; error?: string }> {
    return apiClient.put(`/cowork/sessions/${encodeURIComponent(options.sessionId)}/rename`, {
      title: options.title,
    });
  },

  async getSession(sessionId: string): Promise<{ success: boolean; session?: CoworkSession; error?: string }> {
    return apiClient.get(`/cowork/sessions/${encodeURIComponent(sessionId)}`);
  },

  async listSessions(): Promise<{ success: boolean; sessions?: CoworkSessionSummary[]; error?: string }> {
    return apiClient.get('/cowork/sessions');
  },

  // Image export not available in web (requires Electron main process)
  async exportResultImage(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Image export not available in web version' };
  },

  async captureImageChunk(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Image capture not available in web version' };
  },

  async saveResultImage(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Image save not available in web version' };
  },

  async respondToPermission(options: { requestId: string; result: CoworkPermissionResult }): Promise<{ success: boolean; error?: string }> {
    return apiClient.post('/cowork/permissions/respond', options);
  },

  async getConfig(): Promise<{ success: boolean; config?: CoworkConfig; error?: string }> {
    return apiClient.get('/cowork/config');
  },

  async setConfig(config: CoworkConfigUpdate): Promise<{ success: boolean; error?: string }> {
    return apiClient.put('/cowork/config', config);
  },

  async listMemoryEntries(input: {
    query?: string;
    status?: 'created' | 'stale' | 'deleted' | 'all';
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; entries?: CoworkUserMemoryEntry[]; error?: string }> {
    return apiClient.get('/cowork/memory/entries?' + new URLSearchParams(input as Record<string, string>).toString());
  },

  async createMemoryEntry(input: {
    text: string;
    confidence?: number;
    isExplicit?: boolean;
  }): Promise<{ success: boolean; entry?: CoworkUserMemoryEntry; error?: string }> {
    return apiClient.post('/cowork/memory/entries', input);
  },

  async updateMemoryEntry(input: {
    id: string;
    text?: string;
    confidence?: number;
    status?: 'created' | 'stale' | 'deleted';
    isExplicit?: boolean;
  }): Promise<{ success: boolean; entry?: CoworkUserMemoryEntry; error?: string }> {
    return apiClient.put(`/cowork/memory/entries/${encodeURIComponent(input.id)}`, input);
  },

  async deleteMemoryEntry(input: { id: string }): Promise<{ success: boolean; error?: string }> {
    return apiClient.delete(`/cowork/memory/entries/${encodeURIComponent(input.id)}`);
  },

  async getMemoryStats(): Promise<{ success: boolean; stats?: CoworkMemoryStats; error?: string }> {
    return apiClient.get('/cowork/memory/stats');
  },

  // Stream event listeners
  onStreamMessage(callback: (data: { sessionId: string; message: CoworkMessage }) => void): () => void {
    return webSocketClient.on(WS_EVENTS.COWORK_MESSAGE, callback);
  },

  onStreamMessageUpdate(callback: (data: { sessionId: string; messageId: string; content: string }) => void): () => void {
    return webSocketClient.on(WS_EVENTS.COWORK_MESSAGE_UPDATE, callback);
  },

  onStreamPermission(callback: (data: { sessionId: string; request: CoworkPermissionRequest }) => void): () => void {
    return webSocketClient.on(WS_EVENTS.COWORK_PERMISSION, callback);
  },

  onStreamComplete(callback: (data: { sessionId: string; claudeSessionId: string | null }) => void): () => void {
    return webSocketClient.on(WS_EVENTS.COWORK_COMPLETE, callback);
  },

  onStreamError(callback: (data: { sessionId: string; error: string }) => void): () => void {
    return webSocketClient.on(WS_EVENTS.COWORK_ERROR, callback);
  },
};


// ============================================================================
// Scheduled Tasks API
// ============================================================================
const scheduledTasks = {
  async list(): Promise<any> {
    return apiClient.get('/scheduled-tasks');
  },

  async get(id: string): Promise<any> {
    return apiClient.get(`/scheduled-tasks/${encodeURIComponent(id)}`);
  },

  async create(input: any): Promise<any> {
    return apiClient.post('/scheduled-tasks', input);
  },

  async update(id: string, input: any): Promise<any> {
    return apiClient.put(`/scheduled-tasks/${encodeURIComponent(id)}`, input);
  },

  async delete(id: string): Promise<any> {
    return apiClient.delete(`/scheduled-tasks/${encodeURIComponent(id)}`);
  },

  async toggle(id: string, enabled: boolean): Promise<any> {
    return apiClient.post(`/scheduled-tasks/${encodeURIComponent(id)}/toggle`, { enabled });
  },

  async runManually(id: string): Promise<any> {
    return apiClient.post(`/scheduled-tasks/${encodeURIComponent(id)}/run`, {});
  },

  async stop(id: string): Promise<any> {
    return apiClient.post(`/scheduled-tasks/${encodeURIComponent(id)}/stop`, {});
  },

  async listRuns(taskId: string, limit?: number, offset?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return apiClient.get(`/scheduled-tasks/${encodeURIComponent(taskId)}/runs?${params}`);
  },

  async countRuns(taskId: string): Promise<any> {
    return apiClient.get(`/scheduled-tasks/${encodeURIComponent(taskId)}/runs/count`);
  },

  async listAllRuns(limit?: number, offset?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return apiClient.get(`/scheduled-tasks/runs/all?${params}`);
  },

  onStatusUpdate(callback: (data: any) => void): () => void {
    return webSocketClient.on(WS_EVENTS.TASK_STATUS_UPDATE, callback);
  },

  onRunUpdate(callback: (data: any) => void): () => void {
    return webSocketClient.on(WS_EVENTS.TASK_RUN_UPDATE, callback);
  },
};

// ============================================================================
// API Config
// ============================================================================
async function getApiConfig(): Promise<CoworkApiConfig | null> {
  const result = await apiClient.get('/api-config');
  return result.data as CoworkApiConfig || null;
}

async function checkApiConfig(options?: { probeModel?: boolean }): Promise<{ hasConfig: boolean; config: CoworkApiConfig | null; error?: string }> {
  const params = options?.probeModel ? '?probeModel=true' : '';
  const result = await apiClient.get(`/api-config/check${params}`);
  return result.data as { hasConfig: boolean; config: CoworkApiConfig | null; error?: string } || { hasConfig: false, config: null };
}

async function saveApiConfig(config: CoworkApiConfig): Promise<{ success: boolean; error?: string }> {
  return apiClient.put('/api-config', config);
}

// ============================================================================
// Utility Functions
// ============================================================================
async function generateSessionTitle(userInput: string | null): Promise<string> {
  const result = await apiClient.post('/cowork/generate-title', { userInput });
  return (result.data as { title?: string })?.title || '';
}

async function getRecentCwds(limit?: number): Promise<string[]> {
  const params = limit ? `?limit=${limit}` : '';
  const result = await apiClient.get(`/cowork/cwds/recent${params}`);
  return result.data as string[] || [];
}

// ============================================================================
// IPC Renderer (Web simulation)
// ============================================================================
const ipcRenderer = {
  send(channel: string, ...args: unknown[]): void {
    webSocketClient.send('ipc', { channel, args });
  },

  on(channel: string, func: (...args: unknown[]) => void): () => void {
    return webSocketClient.on(`ipc:${channel}`, func);
  },
};

// ============================================================================
// Window (Not applicable in web, removed)
// ============================================================================

// ============================================================================
// Dialog (Web simulation)
// ============================================================================
const dialog = {
  async selectDirectory(): Promise<{ success: boolean; path: string | null }> {
    // In web, use a simple prompt or return null
    console.warn('[ElectronShim] Directory selection not available in web');
    return { success: false, path: null };
  },

  async selectFile(_options?: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<{ success: boolean; path: string | null }> {
    // Use HTML file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        resolve({ success: !!file, path: file?.name || null });
      };
      input.oncancel = () => resolve({ success: false, path: null });
      input.click();
    });
  },

  async saveInlineFile(_options: { dataBase64: string; fileName?: string; mimeType?: string; cwd?: string }): Promise<{ success: boolean; path: string | null; error?: string }> {
    console.warn('[ElectronShim] Inline file save not available in web');
    return { success: false, path: null, error: 'Not available in web' };
  },

  async readFileAsDataUrl(_filePath: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    console.warn('[ElectronShim] File reading not available in web');
    return { success: false, error: 'Not available in web' };
  },
};

// ============================================================================
// Shell (Web simulation)
// ============================================================================
const shell = {
  async openPath(_filePath: string): Promise<{ success: boolean; error?: string }> {
    console.warn('[ElectronShim] File opening not available in web');
    return { success: false, error: 'Not available in web' };
  },

  async showItemInFolder(_filePath: string): Promise<{ success: boolean; error?: string }> {
    console.warn('[ElectronShim] Show in folder not available in web');
    return { success: false, error: 'Not available in web' };
  },

  async openExternal(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to open URL' };
    }
  },
};

// ============================================================================
// Auto Launch (Not applicable in web, removed)
// ============================================================================

// ============================================================================
// App Info
// ============================================================================
const appInfo = {
  async getVersion(): Promise<string> {
    const result = await apiClient.get('/app/version');
    return (result.data as { version?: string })?.version || '0.0.0-web';
  },

  async getSystemLocale(): Promise<string> {
    return navigator.language || 'en-US';
  },
};

// ============================================================================
// App Update (Not applicable in web, removed)
// ============================================================================

// ============================================================================
// Log (Not applicable in web, removed)
// ============================================================================

// ============================================================================
// Permissions (Web simulation)
// ============================================================================
const permissions = {
  async checkCalendar(): Promise<{ success: boolean; status?: string; error?: string; autoRequested?: boolean }> {
    return { success: true, status: 'not-applicable' };
  },

  async requestCalendar(): Promise<{ success: boolean; granted?: boolean; status?: string; error?: string }> {
    return { success: true, granted: false, status: 'not-applicable' };
  },
};

// ============================================================================
// Network Status (Web simulation)
// ============================================================================
const networkStatus = {
  send(_status: 'online' | 'offline'): void {
    // Handled by browser's online/offline events
  },
};

// ============================================================================
// Platform info
// ============================================================================
const platform = navigator.userAgent.includes('Windows') ? 'win32' :
                 navigator.userAgent.includes('Mac') ? 'darwin' :
                 navigator.userAgent.includes('Linux') ? 'linux' : 'web';

const arch = 'unknown'; // Browser doesn't expose architecture

// ============================================================================
// Export the shim object
// ============================================================================
interface ElectronShim {
  platform: string;
  arch: string;
  store: typeof store;
  skills: typeof skills;
  mcp: typeof mcp;
  api: typeof api;
  getApiConfig: typeof getApiConfig;
  checkApiConfig: typeof checkApiConfig;
  saveApiConfig: typeof saveApiConfig;
  generateSessionTitle: typeof generateSessionTitle;
  getRecentCwds: typeof getRecentCwds;
  ipcRenderer: typeof ipcRenderer;
  dialog: typeof dialog;
  shell: typeof shell;
  appInfo: typeof appInfo;
  scheduledTasks: typeof scheduledTasks;
  permissions: typeof permissions;
  networkStatus: typeof networkStatus;
  cowork: typeof cowork;
  files: typeof files;
  workspace: typeof workspace;
}

export function createElectronShim(): ElectronShim {
  return {
    platform,
    arch,
    store,
    skills,
    mcp,
    api,
    getApiConfig,
    checkApiConfig,
    saveApiConfig,
    generateSessionTitle,
    getRecentCwds,
    ipcRenderer,
    dialog,
    shell,
    appInfo,
    scheduledTasks,
    permissions,
    networkStatus,
    cowork,
    files,
    workspace,
  };
}

/**
 * Initialize the electron shim
 * Call this during app initialization to set window.electron
 */
export async function initElectronShim(): Promise<void> {
  // Connect WebSocket for real-time events
  await webSocketClient.connect();

  // Set window.electron to the shim
  (window as any).electron = createElectronShim();

  console.log('[ElectronShim] Initialized', {
    platform,
    apiBase: apiClient.getBaseUrl(),
    wsConnected: webSocketClient.isConnected(),
  });
}
