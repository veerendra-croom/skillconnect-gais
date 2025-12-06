import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezmrokydmexkyfjskmsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bXJva3lkbWV4a3lmanNrbXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODgwOTQsImV4cCI6MjA4MDA2NDA5NH0.ViqqXFh-1_YDOjJw-18sUw9PN5U-xRNU5GPL-I7bUDo';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Authentication will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);