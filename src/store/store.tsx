import { configureStore } from '@reduxjs/toolkit';
import cachedDataSlice from './features/cachedDataSlice';

export const store = configureStore({
  reducer: {
    cachedData: cachedDataSlice,
  },
});