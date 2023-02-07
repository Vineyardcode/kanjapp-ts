import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LearnedKanji {
  kanji: string;
  meaning: string;
  character: string;
}

const initialState: LearnedKanji[] = [];

const learnedKanjiSlice = createSlice({
  name: 'learnedKanji',
  initialState,
  reducers: {
    addLearnedKanji: (state, action: PayloadAction<LearnedKanji>) => {
      const index = state.findIndex(kanji => kanji.character === action.payload.character);
      if (index === -1) {
        state.push(action.payload);
      }
    }
  }
});

export const { addLearnedKanji } = learnedKanjiSlice.actions;
export default learnedKanjiSlice;