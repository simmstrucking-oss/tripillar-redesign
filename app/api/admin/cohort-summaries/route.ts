/**
 * GET /api/admin/cohort-summaries
 *   Returns list of completed cohorts that have a summary_pdf_path
 *
 * GET /api/admin/cohort-summaries?cohort_id=xxx
 *   Returns a 24-hour signed URL for that cohort's PDF
 *
 * Admin auth required (x-admin-secret header or lg-admin-session cookie).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function isAdmin(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET ?? '';
  if (req.headers.get('x-admin-secret') === adminSecret) return true;
  const cookie = req.cookies.get('lg-admin-session')?.value ?? '';
  return cookie === adminSecret;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = sb();
  const cohortId = req.nextUrl.searchParams.get('cohort_id');

  // Signed URL for a specific cohort
  if (cohortId) {
    const { data: cohort } = await supabase
      .from('cohorts')
      .select('summary_pdf_path')
      .eq('id', cohortId)
      .single();

    if (!cohort?.summary_pdf_path) {
      return NextResponse.json({ error: 'No PDF for this cohort' }, { status: 404 });
    }

    const { data: signed, error } = await supabase.storage
      .from('admin-documents')
      .createSignedUrl(cohort.summary_pdf_path, 60 * 60 * 24); // 24 hours

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ url: signed?.signedUrl });
  }

  // List all cohorts with PDFs, joined with facilitator name + org name
  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select(`
      id,
      book_number,
      summary_pdf_path,
      summary_submitted_at,
      facilitator_profiles!facilitator_id(full_name),
      organizations!organization_id(name)
    `)
    .not('summary_pdf_path', 'is', null)
    .eq('status', 'completed')
    .order('summary_submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = (cohorts ?? []).map((c: any) => ({
    id:                    c.id,
    book_number:           c.book_number,
    summary_pdf_path:      c.summary_pdf_path,
    summary_submitted_at:  c.summary_submitted_at,
    facilitator_name:      c.facilitator_profiles?.full_name ?? null,
    org_name:              c.organizations?.name ?? null,
  }));

  return NextResponse.json({ cohorts: mapped });
}
