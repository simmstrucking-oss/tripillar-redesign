/**
 * GET /api/admin/financial-summary
 * Wayne-only: lifetime + 30-day revenue from purchases table.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('lg-admin-session')?.value;
  const header = req.headers.get('x-admin-secret');
  return cookie === process.env.ADMIN_SECRET || header === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb    = getSupabaseServer();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: all }, { data: recent }] = await Promise.all([
    sb.from('purchases').select('amount, payment_type'),
    sb.from('purchases').select('amount, payment_type').gte('created_at', since),
  ]);

  const sumCents = (rows: { amount: number | null }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);

  return NextResponse.json({
    revenue_total_cents:   sumCents(all),
    revenue_30d_cents:     sumCents(recent),
    solo_purchases_total:  (all ?? []).length,
    solo_purchases_30d:    (recent ?? []).length,
  });
}
