import { configureStore } from '@reduxjs/toolkit';
import learnedKanjiArraySlice from './learnedKanjiSlice';

const store = configureStore({
  reducer: {
    learnedKanjiArray: learnedKanjiArraySlice.reducer
  },
});

export default store;