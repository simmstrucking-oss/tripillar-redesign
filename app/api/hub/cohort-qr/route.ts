import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cohort_id = req.nextUrl.searchParams.get('cohort_id');
  if (!cohort_id) return NextResponse.json({ error: 'cohort_id required' }, { status: 400 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: cohort } = await supabase.from('cohorts')
    .select('id').eq('id', cohort_id).eq('facilitator_id', profile.id).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const origin = req.nextUrl.origin;
  const urls = {
    pre:      `${origin}/outcomes/pre?cohort=${cohort_id}`,
    mid:      `${origin}/outcomes/mid?cohort=${cohort_id}`,
    post:     `${origin}/outcomes/post?cohort=${cohort_id}`,
    followup: `${origin}/outcomes/followup?cohort=${cohort_id}`,
    qr_pack:  `${origin}/outcomes/qr-pack?cohort=${cohort_id}`,
  };

  return NextResponse.json({ ok: true, urls });
}
