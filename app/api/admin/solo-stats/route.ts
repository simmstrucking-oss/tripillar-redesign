/**
 * GET /api/admin/solo-stats
 * Solo Companion dashboard data — owner (Wayne/Jamie) only.
 * Aggregate queries only — no SELECT *.
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

  const sb = getSupabaseServer();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Total purchases
    const { count: totalPurchases } = await sb
      .from('purchases')
      .select('id', { count: 'exact', head: true });

    // 2. Active users in last 30 days
    const { count: activeUsers30d } = await sb
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .gte('purchased_at', thirtyDaysAgo);

    // 3. Purchases by type (need to fetch and aggregate)
    const { data: purchasesByTypeData, error: purchasesByTypeErr } = await sb
      .from('purchases')
      .select('payment_type');

    let purchasesByType = { one_time: 0, installment: 0 };
    if (!purchasesByTypeErr && purchasesByTypeData) {
      purchasesByType.one_time = purchasesByTypeData.filter(p => p.payment_type === 'one_time').length;
      purchasesByType.installment = purchasesByTypeData.filter(p => p.payment_type === 'installment').length;
    }

    // 4. Supplement tokens total issued
    const { count: supplementTokens } = await sb
      .from('supplement_tokens')
      .select('id', { count: 'exact', head: true });

    // 5. Supplement tokens redeemed
    const { count: supplementRedeemed } = await sb
      .from('supplement_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('redeemed', true);

    // 6. Access codes redeemed
    const { count: accessCodesRedeemed } = await sb
      .from('access_codes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'redeemed');

    // 7. Week funnel (sessions completed per week)
    const { data: sessionProgressData, error: sessionProgressErr } = await sb
      .from('session_progress')
      .select('week, completed, user_id');

    const weekFunnel: { week: number; users: number }[] = [];
    if (!sessionProgressErr && sessionProgressData) {
      const weekMap = new Map<number, Set<string>>();
      sessionProgressData.forEach(row => {
        if (row.completed && row.week >= 1 && row.week <= 13) {
          if (!weekMap.has(row.week)) weekMap.set(row.week, new Set());
          weekMap.get(row.week)!.add(row.user_id);
        }
      });
      for (let w = 1; w <= 13; w++) {
        weekFunnel.push({ week: w, users: weekMap.get(w)?.size ?? 0 });
      }
    }

    // 8. Active participants (currently active access)
    const { count: activeParticipants } = await sb
      .from('participant_access')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    // 9. Recent purchases in last 7 days
    const { count: recentPurchases7d } = await sb
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .gte('purchased_at', sevenDaysAgo);

    return NextResponse.json({
      success: true,
      data: {
        totalPurchases: totalPurchases ?? 0,
        activeUsers30d: activeUsers30d ?? 0,
        purchasesByType,
        supplementTokens: supplementTokens ?? 0,
        supplementRedeemed: supplementRedeemed ?? 0,
        accessCodesRedeemed: accessCodesRedeemed ?? 0,
        weekFunnel,
        activeParticipants: activeParticipants ?? 0,
        recentPurchases7d: recentPurchases7d ?? 0,
      },
      lastUpdated: now.toISOString(),
    });
  } catch (error) {
    console.error('solo-stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
