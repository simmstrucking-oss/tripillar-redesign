import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Auth: validate Supabase session from cookie, return user ─────────────────
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

// ── Service-role Supabase client ─────────────────────────────────────────────
function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── GET /api/org/dashboard ───────────────────────────────────────────────────
// Returns: org, facilitators (with cohort counts), aggregate stats, announcements
// Security: caller must be a facilitator with role=org_admin AND have an organization_id.
//           All data is scoped to that exact organization_id — never trusts a query param.

// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = sb();

  // 1. Look up the caller's profile — must be org_admin with an org
  const { data: callerProfile, error: profileErr } = await supabase
    .from('facilitator_profiles')
    .select('id, full_name, role, cert_status, organization_id')
    .eq('user_id', user.id)
    .single();

  if (profileErr || !callerProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (callerProfile.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden — org_admin role required' }, { status: 403 });
  }

  const orgId = callerProfile.organization_id;
  if (!orgId) {
    return NextResponse.json({ error: 'No organization assigned to your account. Contact wayne@tripillarstudio.com.' }, { status: 403 });
  }

  // 2. Fetch the organization row
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, type, license_type, license_status, license_start, license_renewal, contact_name, contact_email, contact_phone, state, notes')
    .eq('id', orgId)
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // 3. Fetch all facilitators in this org (scoped by orgId — not caller-supplied)
  const { data: facilitators, error: facErr } = await supabase
    .from('facilitator_profiles')
    .select('id, user_id, full_name, email, phone, role, cert_id, cert_status, cert_issued, cert_renewal, books_certified, last_active, created_at')
    .eq('organization_id', orgId)
    .order('full_name');

  if (facErr) return NextResponse.json({ error: facErr.message }, { status: 500 });

  const facilitatorIds = (facilitators ?? []).map(f => f.id);

  // 4. Fetch all cohorts for those facilitators
  let cohorts: Array<{
    id: string; facilitator_id: string; book_number: number;
    start_date: string; end_date?: string; participant_count?: number;
    status: string; notes?: string;
  }> = [];

  if (facilitatorIds.length > 0) {
    const { data: cohortData } = await supabase
      .from('cohorts')
      .select('id, facilitator_id, book_number, start_date, end_date, participant_count, status, notes')
      .in('facilitator_id', facilitatorIds);
    cohorts = cohortData ?? [];
  }

  // 5. Build cohort map: facilitator_id → cohort[]
  const cohortMap: Record<string, typeof cohorts> = {};
  for (const c of cohorts) {
    if (!cohortMap[c.facilitator_id]) cohortMap[c.facilitator_id] = [];
    cohortMap[c.facilitator_id].push(c);
  }

  // 6. Attach cohorts to each facilitator
  const facilitatorsWithCohorts = (facilitators ?? []).map(f => ({
    ...f,
    cohorts: cohortMap[f.id] ?? [],
  }));

  // 7. Aggregate stats
  const totalFacilitators = facilitatorsWithCohorts.length;
  const activeFacilitators = facilitatorsWithCohorts.filter(f => f.cert_status === 'active').length;
  const totalCohorts = cohorts.length;
  const totalParticipants = cohorts.reduce((sum, c) => sum + (c.participant_count ?? 0), 0);

  const activeCohorts = cohorts.filter(c => c.status === 'active');
  const booksInProgress = [...new Set(activeCohorts.map(c => c.book_number))].sort();

  const bookCounts: Record<number, number> = {};
  for (const c of cohorts) {
    bookCounts[c.book_number] = (bookCounts[c.book_number] ?? 0) + 1;
  }

  // 8. Pinned announcements for org admins
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, published_at, pinned')
    .eq('active', true)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    org,
    facilitators: facilitatorsWithCohorts,
    stats: {
      totalFacilitators,
      activeFacilitators,
      inactiveFacilitators: totalFacilitators - activeFacilitators,
      totalCohorts,
      totalParticipants,
      booksInProgress,
      bookCounts,
    },
    announcements: announcements ?? [],
  });
}
