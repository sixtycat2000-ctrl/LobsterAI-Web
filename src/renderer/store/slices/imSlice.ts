/**
 * Stub IM Redux slice for web builds
 * IM features are not available in web version
 */

import { createSlice } from '@reduxjs/toolkit';
import type { IMConfig, IMStatus, IMPlatform, IMGatewayConfig } from '../../types/im';

interface IMState {
  config: IMConfig;
  status: IMStatus;
  isLoading: boolean;
  // Legacy flat structure for backward compatibility
  dingtalk: { enabled: boolean; webhookUrl: string; appId: string; appSecret: string; error: string | null };
  feishu: { enabled: boolean; webhookUrl: string; appId: string; appSecret: string; error: string | null };
  qq: { enabled: boolean; webhookUrl: string; appId: string; appSecret: string; error: string | null };
  telegram: { enabled: boolean; botToken: string; error: string | null };
  discord: { enabled: boolean; webhookUrl: string; error: string | null };
  nim: { enabled: boolean; appKey: string; appSecret: string; account: string; token: string; error: string | null };
  xiaomifeng: { enabled: boolean; webhookUrl: string; error: string | null };
  wecom: { enabled: boolean; webhookUrl: string; agentId: string; secret: string; error: string | null };
}

const defaultGatewayConfig = {
  enabled: false,
  webhookUrl: '',
  appId: '',
  appSecret: '',
};

const defaultStatus = {
  connected: false,
  error: undefined as string | undefined,
};

const initialState: IMState = {
  config: {
    dingtalk: { ...defaultGatewayConfig },
    feishu: { ...defaultGatewayConfig },
    qq: { ...defaultGatewayConfig },
    telegram: { ...defaultGatewayConfig, botToken: '' },
    discord: { ...defaultGatewayConfig },
    nim: { ...defaultGatewayConfig, appKey: '', account: '', token: '' },
    xiaomifeng: { ...defaultGatewayConfig },
    wecom: { ...defaultGatewayConfig, agentId: '', secret: '' },
  },
  status: {
    dingtalk: { ...defaultStatus },
    feishu: { ...defaultStatus },
    qq: { ...defaultStatus },
    telegram: { ...defaultStatus },
    discord: { ...defaultStatus },
    nim: { ...defaultStatus },
    xiaomifeng: { ...defaultStatus },
    wecom: { ...defaultStatus },
  },
  isLoading: false,
  // Legacy flat structure
  dingtalk: { enabled: false, webhookUrl: '', appId: '', appSecret: '', error: null },
  feishu: { enabled: false, webhookUrl: '', appId: '', appSecret: '', error: null },
  qq: { enabled: false, webhookUrl: '', appId: '', appSecret: '', error: null },
  telegram: { enabled: false, botToken: '', error: null },
  discord: { enabled: false, webhookUrl: '', error: null },
  nim: { enabled: false, appKey: '', appSecret: '', account: '', token: '', error: null },
  xiaomifeng: { enabled: false, webhookUrl: '', error: null },
  wecom: { enabled: false, webhookUrl: '', agentId: '', secret: '', error: null },
};

const imSlice = createSlice({
  name: 'im',
  initialState,
  reducers: {
    setDingTalkConfig: (state, action) => ({ ...state, dingtalk: { ...state.dingtalk, ...action.payload } }),
    setFeishuConfig: (state, action) => ({ ...state, feishu: { ...state.feishu, ...action.payload } }),
    setQQConfig: (state, action) => ({ ...state, qq: { ...state.qq, ...action.payload } }),
    setTelegramConfig: (state, action) => ({ ...state, telegram: { ...state.telegram, ...action.payload } }),
    setDiscordConfig: (state, action) => ({ ...state, discord: { ...state.discord, ...action.payload } }),
    setNimConfig: (state, action) => ({ ...state, nim: { ...state.nim, ...action.payload } }),
    setXiaomifengConfig: (state, action) => ({ ...state, xiaomifeng: { ...state.xiaomifeng, ...action.payload } }),
    setWecomConfig: (state, action) => ({ ...state, wecom: { ...state.wecom, ...action.payload } }),
    clearError: (state) => state,
    setConfig: (state, action) => { state.config = action.payload; },
    setStatus: (state, action) => { state.status = action.payload; },
    setIsLoading: (state, action) => { state.isLoading = action.payload; },
    updateConfig: (state, action: { payload: { platform: IMPlatform; config: Partial<IMGatewayConfig> } }) => {
      const { platform, config } = action.payload;
      state.config[platform] = { ...state.config[platform], ...config };
    },
  },
});

export const {
  setDingTalkConfig,
  setFeishuConfig,
  setQQConfig,
  setTelegramConfig,
  setDiscordConfig,
  setNimConfig,
  setXiaomifengConfig,
  setWecomConfig,
  clearError,
  setConfig,
  setStatus,
  setIsLoading,
  updateConfig,
} = imSlice.actions;

export default imSlice.reducer;
