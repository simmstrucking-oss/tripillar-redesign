import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCohortPdf, type CohortSummaryData } from '@/lib/generate-cohort-pdf';

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
      .select('id, facilitator_id, book_number, organization_id, status, start_date, end_date')
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

    // ── Generate PDF summary ─────────────────────────────────────────────────
    const completionRate = total_enrolled > 0
      ? Math.round((total_completed / total_enrolled) * 100) : 0;
    const submittedAt = new Date().toISOString();
    const safeOrgName = orgName.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    const pdfFileName = `cohort_${cohortId.slice(0, 8)}_${safeOrgName}_book${bookNum}.pdf`;
    const storagePath = `cohort-summaries/${pdfFileName}`;

    let pdfUrl: string | null = null;

    try {
      const pdfData: CohortSummaryData = {
        cohort_id:              cohortId,
        cohort_name:            `Book ${bookNum} Cohort — ${orgName}`,
        book_number:            bookNum,
        facilitator_name:       facilitatorName,
        organization_name:      orgName,
        start_date:             cohort.start_date ?? null,
        end_date:               cohort.end_date ?? null,
        total_enrolled:         Number(total_enrolled),
        total_completed:        Number(total_completed),
        dropout_reasons:        dropout_reasons || null,
        facilitator_assessment,
        notable_outcomes:       notable_outcomes || null,
        curriculum_feedback:    curriculum_feedback || null,
        avg_satisfaction:       null,  // not collected at this stage
        summary_submitted_at:   submittedAt,
      };

      const pdfBuffer = await generateCohortPdf(pdfData);

      // Upload to admin-documents/cohort-summaries/ bucket
      const { error: uploadErr } = await supabase.storage
        .from('admin-documents')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadErr) {
        console.error('[cohort complete] PDF upload failed:', uploadErr.message);
      } else {
        // Store the storage path on the cohort row for admin download
        await supabase.from('cohorts')
          .update({ summary_pdf_path: storagePath })
          .eq('id', cohortId);

        // Create a 1-year signed URL for the email attachment link
        const { data: signed } = await supabase.storage
          .from('admin-documents')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
        pdfUrl = signed?.signedUrl ?? null;
      }
    } catch (pdfErr) {
      console.error('[cohort complete] PDF generation failed (non-fatal):', pdfErr);
    }

    // ── Send Resend email to Wayne ───────────────────────────────────────────
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
            html: `
              <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:28px 24px;color:#1c3028;">
                <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1c3028;">Cohort Completed</p>
                <p style="margin:0 0 24px;font-size:12px;color:#6b7280;">${submittedAt}</p>

                <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;width:180px;">Facilitator</td><td>${facilitatorName}</td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Organization</td><td>${orgName}</td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Book</td><td>Book ${bookNum}</td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Total Enrolled</td><td>${total_enrolled}</td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Total Completed</td><td>${total_completed}</td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Completion Rate</td><td><strong>${completionRate}%</strong></td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Assessment</td><td>${facilitator_assessment}</td></tr>
                  <tr><td style="padding:6px 16px 6px 0;font-weight:600;">Would Run Again</td><td>${would_run_again ? 'Yes' : 'No'}</td></tr>
                </table>

                ${notable_outcomes ? `<p style="font-size:13px;margin:0 0 8px;"><strong>Notable Outcomes:</strong><br>${notable_outcomes}</p>` : ''}
                ${dropout_reasons  ? `<p style="font-size:13px;margin:0 0 8px;"><strong>Dropout Reasons:</strong><br>${dropout_reasons}</p>`  : ''}

                ${pdfUrl ? `
                <div style="margin:24px 0;padding:14px 18px;background:#f9f7f4;border-left:3px solid #B8942F;border-radius:0 6px 6px 0;">
                  <a href="${pdfUrl}" style="color:#B8942F;font-weight:600;font-size:14px;text-decoration:none;">
                    📄 Download Full PDF Summary
                  </a>
                </div>` : ''}

                <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
                  <a href="https://www.tripillarstudio.com/admin/dashboard" style="color:#B8942F;">View in admin panel →</a>
                </p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('Email send failed (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true, pdf_url: pdfUrl });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
