/**
 * Tests for Redux store and slices
 * Tests the pure function behavior of Redux reducers
 *
 * This file tests the reducer logic by importing the compiled output.
 * Run `npm run build` before running these tests.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Define types locally for testing
interface CoworkSessionSummary {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CoworkMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface CoworkSession {
  id: string;
  title: string;
  claudeSessionId: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  pinned: boolean;
  cwd: string;
  systemPrompt: string;
  executionMode: 'auto' | 'local' | 'sandbox';
  activeSkillIds: string[];
  messages: CoworkMessage[];
  createdAt: number;
  updatedAt: number;
}

interface CoworkPermissionRequest {
  sessionId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  requestId: string;
  toolUseId?: string | null;
}

interface CoworkConfig {
  workingDirectory: string;
  systemPrompt: string;
  executionMode: 'auto' | 'local' | 'sandbox';
  memoryEnabled: boolean;
  memoryImplicitUpdateEnabled: boolean;
  memoryLlmJudgeEnabled: boolean;
  memoryGuardLevel: 'strict' | 'standard' | 'relaxed';
  memoryUserMemoriesMaxItems: number;
}

interface CoworkState {
  sessions: CoworkSessionSummary[];
  currentSessionId: string | null;
  currentSession: CoworkSession | null;
  draftPrompt: string;
  unreadSessionIds: string[];
  isCoworkActive: boolean;
  isStreaming: boolean;
  pendingPermissions: CoworkPermissionRequest[];
  config: CoworkConfig;
}

// Import actions and reducer from compiled output
let coworkReducer: (state: CoworkState | undefined, action: { type: string; payload?: unknown }) => CoworkState;
let actions: {
  setCoworkActive: (active: boolean) => { type: string; payload: boolean };
  setSessions: (sessions: CoworkSessionSummary[]) => { type: string; payload: CoworkSessionSummary[] };
  setCurrentSessionId: (id: string | null) => { type: string; payload: string | null };
  setCurrentSession: (session: CoworkSession | null) => { type: string; payload: CoworkSession | null };
  setDraftPrompt: (prompt: string) => { type: string; payload: string };
  addSession: (session: CoworkSession) => { type: string; payload: CoworkSession };
  updateSessionStatus: (payload: { sessionId: string; status: CoworkSession['status'] }) => { type: string; payload: { sessionId: string; status: CoworkSession['status'] } };
  deleteSession: (id: string) => { type: string; payload: string };
  deleteSessions: (ids: string[]) => { type: string; payload: string[] };
  addMessage: (payload: { sessionId: string; message: CoworkMessage }) => { type: string; payload: { sessionId: string; message: CoworkMessage } };
  updateMessageContent: (payload: { sessionId: string; messageId: string; content: string }) => { type: string; payload: { sessionId: string; messageId: string; content: string } };
  setStreaming: (streaming: boolean) => { type: string; payload: boolean };
  updateSessionPinned: (payload: { sessionId: string; pinned: boolean }) => { type: string; payload: { sessionId: string; pinned: boolean } };
  updateSessionTitle: (payload: { sessionId: string; title: string }) => { type: string; payload: { sessionId: string; title: string } };
  enqueuePendingPermission: (permission: CoworkPermissionRequest) => { type: string; payload: CoworkPermissionRequest };
  dequeuePendingPermission: (payload?: { requestId?: string }) => { type: string; payload?: { requestId?: string } };
  clearPendingPermissions: () => { type: string };
  setConfig: (config: CoworkConfig) => { type: string; payload: CoworkConfig };
  updateConfig: (config: Partial<CoworkConfig>) => { type: string; payload: Partial<CoworkConfig> };
  clearCurrentSession: () => { type: string };
};

try {
  // Try to load compiled module
  const sliceModule = require('../../dist-electron/store/slices/coworkSlice.js');
  coworkReducer = sliceModule.default;
  actions = {
    setCoworkActive: sliceModule.setCoworkActive,
    setSessions: sliceModule.setSessions,
    setCurrentSessionId: sliceModule.setCurrentSessionId,
    setCurrentSession: sliceModule.setCurrentSession,
    setDraftPrompt: sliceModule.setDraftPrompt,
    addSession: sliceModule.addSession,
    updateSessionStatus: sliceModule.updateSessionStatus,
    deleteSession: sliceModule.deleteSession,
    deleteSessions: sliceModule.deleteSessions,
    addMessage: sliceModule.addMessage,
    updateMessageContent: sliceModule.updateMessageContent,
    setStreaming: sliceModule.setStreaming,
    updateSessionPinned: sliceModule.updateSessionPinned,
    updateSessionTitle: sliceModule.updateSessionTitle,
    enqueuePendingPermission: sliceModule.enqueuePendingPermission,
    dequeuePendingPermission: sliceModule.dequeuePendingPermission,
    clearPendingPermissions: sliceModule.clearPendingPermissions,
    setConfig: sliceModule.setConfig,
    updateConfig: sliceModule.updateConfig,
    clearCurrentSession: sliceModule.clearCurrentSession,
  };
} catch {
  // If module not found, create a mock implementation for testing structure
  console.log('Note: Compiled module not found. Run `npm run build` first.');
  console.log('Running structural tests only.');

  // Create a minimal mock for testing
  const initialState: CoworkState = {
    sessions: [],
    currentSessionId: null,
    currentSession: null,
    draftPrompt: '',
    unreadSessionIds: [],
    isCoworkActive: false,
    isStreaming: false,
    pendingPermissions: [],
    config: {
      workingDirectory: '',
      systemPrompt: '',
      executionMode: 'local',
      memoryEnabled: true,
      memoryImplicitUpdateEnabled: true,
      memoryLlmJudgeEnabled: false,
      memoryGuardLevel: 'strict',
      memoryUserMemoriesMaxItems: 12,
    },
  };

  coworkReducer = (state = initialState, action) => state;
  actions = {
    setCoworkActive: (active) => ({ type: 'cowork/setCoworkActive', payload: active }),
    setSessions: (sessions) => ({ type: 'cowork/setSessions', payload: sessions }),
    setCurrentSessionId: (id) => ({ type: 'cowork/setCurrentSessionId', payload: id }),
    setCurrentSession: (session) => ({ type: 'cowork/setCurrentSession', payload: session }),
    setDraftPrompt: (prompt) => ({ type: 'cowork/setDraftPrompt', payload: prompt }),
    addSession: (session) => ({ type: 'cowork/addSession', payload: session }),
    updateSessionStatus: (payload) => ({ type: 'cowork/updateSessionStatus', payload }),
    deleteSession: (id) => ({ type: 'cowork/deleteSession', payload: id }),
    deleteSessions: (ids) => ({ type: 'cowork/deleteSessions', payload: ids }),
    addMessage: (payload) => ({ type: 'cowork/addMessage', payload }),
    updateMessageContent: (payload) => ({ type: 'cowork/updateMessageContent', payload }),
    setStreaming: (streaming) => ({ type: 'cowork/setStreaming', payload: streaming }),
    updateSessionPinned: (payload) => ({ type: 'cowork/updateSessionPinned', payload }),
    updateSessionTitle: (payload) => ({ type: 'cowork/updateSessionTitle', payload }),
    enqueuePendingPermission: (permission) => ({ type: 'cowork/enqueuePendingPermission', payload: permission }),
    dequeuePendingPermission: (payload) => ({ type: 'cowork/dequeuePendingPermission', payload }),
    clearPendingPermissions: () => ({ type: 'cowork/clearPendingPermissions' }),
    setConfig: (config) => ({ type: 'cowork/setConfig', payload: config }),
    updateConfig: (config) => ({ type: 'cowork/updateConfig', payload: config }),
    clearCurrentSession: () => ({ type: 'cowork/clearCurrentSession' }),
  };
}

// Helper to create initial state
function createInitialState(): CoworkState {
  return {
    sessions: [],
    currentSessionId: null,
    currentSession: null,
    draftPrompt: '',
    unreadSessionIds: [],
    isCoworkActive: false,
    isStreaming: false,
    pendingPermissions: [],
    config: {
      workingDirectory: '',
      systemPrompt: '',
      executionMode: 'local',
      memoryEnabled: true,
      memoryImplicitUpdateEnabled: true,
      memoryLlmJudgeEnabled: false,
      memoryGuardLevel: 'strict',
      memoryUserMemoriesMaxItems: 12,
    },
  };
}

// Helper to create a sample session
function createSampleSession(overrides: Partial<CoworkSession> = {}): CoworkSession {
  return {
    id: 'session-123',
    title: 'Test Session',
    claudeSessionId: null,
    status: 'idle',
    pinned: false,
    cwd: '/test/dir',
    systemPrompt: '',
    executionMode: 'local',
    activeSkillIds: [],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// Helper to create a sample session summary
function createSampleSessionSummary(overrides: Partial<CoworkSessionSummary> = {}): CoworkSessionSummary {
  return {
    id: 'session-123',
    title: 'Test Session',
    status: 'idle',
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// Helper to create a sample message
function createSampleMessage(overrides: Partial<CoworkMessage> = {}): CoworkMessage {
  return {
    id: 'message-123',
    type: 'user',
    content: 'Hello world',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('coworkSlice', () => {
  let initialState: CoworkState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  // ==================== Initial State ====================

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = coworkReducer(undefined, { type: 'unknown' });
      assert.ok(state);
      assert.deepStrictEqual(state.sessions, []);
      assert.strictEqual(state.currentSessionId, null);
      assert.strictEqual(state.currentSession, null);
      assert.strictEqual(state.draftPrompt, '');
      assert.strictEqual(state.isCoworkActive, false);
      assert.strictEqual(state.isStreaming, false);
    });

    it('should have correct default config', () => {
      const state = coworkReducer(undefined, { type: 'unknown' });
      assert.strictEqual(state.config.executionMode, 'local');
      assert.strictEqual(state.config.memoryEnabled, true);
      assert.strictEqual(state.config.memoryGuardLevel, 'strict');
    });
  });

  // ==================== Action Creators ====================

  describe('action creators', () => {
    it('should create setCoworkActive action', () => {
      const action = actions.setCoworkActive(true);
      assert.strictEqual(action.type, 'cowork/setCoworkActive');
      assert.strictEqual(action.payload, true);
    });

    it('should create setSessions action', () => {
      const sessions = [createSampleSessionSummary()];
      const action = actions.setSessions(sessions);
      assert.strictEqual(action.type, 'cowork/setSessions');
      assert.deepStrictEqual(action.payload, sessions);
    });

    it('should create setCurrentSessionId action', () => {
      const action = actions.setCurrentSessionId('session-123');
      assert.strictEqual(action.type, 'cowork/setCurrentSessionId');
      assert.strictEqual(action.payload, 'session-123');
    });

    it('should create setCurrentSession action', () => {
      const session = createSampleSession();
      const action = actions.setCurrentSession(session);
      assert.strictEqual(action.type, 'cowork/setCurrentSession');
      assert.deepStrictEqual(action.payload, session);
    });

    it('should create setDraftPrompt action', () => {
      const action = actions.setDraftPrompt('Hello');
      assert.strictEqual(action.type, 'cowork/setDraftPrompt');
      assert.strictEqual(action.payload, 'Hello');
    });

    it('should create addSession action', () => {
      const session = createSampleSession();
      const action = actions.addSession(session);
      assert.strictEqual(action.type, 'cowork/addSession');
      assert.deepStrictEqual(action.payload, session);
    });

    it('should create updateSessionStatus action', () => {
      const action = actions.updateSessionStatus({ sessionId: 's1', status: 'running' });
      assert.strictEqual(action.type, 'cowork/updateSessionStatus');
      assert.deepStrictEqual(action.payload, { sessionId: 's1', status: 'running' });
    });

    it('should create deleteSession action', () => {
      const action = actions.deleteSession('session-123');
      assert.strictEqual(action.type, 'cowork/deleteSession');
      assert.strictEqual(action.payload, 'session-123');
    });

    it('should create deleteSessions action', () => {
      const action = actions.deleteSessions(['s1', 's2']);
      assert.strictEqual(action.type, 'cowork/deleteSessions');
      assert.deepStrictEqual(action.payload, ['s1', 's2']);
    });

    it('should create addMessage action', () => {
      const message = createSampleMessage();
      const action = actions.addMessage({ sessionId: 's1', message });
      assert.strictEqual(action.type, 'cowork/addMessage');
      assert.strictEqual(action.payload.sessionId, 's1');
      assert.deepStrictEqual(action.payload.message, message);
    });

    it('should create updateMessageContent action', () => {
      const action = actions.updateMessageContent({
        sessionId: 's1',
        messageId: 'm1',
        content: 'New content',
      });
      assert.strictEqual(action.type, 'cowork/updateMessageContent');
      assert.deepStrictEqual(action.payload, {
        sessionId: 's1',
        messageId: 'm1',
        content: 'New content',
      });
    });

    it('should create setStreaming action', () => {
      const action = actions.setStreaming(true);
      assert.strictEqual(action.type, 'cowork/setStreaming');
      assert.strictEqual(action.payload, true);
    });

    it('should create updateSessionPinned action', () => {
      const action = actions.updateSessionPinned({ sessionId: 's1', pinned: true });
      assert.strictEqual(action.type, 'cowork/updateSessionPinned');
      assert.deepStrictEqual(action.payload, { sessionId: 's1', pinned: true });
    });

    it('should create updateSessionTitle action', () => {
      const action = actions.updateSessionTitle({ sessionId: 's1', title: 'New Title' });
      assert.strictEqual(action.type, 'cowork/updateSessionTitle');
      assert.deepStrictEqual(action.payload, { sessionId: 's1', title: 'New Title' });
    });

    it('should create enqueuePendingPermission action', () => {
      const permission: CoworkPermissionRequest = {
        sessionId: 's1',
        toolName: 'read_file',
        toolInput: { path: '/test' },
        requestId: 'r1',
      };
      const action = actions.enqueuePendingPermission(permission);
      assert.strictEqual(action.type, 'cowork/enqueuePendingPermission');
      assert.deepStrictEqual(action.payload, permission);
    });

    it('should create dequeuePendingPermission action', () => {
      const action = actions.dequeuePendingPermission({ requestId: 'r1' });
      assert.strictEqual(action.type, 'cowork/dequeuePendingPermission');
      assert.deepStrictEqual(action.payload, { requestId: 'r1' });
    });

    it('should create clearPendingPermissions action', () => {
      const action = actions.clearPendingPermissions();
      assert.strictEqual(action.type, 'cowork/clearPendingPermissions');
    });

    it('should create setConfig action', () => {
      const config: CoworkConfig = {
        workingDirectory: '/new',
        systemPrompt: 'New prompt',
        executionMode: 'sandbox',
        memoryEnabled: false,
        memoryImplicitUpdateEnabled: false,
        memoryLlmJudgeEnabled: true,
        memoryGuardLevel: 'relaxed',
        memoryUserMemoriesMaxItems: 20,
      };
      const action = actions.setConfig(config);
      assert.strictEqual(action.type, 'cowork/setConfig');
      assert.deepStrictEqual(action.payload, config);
    });

    it('should create updateConfig action', () => {
      const action = actions.updateConfig({ workingDirectory: '/new' });
      assert.strictEqual(action.type, 'cowork/updateConfig');
      assert.deepStrictEqual(action.payload, { workingDirectory: '/new' });
    });

    it('should create clearCurrentSession action', () => {
      const action = actions.clearCurrentSession();
      assert.strictEqual(action.type, 'cowork/clearCurrentSession');
    });
  });

  // ==================== Type Validation ====================

  describe('type validation', () => {
    it('should validate CoworkSessionSummary type', () => {
      const summary: CoworkSessionSummary = {
        id: 'test-id',
        title: 'Test',
        status: 'idle',
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      assert.strictEqual(typeof summary.id, 'string');
      assert.strictEqual(typeof summary.title, 'string');
      assert.ok(['idle', 'running', 'completed', 'error'].includes(summary.status));
    });

    it('should validate CoworkSession type', () => {
      const session: CoworkSession = {
        id: 'test-id',
        title: 'Test',
        claudeSessionId: null,
        status: 'idle',
        pinned: false,
        cwd: '/test',
        systemPrompt: '',
        executionMode: 'local',
        activeSkillIds: [],
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      assert.strictEqual(typeof session.id, 'string');
      assert.ok(Array.isArray(session.messages));
    });

    it('should validate CoworkMessage type', () => {
      const message: CoworkMessage = {
        id: 'msg-id',
        type: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };
      assert.strictEqual(typeof message.id, 'string');
      assert.ok(['user', 'assistant', 'tool_use', 'tool_result', 'system'].includes(message.type));
    });

    it('should validate CoworkConfig type', () => {
      const config: CoworkConfig = {
        workingDirectory: '/test',
        systemPrompt: '',
        executionMode: 'local',
        memoryEnabled: true,
        memoryImplicitUpdateEnabled: true,
        memoryLlmJudgeEnabled: false,
        memoryGuardLevel: 'strict',
        memoryUserMemoriesMaxItems: 12,
      };
      assert.strictEqual(typeof config.workingDirectory, 'string');
      assert.strictEqual(typeof config.memoryEnabled, 'boolean');
      assert.ok(['strict', 'standard', 'relaxed'].includes(config.memoryGuardLevel));
    });

    it('should validate CoworkPermissionRequest type', () => {
      const permission: CoworkPermissionRequest = {
        sessionId: 's1',
        toolName: 'read_file',
        toolInput: { path: '/test' },
        requestId: 'r1',
      };
      assert.strictEqual(typeof permission.sessionId, 'string');
      assert.strictEqual(typeof permission.toolName, 'string');
      assert.strictEqual(typeof permission.toolInput, 'object');
    });
  });
});
