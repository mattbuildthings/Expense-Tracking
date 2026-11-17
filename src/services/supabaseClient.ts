import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL_KEY = 'build_supabase_url';
const ANON_KEY = 'build_supabase_anon_key';

// NO HARDCODED CREDENTIALS.
//
// A working project URL and anon key used to sit here as DEFAULT_SUPABASE_URL /
// DEFAULT_SUPABASE_ANON_KEY, in a public repo, and because this app never signs
// anybody in, every request ran as the `anon` role. Anyone reading the repo had
// the same read/write access to `expenses` that the app did. See
// supabase/migrations/20261117_lock_down_anon_access.sql.
//
// Do not reintroduce a fallback constant here. Cloud sync is opt-in: it stays
// off until someone supplies credentials via build-time env vars or the
// Settings modal. Every helper in storageService.ts already returns null when
// getSupabaseClient() yields null, and App.tsx guards on `if (cloudItems)`, so
// with no credentials the app runs entirely on localStorage + IndexedDB.
//
// Note that an anon key is public by design -- it is meant to ship in client
// JS. Keeping it out of the repo is hygiene, not the security boundary. The
// boundary is row-level security plus a real authenticated user, which arrives
// with the merge.

export function getSupabaseUrl(): string {
  return localStorage.getItem(URL_KEY) || import.meta.env.VITE_SUPABASE_URL || '';
}

export function getSupabaseAnonKey(): string {
  return localStorage.getItem(ANON_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(URL_KEY, url.trim());
  localStorage.setItem(ANON_KEY, anonKey.trim());
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: { persistSession: false }
    });
  }

  return supabaseInstance;
}

export function resetSupabaseInstance(): void {
  supabaseInstance = null;
}
