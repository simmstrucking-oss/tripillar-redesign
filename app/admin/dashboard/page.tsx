'use client';
/**
 * /admin/dashboard — Wayne's lifetime program dashboard
 * Live view only — not a PDF. Running totals that update in real time (30s poll).
 * Auth: lg-admin-session cookie (same as /admin/facilitators).
 */
import { useState, useEffect, useCallback } from 'react';

const C = {
  navy:     '#2D3142',
  gold:     '#B8942F',
  cream:    '#FAFAF7',
  slate:    '#5A6070',
  light:    '#EAEAEA',
  green:    '#2E7D50',
  red:      '#C0392B',
  cardBg:   '#FFFFFF',
  pageBg:   '#F4F1EC',
};

interface ProgramMetrics {
  // Lifetime totals
  participants_served:    number;
  participants_enrolled:  number;
  cohorts_total:          number;
  cohorts_completed:      number;
  cohorts_active:         number;
  organizations_licensed: number;
  facilitators_certified: number;
  facilitators_active:    number;
  completion_rate:        number | null;
  avg_outcome_rating:     number | null;
  critical_incidents:     number;
  critical_incident_reports: number;
  // Solo Companion
  solo_users:             number;
  solo_completions:       number;
  solo_completion_rate:   number | null;
  // Financial (Wayne-only tab)
  revenue_total_cents:    number | null;
  revenue_30d_cents:      number | null;
  solo_purchases_total:   number | null;
  solo_purchases_30d:     number | null;
  // Cohort Completion Summaries
  summaries_submitted:       number;
  avg_participants_completed: number | null;
  avg_summary_completion_rate: number | null;
  assessment_strong:         number;
  assessment_moderate:       number;
  assessment_challenging:    number;
  would_run_again_pct:       number | null;
  // Recency
  cohorts_last_30d:       number;
  facs_last_30d:          number;
  orgs_last_30d:          number;
  // Meta
  last_updated:           string;
}

interface AdminAuth { authed: boolean; checking: boolean; }

const ADMIN_SECRET_COOKIE = 'lg-admin-session';

