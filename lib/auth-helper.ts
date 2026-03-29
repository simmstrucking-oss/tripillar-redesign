import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Extracts the Supabase access token from request cookies.
 *
 * @supabase/ssr createBrowserClient stores tokens as:
 *   cookie name:  sb-<ref>-auth-token  (or chunked: .0, .1, ...)
 *   cookie value: "base64-<base64url-encoded JSON>"
 *
 * We must reassemble chunks then strip the "base64-" prefix and decode.
 */
function decodeSupabaseCookieValue(raw: string): string {
  const PREFIX = 'base64-';
  if (raw.startsWith(PREFIX)) {
    const b64 = raw.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice((b64.length % 4) || 4);
    try { return Buffer.from(padded, 'base64').toString('utf-8'); } catch { return raw; }
  }
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function extractAccessToken(cookieHeader: string): string | null {
  // Parse cookies into a map
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }

  // Find base token key (e.g. "sb-wuwgbdjgsgtsmuctuhpt-auth-token")
  const baseKey = Object.keys(cookies).find(k => /^sb-[^.]+?-auth-token$/.test(k));

  let rawJoined: string | null = null;

  if (baseKey && cookies[baseKey]) {
    // Single-cookie (short session or legacy)
    rawJoined = cookies[baseKey];
  } else {
    // Chunked: find base name from .0 chunk
    const chunkZeroKey = Object.keys(cookies).find(k => /^sb-[^.]+?-auth-token\.0$/.test(k));
    if (chunkZeroKey) {
      const chunkBase = chunkZeroKey.slice(0, -2); // strip ".0"
      let assembled = '';
      let i = 0;
      while (cookies[`${chunkBase}.${i}`] !== undefined) {
        assembled += cookies[`${chunkBase}.${i}`];
        i++;
      }
      rawJoined = assembled;
    }
  }

  if (!rawJoined) return null;

  // Decode and parse JSON
  try {
    const decoded = decodeSupabaseCookieValue(rawJoined);
    const parsed = JSON.parse(decoded);
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
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
