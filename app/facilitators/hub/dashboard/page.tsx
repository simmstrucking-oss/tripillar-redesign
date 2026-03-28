'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

/* ── Fonts ── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

/* ── Design tokens ── */
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

const inp: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
  background: C.white, boxSizing: 'border-box', color: C.navy,
};

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: C.navy, marginBottom: 4, fontFamily: 'Inter, sans-serif',
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

const btn = (bg: string, fg = '#fff', sm = false): React.CSSProperties => ({
  background: bg, color: fg, border: 'none', borderRadius: 6,
  padding: sm ? '0.35rem 0.85rem' : '0.6rem 1.25rem',
  fontSize: sm ? '0.8rem' : '0.875rem', fontWeight: 600,
  fontFamily: 'Inter, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' as const,
});

/* ── Types ── */
interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  phone?: string; role: string; cert_id: string; cert_status: string;
  cert_issued: string; cert_renewal: string; books_certified?: number[];
  kit_subscriber_id?: string; organization_id?: string;
  organizations?: { name: string; type?: string; license_status?: string };
}

interface Document {
  id: string; title: string; description?: string; category?: string;
  book_number?: number; file_size?: string; signed_url: string | null; sort_order?: number;
}

interface Cohort {
  id: string; book_number: number; start_date: string; end_date?: string;
  participant_count?: number; status: string; notes?: string;
}

interface Announcement {
  id: string; title: string; body: string; published_at?: string; pinned?: boolean;
}

/* ── Cert status banner ── */
function CertBanner({ status, renewal }: { status: string; renewal: string }) {
  const daysLeft = Math.ceil((new Date(renewal).getTime() - Date.now()) / 86400000);
  if (status === 'active' && daysLeft > 60) return null;

  const [bg, color, msg] =
    status === 'expired'           ? [C.danger + '18', C.danger, `Your certification expired on ${renewal}. Please contact wayne@tripillarstudio.com to renew.`]
    : daysLeft <= 30               ? [C.danger + '18', C.danger, `Certification expires in ${daysLeft} days (${renewal}). Renewal required soon.`]
    : daysLeft <= 60               ? [C.warn   + '18', C.warn,   `Certification renewal approaching — expires ${renewal} (${daysLeft} days).`]
    : status === 'pending_renewal' ? [C.warn   + '18', C.warn,   'Your certification renewal is pending. Check your email for instructions.']
    :                                [C.muted  + '18', C.muted,  `Certification status: ${status}`];

  return (
    <div style={{ background: bg, border: `1px solid ${color}40`, borderRadius: 8,
      padding: '0.85rem 1.1rem', marginBottom: '1.25rem',
      fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color, fontWeight: 500 }}>
      ⚠ {msg}
    </div>
  );
}

/* ── Cert card ── */
const BOOKS_MAP: Record<number, string> = {
  1: 'Understanding Grief', 2: 'The Grieving Body',
  3: 'Relationships and Grief', 4: 'Finding Meaning',
  5: 'Continuing Bonds', 6: 'Living Forward',
};

