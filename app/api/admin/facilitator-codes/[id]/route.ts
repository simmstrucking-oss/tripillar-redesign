import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

// GET /api/admin/facilitator-codes/[id]
// Returns summary stats + batch list for a single facilitator profile ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: facilitatorId } = await params;
  const supabase = getSupabaseServer();

  // Fetch all codes for this facilitator (via batch relationship)
  const { data: codes, error } = await supabase
    .from('access_codes')
    .select(`
      id, code, status, expires_at, redeemed_at, redeemed_by_email, book_number, created_at,
      batch_id,
      access_code_batches!inner(id, facilitator_id, notes, created_at)
    `)
    .eq('access_code_batches.facilitator_id', facilitatorId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const stats = {
    total:    codes?.length ?? 0,
    active:   0,
    redeemed: 0,
    expired:  0,
    revoked:  0,
  };

  for (const c of codes ?? []) {
    if (c.status === 'revoked') {
      stats.revoked++;
    } else if (c.status === 'redeemed') {
      stats.redeemed++;
    } else if (c.expires_at && new Date(c.expires_at) < now) {
      stats.expired++;
    } else if (c.status === 'active') {
      stats.active++;
    }
  }

  // Fetch batches for this facilitator
  const { data: batches, error: bErr } = await supabase
    .from('access_code_batches')
    .select('id, book_number, batch_size, expires_at, notes, created_at')
    .eq('facilitator_id', facilitatorId)
    .order('created_at', { ascending: false });

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  return NextResponse.json({ stats, batches: batches ?? [] });
}
