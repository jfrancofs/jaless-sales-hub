import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

declare global {
  // eslint-disable-next-line no-var
  var __jalessSupabase: SupabaseClient | undefined;
}

export const supabase = globalThis.__jalessSupabase ?? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'jaless-one-auth',
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__jalessSupabase = supabase;
}
