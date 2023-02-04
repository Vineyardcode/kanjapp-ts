import { configureStore, createSlice } from '@reduxjs/toolkit';

const learnedKanjiArraySlice = createSlice({
  name: 'learnedKanjiArray',
  initialState: [] as string[],
  reducers: {
    addKanji: (state, action) => {
      state.push(action.payload);
    },
  },
});

const store = configureStore({
  reducer: {
    learnedKanjiArray: learnedKanjiArraySlice.reducer,
  },
});