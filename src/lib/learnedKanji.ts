import { supabase } from '../config/supabase';

// The app stores whole kanji objects; we only ever key them by `character`.
export interface Kanji {
  character?: string;
  [key: string]: any;
}

const STORAGE_KEY = 'learnedKanjiArray';

export function getLocalLearned(): Kanji[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setLocalLearned(arr: Kanji[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/** Drop the locally cached list (used on sign-out so it can't leak to the next account). */
export function clearLocalLearned() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota/privacy-mode errors */
  }
}

async function currentUserId(): Promise<string | null> {
  const db = supabase;
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  return user?.id ?? null;
}

/**
 * Mark a kanji as learned: always writes localStorage, and additionally
 * upserts to Supabase when the user is signed in. Returns the updated list.
 */
export async function saveLearnedKanji(kanji: Kanji): Promise<Kanji[]> {
  const arr = getLocalLearned();
  if (kanji.character && !arr.some((k) => k.character === kanji.character)) {
    arr.push(kanji);
    setLocalLearned(arr);
  }

  const db = supabase;
  if (!db) return arr;

  const userId = await currentUserId();
  if (userId && kanji.character) {
    const { error } = await db
      .from('learned_kanji')
      .upsert(
        { user_id: userId, character: kanji.character, kanji },
        { onConflict: 'user_id,character' },
      );
    if (error) console.error('saveLearnedKanji (cloud):', error.message);
  }

  return arr;
}

/**
 * Forget a kanji: removes it from localStorage and, when signed in, from
 * Supabase. Returns the updated list.
 */
export async function deleteLearnedKanji(kanji: Kanji): Promise<Kanji[]> {
  const arr = getLocalLearned().filter((k) => k.character !== kanji.character);
  setLocalLearned(arr);

  const db = supabase;
  if (!db) return arr;

  const userId = await currentUserId();
  if (userId && kanji.character) {
    const { error } = await db
      .from('learned_kanji')
      .delete()
      .eq('user_id', userId)
      .eq('character', kanji.character);
    if (error) console.error('deleteLearnedKanji (cloud):', error.message);
  }

  return arr;
}

/**
 * Pull the signed-in user's learned kanji from Supabase and merge with
 * whatever is in localStorage (union by character). Local-only kanji are
 * pushed up so nothing learned while logged out is lost. Writes the merged
 * result back to localStorage and returns it. Returns null when signed out
 * or when Supabase is not configured.
 */
export async function syncLearnedFromCloud(): Promise<Kanji[] | null> {
  const db = supabase;
  if (!db) return null;

  const userId = await currentUserId();
  if (!userId) return null;

  const local = getLocalLearned();
  const { data, error } = await db
    .from('learned_kanji')
    .select('kanji')
    .eq('user_id', userId);

  if (error) {
    console.error('syncLearnedFromCloud:', error.message);
    return null;
  }

  const cloud: Kanji[] = (data ?? []).map((row: any) => row.kanji);

  // Union by character (cloud first, then local fills any gaps).
  const merged = new Map<string, Kanji>();
  [...cloud, ...local].forEach((k) => {
    if (k?.character) merged.set(k.character, k);
  });
  const mergedArr = [...merged.values()];
  setLocalLearned(mergedArr);

  // Push kanji that exist locally but not yet in the cloud.
  const cloudChars = new Set(cloud.map((k) => k.character));
  const toPush = mergedArr
    .filter((k) => k.character && !cloudChars.has(k.character))
    .map((k) => ({ user_id: userId, character: k.character!, kanji: k }));
  if (toPush.length) {
    const { error: pushError } = await db
      .from('learned_kanji')
      .upsert(toPush, { onConflict: 'user_id,character' });
    if (pushError) console.error('syncLearnedFromCloud (push):', pushError.message);
  }

  return mergedArr;
}
