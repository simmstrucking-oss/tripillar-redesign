import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateILAPdf } from '@/lib/generate-ila-pdf';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_SECRET!;
const resendKey = process.env.RESEND_API_KEY!;

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

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { wayne_signature } = body;

    if (!wayne_signature || wayne_signature.trim().length < 2) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Get agreement
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check status
    if (agreement.status !== 'org_signed') {
      return NextResponse.json(
        { error: 'Agreement must be org_signed to co-sign' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Save to facilitator_signatures
    const ipAddr = getClientIp(req);
    const signatureText = `Name: Wayne Simms | Email: wayne@tripillarstudio.com | Signed: ${new Date().toISOString()}`;

    const { error: sigError } = await supabase
      .from('facilitator_signatures')
      .insert([
        {
          document_name: 'Institutional License Agreement',
          document_version: agreement.token,
          signer_name: 'Wayne Simms',
          signer_email: 'wayne@tripillarstudio.com',
          signed_at: new Date().toISOString(),
          ip_address: ipAddr,
          signature_text: signatureText,
        },
      ]);

    if (sigError) {
      console.error('Signature insert error:', sigError);
      // Continue anyway
    }

    // Regenerate PDF with both signatures
    const pdfData = {
      ...agreement,
      org_signature: agreement.org_signature,
      org_date: agreement.org_signed_at?.split('T')[0],
      wayne_signature,
      wayne_date: today,
      execution_date: agreement.license_start_date,
    };

    const pdfBuffer = await generateILAPdf(pdfData);

    // Upload executed PDF
    const executedPath = `agreements/${agreement.token}-executed.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('admin-documents')
      .upload(executedPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload signed PDF' },
        { status: 500 }
      );
    }

    // Update agreement
    const { data: updated, error: updateError } = await supabase
      .from('agreements')
      .update({
        status: 'fully_executed',
        wayne_signature,
        wayne_signed_at: new Date().toISOString(),
        final_pdf_path: executedPath,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agreement' },
        { status: 500 }
      );
    }

    // Auto-provision: update org, create auth user if needed
    if (agreement.org_id || agreement.contact_email) {
      // Try to get org by id first, then by contact email match
      let org = null;

      if (agreement.org_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', agreement.org_id)
          .single();
        org = orgData;
      }

      if (org && org.id) {
        // Update org license status
        await supabase
          .from('organizations')
          .update({
            license_status: 'active',
            license_start: agreement.license_start_date,
            license_renewal: agreement.license_renewal_date,
            onboarding_complete: false,
          })
          .eq('id', org.id);
      }

      // Create auth user for contact
      try {
        const randomPwd = Array.from(
          crypto.getRandomValues(new Uint8Array(9))
        )
          .map((b) => b.toString(36))
          .join('')
          .slice(0, 12);

        const { error: authError } = await supabase.auth.admin.createUser({
          email: agreement.contact_email,
          password: randomPwd,
          user_metadata: {
            role: 'org_contact',
            org_id: org?.id || agreement.org_id,
          },
        });

        if (!authError) {
          // Send hub credentials email
          await sendEmail(agreement.contact_email,
            'Your Live and Grieve™ Hub Credentials',
            `<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
    <h2>Welcome to the Live and Grieve™ Hub</h2>
    <p>Dear ${agreement.contact_name},</p>
    <p>Your account has been created. You can now log in to manage your organization's Live and Grieve™ program.</p>
    <div style="background:#F4F1EC;padding:20px;border-radius:4px;margin:20px 0;">
      <p><strong>Email:</strong> ${agreement.contact_email}</p>
      <p><strong>Temporary Password:</strong> ${randomPwd}</p>
      <p style="margin-top:20px;"><a href="https://tripillarstudio.com/org/login" style="background:#B8942F;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Log In to Hub</a></p>
    </div>
    <p><strong>Important:</strong> Please change your password on first login.</p>
    <p>Questions? Contact wayne@tripillarstudio.com.</p>
    <p>Best regards,<br>Tri-Pillars LLC</p>
    </body></html>`
          );
        }
      } catch (e) {
        console.error('Auth provision error:', e);
        // Don't fail the whole request
      }
    }

    // Send executed PDF to contact
    const { data: signedUrlData } = await supabase.storage
      .from('admin-documents')
      .createSignedUrl(executedPath, 3600 * 24 * 7);

    if (signedUrlData?.signedUrl) {
      await sendEmail(agreement.contact_email,
        'Your Executed License Agreement',
        `<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
    <h2>License Agreement Executed</h2>
    <p>Dear ${agreement.contact_name},</p>
    <p>Your Institutional License Agreement for Live and Grieve™ has been fully executed.</p>
    <p style="text-align:center;margin:30px 0;">
      <a href="${signedUrlData.signedUrl}" style="background:#B8942F;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Download Signed Agreement</a>
    </p>
    <p>Your organization is licensed for the period ${agreement.license_start_date} through ${agreement.license_renewal_date}.</p>
    <p>Best regards,<br>Wayne Simms<br>Co-Founder, Tri-Pillars LLC</p>
    </body></html>`
      );
    }

    // Notify Wayne
    await sendEmail('wayne@tripillarstudio.com',
      `AGREEMENT EXECUTED — ${agreement.org_name} — ${agreement.license_tier}`,
      `<p>Agreement fully executed. Org: <strong>${agreement.org_name}</strong> (${agreement.license_tier}). Auto-provisioning complete.</p>`
    );

    return NextResponse.json({ ok: true, agreement: updated });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
