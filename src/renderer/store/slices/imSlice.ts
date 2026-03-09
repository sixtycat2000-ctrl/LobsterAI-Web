/**
 * Stub IM Redux slice for web builds
 * IM features are not available in web version
 */

import { createSlice } from '@reduxjs/toolkit';

interface IMState {
  dingtalk: { enabled: boolean; webhookUrl: string; appId: string; appSecret: string; error: string | null };
  feishu: { enabled: boolean; webhookUrl: string; appId: string; appSecret: string; error: string | null };
  qq: { enabled: boolean; webhookUrl: string; appId: string; appSecret: string; error: string | null };
  telegram: { enabled: boolean; botToken: string; error: string | null };
  discord: { enabled: boolean; webhookUrl: string; error: string | null };
  nim: { enabled: boolean; appKey: string; appSecret: string; error: string | null };
  xiaomifeng: { enabled: boolean; webhookUrl: string; error: string | null };
  wecom: { enabled: boolean; webhookUrl: string; agentId: string; secret: string; error: string | null };
}

const initialState: IMState = {
  dingtalk: { enabled: false, webhookUrl: '', appId: '', appSecret: '', error: null },
  feishu: { enabled: false, webhookUrl: '', appId: '', appSecret: '', error: null },
  qq: { enabled: false, webhookUrl: '', appId: '', appSecret: '', error: null },
  telegram: { enabled: false, botToken: '', error: null },
  discord: { enabled: false, webhookUrl: '', error: null },
  nim: { enabled: false, appKey: '', appSecret: '', error: null },
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
} = imSlice.actions;

export default imSlice.reducer;
