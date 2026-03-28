import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client — uses service role, bypasses RLS
// Only import in Server Components, API routes, and middleware
export function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
