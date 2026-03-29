import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const getUser = (req: NextRequest) => getUserFromRequest(req);

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET /api/hub/cohort-outcomes?cohort_id=xxx
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cohort_id = req.nextUrl.searchParams.get('cohort_id');
  if (!cohort_id) return NextResponse.json({ error: 'cohort_id required' }, { status: 400 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: outcome } = await supabase.from('cohort_outcomes')
    .select('*').eq('cohort_id', cohort_id).eq('facilitator_id', profile.id).maybeSingle();

  return NextResponse.json({ outcome: outcome ?? null });
}

// POST /api/hub/cohort-outcomes — upsert pre or post data
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id, organization_id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { cohort_id, phase, ...fields } = body; // phase: 'pre' | 'post'
  if (!cohort_id || !phase) return NextResponse.json({ error: 'cohort_id and phase required' }, { status: 400 });

  // Verify ownership
  const { data: cohort } = await supabase.from('cohorts')
    .select('id, book_number').eq('id', cohort_id).eq('facilitator_id', profile.id).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  // Check if row exists
  const { data: existing } = await supabase.from('cohort_outcomes')
    .select('id').eq('cohort_id', cohort_id).maybeSingle();

  let payload: Record<string, unknown>;

  if (phase === 'pre') {
    payload = {
      cohort_id,
      facilitator_id:          profile.id,
      organization_id:         profile.organization_id ?? null,
      book_number:             cohort.book_number,
      pre_participant_count:   fields.pre_participant_count ? Number(fields.pre_participant_count) : null,
      pre_age_ranges:          fields.pre_age_ranges ?? null,
      pre_setting_type:        fields.pre_setting_type ?? null,
      pre_community_type:      fields.pre_community_type ?? null,
      pre_primary_loss_types:  fields.pre_primary_loss_types ?? null,
      pre_time_since_loss:     fields.pre_time_since_loss ?? null,
      pre_prior_support:       fields.pre_prior_support ?? null,
      pre_submitted_at:        new Date().toISOString(),
    };
  } else if (phase === 'post') {
    payload = {
      post_participant_count:          fields.post_participant_count ? Number(fields.post_participant_count) : null,
      post_grief_intensity_rating:     fields.post_grief_intensity_rating ? Number(fields.post_grief_intensity_rating) : null,
      post_connection_rating:          fields.post_connection_rating ? Number(fields.post_connection_rating) : null,
      post_self_care_rating:           fields.post_self_care_rating ? Number(fields.post_self_care_rating) : null,
      post_hope_rating:                fields.post_hope_rating ? Number(fields.post_hope_rating) : null,
      post_facilitator_observations:   fields.post_facilitator_observations ?? null,
      post_submitted_at:               new Date().toISOString(),
      updated_at:                      new Date().toISOString(),
    };
  } else {
    return NextResponse.json({ error: 'phase must be pre or post' }, { status: 400 });
  }

  let data, error;
  if (existing) {
    ({ data, error } = await supabase.from('cohort_outcomes')
      .update(payload).eq('cohort_id', cohort_id).select().single());
  } else {
    ({ data, error } = await supabase.from('cohort_outcomes')
      .insert(payload).select().single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // On post submission: mark cohort completed + trigger Kit sequence + email Wayne
  if (phase === 'post') {
    // Mark cohort completed
    await supabase.from('cohorts').update({ status: 'completed' }).eq('id', cohort_id);

    // Trigger Kit Book 1 Completion sequence (2701295)
    const kitKey = process.env.KIT_API_SECRET;
    const facilitatorEmail = user.email;
    if (kitKey && facilitatorEmail) {
      // Get Kit subscriber id for this facilitator
      const kitRes = await fetch(
        `https://api.convertkit.com/v3/subscribers?api_secret=${kitKey}&email_address=${encodeURIComponent(facilitatorEmail)}`
      ).then(r => r.json()).catch(() => ({}));
      const subId = kitRes?.subscribers?.[0]?.id;
      if (subId) {
        await fetch(`https://api.convertkit.com/v3/sequences/2701295/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_secret: kitKey, subscriber_id: subId }),
        }).catch(() => { /* non-blocking */ });
      }
    }

    // Email Wayne notification
    const { data: facProfile } = await supabase.from('facilitator_profiles')
      .select('full_name, organizations(name)').eq('id', profile.id).single() as { data: { full_name: string; organizations?: { name: string } } | null };
    const orgName = (facProfile as { organizations?: { name: string } } & { full_name: string } | null)?.organizations?.name ?? 'Unknown Org';
    const facName = facProfile?.full_name ?? facilitatorEmail;
    const completionRate = data?.completion_rate ?? 'N/A';

    await fetch('https://api.convertkit.com/v3/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: process.env.KIT_API_SECRET,
        subject: `Cohort completed: ${facName} — ${orgName}`,
        content: `A cohort has been submitted.\n\nFacilitator: ${facName}\nOrganization: ${orgName}\nBook: ${cohort.book_number}\nParticipants: ${fields.post_participant_count}\nCompletion rate: ${completionRate}%\n\nView in admin: https://www.tripillarstudio.com/admin/dashboard`,
        public: false,
        email_address: 'wayne@tripillarstudio.com',
      }),
    }).catch(() => { /* non-blocking */ });

    // Log to report_log
    await supabase.from('report_log').insert({
      report_type:           'cohort_summary',
      report_period:         cohort_id,
      generated_by_user_id:  user.id,
      generated_for_entity:  profile.id,
    });
  }

  return NextResponse.json({ ok: true, outcome: data });
}
