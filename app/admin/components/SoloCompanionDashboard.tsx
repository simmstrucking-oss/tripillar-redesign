'use client';
/**
 * SoloCompanionDashboard — Solo Companion usage metrics
 * Visible to Wayne/Jamie (owners) only
 */
import { useState, useEffect, useCallback } from 'react';

const C = {
  navy:     '#1c3028',
  gold:     '#B8942F',
  cream:    '#FAFAF7',
  slate:    '#5A6070',
  light:    '#EAEAEA',
  green:    '#2E7D50',
  red:      '#C0392B',
  warn:     '#D97706',
  cardBg:   '#FFFFFF',
  pageBg:   '#F4F1EC',
};

interface SoloStats {
  totalPurchases: number;
  activeUsers30d: number;
  purchasesByType: { one_time: number; installment: number };
  supplementTokens: number;
  supplementRedeemed: number;
  accessCodesRedeemed: number;
  weekFunnel: { week: number; users: number }[];
  activeParticipants: number;
  recentPurchases7d: number;
}

interface DashboardState {
  data: SoloStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

function StatCard({ label, value, sub, color, large }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  large?: boolean;
}) {
  return (
    <div style={{
      background: C.cardBg,
      borderRadius: 10,
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      borderTop: `3px solid ${color ?? C.gold}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        color: C.slate,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>
      <div style={{
        color: color ?? C.navy,
        fontSize: large ? 40 : 28,
        fontWeight: 700,
        lineHeight: 1.1,
      }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ color: C.slate, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ margin: '28px 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: C.light }} />
      <span style={{
        color: C.navy,
        fontWeight: 700,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: C.light }} />
    </div>
  );
}

export function SoloCompanionDashboard() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/admin/solo-stats', {
        credentials: 'include',
      });

      if (res.status === 403) {
        setState(prev => ({
          ...prev,
          error: 'Not authorized to view Solo Companion data',
          loading: false,
        }));
        return;
      }

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          error: 'Failed to load data — check Supabase connection',
          loading: false,
        }));
        return;
      }

      const json = await res.json();
      setState({
        data: json.data,
        loading: false,
        error: null,
        lastUpdated: json.lastUpdated,
      });
    } catch (e) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load data — check Supabase connection',
        loading: false,
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { data, loading, error, lastUpdated } = state;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 0',
        color: C.slate,
      }}>
        ⟳ Loading Solo Companion data…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: C.cardBg,
        borderLeft: `4px solid ${C.red}`,
        borderRadius: 10,
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        color: C.red,
        fontWeight: 600,
      }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ color: C.slate, padding: '40px 0', textAlign: 'center' }}>
        No data available.
      </div>
    );
  }

  // Calculate metrics
  const totalPurchasesByType = data.purchasesByType.one_time + data.purchasesByType.installment;
  const oneTimePct = totalPurchasesByType > 0
    ? Math.round((data.purchasesByType.one_time / totalPurchasesByType) * 100)
    : 0;
  const purchaseTypeStr = `${data.purchasesByType.one_time} one-time / ${data.purchasesByType.installment} installment (${oneTimePct}% one-time)`;

  const supplementAccessStr = `${data.supplementTokens} tokens issued / ${data.supplementRedeemed} redeemed / ${data.accessCodesRedeemed} code redemptions`;

  // Find highest drop-off week
  let highestDropoff = { week: 0, drop: 0 };
  for (let i = 1; i < data.weekFunnel.length; i++) {
    const drop = data.weekFunnel[i - 1].users - data.weekFunnel[i].users;
    if (drop > highestDropoff.drop) {
      highestDropoff = { week: data.weekFunnel[i].week, drop };
    }
  }

  const hasWeekData = data.weekFunnel.some(w => w.users > 0);

  // Format last updated
  const lastUpdatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      })
    : '—';

  return (
    <>
      {/* Row 1 — Overview Cards */}
      <SectionHead title="Overview" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatCard
          label="Total Purchases"
          value={data.totalPurchases}
          large
          color={C.navy}
        />
        <StatCard
          label="Active (Last 30 Days)"
          value={data.activeUsers30d}
          color={C.gold}
        />
        <StatCard
          label="One-Time vs Installment"
          value={purchaseTypeStr}
          color={C.green}
        />
        <StatCard
          label="Supplement Access"
          value={supplementAccessStr}
          color={C.navy}
        />
      </div>

      {/* Row 2 — Week-by-Week Funnel */}
      <SectionHead title="Week-by-Week Completion Funnel (Weeks 1–13)" />
      {hasWeekData ? (
        <>
          <div style={{
            background: C.cardBg,
            borderRadius: 10,
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            marginBottom: 24,
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
            }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.light}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: C.navy, fontWeight: 700 }}>
                    Week
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: C.navy, fontWeight: 700 }}>
                    Users Completed
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: C.navy, fontWeight: 700 }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.weekFunnel.map((row) => {
                  const isDropoff = row.week === highestDropoff.week && highestDropoff.drop > 0;
                  return (
                    <tr
                      key={row.week}
                      style={{
                        borderBottom: `1px solid ${C.light}`,
                        background: isDropoff ? 'rgba(217, 119, 6, 0.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: C.navy, fontWeight: 600 }}>
                        Week {row.week}
                      </td>
                      <td style={{ padding: '10px 12px', color: C.navy, fontWeight: 700, fontSize: 14 }}>
                        {row.users}
                      </td>
                      <td style={{ padding: '10px 12px', color: isDropoff ? C.warn : C.slate, fontWeight: isDropoff ? 600 : 400 }}>
                        {isDropoff && highestDropoff.drop > 0
                          ? `↓ Highest drop-off (−${highestDropoff.drop})`
                          : row.users > 0
                            ? '✓'
                            : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{
          background: C.cardBg,
          borderRadius: 10,
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          color: C.slate,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          No completion data yet — data will appear as participants progress through the program.
        </div>
      )}

      {/* Row 3 — Revenue Note */}
      <SectionHead title="Revenue" />
      <div style={{
        background: C.cream,
        border: `2px solid ${C.gold}`,
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 24,
        color: C.navy,
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>💳 Revenue Tracking</div>
        <div>
          Revenue data is tracked in Stripe, not Supabase. Purchase records confirm payment_type
          but do not store dollar amounts. View revenue at:{' '}
          <a
            href="https://stripe.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.gold, fontWeight: 700, textDecoration: 'none' }}
          >
            stripe.com/dashboard → Payments
          </a>
        </div>
      </div>

      {/* Row 4 — Data Freshness */}
      <SectionHead title="Data Freshness" />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          flex: 1,
          color: C.slate,
          fontSize: 13,
        }}>
          Last updated: <span style={{ fontWeight: 700, color: C.navy }}>{lastUpdatedStr}</span>
        </div>
        <button
          onClick={fetchStats}
          style={{
            background: C.navy,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          🔄 Refresh
        </button>
      </div>
    </>
  );
}
