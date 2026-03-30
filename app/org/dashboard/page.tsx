'use client';
/**
 * /org/dashboard — Organization Admin Dashboard
 * Sections:
 *   1. Impact Summary — 4 top metrics
 *   2. Facilitator Breakdown table — click to view cohort PDFs
 *   3. Generate Organization Report PDF (this quarter / this year / all time / custom)
 *   4. Download all cohort PDFs as ZIP
 * Auth: Supabase session cookie; role must be org_admin.
 * All data is org-scoped at the API level — UI cannot override.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

const C = {
  navy:    '#2D3142',
  gold:    '#B8942F',
  goldLt:  '#FDF8EE',
  bg:      '#F4F1EC',
  white:   '#FFFFFF',
  border:  '#E2DDD7',
  muted:   '#7A7264',
  success: '#2E7D50',
  warn:    '#C07D2F',
  danger:  '#C0392B',
};

const card: React.CSSProperties = {
  background: C.white, borderRadius: 10, border: `1px solid ${C.border}`,
  padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Playfair Display, serif',
  fontSize: '1.1rem', fontWeight: 700, color: C.navy,
  margin: '0 0 1rem',
};

const btn = (bg: string, fg = '#fff', sm = false): React.CSSProperties => ({
  background: bg, color: fg, border: 'none', borderRadius: 6,
  padding: sm ? '6px 14px' : '9px 20px',
  fontSize: sm ? '0.8rem' : '0.875rem',
  fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  whiteSpace: 'nowrap',
});

/* ── Interfaces ── */
interface Org {
  id: string; name: string; type?: string;
  license_type?: string; license_status?: string;
  license_start?: string; license_renewal?: string;
  contact_name?: string; contact_email?: string;
}

interface Cohort {
  id: string; book_number: number; start_date: string; end_date?: string;
  participant_count?: number; status: string; notes?: string;
}

interface Facilitator {
  id: string; user_id: string; full_name: string; email: string; phone?: string;
  role: string; cert_id: string; cert_status: string;
  cert_issued: string; cert_renewal: string;
  books_certified?: number[]; last_active?: string; created_at: string;
  cohorts: Cohort[];
}

interface Stats {
  totalFacilitators: number; activeFacilitators: number; inactiveFacilitators: number;
  totalCohorts: number; totalParticipants: number;
  booksInProgress: number[];
  bookCounts: Record<number, number>;
}

interface Announcement {
  id: string; title: string; body: string; published_at?: string; pinned?: boolean;
}

interface OrgReport {
  breakdown?: FacBreakdown[];
  impact?: {
    total_cohorts: number;
    total_participants: number;
    avg_completion_rate: number | null;
    avg_outcome_rating: number | null;
  };
}

interface FacBreakdown {
  facilitator_id: string;
  name: string;
  email: string;
  cert_status: string;
  cohorts_total: number;
  cohorts_completed: number;
  participants_enrolled: number;
  participants_served: number;
  completion_rate: number | null;
  avg_outcome_rating: number | null;
  cohort_report_paths?: string[];
}

const BOOKS_MAP: Record<number, string> = {
  1: 'In The Quiet', 2: 'Through The Weight',
  3: 'Toward the Light', 4: 'With the Memory',
};

/* ── Helpers ── */
function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success
    : s === 'pending_renewal' ? C.warn
    : s === 'expired' ? C.danger : C.muted;
  return (
    <span style={{
      background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
      fontWeight: 600, fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap', textTransform: 'capitalize',
    }}>
      {s.replace('_', ' ')}
    </span>
  );
}

function RatingBar({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: C.muted, fontSize: 12 }}>—</span>;
  const pct = (value / 5) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 7, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.gold, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{value}/5</span>
    </div>
  );
}

