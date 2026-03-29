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

export async function GET(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: org, error } = await supabase
    .from('organizations')
    .select('license_type, license_status, license_start, license_renewal, contact_name, contact_email')
    .eq('id', orgId)
    .single();

  if (error || !org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  const { data: files } = await supabase.storage
    .from('admin-documents')
    .list('', { limit: 100 });

  let ilaUrl = null;
  if (files) {
    const ilaFile = files.find(f => f.name.includes('License_Agreement') || f.name.includes('ILA'));
    if (ilaFile) {
      const { data: signed } = await supabase.storage
        .from('admin-documents')
        .createSignedUrl(ilaFile.name, 60);
      ilaUrl = signed?.signedUrl ?? null;
    }
  }

  return NextResponse.json({ ...org, ila_url: ilaUrl });
}
