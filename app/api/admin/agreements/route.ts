import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateILAPdf } from '@/lib/generate-ila-pdf';
import { SCHEDULE_A, type ILAData } from '@/lib/ila-template';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_SECRET!;
const resendKey = process.env.RESEND_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Ember <ember@tripillarstudio.com>', to, subject, html }),
  });
}

function verifyAdminAuth(req: NextRequest): boolean {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('admin-secret')?.value;
  return header === adminSecret || cookie === adminSecret;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeTest = searchParams.get('include_test') === 'true';

  let query = supabase
    .from('agreements')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeTest) {
    query = query.eq('test_mode', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agreements: data });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      prospect_id,
      org_id,
      org_name,
      contact_name,
      contact_email,
      contact_title,
      org_address,
      org_state,
      license_tier,
      books_licensed,
      license_start_date,
      test_mode = false,
    } = body;

    // Validate required fields
    if (
      !org_name ||
      !contact_name ||
      !contact_email ||
      !license_tier ||
      !books_licensed ||
      !license_start_date
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Look up fee
    const tierData = SCHEDULE_A[license_tier];
    if (!tierData) {
      return NextResponse.json(
        { error: 'Invalid license tier' },
        { status: 400 }
      );
    }

    const license_fee = tierData.fee;

    // Compute dates
    const startDate = new Date(license_start_date);
    const renewalDate = new Date(startDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const license_renewal_date = renewalDate
      .toISOString()
      .split('T')[0];
    const expires_at = expiresAt.toISOString().split('T')[0];

    // Generate token
    const agreement_token = crypto.randomUUID();

    // Generate PDF
    const today = new Date().toISOString().split('T')[0];
    const pdfData: ILAData = {
      org_name,
      contact_name,
      contact_title: contact_title || '',
      contact_email,
      org_address: org_address || '',
      org_state: org_state || '',
      license_tier,
      license_fee,
      license_start_date,
      license_renewal_date,
      books_licensed,
      execution_date: today,
      agreement_token,
    };

    const pdfBuffer = await generateILAPdf(pdfData);

    // Upload to Supabase storage
    const pdfPath = `agreements/${agreement_token}.pdf`;
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

    // Insert agreement record
    const { data: agreement, error: insertError } = await supabase
      .from('agreements')
      .insert([
        {
          token: agreement_token,
          prospect_id: prospect_id || null,
          org_id: org_id || null,
          org_name,
          contact_name,
          contact_email,
          contact_title: contact_title || null,
          org_address: org_address || null,
          org_state: org_state || null,
          license_tier,
          license_fee,
          books_licensed,
          license_start_date,
          license_renewal_date,
          status: 'sent',
          test_mode,
          generated_pdf_path: pdfPath,
          expires_at,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create agreement' },
        { status: 500 }
      );
    }

    // Send email to contact
    const signLink = `https://tripillarstudio.com/sign/${agreement_token}`;
    await sendEmail(contact_email,
      'Your Live and Grieve™ License Agreement is ready for review and signature',
      `<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
    <h2>Live and Grieve™ Institutional License Agreement</h2>
    <p>Dear ${contact_name},</p>
    <p>We are pleased to present your Institutional License Agreement for the Live and Grieve™ grief education program.</p>
    <div style="background:#F4F1EC;padding:20px;border-radius:4px;margin:20px 0;">
      <p><strong>Organization:</strong> ${org_name}</p>
      <p><strong>License Tier:</strong> ${license_tier}</p>
      <p><strong>Annual License Fee:</strong> $${license_fee}.00 USD</p>
      <p><strong>License Period:</strong> ${license_start_date} to ${license_renewal_date}</p>
    </div>
    <p>Please review the agreement carefully and sign electronically at the link below. This link expires in 30 days.</p>
    <p style="text-align:center;margin:30px 0;">
      <a href="${signLink}" style="background:#B8942F;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Review and Sign Agreement</a>
    </p>
    <p>Questions? Contact Wayne Simms at wayne@tripillarstudio.com.</p>
    <p>Best regards,<br>Tri-Pillars LLC</p>
    </body></html>`
    );

    // Notify Wayne
    await sendEmail('wayne@tripillarstudio.com',
      `Agreement sent — ${org_name} — ${license_tier} — ${today}`,
      `<p>Agreement sent to <strong>${org_name}</strong> (${license_tier}) — ${contact_email}</p>`
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
