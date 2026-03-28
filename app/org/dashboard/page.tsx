'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

const C = {
  navy:   '#2D3142',
  gold:   '#B8942F',
  goldLt: '#F5EDD5',
  bg:     '#F5F4F0',
  white:  '#FFFFFF',
  border: '#DDD9D0',
  muted:  '#6B7280',
  danger: '#DC2626',
  success:'#16A34A',
  warn:   '#D97706',
};

const card: React.CSSProperties = {
  background: C.white, borderRadius: 10, border: `1px solid ${C.border}`,
  padding: '1.5rem', marginBottom: '1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Playfair Display, serif', fontSize: '1.2rem',
  color: C.navy, fontWeight: 700, margin: '0 0 1rem',
};

const btn = (bg: string, fg = '#fff', sm = false): React.CSSProperties => ({
  background: bg, color: fg, border: 'none', borderRadius: 6,
  padding: sm ? '0.35rem 0.85rem' : '0.6rem 1.25rem',
  fontSize: sm ? '0.8rem' : '0.875rem', fontWeight: 600,
  fontFamily: 'Inter, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' as const,
});

/* ── Types ── */
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

/* ── Helpers ── */
const BOOKS_MAP: Record<number, string> = {
  1: 'Understanding Grief', 2: 'The Grieving Body',
  3: 'Relationships and Grief', 4: 'Finding Meaning',
  5: 'Continuing Bonds', 6: 'Living Forward',
};

