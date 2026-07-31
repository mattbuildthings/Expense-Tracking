import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL_KEY = 'build_supabase_url';
const ANON_KEY = 'build_supabase_anon_key';

// User's project credentials
export const DEFAULT_SUPABASE_URL = 'https://idckmqtcneozcrqebchd.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkY2ttcXRjbmVvemNycWViY2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Njc3MDIsImV4cCI6MjEwMTA0MzcwMn0.KCDuTCnElL0bBOekx4yNaZlywgbcC2eqbmQLsVCvIJ8';

export function getSupabaseUrl(): string {
  return localStorage.getItem(URL_KEY) || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return localStorage.getItem(ANON_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
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
