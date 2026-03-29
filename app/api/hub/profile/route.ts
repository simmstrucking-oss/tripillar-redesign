import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const getUser = (req: NextRequest) => getUserFromRequest(req);

// GET /api/hub/profile — returns facilitator_profiles row + org for current user
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile, error } = await supabase
    .from('facilitator_profiles')
    .select('*, organizations(name, type, license_status)')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Update last_active
  await supabase.from('facilitator_profiles')
    .update({ last_active: new Date().toISOString() })
    .eq('user_id', user.id);

  return NextResponse.json({ profile });
}
