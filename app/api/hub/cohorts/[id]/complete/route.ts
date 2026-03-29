import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cohortId } = await params;
    const body = await req.json();
    const {
      facilitator_id,
      total_enrolled,
      total_completed,
      dropout_reasons,
      facilitator_assessment,
      notable_outcomes,
      would_run_again,
      curriculum_feedback,
    } = body;

    if (!facilitator_id || total_enrolled == null || total_completed == null || !facilitator_assessment || would_run_again == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['Strong', 'Moderate', 'Challenging'].includes(facilitator_assessment)) {
      return NextResponse.json({ error: 'Invalid facilitator_assessment value' }, { status: 400 });
    }

    // Verify the cohort belongs to this facilitator
    const { data: cohort, error: cohortErr } = await supabase
      .from('cohorts')
      .select('id, facilitator_id, book_number, organization_id, status')
      .eq('id', cohortId)
      .single();

    if (cohortErr || !cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }
    if (cohort.facilitator_id !== facilitator_id) {
      return NextResponse.json({ error: 'Not your cohort' }, { status: 403 });
    }
    if (cohort.status === 'completed') {
      return NextResponse.json({ error: 'Cohort already completed' }, { status: 400 });
    }

    // Update cohort with completion data
    const { error: updateErr } = await supabase
      .from('cohorts')
      .update({
        status: 'completed',
        total_enrolled: Number(total_enrolled),
        total_completed: Number(total_completed),
        dropout_reasons: dropout_reasons || null,
        facilitator_assessment,
        notable_outcomes: notable_outcomes || null,
        would_run_again: Boolean(would_run_again),
        curriculum_feedback: curriculum_feedback || null,
        summary_submitted_at: new Date().toISOString(),
      })
      .eq('id', cohortId);

    if (updateErr) {
      console.error('Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update cohort' }, { status: 500 });
    }

    // Fetch facilitator name, book number, and organization name for the email
    const { data: facProfile } = await supabase
      .from('facilitator_profiles')
      .select('full_name, organization_id, organizations(name)')
      .eq('id', facilitator_id)
      .single();

    const facilitatorName = facProfile?.full_name ?? 'Unknown Facilitator';
    const orgName = (facProfile as any)?.organizations?.name ?? 'No Organization';
    const bookNum = cohort.book_number;

    // Send Resend email to Wayne
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Ember <ember@tripillarstudio.com>',
            to: 'wayne@tripillarstudio.com',
            subject: `Cohort completed — ${facilitatorName} — Book ${bookNum} — ${orgName}`,
            text: `COHORT COMPLETION SUMMARY\n\nFacilitator: ${facilitatorName}\nBook: ${bookNum}\nOrganization: ${orgName}\nCohort ID: ${cohortId}\n\n─── Enrollment ───\nTotal Enrolled: ${total_enrolled}\nTotal Completed (10+ of 13 sessions): ${total_completed}\nCompletion Rate: ${total_enrolled > 0 ? Math.round((total_completed / total_enrolled) * 100) : 0}%\n\nDropout Reasons:\n${dropout_reasons || 'None reported'}\n\n─── Assessment ───\nFacilitator Overall Assessment: ${facilitator_assessment}\nWould Run Again: ${would_run_again ? 'Yes' : 'No'}\n\nNotable Outcomes:\n${notable_outcomes || 'None reported'}\n\nCurriculum Feedback:\n${curriculum_feedback || 'None provided'}\n\n─── Meta ───\nSubmitted: ${new Date().toISOString()}`,
          }),
        });
      } catch (emailErr) {
        console.error('Email send failed (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