function CertCard({ profile }: { profile: Profile }) {
  const daysLeft  = Math.ceil((new Date(profile.cert_renewal).getTime() - Date.now()) / 86400000);
  const pct       = Math.max(0, Math.min(100, Math.round((daysLeft / 365) * 100)));
  const barColor  = daysLeft > 60 ? C.success : daysLeft > 30 ? C.warn : C.danger;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Certification</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          ['Cert ID',  <code key="c" style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: C.navy }}>{profile.cert_id}</code>],
          ['Status',   <StatusBadge key="s" s={profile.cert_status} />],
          ['Track',    profile.role.replace('_', ' ')],
          ['Issued',   profile.cert_issued],
          ['Renewal',  profile.cert_renewal],
          ['Org',      profile.organizations?.name ?? '—'],
        ].map(([k, v]) => (
          <div key={String(k)}>
            <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{k}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', color: C.navy, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Renewal progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem',
          color: C.muted, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
          <span>Time remaining</span>
          <span style={{ color: barColor, fontWeight: 600 }}>{daysLeft > 0 ? `${daysLeft} days` : 'Expired'}</span>
        </div>
        <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{ background: barColor, width: `${pct}%`, height: '100%',
            borderRadius: 99, transition: 'width .5s ease' }} />
        </div>
      </div>

      {/* Books certified */}
      {(profile.books_certified?.length ?? 0) > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
            Books Certified to Facilitate
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.books_certified!.sort().map(b => (
              <span key={b} style={{ background: C.goldLt, color: C.gold, border: `1px solid ${C.gold}40`,
                borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem',
                fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                Book {b} — {BOOKS_MAP[b] ?? ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success : s === 'pending_renewal' ? C.warn
    : s === 'expired' ? C.danger : C.muted;
  return (
    <span style={{ background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
      fontWeight: 600, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {s.replace('_', ' ')}
    </span>
  );
}

/* ── Announcements ── */
function AnnouncementsCard({ announcements }: { announcements: Announcement[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (announcements.length === 0) return null;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Announcements</h2>
      {announcements.map(a => (
        <div key={a.id} style={{
          borderLeft: `3px solid ${a.pinned ? C.gold : C.border}`,
          paddingLeft: '1rem', marginBottom: '1rem',
          paddingBottom: a.id === announcements[announcements.length - 1].id ? 0 : '1rem',
          borderBottom: a.id === announcements[announcements.length - 1].id ? 'none' : `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              {a.pinned && (
                <span style={{ fontSize: '0.7rem', color: C.gold, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  fontFamily: 'Inter, sans-serif', marginRight: 8 }}>📌 Pinned</span>
              )}
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                color: C.navy, fontSize: '0.95rem' }}>{a.title}</span>
            </div>
            {a.published_at && (
              <span style={{ fontSize: '0.75rem', color: C.muted,
                fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {new Date(a.published_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.muted,
            marginTop: 6, lineHeight: 1.6,
            maxHeight: expanded === a.id ? 'none' : '3.2em',
            overflow: 'hidden',
          }}>
            {a.body}
          </div>
          {a.body.length > 120 && (
            <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              style={{ background: 'none', border: 'none', color: C.gold,
                fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                fontWeight: 600, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}>
              {expanded === a.id ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Documents ── */
const DOC_CATEGORIES = ['All', 'Training', 'Facilitation Guide', 'Marketing', 'Forms', 'Reference'];

function DocumentsCard({ documents }: { documents: Document[] }) {
  const [catFilter, setCatFilter] = useState('All');
  const [bookFilter, setBookFilter] = useState(0);

  const filtered = documents.filter(d => {
    if (catFilter !== 'All' && d.category !== catFilter) return false;
    if (bookFilter > 0 && d.book_number !== bookFilter) return false;
    return true;
  });

  const categories = ['All', ...Array.from(new Set(documents.map(d => d.category).filter(Boolean))) as string[]];
  const books = Array.from(new Set(documents.map(d => d.book_number).filter(Boolean))).sort() as number[];

  async function download(doc: Document) {
    // Re-fetch to get a fresh signed URL
    const res  = await fetch('/api/hub/documents');
    const data = await res.json();
    const fresh = (data.documents ?? []).find((d: Document) => d.id === doc.id);
    const url  = fresh?.signed_url;
    if (url) window.open(url, '_blank');
    else alert('Download link unavailable. Please refresh and try again.');
  }

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Documents & Resources</h2>

      {documents.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
          No documents available yet. Check back soon.
        </p>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{
                ...btn(catFilter === c ? C.navy : C.bg, catFilter === c ? '#fff' : C.muted, true),
                border: `1px solid ${catFilter === c ? C.navy : C.border}`,
              }}>{c}</button>
            ))}
            {books.length > 0 && (
              <select value={bookFilter} onChange={e => setBookFilter(Number(e.target.value))}
                style={{ ...inp, width: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                <option value={0}>All Books</option>
                {books.map(b => <option key={b} value={b}>Book {b}</option>)}
              </select>
            )}
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
              No documents match that filter.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {filtered.map(doc => (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.bg,
                  gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                      color: C.navy, fontSize: '0.9rem', marginBottom: 2 }}>
                      {doc.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {doc.category && (
                        <span style={{ fontSize: '0.72rem', color: C.muted,
                          fontFamily: 'Inter, sans-serif', background: C.border,
                          borderRadius: 10, padding: '1px 8px' }}>
                          {doc.category}
                        </span>
                      )}
                      {doc.book_number && (
                        <span style={{ fontSize: '0.72rem', color: C.gold,
                          fontFamily: 'Inter, sans-serif', background: C.goldLt,
                          borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>
                          Book {doc.book_number}
                        </span>
                      )}
                      {doc.description && (
                        <span style={{ fontSize: '0.8rem', color: C.muted,
                          fontFamily: 'Inter, sans-serif' }}>
                          {doc.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {doc.file_size && (
                      <span style={{ fontSize: '0.75rem', color: C.muted,
                        fontFamily: 'Inter, sans-serif' }}>{doc.file_size}</span>
                    )}
                    <button onClick={() => download(doc)}
                      disabled={!doc.signed_url}
                      style={{ ...btn(doc.signed_url ? C.navy : C.muted, '#fff', true),
                        opacity: doc.signed_url ? 1 : 0.5 }}>
                      ↓ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Cohorts ── */
function CohortsCard({ cohorts, onAdded }: { cohorts: Cohort[]; onAdded: () => void }) {
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState('');
  const [form, setForm] = useState({
    book_number: '', start_date: '', end_date: '',
    participant_count: '', notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const res = await fetch('/api/hub/cohorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setMsg('Cohort logged.');
      setForm({ book_number: '', start_date: '', end_date: '', participant_count: '', notes: '' });
      setShowForm(false);
      onAdded();
    } else {
      const d = await res.json();
      setMsg('Error: ' + d.error);
    }
  }

  const active   = cohorts.filter(c => c.status === 'active');
  const completed = cohorts.filter(c => c.status !== 'active');

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ ...sectionTitle, margin: 0 }}>My Cohorts</h2>
        <button onClick={() => setShowForm(s => !s)} style={btn(C.gold, '#fff', true)}>
          {showForm ? 'Cancel' : '+ Log Cohort'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{
          background: C.bg, borderRadius: 8, padding: '1rem',
          marginBottom: '1.25rem', border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={fieldLabel}>Book *</label>
              <select style={inp} value={form.book_number} onChange={e => set('book_number', e.target.value)} required>
                <option value="">— Select —</option>
                {[1,2,3,4,5,6].map(b => <option key={b} value={b}>Book {b} — {BOOKS_MAP[b]}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Start Date *</label>
              <input type="date" style={inp} value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
            </div>
            <div>
              <label style={fieldLabel}>End Date</label>
              <input type="date" style={inp} value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel}>Participants</label>
              <input type="number" min="1" style={inp} value={form.participant_count}
                onChange={e => set('participant_count', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>Notes</label>
            <textarea style={{ ...inp, height: 60, resize: 'vertical' }}
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          {msg && <p style={{ fontSize: '0.8rem', color: msg.startsWith('Error') ? C.danger : C.success,
            margin: '0 0 0.5rem', fontFamily: 'Inter, sans-serif' }}>{msg}</p>}
          <button type="submit" disabled={loading} style={btn(C.navy, '#fff', true)}>
            {loading ? 'Saving…' : 'Save Cohort'}
          </button>
        </form>
      )}

      {cohorts.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
          No cohorts logged yet. Use "Log Cohort" to record your first group.
        </p>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Active</div>
              {active.map(c => <CohortRow key={c.id} c={c} />)}
            </>
          )}
          {completed.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                fontFamily: 'Inter, sans-serif', margin: '1rem 0 8px' }}>Completed</div>
              {completed.map(c => <CohortRow key={c.id} c={c} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

function CohortRow({ c }: { c: Cohort }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
      gap: 8, padding: '0.65rem 0.85rem', borderRadius: 7,
      border: `1px solid ${C.border}`, background: C.bg, marginBottom: 8 }}>
      <div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: C.navy, fontSize: '0.875rem' }}>
          Book {c.book_number} — {BOOKS_MAP[c.book_number] ?? ''}
        </span>
        {c.notes && (
          <span style={{ fontFamily: 'Inter, sans-serif', color: C.muted, fontSize: '0.8rem', marginLeft: 8 }}>
            {c.notes}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
          {c.start_date}{c.end_date ? ` → ${c.end_date}` : ''}
        </span>
        {c.participant_count && (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
            {c.participant_count} participants
          </span>
        )}
        <StatusBadge s={c.status} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT DASHBOARD
═════════════════════════════════════════════════════════════*/
type Tab = 'overview' | 'documents' | 'cohorts';

export default function HubDashboard() {
  const router = useRouter();

  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [documents,     setDocuments]     = useState<Document[]>([]);
  const [cohorts,       setCohorts]       = useState<Cohort[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab,           setTab]           = useState<Tab>('overview');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  const loadHub = useCallback(async () => {
    const [profRes, docsRes, cohortsRes] = await Promise.all([
      fetch('/api/hub/profile'),
      fetch('/api/hub/documents'),
      fetch('/api/hub/cohorts'),
    ]);

    if (profRes.status === 401) { router.replace('/facilitators/login?reason=session'); return; }

    const [profData, docsData, cohortData] = await Promise.all([
      profRes.json(), docsRes.json(), cohortsRes.json(),
    ]);

    if (profData.profile)           setProfile(profData.profile);
    else                            setError(profData.error ?? 'Failed to load profile');
    if (docsData.documents)         setDocuments(docsData.documents);
    if (cohortData.cohorts)         setCohorts(cohortData.cohorts);
    if (cohortData.announcements)   setAnnouncements(cohortData.announcements);

    setLoading(false);
  }, [router]);

  useEffect(() => { loadHub(); }, [loadHub]);

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    router.replace('/facilitators/login');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: C.muted }}>
      Loading…
    </div>
  );

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', color: C.danger }}>
        <p style={{ marginBottom: '1rem' }}>{error || 'Profile not found.'}</p>
        <button onClick={() => router.replace('/facilitators/login')} style={btn(C.navy)}>
          Return to Login
        </button>
      </div>
    </div>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={FONT_LINK} rel="stylesheet" />

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
        {/* Topbar */}
        <div style={{ background: C.navy, height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 1.25rem',
          position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold,
              fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
              Live and Grieve™
            </span>
            <span style={{ color: 'rgba(255,255,255,.4)', display: 'none' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '0.875rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name}
            </span>
          </div>
          <button onClick={logout} style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>
            Log out
          </button>
        </div>

        {/* Tabs */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`,
          display: 'flex', padding: '0 1.25rem', position: 'sticky', top: 58, zIndex: 99 }}>
          {(['overview', 'documents', 'cohorts'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
              padding: '0.85rem 1rem', textTransform: 'capitalize',
              borderBottom: tab === t ? `3px solid ${C.gold}` : '3px solid transparent',
              color: tab === t ? C.navy : C.muted,
            }}>{t === 'overview' ? 'Overview' : t === 'documents' ? 'Documents' : 'My Cohorts'}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
          <CertBanner status={profile.cert_status} renewal={profile.cert_renewal} />

          {tab === 'overview' && (
            <>
              <AnnouncementsCard announcements={announcements} />
              <CertCard profile={profile} />
            </>
          )}
          {tab === 'documents' && (
            <DocumentsCard documents={documents} />
          )}
          {tab === 'cohorts' && (
            <CohortsCard cohorts={cohorts} onAdded={loadHub} />
          )}
        </div>
      </div>
    </>
  );
}
