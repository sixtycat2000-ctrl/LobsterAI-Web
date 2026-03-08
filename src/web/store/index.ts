import { configureStore } from '@reduxjs/toolkit';
import coworkReducer from './slices/coworkSlice';
import settingsReducer from './slices/settingsSlice';
import skillReducer from './slices/skillSlice';
import mcpReducer from './slices/mcpSlice';
import taskReducer from './slices/taskSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    cowork: coworkReducer,
    settings: settingsReducer,
    skill: skillReducer,
    mcp: mcpReducer,
    task: taskReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
