import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ScheduledTask } from '../../types';

interface TaskState {
  tasks: ScheduledTask[];
  selectedTaskId: string | null;
  viewMode: 'list' | 'create' | 'edit' | 'detail';
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTaskId: null,
  viewMode: 'list',
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<ScheduledTask[]>) => {
      state.tasks = action.payload;
    },
    selectTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'list' | 'create' | 'edit' | 'detail'>) => {
      state.viewMode = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setTasks, selectTask, setViewMode, setLoading, setError } = taskSlice.actions;

export default taskSlice.reducer;
