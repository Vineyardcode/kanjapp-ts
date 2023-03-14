import { createSlice } from '@reduxjs/toolkit';



const kanjiSlice = createSlice({
  name: 'kanji',
  initialState: {
    kanji: []
},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchKanji.pending, (state) => {
        // handle loading state if needed
      })
      .addCase(fetchKanji.fulfilled, (state, action) => {
        state.kanji = action.payload;
      })
      .addCase(fetchKanji.rejected, (state) => {
        // handle error state if needed
      });
  },
});

export default kanjiSlice.reducer;
