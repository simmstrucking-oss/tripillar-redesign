/**
 * GET  /api/hub/onboarding — returns onboarding state for authenticated facilitator
 * PATCH /api/hub/onboarding — update checklist item, training details, or dismiss orientation
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;
  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch { /* */ }
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch { /* */ }
  }
  if (!token) return null;
  const { data, error } = await sb().auth.getUser(token);
  return (error || !data?.user) ? null : data.user;
}

const CHECKLIST_COUNT = 7;

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error } = await sb()
    .from('facilitator_profiles')
    .select('id, status, onboarding_checklist, onboarding_complete, training_date, training_location, training_confirmed, dismissed_orientation, books_certified')
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
    .select('id, onboarding_checklist, training_confirmed')
    .eq('user_id', user.id)
    .single();

  if (pErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Case 1: Update a single checklist item
  if (body.item !== undefined && body.checked !== undefined) {
    const checklist: Record<string, boolean> = { ...(profile.onboarding_checklist ?? {}) };
    checklist[String(body.item)] = !!body.checked;

    const update: Record<string, unknown> = { onboarding_checklist: checklist };

    // Check if all 7 items checked AND training confirmed
    const allChecked = Array.from({ length: CHECKLIST_COUNT }, (_, i) => checklist[String(i + 1)]).every(Boolean);
    const trainingOk = body.item === 7 ? !!body.training_confirmed : !!profile.training_confirmed;
    if (allChecked && trainingOk) update.onboarding_complete = true;

    const { error } = await supabase
      .from('facilitator_profiles')
      .update(update)
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ ok: true, onboarding_complete: !!update.onboarding_complete });
  }

  // Case 2: Update training details
  if (body.training_confirmed !== undefined) {
    const update: Record<string, unknown> = {
      training_date: body.training_date ?? null,
      training_location: body.training_location ?? null,
      training_confirmed: !!body.training_confirmed,
    };

    // Check completion
    const checklist: Record<string, boolean> = profile.onboarding_checklist ?? {};
    const allChecked = Array.from({ length: CHECKLIST_COUNT }, (_, i) => checklist[String(i + 1)]).every(Boolean);
    if (allChecked && body.training_confirmed) update.onboarding_complete = true;

    const { error } = await supabase
      .from('facilitator_profiles')
      .update(update)
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ ok: true, onboarding_complete: !!update.onboarding_complete });
  }

  // Case 3: Dismiss orientation
  if (body.dismissed_orientation) {
    const { error } = await supabase
      .from('facilitator_profiles')
      .update({ dismissed_orientation: true })
      .eq('id', profile.id);

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}
