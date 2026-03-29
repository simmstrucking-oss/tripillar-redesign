/**
 * GET /api/org/reports-zip?org_id=X
 * Streams a ZIP of all cohort summary PDFs for an organization.
 * Security: caller must be org_admin in the same org.
 * Uses fflate (no native deps) for ZIP assembly in Vercel Edge-compatible runtime.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { zip } from 'fflate';

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
  const orgId = searchParams.get('org_id');
  if (!orgId) return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });

  const callerOrgId = await getCallerOrgId(req);
  if (!callerOrgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (callerOrgId !== orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb = getSupabaseServer();

  // Get all facilitator IDs for this org
  const { data: facs } = await sb
    .from('facilitator_profiles')
    .select('id, full_name')
    .eq('organization_id', orgId);

  if (!facs || facs.length === 0) {
    return NextResponse.json({ count: 0, message: 'No facilitators in this organization' });
  }

  // Collect all PDF paths from Storage and report_log
  const pdfFiles: { path: string; filename: string }[] = [];

  for (const fac of facs) {
    // Storage listing
    const prefix = `cohort-summary/${fac.id}/`;
    const { data: files } = await sb.storage.from('reports').list(prefix, { limit: 100 });
    for (const file of files ?? []) {
      if (!file.name.endsWith('.pdf')) continue;
      pdfFiles.push({
        path:     `${prefix}${file.name}`,
        filename: `${fac.full_name.replace(/[^a-zA-Z0-9]/g, '-')}/${file.name}`,
      });
    }

    // report_log extras
    const { data: logged } = await sb
      .from('report_log')
      .select('file_path')
      .eq('generated_for_entity', fac.id)
      .eq('report_type', 'cohort_summary');
    const existing = new Set(pdfFiles.map(f => f.path));
    for (const lr of logged ?? []) {
      if (!lr.file_path || existing.has(lr.file_path)) continue;
      const fname = lr.file_path.split('/').pop() ?? `report-${Date.now()}.pdf`;
      pdfFiles.push({
        path:     lr.file_path,
        filename: `${fac.full_name.replace(/[^a-zA-Z0-9]/g, '-')}/${fname}`,
      });
      existing.add(lr.file_path);
    }
  }

  if (pdfFiles.length === 0) {
    return NextResponse.json({ count: 0, message: 'No cohort reports exist yet' });
  }

  // Download all PDFs from Supabase Storage
  const fileEntries: Record<string, Uint8Array> = {};
  await Promise.all(
    pdfFiles.map(async ({ path, filename }) => {
      const { data, error } = await sb.storage.from('reports').download(path);
      if (error || !data) return;
      const buf = await data.arrayBuffer();
      fileEntries[filename] = new Uint8Array(buf);
    })
  );

  if (Object.keys(fileEntries).length === 0) {
    return NextResponse.json({ count: 0, message: 'Could not retrieve any PDF files' });
  }

  // Build ZIP using fflate
  const zipBuffer: Uint8Array = await new Promise((resolve, reject) => {
    zip(fileEntries, { level: 0 }, (err, data) => {
      if (err) reject(err); else resolve(data);
    });
  });

  const orgSlug  = orgId.slice(0, 8);
  const datestamp = new Date().toISOString().slice(0, 10);
  const filename  = `lg-org-${orgSlug}-reports-${datestamp}.zip`;

  return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(zipBuffer.byteLength),
    },
  });
}
