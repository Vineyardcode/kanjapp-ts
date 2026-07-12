import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Helps catch a missing/mis-named .env early instead of a cryptic runtime error.
  console.warn(
    'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  );
}

// persistSession + detectSessionInUrl are on by default, so the magic-link
// redirect (which returns tokens in the URL) is handled automatically.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
