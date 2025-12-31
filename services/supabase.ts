import { createClient } from '@supabase/supabase-js';

// Fallback credentials
const FALLBACK_SUPABASE_URL = 'https://ezmrokydmexkyfjskmsq.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bXJva3lkbWV4a3lmanNrbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODgwOTQsImV4cCI6MjA4MDA2NDA5NH0.ViqqXFh-1_YDOjJw-18sUw9PN5U-xRNU5GPL-I7bUDo';

let supabaseUrl = FALLBACK_SUPABASE_URL;
let supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;

// Attempt to access environment variables safely
// Using static access allows Vite to replace these values at build time if available
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_SUPABASE_URL) {
      // @ts-ignore
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    }
    // @ts-ignore
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // @ts-ignore
      supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }
  }
} catch (e) {
  // Ignore errors and use fallbacks
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials missing. App cannot connect to database.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);
