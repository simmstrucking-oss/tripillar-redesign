import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PARTICIPANT_KIT_SEQUENCE_ID = '2714989';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, displayName, cohortId } = body;

  if (!email || !cohortId) {
    return NextResponse.json({ error: 'email and cohortId required' }, { status: 400 });
  }

  const supabase = sb();

  // Validate cohort exists
  const { data: cohort } = await supabase.from('cohorts').select('id').eq('id', cohortId).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  // Upsert registration
  const { error: regErr } = await supabase.from('participant_registrations')
    .upsert({
      email: email.toLowerCase().trim(),
      display_name: displayName || null,
      cohort_id: cohortId,
    }, { onConflict: 'email,cohort_id' });

  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 });

  // Enroll in Kit sequence
  try {
    const kitRes = await fetch(
      `https://api.convertkit.com/v3/sequences/${PARTICIPANT_KIT_SEQUENCE_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_secret: process.env.KIT_API_SECRET,
          email: email.toLowerCase().trim(),
          first_name: displayName || '',
        }),
      }
    );
    if (kitRes.ok) {
      const kitData = await kitRes.json();
      const subscriberId = kitData?.subscription?.subscriber?.id;
      if (subscriberId) {
        await supabase.from('participant_registrations')
          .update({ kit_subscriber_id: subscriberId })
          .eq('email', email.toLowerCase().trim())
          .eq('cohort_id', cohortId);
      }
    }
  } catch {
    // Kit enrollment is best-effort — don't fail the registration
  }

  return NextResponse.json({ ok: true });
}
