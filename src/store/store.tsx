import { configureStore } from '@reduxjs/toolkit';
import kanjiSlice from './features/kanjiSlice';
import authSlice from './features/authSlice';

export const store = configureStore({
  reducer: {
    kanji: kanjiSlice,
    auth: authSlice,
  },
});