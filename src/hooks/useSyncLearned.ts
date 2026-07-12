import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { syncLearnedFromCloud, Kanji } from '../lib/learnedKanji';

/**
 * On mount and whenever auth state changes (e.g. after a magic-link login),
 * merge the user's cloud-stored learned kanji into local state. No-op when
 * signed out, so localStorage keeps working on its own.
 */
export function useSyncLearned(
  setLearnedKanjiArray: (kanji: Kanji[]) => void,
) {
  useEffect(() => {
    let active = true;
    const run = () => {
      syncLearnedFromCloud().then((merged) => {
        if (active && merged) setLearnedKanjiArray(merged);
      });
    };

    run();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => run());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // setLearnedKanjiArray is a stable useState setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
