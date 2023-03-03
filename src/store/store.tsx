import { configureStore } from '@reduxjs/toolkit';
import kanjiSlice from './features/kanjiSlice';

export const store = configureStore({
  reducer: {
    kanji: kanjiSlice,
  },
});