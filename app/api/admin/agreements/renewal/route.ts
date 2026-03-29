import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateILAPdf } from '@/lib/generate-ila-pdf';
import { SCHEDULE_A, type ILAData } from '@/lib/ila-template';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Ember <ember@tripillarstudio.com>', to, subject, html }),
  });
}

function verifyAdminAuth(req: NextRequest): boolean {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === adminSecret || cookie === adminSecret;
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { org_id, license_tier, books_licensed, license_start_date } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: 'Missing org_id' },
        { status: 400 }
      );
    }

    // Fetch current org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', org_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Determine license tier and fee
    const finalLicenseTier = license_tier || org.license_type;
    const tierData = SCHEDULE_A[finalLicenseTier];
    if (!tierData) {
      return NextResponse.json(
        { error: 'Invalid license tier' },
        { status: 400 }
      );
    }

    const license_fee = tierData.fee;

    // Determine dates
    const renewalStartDate = license_start_date || org.license_renewal;
    const startDate = new Date(renewalStartDate);
    const renewalDate = new Date(startDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const license_renewal_date = renewalDate.toISOString().split('T')[0];
    const expires_at = expiresAt.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Generate token
    const agreement_token = crypto.randomUUID();

    // Determine books licensed
    const finalBooksLicensed = books_licensed || org.books_licensed || [];

    // Generate renewal PDF
    const renewalYear = (org.license_renewed_count || 0) + 1;
    const pdfData: ILAData = {
      org_name: org.name,
      contact_name: org.contact_name,
      contact_title: org.contact_title || '',
      contact_email: org.contact_email,
      org_address: org.address || '',
      org_state: org.state || '',
      license_tier: finalLicenseTier,
      license_fee,
      license_start_date: renewalStartDate,
      license_renewal_date,
      books_licensed: finalBooksLicensed,
      execution_date: today,
      agreement_token,
      renewalNote: `ANNUAL RENEWAL — License Year ${renewalYear}`,
    };

    const pdfBuffer = await generateILAPdf(pdfData);

    // Upload PDF to storage
    const pdfPath = `agreements/${agreement_token}-renewal.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('admin-documents')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Insert agreement record with is_renewal=true
    const { data: agreement, error: insertError } = await supabase
      .from('agreements')
      .insert([
        {
          token: agreement_token,
          org_id,
          org_name: org.name,
          contact_name: org.contact_name,
          contact_email: org.contact_email,
          contact_title: org.contact_title || null,
          org_address: org.address || null,
          org_state: org.state || null,
          license_tier: finalLicenseTier,
          license_fee,
          books_licensed: finalBooksLicensed,
          license_start_date: renewalStartDate,
          license_renewal_date,
          status: 'sent',
          test_mode: false,
          is_renewal: true,
          generated_pdf_path: pdfPath,
          expires_at,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create renewal agreement' },
        { status: 500 }
      );
    }

    // Send email to org contact
    const signLink = `https://tripillarstudio.com/sign/${agreement_token}`;
    await sendEmail(
      org.contact_email,
      'Your Live and Grieve™ License Renewal Agreement is ready for review and signature',
      `<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
    <h2>Live and Grieve™ License Renewal Agreement</h2>
    <p>Dear ${org.contact_name},</p>
    <p>Your Institutional License Agreement for Live and Grieve™ is ready for renewal.</p>
    <div style="background:#F4F1EC;padding:20px;border-radius:4px;margin:20px 0;">
      <p><strong>Organization:</strong> ${org.name}</p>
      <p><strong>License Tier:</strong> ${finalLicenseTier}</p>
      <p><strong>Renewal Fee:</strong> $${license_fee}.00 USD</p>
      <p><strong>License Period:</strong> ${renewalStartDate} to ${license_renewal_date}</p>
    </div>
    <p>Please review the renewal agreement carefully and sign electronically at the link below. This link expires in 30 days.</p>
    <p style="text-align:center;margin:30px 0;">
      <a href="${signLink}" style="background:#B8942F;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Review and Sign Renewal Agreement</a>
    </p>
    <p>Questions? Contact Wayne Simms at wayne@tripillarstudio.com.</p>
    <p>Best regards,<br>Tri-Pillars LLC</p>
    </body></html>`
    );

    // Send Wayne notification
    await sendEmail(
      'wayne@tripillarstudio.com',
      `Renewal agreement sent — ${org.name} — ${finalLicenseTier} — Year ${renewalYear}`,
      `<p>Renewal agreement sent to <strong>${org.name}</strong> (${finalLicenseTier}, Year ${renewalYear}) — ${org.contact_email}</p>`
    );

    return NextResponse.json({ agreement });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
