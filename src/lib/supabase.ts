import { createClient } from '@supabase/supabase-js';

// Use placeholder values during build time so Next.js can compile the app.
// At runtime, actual environment variables must be set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
