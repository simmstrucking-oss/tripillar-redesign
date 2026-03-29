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
  if (!isOwnerEmail(data.user.email) && data.user.user_metadata?.role !== 'org_contact') return null;
  return data.user;
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function GET(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const supabase = sb();

  const { data: facilitators } = await supabase
    .from('facilitator_profiles')
    .select('id, full_name')
    .eq('organization_id', orgId);

  const facMap: Record<string, string> = {};
  for (const f of facilitators ?? []) {
    facMap[f.id] = f.full_name;
  }
  const facIds = Object.keys(facMap);

  if (facIds.length === 0) {
    return NextResponse.json({ cohorts: [] });
  }

  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('id, facilitator_id, book_number, start_date, end_date, status, total_enrolled, total_completed, participant_count')
    .eq('organization_id', orgId)
    .order('start_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (cohorts ?? []).map(c => ({
    ...c,
    book_module: c.book_number ? `Book ${c.book_number}` : 'Unknown',
    facilitator_name: facMap[c.facilitator_id] ?? 'Unknown',
    enrolled: c.total_enrolled ?? c.participant_count ?? 0,
    completed: c.total_completed ?? 0,
    completion_rate: (c.total_enrolled ?? c.participant_count ?? 0) > 0
      ? Math.round(((c.total_completed ?? 0) / (c.total_enrolled ?? c.participant_count ?? 1)) * 100)
      : 0,
  }));

  return NextResponse.json({ cohorts: result });
}
