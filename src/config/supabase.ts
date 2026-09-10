import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Vite inlines these at BUILD time. If they are absent when the bundle is built
// they become `undefined` forever — setting them in the host afterwards does
// nothing until a fresh build runs.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

let client: SupabaseClient | null = null;

if (!url || !key) {
  console.warn(
    'Supabase env vars missing at build time. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY, then REBUILD. Running in offline (localStorage-only) mode.',
  );
} else {
  try {
    // createClient throws on a missing OR malformed URL (e.g. a value pasted
    // without the https:// prefix), so this must be guarded, not just truthy-checked.
    client = createClient(url, key);
  } catch (e) {
    console.error('Supabase client not created; running offline:', e);
  }
}

/**
 * The Supabase client, or null when the app is not configured for it.
 * Null-checked at every call site so a missing config degrades to a working
 * localStorage-only app instead of crashing the whole bundle at import time.
 */
export const supabase = client;
export const supabaseConfigured = client !== null;