/* ── Section 1: Impact Summary ── */
function ImpactSummary({ impact }: { impact: OrgReport['impact'] | null; orgStats: Stats | null }) {
  if (!impact) return null;
  const tiles = [
    { label: 'Total Cohorts',          value: impact.total_cohorts,                               color: C.navy },
    { label: 'Participants Served',     value: impact.total_participants,                          color: C.success },
    { label: 'Avg Completion Rate',     value: impact.avg_completion_rate != null ? `${impact.avg_completion_rate}%` : '—', color: C.gold },
    { label: 'Avg Outcome Rating',      value: impact.avg_outcome_rating  != null ? `${impact.avg_outcome_rating}/5` : '—', color: C.navy },
  ];
  return (
    <div style={{ ...card, borderTop: `3px solid ${C.gold}` }}>
      <h2 style={sectionTitle}>Organization Impact</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        {tiles.map(t => (
          <div key={t.label} style={{
            background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`,
            padding: '1rem', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: t.color, lineHeight: 1.2 }}>
              {t.value ?? '—'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cohort PDF modal for a facilitator ── */
function CohortReportsModal({ fac, orgId, onClose }: { fac: FacBreakdown; orgId: string; onClose: () => void }) {
  const [reports, setReports] = useState<{ path: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/org/facilitator-reports?fac_id=${fac.facilitator_id}&org_id=${orgId}`);
        if (!r.ok) { setErr('Could not load reports.'); setLoading(false); return; }
        const d = await r.json();
        setReports(d.reports ?? []);
      } catch (e) { setErr(String(e)); }
      setLoading(false);
    }
    load();
  }, [fac.facilitator_id, orgId]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.white, borderRadius: 12, width: '100%', maxWidth: 560,
        maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,.22)',
      }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: C.navy }}>
              Cohort Reports — {fac.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: C.muted, marginTop: 2 }}>Read-only. Download individual PDFs below.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {loading && <div style={{ color: C.muted, fontSize: 13 }}>Loading…</div>}
          {err    && <div style={{ color: C.danger, fontSize: 13 }}>{err}</div>}
          {!loading && !err && reports.length === 0 && (
            <div style={{ color: C.muted, fontSize: 13 }}>No cohort reports generated yet. Reports are created when a facilitator submits post-program outcomes.</div>
          )}
          {reports.map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < reports.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>
                📄 {r.path.split('/').pop() ?? r.path}
              </div>
              <a href={r.url} target="_blank" rel="noopener noreferrer"
                 style={{ ...btn(C.gold, '#fff', true), textDecoration: 'none', display: 'inline-block' }}>
                ↓ Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Section 2: Facilitator Breakdown table ── */
function FacilitatorBreakdown({ breakdown, orgId }: { breakdown: FacBreakdown[]; orgId: string }) {
  const [selected, setSelected] = useState<FacBreakdown | null>(null);
  const [q,        setQ]        = useState('');

  const filtered = breakdown.filter(f =>
    !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ ...sectionTitle, margin: 0 }}>Facilitator Breakdown</h2>
        <input
          placeholder="Search facilitators…"
          value={q} onChange={e => setQ(e.target.value)}
          style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', width: 200 }}
        />
      </div>

      {filtered.length === 0 && (
        <div style={{ color: C.muted, fontSize: 13, padding: '12px 0' }}>No facilitators found.</div>
      )}

      {/* Desktop table */}
      <div className="desktop-table" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {['Facilitator', 'Status', 'Cohorts', 'Participants', 'Completion', 'Avg Rating', 'Reports'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.facilitator_id}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 10px' }}>
                  <div style={{ fontWeight: 600, color: C.navy }}>{f.name}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>{f.email}</div>
                </td>
                <td style={{ padding: '10px 10px' }}><StatusBadge s={f.cert_status} /></td>
                <td style={{ padding: '10px 10px' }}>{f.cohorts_total} <span style={{ color: C.muted, fontSize: 11 }}>({f.cohorts_completed} done)</span></td>
                <td style={{ padding: '10px 10px' }}>{f.participants_served} <span style={{ color: C.muted, fontSize: 11 }}>of {f.participants_enrolled}</span></td>
                <td style={{ padding: '10px 10px' }}>{f.completion_rate != null ? `${f.completion_rate}%` : '—'}</td>
                <td style={{ padding: '10px 10px' }}><RatingBar value={f.avg_outcome_rating} /></td>
                <td style={{ padding: '10px 10px' }}>
                  <button onClick={() => setSelected(f)} style={{ ...btn(C.navy, '#fff', true) }}>
                    View Reports
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="mobile-list" style={{ display: 'none' }}>
        {filtered.map(f => (
          <div key={f.facilitator_id} style={{ borderBottom: `1px solid ${C.border}`, padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600, color: C.navy, fontSize: 14 }}>{f.name}</div>
                <div style={{ color: C.muted, fontSize: 11 }}>{f.email}</div>
              </div>
              <StatusBadge s={f.cert_status} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted, marginBottom: 8 }}>
              <span><strong style={{ color: C.navy }}>{f.cohorts_total}</strong> cohorts</span>
              <span><strong style={{ color: C.navy }}>{f.participants_served}</strong> served</span>
              <span>Rating: <strong style={{ color: C.navy }}>{f.avg_outcome_rating ?? '—'}</strong></span>
            </div>
            <button onClick={() => setSelected(f)} style={{ ...btn(C.navy, '#fff', true) }}>View Reports</button>
          </div>
        ))}
      </div>

      {selected && <CohortReportsModal fac={selected} orgId={orgId} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── Section 3: Generate Org Report PDF ── */
const PERIOD_OPTIONS = [
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year',    label: 'This Year'    },
  { id: 'all',     label: 'All Time'     },
  { id: 'custom',  label: 'Custom Range' },
] as const;
type PeriodId = typeof PERIOD_OPTIONS[number]['id'];

function GenerateOrgReport({ orgId }: { orgId: string }) {
  const [period,    setPeriod]    = useState<PeriodId>('quarter');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');
  const [url,       setUrl]       = useState('');
  const linkRef                   = useRef<HTMLAnchorElement>(null);

  async function generate() {
    setLoading(true); setErr(''); setUrl('');
    const now = new Date();
    let from = '';
    let to   = now.toISOString().slice(0, 10);

    if (period === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      from = qStart.toISOString().slice(0, 10);
    } else if (period === 'year') {
      from = `${now.getFullYear()}-01-01`;
    } else if (period === 'all') {
      from = '2020-01-01';
    } else {
      from = dateFrom; to = dateTo;
    }

    if (!from || !to) { setErr('Please set both dates.'); setLoading(false); return; }

    try {
      const r = await fetch('/api/org/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, date_from: from, date_to: to }),
        credentials: 'include',
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setErr(d.error ?? 'Generation failed.'); }
      else {
        setUrl(d.url);
        // Auto-trigger download
        setTimeout(() => linkRef.current?.click(), 100);
      }
    } catch (e) { setErr(String(e)); }
    setLoading(false);
  }

  return (
    <div style={{ ...card }}>
      <h2 style={sectionTitle}>Generate Organization Report</h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {PERIOD_OPTIONS.map(p => (
          <button key={p.id} onClick={() => { setPeriod(p.id); setUrl(''); }}
            style={{
              ...btn(period === p.id ? C.navy : C.bg, period === p.id ? '#fff' : C.navy, true),
              border: `1px solid ${period === p.id ? C.navy : C.border}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 3 }}>FROM</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 3 }}>TO</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: 'Inter, sans-serif' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={generate} disabled={loading} style={{
          ...btn(loading ? C.muted : C.gold),
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Generating…' : '📊 Generate & Download PDF'}
        </button>
        {err && <span style={{ color: C.danger, fontSize: 13 }}>{err}</span>}
        {url && (
          <a href={url} ref={linkRef} target="_blank" rel="noopener noreferrer"
             style={{ color: C.success, fontSize: 13, fontWeight: 600 }}>
            ✅ Report ready — click to download
          </a>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
        Generates a branded Tri-Pillars™ PDF stored in Supabase Storage. Download begins automatically.
      </div>
    </div>
  );
}

/* ── Section 4: Download all cohort PDFs as ZIP ── */
function DownloadAllReports({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [msg,     setMsg]     = useState('');

  async function downloadZip() {
    setLoading(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/org/reports-zip?org_id=${orgId}`, { credentials: 'include' });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error ?? `Error ${r.status}`);
        setLoading(false);
        return;
      }
      const contentType = r.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const d = await r.json();
        if (d.count === 0) { setMsg('No cohort reports exist yet.'); setLoading(false); return; }
      }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${orgId}-cohort-reports.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg('Download started.');
    } catch (e) { setErr(String(e)); }
    setLoading(false);
  }

  return (
    <div style={{ ...card, background: C.navy, border: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>
            Download All Cohort Reports
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: 'rgba(255,255,255,.65)', margin: 0 }}>
            All PDF cohort summaries for your organization in one ZIP file.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button onClick={downloadZip} disabled={loading} style={{
            ...btn(loading ? '#555' : C.gold), cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Preparing ZIP…' : '↓ Download All PDFs (ZIP)'}
          </button>
          {err && <span style={{ color: '#ff9999', fontSize: 12 }}>{err}</span>}
          {msg && <span style={{ color: '#aaffaa', fontSize: 12 }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Org header (license banner) ── */
function OrgHeader({ org }: { org: Org }) {
  const renewal  = org.license_renewal ? new Date(org.license_renewal) : null;
  const daysLeft = renewal ? Math.ceil((renewal.getTime() - Date.now()) / 86400000) : null;
  const expired  = org.license_status === 'expired' || (daysLeft !== null && daysLeft <= 0);
  const warnSoon = !expired && daysLeft !== null && daysLeft <= 60;

  return (
    <div style={{ ...card, borderLeft: `4px solid ${expired ? C.danger : warnSoon ? C.warn : C.gold}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: C.navy }}>
            {org.name}
          </div>
          {org.type && (
            <div style={{ fontSize: '0.8rem', color: C.muted, marginTop: 2 }}>
              {org.type.replace(/_/g, ' ')}
              {org.contact_name ? ` · ${org.contact_name}` : ''}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {org.license_status && <StatusBadge s={expired ? 'expired' : org.license_status} />}
          {daysLeft != null && !expired && (
            <div style={{ fontSize: '0.75rem', color: warnSoon ? C.warn : C.muted, marginTop: 4, fontWeight: warnSoon ? 700 : 400 }}>
              {warnSoon ? `⚠️ Renewal in ${daysLeft} days` : `Renews in ${daysLeft} days`}
            </div>
          )}
          {expired && (
            <div style={{ fontSize: '0.75rem', color: C.danger, marginTop: 4, fontWeight: 700 }}>
              License expired — contact wayne@tripillarstudio.com
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Announcements ── */
function AnnouncementsCard({ announcements, seenKey }: { announcements: Announcement[]; seenKey: string }) {
  const [seen,     setSeen]     = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey) ?? '[]')); } catch { return new Set(); }
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  function markSeen(id: string) {
    const next = new Set(seen).add(id);
    setSeen(next);
    localStorage.setItem(seenKey, JSON.stringify([...next]));
  }

  const unseen = announcements.filter(a => !seen.has(a.id));
  const pinned = announcements.filter(a => a.pinned);
  const visible = [...new Map([...pinned, ...unseen].map(a => [a.id, a])).values()].slice(0, 3);

  if (visible.length === 0) return null;
  return (
    <div style={{ ...card, borderLeft: `4px solid ${C.gold}` }}>
      <h2 style={sectionTitle}>📢 Announcements</h2>
      {visible.map(a => (
        <div key={a.id} style={{ marginBottom: 12, paddingBottom: 12,
          borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600, color: C.navy, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              {a.pinned && '📌 '}{a.title}
            </div>
            {!seen.has(a.id) && (
              <span style={{ background: C.gold + '20', color: C.gold,
                fontSize: 10, fontWeight: 700, padding: '2px 7px',
                borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 8 }}>NEW</span>
            )}
          </div>
          {expanded === a.id
            ? <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>{a.body}</div>
            : <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{a.body.slice(0, 100)}{a.body.length > 100 ? '…' : ''}</div>
          }
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <button onClick={() => { setExpanded(expanded === a.id ? null : a.id); markSeen(a.id); }}
              style={{ background: 'none', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {expanded === a.id ? 'Collapse' : 'Read more'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main export ── */
export default function OrgDashboard() {
  const router = useRouter();

  const [org,           setOrg]           = useState<Org | null>(null);
  const [facilitators,  setFacilitators]  = useState<Facilitator[]>([]);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [orgReport,     setOrgReport]     = useState<OrgReport | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/org/dashboard');
    if (res.status === 401) { router.replace('/facilitators/login?reason=session'); return; }
    if (res.status === 403 || !res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Access denied.');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrg(data.org);
    setFacilitators(data.facilitators ?? []);
    setStats(data.stats);
    setAnnouncements(data.announcements ?? []);

    // Fetch org-scoped report data for sections 1 & 2
    if (data.org?.id) {
      const rr = await fetch(`/api/reports/organization/${data.org.id}`).catch(() => null);
      if (rr?.ok) {
        const rd = await rr.json();
        setOrgReport(rd);
      }
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    router.replace('/facilitators/login');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', color: C.muted }}>Loading…</div>
  );

  if (error || !org) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{ color: C.danger, marginBottom: '1rem', fontSize: '0.95rem' }}>{error || 'Organization not found.'}</p>
        <button onClick={() => router.replace('/facilitators/login')} style={btn(C.navy)}>Return to Login</button>
      </div>
    </div>
  );

  // Build FacBreakdown from org report OR fall back to local facilitator data
  const breakdown: FacBreakdown[] = orgReport?.breakdown?.length
    ? orgReport.breakdown
    : facilitators.map(f => ({
        facilitator_id:       f.id,
        name:                 f.full_name,
        email:                f.email,
        cert_status:          f.cert_status,
        cohorts_total:        f.cohorts.length,
        cohorts_completed:    f.cohorts.filter(c => c.status === 'completed').length,
        participants_enrolled: f.cohorts.reduce((s, c) => s + (c.participant_count ?? 0), 0),
        participants_served:   f.cohorts.reduce((s, c) => s + (c.participant_count ?? 0), 0),
        completion_rate:       null,
        avg_outcome_rating:    null,
      }));

  // Build impact from org report OR compute from breakdown
  const impact: OrgReport['impact'] = orgReport?.impact ?? {
    total_cohorts:      breakdown.reduce((s, f) => s + f.cohorts_total, 0),
    total_participants: breakdown.reduce((s, f) => s + f.participants_served, 0),
    avg_completion_rate: (() => {
      const rated = breakdown.filter(f => f.completion_rate != null);
      if (!rated.length) return null;
      return Math.round(rated.reduce((s, f) => s + f.completion_rate!, 0) / rated.length);
    })(),
    avg_outcome_rating: (() => {
      const rated = breakdown.filter(f => f.avg_outcome_rating != null);
      if (!rated.length) return null;
      return Math.round(rated.reduce((s, f) => s + f.avg_outcome_rating!, 0) / rated.length * 10) / 10;
    })(),
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={FONT_LINK} rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 640px) {
          .desktop-table { display: none !important; }
          .mobile-list   { display: block !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
        {/* Topbar */}
        <div style={{
          background: C.navy, height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.25rem', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontWeight: 700, fontSize: '1.05rem' }}>
            Live and Grieve™ — Organization Portal
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.open('/api/org/export', '_blank')}
              style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>
              ↓ Export CSV
            </button>
            <button onClick={logout} style={{ ...btn('rgba(255,255,255,.1)', '#fff', true) }}>
              Log out
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1.25rem' }}>

          {/* Section 0: Org header + license banner */}
          <OrgHeader org={org} />

          {/* Announcements */}
          <AnnouncementsCard announcements={announcements} seenKey={`lg-org-seen-${org.id}`} />

          {/* Section 1: Organization Impact Summary */}
          <ImpactSummary impact={impact} orgStats={stats} />

          {/* Section 2: Facilitator Breakdown */}
          <FacilitatorBreakdown breakdown={breakdown} orgId={org.id} />

          {/* Section 3: Generate Org Report PDF */}
          <GenerateOrgReport orgId={org.id} />

          {/* Section 4: Download all PDFs as ZIP */}
          <DownloadAllReports orgId={org.id} />

        </div>
      </div>
    </>
  );
}
