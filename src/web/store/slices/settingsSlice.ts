import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ApiConfig } from '../../types';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'zh' | 'en';
  apiConfig: ApiConfig | null;
  isOpen: boolean;
  activeTab: 'api' | 'cowork' | 'appearance';
}

const initialState: SettingsState = {
  theme: 'system',
  language: 'zh',
  apiConfig: null,
  isOpen: false,
  activeTab: 'api',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'zh' | 'en'>) => {
      state.language = action.payload;
    },
    setApiConfig: (state, action: PayloadAction<ApiConfig | null>) => {
      state.apiConfig = action.payload;
    },
    openSettings: (state, action: PayloadAction<'api' | 'cowork' | 'appearance' | undefined>) => {
      state.isOpen = true;
      if (action.payload) {
        state.activeTab = action.payload;
      }
    },
    closeSettings: (state) => {
      state.isOpen = false;
    },
    setActiveTab: (state, action: PayloadAction<'api' | 'cowork' | 'appearance'>) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setApiConfig,
  openSettings,
  closeSettings,
  setActiveTab,
} = settingsSlice.actions;

export default settingsSlice.reducer;
