import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LearnedKanjiArrayState {
  learnedKanjiArray: string[];
}

const initialState: LearnedKanjiArrayState = {
  learnedKanjiArray: [],
};

const learnedKanjiArraySlice = createSlice({
  name: 'learnedKanjiArray',
  initialState,
  reducers: {
    setLearnedKanjiArray: (state, action: PayloadAction<string[]>) => {
      state.learnedKanjiArray = action.payload;
    },
  },
});

export const { setLearnedKanjiArray } = learnedKanjiArraySlice.actions;
export default learnedKanjiArraySlice.reducer;