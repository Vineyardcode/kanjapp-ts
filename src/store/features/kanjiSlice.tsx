import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { database } from '../../config/firebase';
import { get, ref } from 'firebase/database';

export const fetchKanji = createAsyncThunk('kanji/fetchKanji', async () => {
  const kanjiRef = ref(database, 'jouyou');
  const snap = await get(kanjiRef);
  const kanjis = snap.val();
  return kanjis;
});

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
