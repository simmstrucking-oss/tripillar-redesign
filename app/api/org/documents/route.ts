import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getOrgUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;

  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch {}
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch {}
  }
  if (!token) return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  if (data.user.user_metadata?.role !== 'org_contact') return null;
  return data.user;
}

const FILE_PATTERNS: Record<string, string[]> = {
  'ila': ['License_Agreement', 'ILA'],
  'program-overview': ['Program_Overview'],
  'appropriateness-guide': ['Appropriateness'],
};

export async function GET(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const file = req.nextUrl.searchParams.get('file');
  if (!file || !FILE_PATTERNS[file]) {
    return NextResponse.json({ error: 'Invalid file parameter. Use: ila, program-overview, or appropriateness-guide' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: files, error: listErr } = await supabase.storage
    .from('admin-documents')
    .list('', { limit: 100 });

  if (listErr || !files) {
    return NextResponse.json({ error: 'Could not list documents' }, { status: 500 });
  }

  const patterns = FILE_PATTERNS[file];
  const match = files.find(f =>
    patterns.some(p => f.name.includes(p))
  );

  if (!match) {
    return NextResponse.json({ error: `Document not found for: ${file}` }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('admin-documents')
    .createSignedUrl(match.name, 60);

  if (signErr || !signed) {
    return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