function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success
    : s === 'pending_renewal' ? C.warn
    : s === 'expired' ? C.danger : C.muted;
  return (
    <span style={{ background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
      fontWeight: 600, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {s.replace('_', ' ')}
    </span>
  );
}

/* ── Section 1: Org header + license banner ── */
function OrgHeader({ org }: { org: Org }) {
  const renewal  = org.license_renewal ? new Date(org.license_renewal) : null;
  const daysLeft = renewal ? Math.ceil((renewal.getTime() - Date.now()) / 86400000) : null;
  const expired  = org.license_status === 'expired' || (daysLeft !== null && daysLeft <= 0);
  const warnSoon = !expired && daysLeft !== null && daysLeft <= 60;

  return (
    <>
      {expired && (
        <div style={{ background: C.danger + '18', border: `1px solid ${C.danger}40`,
          borderRadius: 8, padding: '0.85rem 1.1rem', marginBottom: '1.25rem',
          fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.danger, fontWeight: 500 }}>
          ⛔ Your organization's license has expired. Facilitator access may be restricted.
          Contact <a href="mailto:wayne@tripillarstudio.com" style={{ color: C.danger, fontWeight: 700 }}>
            wayne@tripillarstudio.com
          </a> to renew.
        </div>
      )}
      {warnSoon && !expired && (
        <div style={{ background: C.warn + '18', border: `1px solid ${C.warn}40`,
          borderRadius: 8, padding: '0.85rem 1.1rem', marginBottom: '1.25rem',
          fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.warn, fontWeight: 500 }}>
          ⚠ Organization license renews on {org.license_renewal} ({daysLeft} days).
          Contact <a href="mailto:wayne@tripillarstudio.com" style={{ color: C.warn, fontWeight: 700 }}>
            wayne@tripillarstudio.com
          </a> to arrange renewal.
        </div>
      )}

      <div style={{ ...card, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem',
              color: C.navy, fontWeight: 700, margin: '0 0 0.4rem' }}>
              {org.name}
            </h1>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {org.type && (
                <span style={{ fontSize: '0.8rem', color: C.muted,
                  fontFamily: 'Inter, sans-serif' }}>{org.type}</span>
              )}
              {org.license_status && <StatusBadge s={org.license_status} />}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0.25rem 1.25rem',
            fontFamily: 'Inter, sans-serif', fontSize: '0.825rem' }}>
            {org.license_type && (
              <><span style={{ color: C.muted, fontWeight: 600 }}>License</span>
                <span style={{ color: C.navy }}>{org.license_type}</span></>
            )}
            {org.license_renewal && (
              <><span style={{ color: C.muted, fontWeight: 600 }}>Renewal</span>
                <span style={{ color: C.navy }}>{org.license_renewal}</span></>
            )}
            {org.contact_name && (
              <><span style={{ color: C.muted, fontWeight: 600 }}>Contact</span>
                <span style={{ color: C.navy }}>{org.contact_name}</span></>
            )}
            {org.contact_email && (
              <><span style={{ color: C.muted, fontWeight: 600 }}>Email</span>
                <a href={`mailto:${org.contact_email}`} style={{ color: C.navy }}>{org.contact_email}</a></>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Section 3: Aggregate stats ── */
function StatsGrid({ stats }: { stats: Stats }) {
  const tiles = [
    { label: 'Total Facilitators',  value: stats.totalFacilitators,  color: C.navy },
    { label: 'Active Certifications', value: stats.activeFacilitators, color: C.success },
    { label: 'Inactive / Expired',  value: stats.inactiveFacilitators, color: C.muted },
    { label: 'Total Cohorts Run',   value: stats.totalCohorts,        color: C.gold },
    { label: 'Total Participants',  value: stats.totalParticipants,   color: C.navy },
    { label: 'Books in Progress',   value: stats.booksInProgress.length > 0
        ? stats.booksInProgress.map(b => `Bk ${b}`).join(', ')
        : 'None', color: C.warn, small: true },
  ];

  return (
    <div style={{ ...card }}>
      <h2 style={sectionTitle}>Organization Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {tiles.map(t => (
          <div key={t.label} style={{ background: C.bg, borderRadius: 8,
            border: `1px solid ${C.border}`, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Inter, sans-serif',
              fontSize: t.small ? '1rem' : '1.75rem',
              fontWeight: 700, color: t.color, lineHeight: 1.2 }}>
              {t.value}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
              color: C.muted, marginTop: 4, textTransform: 'uppercase',
              letterSpacing: '0.04em', fontWeight: 600 }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* Books breakdown */}
      {Object.keys(stats.bookCounts).length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
            Cohorts by Book
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(stats.bookCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([bk, cnt]) => (
              <div key={bk} style={{ background: C.goldLt, border: `1px solid ${C.gold}40`,
                borderRadius: 8, padding: '0.5rem 0.9rem', fontFamily: 'Inter, sans-serif' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.navy }}>Book {bk}</span>
                <span style={{ fontSize: '0.75rem', color: C.muted, marginLeft: 6 }}>{cnt} cohort{cnt !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section 2: Facilitator roster + read-only profile modal ── */
function FacilitatorModal({ f, onClose }: { f: Facilitator; onClose: () => void }) {
  const totalCohorts      = f.cohorts.length;
  const totalParticipants = f.cohorts.reduce((s, c) => s + (c.participant_count ?? 0), 0);
  const activeCohorts     = f.cohorts.filter(c => c.status === 'active');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.white, borderRadius: 12, padding: '2rem',
        width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,.2)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem',
              color: C.navy, margin: '0 0 4px', fontWeight: 700 }}>{f.full_name}</h2>
            <p style={{ color: C.muted, fontSize: '0.85rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {f.email}{f.phone ? ` · ${f.phone}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
            fontSize: '1.5rem', cursor: 'pointer', color: C.muted, lineHeight: 1 }}>×</button>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem',
          fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {([
            ['Cert ID',     <code key="c" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{f.cert_id}</code>],
            ['Status',      <StatusBadge key="s" s={f.cert_status} />],
            ['Track',       f.role.replace('_', ' ')],
            ['Renewal',     f.cert_renewal],
            ['Issued',      f.cert_issued],
            ['Last Active', f.last_active ? new Date(f.last_active).toLocaleDateString() : 'Never'],
            ['Cohorts Run', totalCohorts],
            ['Participants',totalParticipants],
          ] as [string, React.ReactNode][]).map(([k, v]) => (
            <div key={k}>
              <div style={{ color: C.muted, fontSize: '0.72rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{k}</div>
              <div style={{ color: C.navy, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Books */}
        {(f.books_certified?.length ?? 0) > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Books Certified</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {f.books_certified!.sort().map(b => (
                <span key={b} style={{ background: C.goldLt, color: C.gold,
                  border: `1px solid ${C.gold}40`, borderRadius: 20,
                  padding: '2px 10px', fontSize: '0.75rem',
                  fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  Book {b} — {BOOKS_MAP[b] ?? ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active cohorts */}
        {activeCohorts.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Active Cohorts</div>
            {activeCohorts.map(c => (
              <div key={c.id} style={{ background: C.bg, borderRadius: 7,
                border: `1px solid ${C.border}`, padding: '0.6rem 0.85rem',
                marginBottom: 6, fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: C.navy }}>Book {c.book_number}</span>
                <span style={{ color: C.muted, marginLeft: 10 }}>{c.start_date}</span>
                {c.participant_count && (
                  <span style={{ color: C.muted, marginLeft: 10 }}>{c.participant_count} participants</span>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
          color: C.muted, marginTop: '1.25rem', fontStyle: 'italic' }}>
          Read-only view. Contact wayne@tripillarstudio.com to update facilitator records.
        </p>
      </div>
    </div>
  );
}

function FacilitatorRoster({ facilitators }: { facilitators: Facilitator[] }) {
  const [q,        setQ]        = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [selected, setSelected] = useState<Facilitator | null>(null);

  const filtered = facilitators.filter(f => {
    const matchQ = !q || f.full_name.toLowerCase().includes(q.toLowerCase())
                      || f.email.toLowerCase().includes(q.toLowerCase());
    const matchS = !statusF || f.cert_status === statusF;
    return matchQ && matchS;
  });

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Facilitator Roster ({facilitators.length})</h2>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input placeholder="Search name or email…" value={q}
          onChange={e => setQ(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: `1px solid ${C.border}`,
            borderRadius: 6, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
            flex: '1 1 200px', maxWidth: 300, color: C.navy, background: C.white }} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: `1px solid ${C.border}`,
            borderRadius: 6, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
            color: C.navy, background: C.white }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_renewal">Pending Renewal</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif' }}>No facilitators match that filter.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse',
              fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                  {['Name', 'Status', 'Certified Books', 'Cohorts', 'Participants', 'Last Active', ''].map(h => (
                    <th key={h} style={{ padding: '0.55rem 0.75rem', textAlign: 'left',
                      color: C.navy, fontWeight: 700, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const totalC = f.cohorts.length;
                  const totalP = f.cohorts.reduce((s, c) => s + (c.participant_count ?? 0), 0);
                  return (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                      onClick={() => setSelected(f)}
                      onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ fontWeight: 600, color: C.navy }}>{f.full_name}</div>
                        <div style={{ fontSize: '0.78rem', color: C.muted }}>{f.email}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}><StatusBadge s={f.cert_status} /></td>
                      <td style={{ padding: '0.65rem 0.75rem', color: C.muted }}>
                        {(f.books_certified?.length ?? 0) > 0
                          ? f.books_certified!.sort().map(b => `Bk ${b}`).join(', ')
                          : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: C.navy, fontWeight: 600 }}>{totalC}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: C.navy, fontWeight: 600 }}>{totalP || '—'}</td>
                      <td style={{ padding: '0.65rem 0.75rem', color: C.muted, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                        {f.last_active ? new Date(f.last_active).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ color: C.gold, fontWeight: 600, fontSize: '0.8rem' }}>View →</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div style={{ display: 'none' }} className="mobile-list">
            {filtered.map(f => {
              const totalC = f.cohorts.length;
              return (
                <div key={f.id} onClick={() => setSelected(f)} style={{
                  border: `1px solid ${C.border}`, borderRadius: 8, padding: '1rem',
                  marginBottom: '0.75rem', cursor: 'pointer', background: C.bg }}>
                  <div style={{ fontWeight: 700, color: C.navy, fontFamily: 'Inter, sans-serif' }}>{f.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: C.muted, fontFamily: 'Inter, sans-serif', margin: '2px 0 6px' }}>{f.email}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge s={f.cert_status} />
                    <span style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'Inter, sans-serif' }}>{totalC} cohort{totalC !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selected && <FacilitatorModal f={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── Announcements strip ── */
function AnnouncementsCard({ announcements, seenKey }: { announcements: Announcement[]; seenKey: string }) {
  const [seen, setSeen] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey) ?? '[]')); }
    catch { return new Set(); }
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  function markSeen(id: string) {
    const next = new Set(seen).add(id);
    setSeen(next);
    try { localStorage.setItem(seenKey, JSON.stringify([...next])); } catch { /* ignore */ }
  }

  if (announcements.length === 0) return null;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Announcements</h2>
      {announcements.map((a, i) => (
        <div key={a.id} onClick={() => markSeen(a.id)} style={{
          borderLeft: `3px solid ${a.pinned ? C.gold : C.border}`,
          paddingLeft: '1rem', paddingBottom: i < announcements.length - 1 ? '1rem' : 0,
          marginBottom: i < announcements.length - 1 ? '1rem' : 0,
          borderBottom: i < announcements.length - 1 ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {!seen.has(a.id) && (
                <span style={{ width: 8, height: 8, borderRadius: '50%',
                  background: C.gold, display: 'inline-block', flexShrink: 0 }} />
              )}
              {a.pinned && (
                <span style={{ fontSize: '0.7rem', color: C.gold, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  fontFamily: 'Inter, sans-serif' }}>📌 Pinned</span>
              )}
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                color: C.navy, fontSize: '0.95rem' }}>{a.title}</span>
            </div>
            {a.published_at && (
              <span style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {new Date(a.published_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
            color: C.muted, marginTop: 6, lineHeight: 1.6,
            maxHeight: expanded === a.id ? 'none' : '3.2em', overflow: 'hidden' }}>
            {a.body}
          </div>
          {a.body.length > 120 && (
            <button onClick={ev => { ev.stopPropagation(); setExpanded(expanded === a.id ? null : a.id); }}
              style={{ background: 'none', border: 'none', color: C.gold,
                fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
              {expanded === a.id ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Root page ── */
export default function OrgDashboard() {
  const router = useRouter();

  const [org,           setOrg]           = useState<Org | null>(null);
  const [facilitators,  setFacilitators]  = useState<Facilitator[]>([]);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/org/dashboard');
    if (res.status === 401) { router.replace('/facilitators/login?reason=session'); return; }
    if (res.status === 403) {
      const d = await res.json();
      setError(d.error ?? 'Access denied.');
      setLoading(false);
      return;
    }
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Failed to load dashboard.');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrg(data.org);
    setFacilitators(data.facilitators ?? []);
    setStats(data.stats);
    setAnnouncements(data.announcements ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    router.replace('/facilitators/login');
  }

  function downloadCSV() {
    window.open('/api/org/export', '_blank');
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
        <div style={{ background: C.navy, height: 58, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.25rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold,
            fontWeight: 700, fontSize: '1.05rem' }}>
            Live and Grieve™ — Organization Portal
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={downloadCSV} style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>
              ↓ Export CSV
            </button>
            <button onClick={logout} style={{ ...btn('rgba(255,255,255,.1)', '#fff', true) }}>
              Log out
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
          {/* Section 1: Org header + license banner */}
          <OrgHeader org={org} />

          {/* Announcements */}
          <AnnouncementsCard announcements={announcements} seenKey={`lg-org-seen-${org.id}`} />

          {/* Section 3: Stats */}
          {stats && <StatsGrid stats={stats} />}

          {/* Section 2: Facilitator roster */}
          <FacilitatorRoster facilitators={facilitators} />

          {/* Section 4: Export reminder */}
          <div style={{ ...card, background: C.navy, border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', color: C.gold,
                  fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>
                  Export Facilitator Data
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.825rem',
                  color: 'rgba(255,255,255,.65)', margin: 0 }}>
                  Download a CSV of all facilitators — name, email, cert status, renewal, books certified, cohorts run, last active.
                </p>
              </div>
              <button onClick={downloadCSV} style={btn(C.gold)}>
                ↓ Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
