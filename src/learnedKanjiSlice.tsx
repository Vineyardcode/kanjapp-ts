import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const learnedKanjiSlice = createSlice({
  name: 'learnedKanji',
  initialState: {
    learnedKanjiArray: []
  },
  reducers: {
    setLearnedKanjiArray: (state, action) => {
      state.learnedKanjiArray = action.payload;
    }
  }
});

export const { setLearnedKanjiArray } = learnedKanjiSlice.actions;

export default learnedKanjiSlice.reducer;