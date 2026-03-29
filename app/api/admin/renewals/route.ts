import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

function verifyAdminAuth(req: NextRequest): boolean {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === adminSecret || cookie === adminSecret;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate 90 days from now
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const futureDate = ninetyDaysFromNow.toISOString().split('T')[0];

    // Get all organizations with renewals within 90 days
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .lte('license_renewal', futureDate)
      .order('license_renewal', { ascending: true });

    if (orgsError) {
      console.error('Orgs query error:', orgsError);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      );
    }

    // For each org, get the latest renewal agreement status
    const renewalsWithStatus = await Promise.all(
      orgs.map(async (org) => {
        const { data: latestAgreement } = await supabase
          .from('agreements')
          .select('id, status')
          .eq('org_id', org.id)
          .eq('is_renewal', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: org.id,
          name: org.name,
          license_type: org.license_type,
          license_renewal: org.license_renewal,
          license_renewed_count: org.license_renewed_count || 0,
          contact_name: org.contact_name,
          contact_email: org.contact_email,
          renewal_status: latestAgreement?.status || null,
          renewal_agreement_id: latestAgreement?.id || null,
        };
      })
    );

    return NextResponse.json({ renewals: renewalsWithStatus });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
