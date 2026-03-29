import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser-side Supabase client — use plain supabase-js (not @supabase/ssr createBrowserClient,
// which silently hangs in browser context with no network requests or errors).
let _client: SupabaseClient | null = null;

export function getSupabaseBrowser() {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}
