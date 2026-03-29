import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Extracts the Supabase access token from the request cookie.
 * Handles both the legacy single-cookie format and the newer
 * chunked format (sb-xxx-auth-token.0, .1, ...).
 */
function extractAccessToken(cookieHeader: string): string | null {
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }

  // Try chunked format first: sb-*-auth-token.0, .1, ...
  const chunkKeys = Object.keys(cookies)
    .filter(k => /^sb-[^.]+\.auth\.token\.\d+$/.test(k) || /^sb-[^-]+-auth-token\.\d+$/.test(k))
    .sort();

  if (chunkKeys.length > 0) {
    try {
      const joined = chunkKeys.map(k => decodeURIComponent(cookies[k])).join('');
      const parsed = JSON.parse(joined);
      if (parsed?.access_token) return parsed.access_token;
    } catch { /* fall through */ }
  }

  // Try single-cookie format: sb-*-auth-token
  const singleKey = Object.keys(cookies).find(k => /^sb-[^-]+-auth-token$/.test(k));
  if (singleKey) {
    const raw = cookies[singleKey];
    // Try URL-decoded JSON
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed?.access_token) return parsed.access_token;
    } catch { /* ignore */ }
    // Try base64
    try {
      const parsed = JSON.parse(Buffer.from(raw, 'base64').toString());
      if (parsed?.access_token) return parsed.access_token;
    } catch { /* ignore */ }
  }

  return null;
}

export async function getUserFromRequest(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const token = extractAccessToken(cookieHeader);
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.getUser(token);
  return (error || !data?.user) ? null : data.user;
}
