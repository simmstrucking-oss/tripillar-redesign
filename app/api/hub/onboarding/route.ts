/**
 * GET  /api/hub/onboarding — returns onboarding state for authenticated facilitator
 * PATCH /api/hub/onboarding — update checklist item, training details, or dismiss orientation
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const getUser = (req: NextRequest) => getUserFromRequest(req);

const CHECKLIST_COUNT = 7;

// Send Kit welcome email via sequence enrollment
async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  try {
    const apiSecret = process.env.KIT_API_SECRET;
    if (!apiSecret) return;

    // Subscribe/enroll to Facilitator Welcome sequence (2701285)
    await fetch(`https://api.convertkit.com/v3/sequences/2701285/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: apiSecret,
        email,
        first_name: fullName.split(' ')[0] || fullName,
      }),
    });
  } catch {
    // Non-fatal — log and continue
    console.error('[onboarding] Failed to send welcome email to', email);
  }
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error } = await sb()
    .from('facilitator_profiles')
    .select('id, cert_status, onboarding_checklist, onboarding_complete, onboarding_step, training_date, training_location, training_confirmed, dismissed_orientation, books_certified')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json({ onboarding: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const supabase = sb();

  const { data: profile, error: pErr } = await supabase
    .from('facilitator_profiles')
    .select('id, email, full_name, onboarding_checklist, training_confirmed, onboarding_complete')
    .eq('user_id', user.id)
    .single();

  if (pErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Case 1: Update a single checklist item
  if (body.item !== undefined && body.checked !== undefined) {
    const checklist: Record<string, boolean> = { ...(profile.onboarding_checklist ?? {}) };
    checklist[String(body.item)] = !!body.checked;

    const update: Record<string, unknown> = { onboarding_checklist: checklist };

    const allChecked = Array.from({ length: CHECKLIST_COUNT }, (_, i) => checklist[String(i + 1)]).every(Boolean);
    const trainingOk = body.item === 7 ? !!body.training_confirmed : !!profile.training_confirmed;
    const justCompleted = allChecked && trainingOk && !profile.onboarding_complete;
    if (justCompleted) update.onboarding_complete = true;

    const { error } = await supabase
      .from('facilitator_profiles')
      .update(update)
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    if (justCompleted) await sendWelcomeEmail(profile.email, profile.full_name);
    return NextResponse.json({ ok: true, onboarding_complete: !!update.onboarding_complete });
  }

  // Case 2: Update training details
  if (body.training_confirmed !== undefined) {
    const update: Record<string, unknown> = {
      training_date: body.training_date ?? null,
      training_location: body.training_location ?? null,
      training_confirmed: !!body.training_confirmed,
    };

    const checklist: Record<string, boolean> = profile.onboarding_checklist ?? {};
    const allChecked = Array.from({ length: CHECKLIST_COUNT }, (_, i) => checklist[String(i + 1)]).every(Boolean);
    const justCompleted = allChecked && !!body.training_confirmed && !profile.onboarding_complete;
    if (justCompleted) update.onboarding_complete = true;

    const { error } = await supabase
      .from('facilitator_profiles')
      .update(update)
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    if (justCompleted) await sendWelcomeEmail(profile.email, profile.full_name);
    return NextResponse.json({ ok: true, onboarding_complete: !!update.onboarding_complete });
  }

  // Case 3: Update onboarding step
  if (body.step !== undefined) {
    const { error } = await supabase
      .from('facilitator_profiles')
      .update({ onboarding_step: body.step })
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Case 4: Mark onboarding complete
  if (body.complete === true) {
    const justCompleted = !profile.onboarding_complete;
    const { error } = await supabase
      .from('facilitator_profiles')
      .update({ onboarding_complete: true })
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    if (justCompleted) await sendWelcomeEmail(profile.email, profile.full_name);
    return NextResponse.json({ ok: true, onboarding_complete: true });
  }

  // Case 5: Dismiss orientation
  if (body.dismissed_orientation) {
    const { error } = await supabase
      .from('facilitator_profiles')
      .update({ dismissed_orientation: true })
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Case 6: Dismiss trainer orientation
  if (body.dismissed_trainer_orientation) {
    const { error } = await supabase
      .from('facilitator_profiles')
      .update({ dismissed_trainer_orientation: true })
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}
