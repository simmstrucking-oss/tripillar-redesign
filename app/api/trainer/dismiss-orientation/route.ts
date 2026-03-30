import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

// GET: check if trainer orientation has been dismissed (uses dismissed_trainer_orientation column)
// PATCH: dismiss it
// Column: dismissed_trainer_orientation boolean DEFAULT false
// Migration SQL (run in Supabase SQL editor if column missing):
//   ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS dismissed_trainer_orientation boolean DEFAULT false;

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('facilitator_profiles')
    .select('dismissed_trainer_orientation')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // Column may not exist yet — treat as not dismissed
    return NextResponse.json({ dismissed: false, pending_migration: true });
  }

  return NextResponse.json({ dismissed: data?.dismissed_trainer_orientation ?? false });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase
    .from('facilitator_profiles')
    .update({ dismissed_trainer_orientation: true })
    .eq('user_id', user.id);

  if (error) {
    // Column may not exist yet
    return NextResponse.json({ ok: false, pending_migration: true, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
