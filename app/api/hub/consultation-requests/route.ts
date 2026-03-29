/**
 * GET  /api/hub/consultation-requests — list own requests
 * POST /api/hub/consultation-requests — submit new request
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const WAYNE_EMAIL = 'wayne@tripillarstudio.com';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const getAuthenticatedFacilitator = (req: NextRequest) => getUserFromRequest(req);

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedFacilitator(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = getServiceClient();
  const { data: fp } = await sb.from('facilitator_profiles').select('id').eq('user_id', user.id).single();
  if (!fp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data, error } = await sb
    .from('consultation_requests')
    .select('id, request_type, description, week_number, status, created_at')
    .eq('facilitator_id', fp.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedFacilitator(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = getServiceClient();
  const { data: profile } = await sb
    .from('facilitator_profiles')
    .select('id, full_name, email')
    .eq('user_id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { request_type, description, week_number } = body;

  const validTypes = [
    'Curriculum question',
    'Group dynamics',
    'Participant concern',
    'Critical incident follow-up',
    'Other',
  ];

  if (!request_type || !validTypes.includes(request_type)) {
    return NextResponse.json({ error: 'Invalid request_type' }, { status: 400 });
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: 'Description must be 500 characters or fewer' }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await sb
    .from('consultation_requests')
    .insert({
      facilitator_id: profile.id as string,
      request_type,
      description: description.trim(),
      week_number: week_number?.trim() || null,
      status: 'pending',
    })
    .select('id, created_at')
    .single();

  if (insertError) return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });

  // Notify Wayne via Resend
  if (RESEND_API_KEY) {
    const emailBody = {
      from: 'Ember <ember@tripillarstudio.com>',
      to: [WAYNE_EMAIL],
      subject: `New support request from ${profile.full_name}: ${request_type}`,
      html: `
        <p><strong>Facilitator:</strong> ${profile.full_name} (${profile.email})</p>
        <p><strong>Request type:</strong> ${request_type}</p>
        ${week_number ? `<p><strong>Week/Session:</strong> ${week_number}</p>` : ''}
        <p><strong>Description:</strong></p>
        <blockquote style="border-left:3px solid #C9A84C;padding-left:12px;color:#444;">${description.trim().replace(/\n/g, '<br>')}</blockquote>
        <p style="color:#888;font-size:12px;">Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT | Request ID: ${inserted.id}</p>
      `,
    };
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailBody),
    }).catch(() => { /* non-fatal */ });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
