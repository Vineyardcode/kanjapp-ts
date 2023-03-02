import { createSlice } from '@reduxjs/toolkit';

const cachedDataSlice = createSlice({
  name: 'cachedData',
  initialState: [],
  reducers: {
    selectCachedData: (state, action) => {
      return action.payload;
    },
  },
});

export const { selectCachedData } = cachedDataSlice.actions;
export default cachedDataSlice.reducer;