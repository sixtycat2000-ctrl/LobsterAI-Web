import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Skill } from '../../types';

interface SkillState {
  skills: Skill[];
  activeSkillIds: string[];
  loading: boolean;
  error: string | null;
}

const initialState: SkillState = {
  skills: [],
  activeSkillIds: [],
  loading: false,
  error: null,
};

const skillSlice = createSlice({
  name: 'skill',
  initialState,
  reducers: {
    setSkills: (state, action: PayloadAction<Skill[]>) => {
      state.skills = action.payload;
    },
    setActiveSkillIds: (state, action: PayloadAction<string[]>) => {
      state.activeSkillIds = action.payload;
    },
    toggleActiveSkill: (state, action: PayloadAction<string>) => {
      const skillId = action.payload;
      const index = state.activeSkillIds.indexOf(skillId);
      if (index >= 0) {
        state.activeSkillIds.splice(index, 1);
      } else {
        state.activeSkillIds.push(skillId);
      }
    },
    clearActiveSkills: (state) => {
      state.activeSkillIds = [];
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
  setSkills,
  setActiveSkillIds,
  toggleActiveSkill,
  clearActiveSkills,
  setLoading,
  setError,
} = skillSlice.actions;

export default skillSlice.reducer;
