import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LearnedKanji {
  kanji: string;
  meaning: string;
}

const initialState: LearnedKanji[] = [];

const learnedKanjiSlice = createSlice({
  name: 'learnedKanji',
  initialState,
  reducers: {
    addLearnedKanji: (state, action: PayloadAction<LearnedKanji>) => {
      state.push(action.payload);
    }
  }
});

export const { addLearnedKanji } = learnedKanjiSlice.actions;
export default learnedKanjiSlice.reducer;