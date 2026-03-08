import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { McpServerConfig } from '../../types';

interface McpState {
  servers: McpServerConfig[];
  loading: boolean;
  error: string | null;
}

const initialState: McpState = {
  servers: [],
  loading: false,
  error: null,
};

const mcpSlice = createSlice({
  name: 'mcp',
  initialState,
  reducers: {
    setMcpServers: (state, action: PayloadAction<McpServerConfig[]>) => {
      state.servers = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setMcpServers, setLoading, setError } = mcpSlice.actions;

export default mcpSlice.reducer;
