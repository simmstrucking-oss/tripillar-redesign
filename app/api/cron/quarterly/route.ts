/**
 * GET /api/cron/quarterly
 * Schedule: Jan 1, Apr 1, Jul 1, Oct 1 at 8 AM ET (13:00 UTC)
 * Generates Quarterly Program Report PDF, stores in Supabase Storage, emails Wayne.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml } from '@/lib/mailer';
import { verifyCronRequest } from '@/lib/cron-auth';

export const maxDuration = 120;

function getQuarterInfo(date: Date): { quarter: number; year: number; startISO: string; endISO: string; label: string } {
  // Report covers the just-completed quarter
  const q = Math.floor((date.getMonth()) / 3); // 0-based current quarter
  const prevQ = q === 0 ? 3 : q - 1;
  const prevYear = q === 0 ? date.getFullYear() - 1 : date.getFullYear();
  const quarterStartMonth = prevQ * 3;
  const start = new Date(prevYear, quarterStartMonth, 1);
  const end   = new Date(prevYear, quarterStartMonth + 3, 0);
  return {
    quarter: prevQ + 1,
    year: prevYear,
    startISO: start.toISOString().split('T')[0],
    endISO:   end.toISOString().split('T')[0],
    label: `Q${prevQ + 1} ${prevYear}`,
  };
}

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow override via ?quarter=Q1&year=2026 for manual triggers
  const url    = new URL(req.url);
  const qParam = url.searchParams.get('quarter');
  const yParam = url.searchParams.get('year');

  const now = new Date();
  let quarterInfo = getQuarterInfo(now);
  if (qParam && yParam) {
    const qn = parseInt(qParam.replace('Q', ''));
    const yn = parseInt(yParam);
    if (!isNaN(qn) && !isNaN(yn)) {
      const startMonth = (qn - 1) * 3;
      const start = new Date(yn, startMonth, 1);
      const end   = new Date(yn, startMonth + 3, 0);
      quarterInfo = {
        quarter: qn, year: yn,
        startISO: start.toISOString().split('T')[0],
        endISO:   end.toISOString().split('T')[0],
        label: `Q${qn} ${yn}`,
      };
    }
  }

  const { quarter, year, startISO, endISO, label } = quarterInfo;
  const sb = getSupabaseServer();
  const now2 = new Date().toISOString();

  let errorMsg: string | null = null;

  try {
    // Generate PDF via existing /api/reports/generate endpoint
    const base = process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const genRes = await fetch(`${base}/api/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET ?? '',
      },
      body: JSON.stringify({
        type: 'quarterly',
        quarter: `Q${quarter}`,
        year,
        force: true,
      }),
    });

    const genData = await genRes.json();
    if (!genRes.ok || !genData.ok) {
      throw new Error(`PDF generation failed: ${genData.error ?? genRes.status}`);
    }

    const pdfUrl: string = genData.url;
    const filePath: string = genData.path ?? `reports/quarterly/Q${quarter}_${year}.pdf`;

    // Email Wayne with download link
    const bodyHtml = `
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
        Your <strong>${label}</strong> Quarterly Program Report is ready.
      </p>

      <div style="margin:0 0 24px;padding:20px;background:#f9f7f4;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:#2D3142;">
          Q${quarter} ${year} Quarterly Program Report
        </p>
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
          Period: ${startISO} — ${endISO}
        </p>
        <a href="${pdfUrl}"
           style="display:inline-block;background:#2D3142;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:6px;text-decoration:none;">
          ↓ Download PDF Report
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;">
        This link expires in 24 hours. You can regenerate it anytime from the
        <a href="https://www.tripillarstudio.com/admin/dashboard" style="color:#B8942F;">admin dashboard</a>.
      </p>
    `;

    const subject = `Live and Grieve™ ${label} Report — Ready`;
    await sendMail({
      to: 'wayne@tripillarstudio.com',
      subject,
      html: brandedHtml(subject, bodyHtml),
    });

    // Log to report_log
    await sb.from('report_log').insert({
      report_type: 'quarterly',
      report_period: `${startISO}/${endISO}`,
      generated_by_user_id: null,
      generated_for_entity: 'program',
      file_path: filePath,
      created_at: now2,
    });

    return NextResponse.json({
      ok: true,
      period: label,
      pdf_url: pdfUrl,
      file_path: filePath,
    });

  } catch (err) {
    errorMsg = String(err);
    try {
      await sendMail({
        to: 'wayne@tripillarstudio.com',
        subject: `⚠️ Quarterly Cron Failed — ${label} — Live and Grieve™`,
        html: brandedHtml('Quarterly Cron Error', `
          <p style="color:#dc2626;font-weight:600;">The ${label} quarterly report cron job failed.</p>
          <pre style="background:#fef2f2;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">${errorMsg}</pre>
        `),
      });
    } catch { /* swallow */ }
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
