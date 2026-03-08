import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ViewType } from '../../types';

interface UIState {
  activeView: ViewType;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  settingsTab: 'api' | 'cowork' | 'appearance';
  theme: 'light' | 'dark' | 'system';
  language: 'zh' | 'en';
}

const initialState: UIState = {
  activeView: 'cowork',
  sidebarCollapsed: false,
  settingsOpen: false,
  settingsTab: 'api',
  theme: 'system',
  language: 'zh',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<ViewType>) => {
      state.activeView = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    openSettings: (state, action: PayloadAction<'api' | 'cowork' | 'appearance' | undefined>) => {
      state.settingsOpen = true;
      if (action.payload) {
        state.settingsTab = action.payload;
      }
    },
    closeSettings: (state) => {
      state.settingsOpen = false;
    },
    setSettingsTab: (state, action: PayloadAction<'api' | 'cowork' | 'appearance'>) => {
      state.settingsTab = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'zh' | 'en'>) => {
      state.language = action.payload;
    },
  },
});

export const {
  setActiveView,
  toggleSidebar,
  setSidebarCollapsed,
  openSettings,
  closeSettings,
  setSettingsTab,
  setTheme,
  setLanguage,
} = uiSlice.actions;

export default uiSlice.reducer;
