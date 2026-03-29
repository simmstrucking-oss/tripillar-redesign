import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const getOrgUser = (req: NextRequest) => getUserFromRequest(req);


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
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

  const { data, error } = await supabase
    .from('facilitator_profiles')
    .select('id, full_name, cert_status, cert_issued, cert_renewal, books_certified, role')
    .eq('organization_id', orgId)
    .order('full_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const facilitators = (data ?? []).map(f => ({
    id: f.id,
    name: f.full_name,
    cert_track: f.role ?? 'Community',
    cert_status: f.cert_status,
    cert_expiry: f.cert_renewal,
    books_certified: f.books_certified ?? [],
  }));

  return NextResponse.json({ facilitators });
}
