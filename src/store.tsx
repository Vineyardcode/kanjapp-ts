import { configureStore } from '@reduxjs/toolkit';
import learnedKanjiSlice from './learnedKanjiSlice';

const store = configureStore({
  reducer: learnedKanjiSlice.reducer
});

export default store;