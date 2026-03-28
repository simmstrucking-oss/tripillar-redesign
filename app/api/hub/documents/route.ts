import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch   = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;
  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch { /* ignore */ }
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch { /* ignore */ }
  }
  if (!token) return null;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await sb.auth.getUser(token);
  return (error || !data?.user) ? null : data.user;
}

// GET /api/hub/documents — list active documents + signed download URLs
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: docs, error } = await supabase
    .from('facilitator_documents')
    .select('id, title, description, category, book_number, file_path, file_size, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate signed URLs (60 seconds — short-lived per spec)
  const withUrls = await Promise.all((docs ?? []).map(async doc => {
    if (!doc.file_path) return { ...doc, signed_url: null };
    const { data: signed } = await supabase.storage
      .from('facilitator-documents')
      .createSignedUrl(doc.file_path, 60);
    return { ...doc, signed_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json({ documents: withUrls });
}
