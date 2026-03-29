import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client using @supabase/ssr
// This stores the session in cookies so middleware and API routes can read it.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}
