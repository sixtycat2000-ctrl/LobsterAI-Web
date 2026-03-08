import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CoworkSession,
  CoworkSessionSummary,
  CoworkMessage,
  CoworkPermissionRequest,
  CoworkConfig,
} from '../../types';

interface CoworkState {
  sessions: CoworkSessionSummary[];
  currentSession: CoworkSession | null;
  currentSessionId: string | null;
  isStreaming: boolean;
  permissionRequest: CoworkPermissionRequest | null;
  config: CoworkConfig;
  draftPrompt: string;
  unreadSessionIds: string[];
  loading: boolean;
  error: string | null;
}

const defaultConfig: CoworkConfig = {
  workingDirectory: '',
  systemPrompt: '',
  executionMode: 'local',
  memoryEnabled: true,
  memoryImplicitUpdateEnabled: true,
  memoryLlmJudgeEnabled: false,
  memoryGuardLevel: 'standard',
  memoryUserMemoriesMaxItems: 100,
};

const initialState: CoworkState = {
  sessions: [],
  currentSession: null,
  currentSessionId: null,
  isStreaming: false,
  permissionRequest: null,
  config: defaultConfig,
  draftPrompt: '',
  unreadSessionIds: [],
  loading: false,
  error: null,
};

const coworkSlice = createSlice({
  name: 'cowork',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<CoworkSessionSummary[]>) => {
      state.sessions = action.payload;
    },
    setCurrentSession: (state, action: PayloadAction<CoworkSession | null>) => {
      state.currentSession = action.payload;
      state.currentSessionId = action.payload?.id ?? null;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
      state.currentSessionId = null;
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    setPermissionRequest: (state, action: PayloadAction<CoworkPermissionRequest | null>) => {
      state.permissionRequest = action.payload;
    },
    clearPermissionRequest: (state) => {
      state.permissionRequest = null;
    },
    setConfig: (state, action: PayloadAction<CoworkConfig>) => {
      state.config = action.payload;
    },
    updateConfig: (state, action: PayloadAction<Partial<CoworkConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setDraftPrompt: (state, action: PayloadAction<string>) => {
      state.draftPrompt = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ sessionId: string; message: CoworkMessage }>) => {
      if (state.currentSession?.id === action.payload.sessionId) {
        state.currentSession.messages.push(action.payload.message);
      }
    },
    updateMessage: (
      state,
      action: PayloadAction<{ sessionId: string; messageId: string; updates: Partial<CoworkMessage> }>
    ) => {
      if (state.currentSession?.id === action.payload.sessionId) {
        const message = state.currentSession.messages.find((m) => m.id === action.payload.messageId);
        if (message) {
          Object.assign(message, action.payload.updates);
        }
      }
    },
    setUnreadSessionIds: (state, action: PayloadAction<string[]>) => {
      state.unreadSessionIds = action.payload;
    },
    markSessionAsRead: (state, action: PayloadAction<string>) => {
      state.unreadSessionIds = state.unreadSessionIds.filter((id) => id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSessions,
  setCurrentSession,
  clearCurrentSession,
  setStreaming,
  setPermissionRequest,
  clearPermissionRequest,
  setConfig,
  updateConfig,
  setDraftPrompt,
  addMessage,
  updateMessage,
  setUnreadSessionIds,
  markSessionAsRead,
  setLoading,
  setError,
} = coworkSlice.actions;

export default coworkSlice.reducer;
