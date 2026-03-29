import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket');
  const file   = searchParams.get('file');

  if (!bucket || !file) {
    return NextResponse.json({ error: 'bucket and file params required' }, { status: 400 });
  }

  const VALID_BUCKETS = ['facilitator-documents', 'admin-documents', 'restricted-documents', 'public-resources'];
  if (!VALID_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await sb.storage.from(bucket).createSignedUrl(file, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'File not found' }, { status: 404 });
  }

  // Log the access
  await sb.from('document_access_log').insert({
    user_id:       'ember-internal',
    document_name: file,
    bucket,
    role:          'internal',
    accessed_at:   new Date().toISOString(),
  });

  return NextResponse.json({ signed_url: data.signedUrl, expires_in: 60 }, { status: 200 });
}
