import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

/** Current Supabase auth session (null when signed out), kept in sync live. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return; // not configured -> app behaves as permanently signed out

    db.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null));

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  return session;
}
