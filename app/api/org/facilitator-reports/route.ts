/**
 * GET /api/org/facilitator-reports?fac_id=X&org_id=Y
 * Returns signed URLs for all cohort summary PDFs for a facilitator.
 * Security: caller must be org_admin in the SAME org as the facilitator.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

async function getCallerOrgId(req: NextRequest): Promise<string | null> {
  const sb = getSupabaseServer();
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch   = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;
  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch { /* */ }
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch { /* */ }
  }
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await sb
    .from('facilitator_profiles')
    .select('organization_id, role')
    .eq('user_id', data.user.id)
    .single();
  if (!profile || profile.role !== 'org_admin') return null;
  return profile.organization_id ?? null;
}


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const facId = searchParams.get('fac_id');
  const orgId = searchParams.get('org_id');

  if (!facId || !orgId) return NextResponse.json({ error: 'Missing fac_id or org_id' }, { status: 400 });

  const callerOrgId = await getCallerOrgId(req);
  if (!callerOrgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (callerOrgId !== orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb = getSupabaseServer();

  // Verify the facilitator belongs to this org
  const { data: facProfile } = await sb
    .from('facilitator_profiles')
    .select('id, organization_id')
    .eq('id', facId)
    .single();

  if (!facProfile || facProfile.organization_id !== orgId) {
    return NextResponse.json({ error: 'Facilitator not found in this organization' }, { status: 404 });
  }

  // List all report files for this facilitator in Supabase Storage
  const prefix = `cohort-summary/${facId}/`;
  const { data: files, error: listErr } = await sb.storage
    .from('reports')
    .list(prefix, { limit: 100 });

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const reports: { path: string; url: string }[] = [];

  for (const file of files ?? []) {
    if (!file.name.endsWith('.pdf')) continue;
    const fullPath = `${prefix}${file.name}`;
    const { data: signedData } = await sb.storage
      .from('reports')
      .createSignedUrl(fullPath, 60 * 60); // 1-hour URL
    if (signedData?.signedUrl) {
      reports.push({ path: fullPath, url: signedData.signedUrl });
    }
  }

  // Also check report_log table for any logged paths
  const { data: loggedReports } = await sb
    .from('report_log')
    .select('file_path, created_at')
    .eq('generated_for_entity', facId)
    .eq('report_type', 'cohort_summary')
    .order('created_at', { ascending: false })
    .limit(50);

  // Merge any logged paths not already in the storage list
  const existingPaths = new Set(reports.map(r => r.path));
  for (const lr of loggedReports ?? []) {
    if (!lr.file_path || existingPaths.has(lr.file_path)) continue;
    const { data: signedData } = await sb.storage
      .from('reports')
      .createSignedUrl(lr.file_path, 60 * 60);
    if (signedData?.signedUrl) {
      reports.push({ path: lr.file_path, url: signedData.signedUrl });
      existingPaths.add(lr.file_path);
    }
  }

  return NextResponse.json({ reports });
}
