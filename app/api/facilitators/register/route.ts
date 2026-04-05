/**
 * POST /api/facilitators/register
 *
 * Public endpoint — validates passcode, creates facilitator account,
 * generates a one-click password-setup link, and enrolls in Kit welcome sequence.
 *
 * Body: { first_name, last_name, email, passcode }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REGISTRATION_PASSCODE = '333';
const FACILITATOR_WELCOME_SEQUENCE = 2701285;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.tripillarstudio.com';

function generateCertId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LG-${year}-${rand}`;
}

function getRenewalDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  let body: { first_name?: string; last_name?: string; email?: string; passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { first_name, last_name, email, passcode } = body;

  // Validate required fields
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !passcode?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  // Validate passcode
  if (passcode.trim() !== REGISTRATION_PASSCODE) {
    return NextResponse.json({ error: 'Invalid passcode. Please check your passcode and try again.' }, { status: 403 });
  }

  const supabase = sb();
  const normalizedEmail = email.trim().toLowerCase();
  const firstName = first_name.trim();
  const lastName = last_name.trim();
  const fullName = `${firstName} ${lastName}`;

  // Check if email already registered
  const { data: existing } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This email is registered. Please sign in.' },
      { status: 409 }
    );
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role: 'facilitator' },
  });

  if (authError || !authData?.user) {
    // Handle duplicate auth user (race condition)
    if (authError?.message?.toLowerCase().includes('already')) {
      return NextResponse.json(
        { error: 'This email is registered. Please sign in.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  const authUserId = authData.user.id;
  const certId = generateCertId();
  const renewalDate = getRenewalDate();

  // Create facilitator profile
  const { error: profileError } = await supabase.from('facilitator_profiles').insert({
    user_id:         authUserId,
    email:           normalizedEmail,
    full_name:       fullName,
    role:            'community',
    books_certified: [1],
    cert_id:         certId,
    cert_status:     'active',
    cert_issued:     new Date().toISOString().split('T')[0],
    cert_renewal:    renewalDate,
    onboarding_step: 0,
    onboarding_complete: false,
    created_at:      new Date().toISOString(),
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUserId);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  // Generate one-click password-setup link
  let setupLink = `${SITE_URL}/login/facilitator`;
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=/facilitators/hub/dashboard`,
    },
  });
  if (linkData?.properties?.action_link) {
    setupLink = linkData.properties.action_link;
  }

  // Enroll in Kit Facilitator Welcome sequence + activate subscriber
  try {
    const apiSecret = process.env.KIT_API_SECRET;
    if (apiSecret) {
      // Step 1: Subscribe to sequence
      const subRes = await fetch(`https://api.convertkit.com/v3/sequences/${FACILITATOR_WELCOME_SEQUENCE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_secret: apiSecret,
          email: normalizedEmail,
          first_name: firstName,
          fields: {
            setup_link:   setupLink,
            cert_id:      certId,
            cert_renewal: renewalDate,
            track:        'community',
          },
        }),
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        const subscriberId = subData?.subscription?.subscriber?.id;

        // Step 2: Activate the subscriber so sequence emails fire immediately
        if (subscriberId) {
          await fetch(`https://api.convertkit.com/v3/subscribers/${subscriberId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_secret: apiSecret }),
          });
        }
      }
    }
  } catch {
    // Non-fatal — account is created, email can be resent manually
  }

  return NextResponse.json({ ok: true });
}
