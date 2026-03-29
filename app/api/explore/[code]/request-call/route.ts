import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || 'unknown';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const body = await request.json();
    const {
      contact_name,
      org_name,
      phone,
      preferred_time,
      message,
      code_id,
      prospect_id
    } = body;

    const ip_address = getClientIp(request);

    // Insert call request
    const { data: callRequest, error: insertError } = await supabase
      .from('prospect_call_requests')
      .insert([
        {
          prospect_id,
          code_id,
          contact_name,
          org_name,
          phone,
          preferred_time: preferred_time || null,
          message: message || null,
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error saving call request:', insertError);
      return NextResponse.json(
        { error: 'Failed to save request' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('prospect_activity')
      .insert([
        {
          prospect_id,
          code_id,
          event_type: 'call_requested',
          event_data: { call_request_id: callRequest.id },
          ip_address,
          created_at: new Date().toISOString()
        }
      ]);

    // Get prospect sector for email
    const { data: prospect } = await supabase
      .from('prospects')
      .select('sector')
      .eq('id', prospect_id)
      .single();

    // Send Resend email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D3142; color: #FDF8EE; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .header h2 { margin: 0 0 10px 0; }
    .section { margin-bottom: 20px; border-bottom: 1px solid #E2DDD7; padding-bottom: 15px; }
    .section:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #2D3142; margin-top: 10px; }
    .value { color: #7A7264; margin: 5px 0 0 0; }
    .timestamp { color: #999; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎯 Prospect Conversation Request</h2>
      <p style="margin: 0; font-size: 14px;">New inquiry from your Live and Grieve™ prospect landing page.</p>
    </div>

    <div class="section">
      <div class="label">Organization</div>
      <div class="value">${org_name}</div>
      <div class="label">Sector</div>
      <div class="value">${prospect?.sector || 'Unknown'}</div>
    </div>

    <div class="section">
      <div class="label">Contact Name</div>
      <div class="value">${contact_name}</div>
      <div class="label">Phone</div>
      <div class="value"><a href="tel:${phone}">${phone}</a></div>
    </div>

    <div class="section">
      <div class="label">Preferred Time to Connect</div>
      <div class="value">${preferred_time || 'Not specified'}</div>
    </div>

    ${message ? `
    <div class="section">
      <div class="label">Message</div>
      <div class="value">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="label">Code</div>
      <div class="value">${(await params).code}</div>
      <div class="label">Reference ID</div>
      <div class="value">${callRequest.id}</div>
      <div class="timestamp">Received: ${new Date().toLocaleString()}</div>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ember <ember@tripillarstudio.com>',
          to: 'wayne@tripillarstudio.com',
          subject: `Prospect requesting a conversation — ${org_name} — ${prospect?.sector || 'Unknown'}`,
          html: emailHtml,
        }),
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error in request-call route:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
