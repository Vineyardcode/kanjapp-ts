import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { syncLearnedFromCloud, clearLocalLearned, Kanji } from '../lib/learnedKanji';

/**
 * On mount and whenever auth state changes (e.g. after a magic-link login),
 * merge the user's cloud-stored learned kanji into local state. No-op when
 * signed out or unconfigured, so localStorage keeps working on its own.
 */
export function useSyncLearned(
  setLearnedKanjiArray: (kanji: Kanji[]) => void,
) {
  useEffect(() => {
    let active = true;
    const run = () => {
      syncLearnedFromCloud()
        .then((merged) => {
          if (active && merged) setLearnedKanjiArray(merged);
        })
        .catch((e) => console.error('learned-kanji sync failed:', e));
    };

    run();

    const db = supabase;
    if (!db) return () => { active = false; };

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Never leave the previous account's kanji in the shared localStorage
        // key: the next account to sign in on this device would otherwise push
        // them up as its own rows.
        clearLocalLearned();
        if (active) setLearnedKanjiArray([]);
        return;
      }
      run();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // setLearnedKanjiArray is a stable useState setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
