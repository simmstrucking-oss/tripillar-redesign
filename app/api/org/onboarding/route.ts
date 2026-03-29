import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getOrgUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;

  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch {}
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch {}
  }
  if (!token) return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  if (!isOwnerEmail(data.user.email) && data.user.user_metadata?.role !== 'org_contact') return null;
  return data.user;
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function GET(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const supabase = sb();

  const { data: org, error } = await supabase
    .from('organizations')
    .select('onboarding_progress, onboarding_complete, training_requested, facilitator_candidate_name, facilitator_candidate_email, target_cohort_date, dismissed_orientation, name')
    .eq('id', orgId)
    .single();

  if (error || !org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });
  return NextResponse.json(org);
}

export async function PATCH(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const supabase = sb();
  const body = await req.json();

  const allowed = [
    'onboarding_progress', 'onboarding_complete', 'training_requested',
    'facilitator_candidate_name', 'facilitator_candidate_email',
    'target_cohort_date', 'dismissed_orientation'
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If facilitator candidate name + email both present, email Wayne
  if (body.facilitator_candidate_name && body.facilitator_candidate_email) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    const orgName = org?.name ?? 'Unknown Org';
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_aDy5YJGb_ML9LLRsnH5PD7Np5W6BeKrk3',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ember <ember@tripillarstudio.com>',
          to: 'wayne@tripillarstudio.com',
          subject: 'Facilitator candidate identified',
          text: `${orgName} — ${body.facilitator_candidate_name} — ${body.facilitator_candidate_email}`,
        }),
      });
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({ success: true });
}
