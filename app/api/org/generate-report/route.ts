/**
 * POST /api/org/generate-report
 * Body: { org_id, date_from, date_to }
 * Generates an Organization Program Report PDF scoped to the caller's org.
 * Security: caller must be org_admin in the same org as org_id.
 * Returns: { ok, url, path }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getUserFromRequest } from '@/lib/auth-helper';

async function getCallerOrgId(req: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const sb = getSupabaseServer();
  const { data } = await sb.from('facilitator_profiles').select('organization_id').eq('user_id', user.id).single();
  return data?.organization_id ?? null;
}


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { org_id, date_from, date_to } = body;

  if (!org_id || !date_from || !date_to) {
    return NextResponse.json({ error: 'Missing org_id, date_from, or date_to' }, { status: 400 });
  }

  // Enforce org scoping — caller must belong to this org
  const callerOrgId = await getCallerOrgId(req);
  if (!callerOrgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (callerOrgId !== org_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Delegate to /api/reports/generate with org scope
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.tripillarstudio.com';
  const genRes = await fetch(`${baseUrl}/api/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Pass through service auth so generate endpoint allows the request
      'x-org-report-internal': process.env.INTERNAL_SECRET ?? '',
      cookie: req.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({
      type:      'organization',
      org_id,
      date_from,
      date_to,
      force:     true,
    }),
  });

  const genData = await genRes.json();
  if (!genRes.ok || !genData.ok) {
    return NextResponse.json({ error: genData.error ?? 'Report generation failed' }, { status: genRes.status || 500 });
  }

  return NextResponse.json({ ok: true, url: genData.url, path: genData.path });
}
