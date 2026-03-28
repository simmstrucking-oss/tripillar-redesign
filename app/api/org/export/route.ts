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
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  return (error || !data?.user) ? null : data.user;
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// GET /api/org/export — returns CSV of all facilitators in the caller's org
// Security: same org_admin + organization_id check as /api/org/dashboard
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: callerProfile } = await supabase
    .from('facilitator_profiles')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'org_admin' || !callerProfile.organization_id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const orgId = callerProfile.organization_id;

  const { data: facilitators } = await supabase
    .from('facilitator_profiles')
    .select('id, full_name, email, cert_id, cert_status, cert_issued, cert_renewal, books_certified, last_active')
    .eq('organization_id', orgId)
    .order('full_name');

  if (!facilitators) return new NextResponse('No data', { status: 500 });

  // Fetch cohorts for all facilitators
  const ids = facilitators.map(f => f.id);
  let cohortMap: Record<string, { count: number; participants: number }> = {};

  if (ids.length > 0) {
    const { data: cohorts } = await supabase
      .from('cohorts')
      .select('facilitator_id, participant_count')
      .in('facilitator_id', ids);

    for (const c of (cohorts ?? [])) {
      if (!cohortMap[c.facilitator_id]) cohortMap[c.facilitator_id] = { count: 0, participants: 0 };
      cohortMap[c.facilitator_id].count++;
      cohortMap[c.facilitator_id].participants += c.participant_count ?? 0;
    }
  }

  const header = ['Name', 'Email', 'Cert ID', 'Cert Status', 'Cert Issued', 'Renewal Date',
                  'Books Certified', 'Cohorts Run', 'Participants Served', 'Last Active'];

  const rows = facilitators.map(f => {
    const books   = (f.books_certified ?? []).sort().map((b: number) => `Book ${b}`).join('; ');
    const cohorts = cohortMap[f.id] ?? { count: 0, participants: 0 };
    return [
      f.full_name, f.email, f.cert_id, f.cert_status,
      f.cert_issued ?? '', f.cert_renewal ?? '',
      books,
      cohorts.count,
      cohorts.participants,
      f.last_active ? new Date(f.last_active).toLocaleDateString() : 'Never',
    ].map(esc).join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const filename = `lg-facilitators-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