function StatCard({ label, value, sub, color, large }: { label: string; value: string | number; sub?: string; color?: string; large?: boolean }) {
  return (
    <div style={{
      background: C.cardBg, borderRadius: 10, padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      borderTop: `3px solid ${color ?? C.gold}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ color: C.slate, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ color: color ?? C.navy, fontSize: large ? 40 : 28, fontWeight: 700, lineHeight: 1.1 }}>
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
      <span style={{ color: C.navy, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: C.light }} />
    </div>
  );
}

function RatingBar({ value }: { value: number | null }) {
  const pct = value ? (value / 5) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 12, background: C.light, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.gold, borderRadius: 6, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ color: C.navy, fontWeight: 700, fontSize: 14, minWidth: 44 }}>
        {value ? `${value}/5` : '—'}
      </span>
    </div>
  );
}

function GenReportBtn({ type, label, onDone }: { type: string; label: string; onDone: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  async function generate() {
    setLoading(true); setError('');
    const year = new Date().getFullYear();
    const qNum = Math.ceil((new Date().getMonth() + 1) / 3);
    const body: Record<string, unknown> = { type, force: true };
    if (type === 'quarterly') { body.year = year; body.quarter = `Q${qNum}`; }
    if (type === 'annual')    { body.year = year - 1; }
    try {
      const r = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const d = await r.json();
      if (d.ok) { onDone(d.url); }
      else       { setError(d.error ?? 'Generation failed'); }
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={generate}
        disabled={loading}
        style={{
          background: loading ? C.light : C.navy, color: loading ? C.slate : '#fff',
          border: 'none', borderRadius: 6, padding: '8px 16px',
          fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating…' : label}
      </button>
      {error && <span style={{ color: C.red, fontSize: 12 }}>{error}</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const [auth,       setAuth]       = useState<AdminAuth>({ authed: false, checking: true });
  const [password,   setPassword]   = useState('');
  const [loginErr,   setLoginErr]   = useState('');
  const [metrics,    setMetrics]    = useState<ProgramMetrics | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [lastPoll,   setLastPoll]   = useState<Date | null>(null);
  const [tab,        setTab]        = useState<'overview'|'cohorts'|'facilitators'|'solo'|'reports'|'financial'>('overview');
  const [reportUrls, setReportUrls] = useState<Record<string, string>>({});

  // Check auth cookie on mount
  useEffect(() => {
    const cookie = document.cookie.split('; ').find(r => r.startsWith(ADMIN_SECRET_COOKIE + '='));
    if (cookie) {
      setAuth({ authed: true, checking: false });
    } else {
      setAuth({ authed: false, checking: false });
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Pull from /api/reports/program for full data
      const r = await fetch('/api/reports/program', { credentials: 'include' });
      if (r.status === 401 || r.status === 403) {
        setAuth({ authed: false, checking: false });
        return;
      }
      const d = await r.json();

      // Also pull financial data (purchases)
      const rf = await fetch('/api/admin/financial-summary', { credentials: 'include' }).catch(() => null);
      const fin = rf?.ok ? await rf.json() : null;

      // Pull facilitator + org counts
      const rm = await fetch('/api/reports/public', { credentials: 'include' }).catch(() => null);
      const pub = rm?.ok ? await rm.json() : null;

      // Pull critical incident reports count
      const adminCookie = document.cookie.split('; ').find(c => c.startsWith(ADMIN_SECRET_COOKIE + '='));
      const adminToken = adminCookie?.split('=')[1] ?? '';
      const ri = await fetch('/api/hub/incidents', { headers: { 'Authorization': `Bearer ${adminToken}` } }).catch(() => null);
      const inc = ri?.ok ? await ri.json() : null;

      setMetrics({
        participants_served:    d.program_overview?.participants_completed  ?? pub?.participants_served ?? 0,
        participants_enrolled:  d.program_overview?.participants_enrolled  ?? 0,
        cohorts_total:          d.program_overview?.cohorts_total          ?? 0,
        cohorts_completed:      d.program_overview?.cohorts_completed      ?? pub?.cohorts_completed ?? 0,
        cohorts_active:         d.program_overview?.cohorts_active         ?? 0,
        organizations_licensed: d.program_overview?.organizations_total    ?? pub?.organizations_licensed ?? 0,
        facilitators_certified: d.program_overview?.facilitators_total     ?? pub?.facilitators_certified ?? 0,
        facilitators_active:    d.program_overview?.facilitators_active    ?? 0,
        completion_rate:        d.program_overview?.overall_completion_rate ?? null,
        avg_outcome_rating:     d.program_overview?.avg_outcome_rating     ?? null,
        critical_incidents:     d.program_overview?.total_critical_incidents ?? 0,
        critical_incident_reports: inc?.count ?? 0,
        solo_users:             d.solo_companion?.total_users              ?? 0,
        solo_completions:       d.solo_companion?.completed_program        ?? 0,
        solo_completion_rate:   d.solo_companion?.completion_rate          ?? null,
        revenue_total_cents:    fin?.revenue_total_cents                   ?? null,
        revenue_30d_cents:      fin?.revenue_30d_cents                     ?? null,
        solo_purchases_total:   fin?.solo_purchases_total                  ?? null,
        solo_purchases_30d:     fin?.solo_purchases_30d                    ?? null,
        summaries_submitted:       d.cohort_completion_summary?.summaries_submitted ?? 0,
        avg_participants_completed: d.cohort_completion_summary?.avg_participants_completed ?? null,
        avg_summary_completion_rate: d.cohort_completion_summary?.avg_completion_rate ?? null,
        assessment_strong:         d.cohort_completion_summary?.assessment_distribution?.Strong ?? 0,
        assessment_moderate:       d.cohort_completion_summary?.assessment_distribution?.Moderate ?? 0,
        assessment_challenging:    d.cohort_completion_summary?.assessment_distribution?.Challenging ?? 0,
        would_run_again_pct:       d.cohort_completion_summary?.would_run_again_pct ?? null,
        cohorts_last_30d:       0,
        facs_last_30d:          0,
        orgs_last_30d:          0,
        last_updated:           new Date().toISOString(),
      });
      setLastPoll(new Date());
    } catch (e) {
      console.error('Metrics fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-poll every 30s when authed
  useEffect(() => {
    if (!auth.authed) return;
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(interval);
  }, [auth.authed, fetchMetrics]);

  function login() {
    setLoginErr('');
    document.cookie = `${ADMIN_SECRET_COOKIE}=${password}; path=/; max-age=${60 * 60 * 8}`;
    setAuth({ authed: true, checking: false });
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (auth.checking) {
    return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:C.pageBg,color:C.slate }}>Loading…</div>;
  }

  if (!auth.authed) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:C.pageBg }}>
        <div style={{ background:C.cardBg,borderRadius:12,padding:'40px 48px',boxShadow:'0 4px 24px rgba(0,0,0,0.12)',minWidth:360 }}>
          <div style={{ color:C.gold,fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em' }}>LIVE AND GRIEVE™</div>
          <h1 style={{ color:C.navy,fontSize:24,fontWeight:700,margin:'8px 0 24px' }}>Admin Dashboard</h1>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width:'100%',padding:'10px 14px',borderRadius:6,border:`1.5px solid ${C.light}`,fontSize:14,marginBottom:12,boxSizing:'border-box' }}
          />
          {loginErr && <div style={{ color:C.red,fontSize:12,marginBottom:8 }}>{loginErr}</div>}
          <button
            onClick={login}
            style={{ width:'100%',background:C.navy,color:'#fff',border:'none',borderRadius:6,padding:'11px 0',fontSize:14,fontWeight:600,cursor:'pointer' }}
          >
            Enter
          </button>
          <div style={{ color:C.slate,fontSize:11,marginTop:16,textAlign:'center' }}>
            Tri-Pillars™ LLC · Confidential
          </div>
        </div>
      </div>
    );
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'overview',     label: '📊 Overview'       },
    { id: 'cohorts',      label: '👥 Cohorts'        },
    { id: 'facilitators', label: '🎓 Facilitators'   },
    { id: 'solo',         label: '💻 Solo Companion'  },
    { id: 'reports',      label: '📄 Reports'        },
    { id: 'financial',    label: '💰 Financial'      },
  ];

  const m = metrics;
  const fmt$ = (cents: number | null) => cents != null ? `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div style={{ background:C.pageBg,minHeight:'100vh',fontFamily:'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background:C.navy,padding:'0 32px',display:'flex',alignItems:'center',gap:24 }}>
        <div style={{ padding:'16px 0' }}>
          <div style={{ color:C.gold,fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em' }}>LIVE AND GRIEVE™</div>
          <div style={{ color:'#fff',fontSize:18,fontWeight:700 }}>Admin Dashboard</div>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ color:C.slate,fontSize:11 }}>
          {loading ? '⟳ Updating…' : lastPoll ? `Updated ${lastPoll.toLocaleTimeString()}` : ''}
        </div>
        <button
          onClick={fetchMetrics}
          style={{ background:'transparent',border:`1px solid ${C.gold}`,color:C.gold,borderRadius:6,padding:'6px 14px',fontSize:12,cursor:'pointer' }}
        >
          Refresh
        </button>
        <button
          onClick={() => { document.cookie=`${ADMIN_SECRET_COOKIE}=; max-age=0`; setAuth({authed:false,checking:false}); }}
          style={{ background:'transparent',border:`1px solid #666`,color:'#aaa',borderRadius:6,padding:'6px 14px',fontSize:12,cursor:'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* Tab nav */}
      <div style={{ background:'#fff',borderBottom:`1px solid ${C.light}`,padding:'0 32px',display:'flex',gap:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background:'transparent',border:'none',
            borderBottom: tab===t.id ? `2px solid ${C.gold}` : '2px solid transparent',
            color: tab===t.id ? C.navy : C.slate,
            padding:'12px 18px',fontSize:13,fontWeight:tab===t.id?700:400,cursor:'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'28px 32px', maxWidth:1200 }}>
        {!m ? (
          <div style={{ color:C.slate,padding:40,textAlign:'center' }}>Loading dashboard data…</div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <>
                <SectionHead title="Lifetime Program Totals" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16 }}>
                  <StatCard label="Participants Served"    value={m.participants_served}    sub={`of ${m.participants_enrolled} enrolled`} large />
                  <StatCard label="Cohorts Completed"      value={m.cohorts_completed}      sub={`${m.cohorts_active} active now`} />
                  <StatCard label="Organizations"          value={m.organizations_licensed} sub={`${m.orgs_last_30d > 0 ? `+${m.orgs_last_30d} last 30d` : 'no new last 30d'}`} />
                  <StatCard label="Certified Facilitators" value={m.facilitators_certified} sub={`${m.facilitators_active} active`} />
                  <StatCard label="Completion Rate"        value={m.completion_rate ? `${m.completion_rate}%` : '—'} color={m.completion_rate && m.completion_rate >= 70 ? C.green : C.gold} />
                  <StatCard label="Avg Outcome Rating"     value={m.avg_outcome_rating ? `${m.avg_outcome_rating}/5` : '—'} color={m.avg_outcome_rating && m.avg_outcome_rating >= 4 ? C.green : C.gold} />
                </div>

                <SectionHead title="Last 30 Days" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16 }}>
                  <StatCard label="New Cohorts"      value={m.cohorts_last_30d}  color={C.navy} />
                  <StatCard label="New Facilitators" value={m.facs_last_30d}     color={C.navy} />
                  <StatCard label="New Organizations" value={m.orgs_last_30d}    color={C.navy} />
                </div>

                <SectionHead title="Program Quality" />
                <div style={{ background:C.cardBg,borderRadius:10,padding:'20px 24px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',maxWidth:500 }}>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ color:C.slate,fontSize:11,fontWeight:600,textTransform:'uppercase',marginBottom:6 }}>Avg Outcome Rating</div>
                    <RatingBar value={m.avg_outcome_rating} />
                  </div>
                  <div style={{ color:C.slate,fontSize:12 }}>Critical Incidents (session logs): <strong style={{color:m.critical_incidents>0?C.red:C.green}}>{m.critical_incidents}</strong></div>
                  <div style={{ color:C.slate,fontSize:12, marginTop:6 }}>Critical Incident Reports (formal): <strong style={{color:m.critical_incident_reports>0?C.red:C.green}}>{m.critical_incident_reports}</strong></div>
                </div>

                <SectionHead title="Cohort Completions" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16 }}>
                  <StatCard label="Summaries Submitted"     value={m.summaries_submitted} color={C.green} />
                  <StatCard label="Avg Participants Completed" value={m.avg_participants_completed ?? '—'} />
                  <StatCard label="Avg Completion Rate"     value={m.avg_summary_completion_rate ? `${m.avg_summary_completion_rate}%` : '—'} color={m.avg_summary_completion_rate && m.avg_summary_completion_rate >= 70 ? C.green : C.gold} />
                  <StatCard label="Would Run Again"         value={m.would_run_again_pct ? `${m.would_run_again_pct}%` : '—'} color={C.green} />
                </div>
                {m.summaries_submitted > 0 && (
                  <div style={{ background:C.cardBg,borderRadius:10,padding:'20px 24px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',maxWidth:500,marginTop:16 }}>
                    <div style={{ color:C.slate,fontSize:11,fontWeight:600,textTransform:'uppercase',marginBottom:10 }}>Facilitator Assessment Distribution</div>
                    {['Strong','Moderate','Challenging'].map(level => {
                      const count = level === 'Strong' ? m.assessment_strong : level === 'Moderate' ? m.assessment_moderate : m.assessment_challenging;
                      const pct = m.summaries_submitted > 0 ? Math.round((count / m.summaries_submitted) * 100) : 0;
                      const barColor = level === 'Strong' ? C.green : level === 'Moderate' ? C.gold : C.red;
                      return (
                        <div key={level} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6 }}>
                          <span style={{ width:90,fontSize:12,color:C.navy,fontWeight:500 }}>{level}</span>
                          <div style={{ flex:1,height:14,background:'#EAEAEA',borderRadius:6,overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`,height:'100%',background:barColor,borderRadius:6,transition:'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize:12,fontWeight:700,color:C.navy,minWidth:50 }}>{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* COHORTS */}
            {tab === 'cohorts' && (
              <>
                <SectionHead title="Cohort Statistics" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16 }}>
                  <StatCard label="Total Cohorts"      value={m.cohorts_total}     />
                  <StatCard label="Active Now"         value={m.cohorts_active}    color={C.gold} />
                  <StatCard label="Completed"          value={m.cohorts_completed} color={C.green} />
                  <StatCard label="Completion Rate"    value={m.completion_rate ? `${m.completion_rate}%` : '—'} />
                  <StatCard label="Participants Enrolled"  value={m.participants_enrolled} />
                  <StatCard label="Participants Served"    value={m.participants_served} color={C.green} />
                  <StatCard label="Critical Incidents"     value={m.critical_incidents} color={m.critical_incidents > 0 ? C.red : C.green} />
                </div>
                <div style={{ marginTop:24,color:C.slate,fontSize:13 }}>
                  For per-cohort data and session logs, visit <a href="/admin/facilitators" style={{color:C.gold}}>Facilitator Admin</a>.
                </div>
              </>
            )}

            {/* FACILITATORS */}
            {tab === 'facilitators' && (
              <>
                <SectionHead title="Facilitator Statistics" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16 }}>
                  <StatCard label="Total Certified"   value={m.facilitators_certified} large />
                  <StatCard label="Active"            value={m.facilitators_active}    color={C.green} />
                  <StatCard label="Organizations"     value={m.organizations_licensed} />
                  <StatCard label="New Last 30d"      value={m.facs_last_30d}          color={C.gold} />
                </div>
                <div style={{ marginTop:24,color:C.slate,fontSize:13 }}>
                  Manage facilitators and access codes at <a href="/admin/facilitators" style={{color:C.gold}}>Facilitator Admin</a>.
                </div>
              </>
            )}

            {/* SOLO COMPANION */}
            {tab === 'solo' && (
              <>
                <SectionHead title="Solo Companion" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16 }}>
                  <StatCard label="Total Users"       value={m.solo_users}             large />
                  <StatCard label="Completions"       value={m.solo_completions}       color={C.green} />
                  <StatCard label="Completion Rate"   value={m.solo_completion_rate ? `${m.solo_completion_rate}%` : '—'} />
                </div>
              </>
            )}

            {/* REPORTS */}
            {tab === 'reports' && (
              <>
                <SectionHead title="On-Demand Report Generation" />
                <div style={{ display:'flex',flexDirection:'column',gap:20,maxWidth:520 }}>
                  {[
                    { type:'quarterly', label:'Generate Q Report (current quarter)' },
                    { type:'annual',    label:'Generate Annual Impact Report (prior year)' },
                  ].map(({ type, label }) => (
                    <div key={type} style={{ background:C.cardBg,borderRadius:10,padding:'18px 22px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                      <div style={{ color:C.navy,fontWeight:600,fontSize:14,marginBottom:10 }}>
                        {type === 'quarterly' ? '📊 Quarterly Program Report' : '📈 Annual Impact Report'}
                      </div>
                      <GenReportBtn
                        type={type}
                        label={label}
                        onDone={url => setReportUrls(prev => ({...prev,[type]:url}))}
                      />
                      {reportUrls[type] && (
                        <a href={reportUrls[type]} target="_blank" rel="noopener noreferrer"
                           style={{ display:'inline-block',marginTop:10,color:C.gold,fontWeight:600,fontSize:13 }}>
                          ↓ Download PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:24,color:C.slate,fontSize:12 }}>
                  Cohort Summary Reports auto-generate on post-program submission. Org Reports available from the Facilitator Admin panel.
                  All PDFs stored in Supabase Storage · 24-hour signed URL cache.
                </div>
              </>
            )}

            {/* FINANCIAL — Wayne only */}
            {tab === 'financial' && (
              <>
                <SectionHead title="Financial Summary (Wayne Only)" />
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16 }}>
                  <StatCard label="Revenue (Lifetime)"  value={fmt$(m.revenue_total_cents)}  large />
                  <StatCard label="Revenue (Last 30d)"  value={fmt$(m.revenue_30d_cents)}    color={C.green} />
                  <StatCard label="Solo Purchases Total" value={m.solo_purchases_total ?? '—'} />
                  <StatCard label="Solo Purchases 30d"   value={m.solo_purchases_30d ?? '—'}  color={C.gold} />
                </div>
                <div style={{ marginTop:16,fontSize:12,color:C.slate }}>
                  Revenue data from Supabase purchases table (Stripe webhook records). Does not include refunds. For full financials use Stripe dashboard.
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign:'center',padding:'24px 0 40px',color:C.slate,fontSize:11 }}>
        Tri-Pillars™ LLC · Confidential Program Data · tripillarstudio.com · Auto-refreshes every 30s
      </div>
    </div>
  );
}
