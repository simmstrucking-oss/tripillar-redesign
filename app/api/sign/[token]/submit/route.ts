import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateILAPdf } from '@/lib/generate-ila-pdf';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { signature_text, signer_name, signer_email } = body;

    if (!signature_text || signature_text.trim().length < 2) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get agreement
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !agreement) {
      return NextResponse.json({ error: 'invalid' });
    }

    // Check expiration
    const expiresAt = new Date(agreement.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'expired' });
    }

    // Check status
    if (agreement.status === 'org_signed' || agreement.status === 'fully_executed') {
      return NextResponse.json({ error: 'already_signed' });
    }

    const ipAddr = getClientIp(req);
    const now = new Date().toISOString();

    // Save to facilitator_signatures
    const finalSignatureText = `Name: ${signer_name} | Email: ${signer_email || agreement.contact_email} | Signed: ${now}`;

    const { error: sigError } = await supabase
      .from('facilitator_signatures')
      .insert([
        {
          document_name: 'Institutional License Agreement',
          document_version: agreement.token,
          signer_name,
          signer_email: signer_email || agreement.contact_email,
          signed_at: now,
          ip_address: ipAddr,
          signature_text: finalSignatureText,
        },
      ]);

    if (sigError) {
      console.error('Signature insert error:', sigError);
      // Continue anyway
    }

    // Regenerate PDF with org signature
    const today = new Date().toISOString().split('T')[0];
    const pdfData = {
      ...agreement,
      org_signature: signature_text,
      org_date: today,
      execution_date: agreement.license_start_date,
    };

    const pdfBuffer = await generateILAPdf(pdfData);

    // Upload org-signed PDF
    const orgSignedPath = `agreements/${agreement.token}-org-signed.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('admin-documents')
      .upload(orgSignedPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to save signed PDF' },
        { status: 500 }
      );
    }

    // Update agreement
    const { error: updateError } = await supabase
      .from('agreements')
      .update({
        status: 'org_signed',
        org_signature: signature_text,
        org_signed_at: now,
      })
      .eq('token', token);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agreement' },
        { status: 500 }
      );
    }

    // Notify Wayne
    const signedDate = new Date(now).toLocaleDateString();
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: 'Ember <ember@tripillarstudio.com>',
      to: 'wayne@tripillarstudio.com',
      subject: `AGREEMENT SIGNED — ${agreement.org_name} — ${agreement.license_tier} — ${signedDate}`,
      html: `
<html>
  <body style="font-family: Arial, sans-serif;">
    <p>Organization: <strong>${agreement.org_name}</strong></p>
    <p>Tier: <strong>${agreement.license_tier}</strong></p>
    <p>Signer: <strong>${signer_name}</strong></p>
    <p>Signed: ${signedDate}</p>
    <p style="margin-top: 20px;"><a href="https://tripillarstudio.com/admin/agreements" style="background: #B8942F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Review in Admin</a></p>
  </body>
</html>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
