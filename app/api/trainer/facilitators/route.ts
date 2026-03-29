import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check role
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role, books_authorized_to_train')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get all certifications by this trainer
  const { data: certifications, error: certError } = await supabase
    .from('trainer_certifications')
    .select('id, facilitator_id, book_number, certified_at')
    .eq('trainer_id', profile.id);

  if (certError) {
    return NextResponse.json({ error: certError.message }, { status: 500 });
  }

  if (!certifications || certifications.length === 0) {
    return NextResponse.json({ books: {} });
  }

  // Get facilitator profiles for all certified facilitators
  const facilitatorIds = [...new Set(certifications.map((c) => c.facilitator_id))];

  const { data: facilitators, error: facError } = await supabase
    .from('facilitator_profiles')
    .select('id, full_name, organization, cert_status')
    .in('id', facilitatorIds);

  if (facError) {
    return NextResponse.json({ error: facError.message }, { status: 500 });
  }

  const facilitatorMap = new Map(
    (facilitators ?? []).map((f) => [f.id, f])
  );

  // Get last cohort start_date for each facilitator
  const { data: cohorts, error: cohortError } = await supabase
    .from('cohorts')
    .select('facilitator_id, start_date')
    .in('facilitator_id', facilitatorIds)
    .order('start_date', { ascending: false });

  if (cohortError) {
    return NextResponse.json({ error: cohortError.message }, { status: 500 });
  }

  const lastCohortMap = new Map<string, string>();
  for (const cohort of cohorts ?? []) {
    if (!lastCohortMap.has(cohort.facilitator_id)) {
      lastCohortMap.set(cohort.facilitator_id, cohort.start_date);
    }
  }

  // Group by book_number
  const books: Record<number, Array<{
    certification_id: string;
    facilitator_id: string;
    full_name: string | null;
    organization: string | null;
    cert_status: string | null;
    certified_at: string;
    last_cohort_start_date: string | null;
  }>> = {};

  for (const cert of certifications) {
    const fac = facilitatorMap.get(cert.facilitator_id);
    const entry = {
      certification_id: cert.id,
      facilitator_id: cert.facilitator_id,
      full_name: fac?.full_name ?? null,
      organization: fac?.organization ?? null,
      cert_status: fac?.cert_status ?? null,
      certified_at: cert.certified_at,
      last_cohort_start_date: lastCohortMap.get(cert.facilitator_id) ?? null,
    };

    if (!books[cert.book_number]) {
      books[cert.book_number] = [];
    }
    books[cert.book_number].push(entry);
  }

  return NextResponse.json({ books });
}
