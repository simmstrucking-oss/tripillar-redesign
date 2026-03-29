'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
interface AccessCode {
  id: string; code: string; status: string;
  redeemed_at?: string; redeemed_by_email?: string;
}
interface CodeBatch {
  id: string; book_number: number; batch_size: number;
  expires_at: string; created_at: string; notes?: string;
  cohort_id?: string;
  redeemed_count?: number;
  codes?: AccessCode[];
  _cohort_name?: string;
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

function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success : s === 'pending_renewal' ? C.warn
    : s === 'expired' ? C.danger : s === 'revoked' ? C.danger : s === 'redeemed' ? C.navy : C.muted;
  return (
    <span style={{ background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
      fontWeight: 600, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {s.replace('_', ' ')}
    </span>
  );
}

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

/* ── Announcements ── */
function AnnouncementsCard({ announcements }: { announcements: Announcement[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (announcements.length === 0) return null;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Announcements</h2>
      {announcements.map((a, idx) => (
        <div key={a.id} style={{
          borderLeft: `3px solid ${a.pinned ? C.gold : C.border}`,
          paddingLeft: '1rem', marginBottom: '1rem',
          paddingBottom: idx === announcements.length - 1 ? 0 : '1rem',
          borderBottom: idx === announcements.length - 1 ? 'none' : `1px solid ${C.border}`,
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
          }}>{a.body}</div>
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
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.bg, gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                      color: C.navy, fontSize: '0.9rem', marginBottom: 2 }}>{doc.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {doc.category && (
                        <span style={{ fontSize: '0.72rem', color: C.muted, fontFamily: 'Inter, sans-serif',
                          background: C.border, borderRadius: 10, padding: '1px 8px' }}>{doc.category}</span>
                      )}
                      {doc.book_number && (
                        <span style={{ fontSize: '0.72rem', color: C.gold, fontFamily: 'Inter, sans-serif',
                          background: C.goldLt, borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>
                          Book {doc.book_number}
                        </span>
                      )}
                      {doc.description && (
                        <span style={{ fontSize: '0.8rem', color: C.muted, fontFamily: 'Inter, sans-serif' }}>
                          {doc.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {doc.file_size && (
                      <span style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'Inter, sans-serif' }}>
                        {doc.file_size}
                      </span>
                    )}
                    <button onClick={() => download(doc)} disabled={!doc.signed_url}
                      style={{ ...btn(doc.signed_url ? C.navy : C.muted, '#fff', true),
                        opacity: doc.signed_url ? 1 : 0.5 }}>↓ Download</button>
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


/* ════════════════════════════════════════════════════════════
   COHORTS TAB  —  2A Pre-Program · 2B Session Logs · 2C Post-Program
═════════════════════════════════════════════════════════════*/

/* ── Types for cohort data ── */
interface SessionLog {
  id: string; cohort_id: string; week_number: number; session_date: string;
  session_duration_minutes?: number; participants_attended: number;
  group_composition_stable?: boolean; co_facilitated?: boolean;
  facilitator_confidence_rating?: number; notes?: string; critical_incident?: boolean;
}
interface CohortOutcome {
  id?: string;
  pre_participant_count?: number; pre_age_ranges?: Record<string, number>;
  pre_setting_type?: string; pre_community_type?: string;
  pre_primary_loss_types?: Record<string, number>; pre_time_since_loss?: string;
  pre_prior_support?: Record<string, number>; pre_submitted_at?: string;
  post_participant_count?: number; post_grief_intensity_rating?: number;
  post_connection_rating?: number; post_self_care_rating?: number;
  post_hope_rating?: number; post_facilitator_observations?: string;
  post_submitted_at?: string; completion_rate?: number;
}

/* ── Rating component (1–5) ── */
function StarRating({ value, onChange, label, hint }: {
  value: number; onChange: (v: number) => void; label: string; hint?: string;
}) {
  const SCALE = [
    '', '1 — No observable change',
    '2 — Slight improvement in some',
    '3 — Moderate improvement in most',
    '4 — Significant improvement in most',
    '5 — Remarkable improvement across the group',
  ];
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ ...fieldLabel, marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted, margin: '0 0 6px' }}>{hint}</p>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            style={{
              ...btn(value === n ? C.navy : C.bg, value === n ? '#fff' : C.navy, true),
              border: `1px solid ${value === n ? C.navy : C.border}`,
              minWidth: 36,
            }}>
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem', color: C.gold,
          margin: '4px 0 0', fontStyle: 'italic' }}>{SCALE[value]}</p>
      )}
    </div>
  );
}

/* ── 2B: Single week log row/modal ── */
function WeekLogRow({ cohortId, weekNum, log, onSaved }: {
  cohortId: string; weekNum: number; log?: SessionLog; onSaved: () => void;
}) {
  const WEEK_TITLES: Record<number, string> = {
    1: 'Understanding Our Grief', 2: 'The Landscape of Loss', 3: 'Waves of Emotion',
    4: 'Carrying the Weight', 5: 'Body and Breath', 6: 'Companions on the Journey',
    7: 'Memory and Meaning', 8: 'Continuing Bonds', 9: 'Rituals and Remembrance',
    10: 'Finding Footing', 11: 'Meaning Reconstruction', 12: 'Hope and Renewal',
    13: 'Living Forward',
  };

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    session_date: log?.session_date ?? new Date().toISOString().slice(0, 10),
    session_duration_minutes: String(log?.session_duration_minutes ?? ''),
    participants_attended: String(log?.participants_attended ?? ''),
    group_composition_stable: log?.group_composition_stable ?? true,
    co_facilitated: log?.co_facilitated ?? false,
    facilitator_confidence_rating: log?.facilitator_confidence_rating ?? 0,
    notes: log?.notes ?? '',
    critical_incident: log?.critical_incident ?? false,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const status = !log ? 'Not logged'
    : log.critical_incident ? 'Logged with incident'
    : 'Logged';
  const statusColor = !log ? C.muted : log.critical_incident ? C.danger : C.success;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const res = await fetch('/api/hub/session-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohort_id: cohortId, week_number: weekNum, ...form,
        session_duration_minutes: form.session_duration_minutes ? Number(form.session_duration_minutes) : null,
        participants_attended: Number(form.participants_attended ?? 0),
        facilitator_confidence_rating: form.facilitator_confidence_rating || null,
      }),
    });
    setSaving(false);
    if (res.ok) { setMsg('Saved ✓'); setOpen(false); onSaved(); }
    else { const d = await res.json(); setMsg('Error: ' + d.error); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.6rem 0.85rem', borderRadius: 7, border: `1px solid ${C.border}`,
        background: C.bg, marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy, fontWeight: 600 }}>
          Week {weekNum} — {WEEK_TITLES[weekNum]}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {log && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
              {log.participants_attended} attended
            </span>
          )}
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: statusColor }}>
            {status}
          </span>
          <button onClick={() => setOpen(o => !o)}
            style={btn(open ? C.border : C.gold, open ? C.navy : '#fff', true)}>
            {open ? 'Close' : log ? 'Edit' : 'Log Session'}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={save} style={{ background: '#FAFAF8', border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '1rem 1.25rem', marginBottom: 10, marginTop: -4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={fieldLabel}>Session Date *</label>
              <input type="date" style={inp} required value={form.session_date}
                onChange={e => set('session_date', e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel}>Participants Attended</label>
              <input type="number" min="0" style={inp} value={form.participants_attended}
                onChange={e => set('participants_attended', e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel}>Duration (minutes)</label>
              <input type="number" min="1" style={inp} placeholder="e.g. 90"
                value={form.session_duration_minutes}
                onChange={e => set('session_duration_minutes', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={fieldLabel}>Group Composition</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button"
                    onClick={() => set('group_composition_stable', v)}
                    style={{ ...btn(form.group_composition_stable === v ? C.navy : C.bg,
                      form.group_composition_stable === v ? '#fff' : C.navy, true),
                      border: `1px solid ${form.group_composition_stable === v ? C.navy : C.border}`,
                      flex: 1, textAlign: 'center' as const }}>
                    {v ? 'Core group consistent' : 'Notable turnover'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Co-facilitated?</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[false, true].map(v => (
                  <button key={String(v)} type="button"
                    onClick={() => set('co_facilitated', v)}
                    style={{ ...btn(form.co_facilitated === v ? C.navy : C.bg,
                      form.co_facilitated === v ? '#fff' : C.navy, true),
                      border: `1px solid ${form.co_facilitated === v ? C.navy : C.border}`,
                      flex: 1, textAlign: 'center' as const }}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>
              Facilitator Confidence This Week (1–5)
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                — Private, only visible to program director
              </span>
            </label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set('facilitator_confidence_rating', n)}
                  style={{ ...btn(form.facilitator_confidence_rating === n ? C.gold : C.bg,
                    form.facilitator_confidence_rating === n ? '#fff' : C.navy, true),
                    border: `1px solid ${form.facilitator_confidence_rating === n ? C.gold : C.border}`,
                    minWidth: 36 }}>
                  {n}
                </button>
              ))}
              {form.facilitator_confidence_rating > 0 && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.76rem', color: C.muted,
                  alignSelf: 'center', marginLeft: 4 }}>
                  {['','uncertain','somewhat uncertain','neutral','confident','very confident'][form.facilitator_confidence_rating]}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>Session Notes
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                — Private, not shared with participants
              </span>
            </label>
            <textarea style={{ ...inp, height: 70, resize: 'vertical' }}
              placeholder="Observations, adjustments, what worked…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.critical_incident}
                onChange={e => set('critical_incident', e.target.checked)}
                style={{ width: 16, height: 16 }} />
              <span>Critical incident this session?</span>
              {form.critical_incident && (
                <span style={{ color: C.danger, fontWeight: 400, fontSize: '0.78rem' }}>
                  — Please document via your organization&apos;s critical incident reporting process
                </span>
              )}
            </label>
          </div>

          {msg && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
            color: msg.startsWith('Error') ? C.danger : C.success, margin: '0 0 0.75rem' }}>{msg}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={btn(C.navy, '#fff', true)}>
              {saving ? 'Saving…' : 'Save Session Log'}
            </button>
            <button type="button" onClick={() => setOpen(false)} style={btn(C.bg, C.navy, true)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── 2A: Pre-Program form ── */
function PreProgramForm({ cohortId, existing, onSaved }: {
  cohortId: string; existing?: CohortOutcome; onSaved: (o: CohortOutcome) => void;
}) {
  const AGE_RANGES = ['under_18', '18_35', '36_55', '56_plus'];
  const AGE_LABELS: Record<string, string> = { under_18: 'Under 18', '18_35': '18–35', '36_55': '36–55', '56_plus': '56+' };
  const LOSS_TYPES = ['spouse','parent','child','sibling','friend','colleague','pet','other'];
  const LOSS_LABELS: Record<string, string> = { spouse:'Spouse/Partner', parent:'Parent', child:'Child',
    sibling:'Sibling', friend:'Friend', colleague:'Colleague', pet:'Pet', other:'Other' };
  const SUPPORT_TYPES = ['therapy','counseling','grief_group','other_program','none'];
  const SUPPORT_LABELS: Record<string, string> = { therapy:'Individual therapy', counseling:'Grief counseling',
    grief_group:'Other grief group', other_program:'Other structured program', none:'None' };

  const initAges = () => Object.fromEntries(AGE_RANGES.map(k => [k, existing?.pre_age_ranges?.[k] ?? 0]));
  const initLoss = () => Object.fromEntries(LOSS_TYPES.map(k => [k, existing?.pre_primary_loss_types?.[k] ?? 0]));
  const initSupport = () => Object.fromEntries(SUPPORT_TYPES.map(k => [k, existing?.pre_prior_support?.[k] ?? 0]));

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [partCount, setPartCount] = useState(String(existing?.pre_participant_count ?? ''));
  const [ageRanges, setAgeRanges] = useState<Record<string, number>>(initAges);
  const [settingType, setSettingType] = useState(existing?.pre_setting_type ?? '');
  const [communityType, setCommunityType] = useState(existing?.pre_community_type ?? '');
  const [timeSinceLoss, setTimeSinceLoss] = useState(existing?.pre_time_since_loss ?? '');
  const [lossTypes, setLossTypes] = useState<Record<string, number>>(initLoss);
  const [priorSupport, setPriorSupport] = useState<Record<string, number>>(initSupport);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const res = await fetch('/api/hub/cohort-outcomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohort_id: cohortId, phase: 'pre',
        pre_participant_count: partCount ? Number(partCount) : null,
        pre_age_ranges: ageRanges,
        pre_setting_type: settingType || null,
        pre_community_type: communityType || null,
        pre_time_since_loss: timeSinceLoss || null,
        pre_primary_loss_types: lossTypes,
        pre_prior_support: priorSupport,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setMsg('Pre-program data saved ✓');
      onSaved(d.outcome);
    } else {
      const d = await res.json();
      setMsg('Error: ' + d.error);
    }
  }

  const saved = !!existing?.pre_submitted_at;

  return (
    <form onSubmit={submit} style={{ background: '#FAFAF8', border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: C.navy, margin: 0 }}>
          Pre-Program Data
        </h3>
        {saved && !msg && (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.success, fontWeight: 600 }}>
            Pre-program data saved ✓
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={fieldLabel}>Participants Enrolled</label>
          <input type="number" min="1" style={inp} value={partCount}
            onChange={e => setPartCount(e.target.value)} placeholder="e.g. 10" />
        </div>
        <div>
          <label style={fieldLabel}>Setting Type</label>
          <select style={inp} value={settingType} onChange={e => setSettingType(e.target.value)}>
            <option value="">— Select —</option>
            {[['community_center','Community Center'],['faith','Faith Community'],
              ['healthcare','Healthcare'],['workplace','Workplace'],
              ['school','School'],['other','Other']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={fieldLabel}>Community Type</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[['rural','Rural'],['suburban','Suburban'],['urban','Urban']].map(([v,l]) => (
              <button key={v} type="button" onClick={() => setCommunityType(v)}
                style={{ ...btn(communityType === v ? C.navy : C.bg,
                  communityType === v ? '#fff' : C.navy, true),
                  border: `1px solid ${communityType === v ? C.navy : C.border}`, flex: 1 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={fieldLabel}>Time Since Primary Loss</label>
          <select style={inp} value={timeSinceLoss} onChange={e => setTimeSinceLoss(e.target.value)}>
            <option value="">— Select —</option>
            {[['under_6mo','Under 6 months'],['6_12mo','6–12 months'],
              ['1_2yr','1–2 years'],['2_5yr','2–5 years'],
              ['5yr_plus','5+ years'],['mixed','Mixed']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Age ranges */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={fieldLabel}>Age Ranges (approximate counts)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {AGE_RANGES.map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '0.4rem 0.75rem', minWidth: 130 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: C.navy, flex: 1 }}>
                {AGE_LABELS[k]}
              </span>
              <input type="number" min="0" style={{ ...inp, width: 50, padding: '0.25rem 0.4rem', textAlign: 'center' as const }}
                value={ageRanges[k]}
                onChange={e => setAgeRanges(r => ({ ...r, [k]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Loss types */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={fieldLabel}>Primary Loss Types Represented (select all that apply)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {LOSS_TYPES.map(k => {
            const selected = (lossTypes[k] ?? 0) > 0;
            return (
              <button key={k} type="button"
                onClick={() => setLossTypes(r => ({ ...r, [k]: selected ? 0 : 1 }))}
                style={{ ...btn(selected ? C.navy : C.bg, selected ? '#fff' : C.navy, true),
                  border: `1px solid ${selected ? C.navy : C.border}` }}>
                {LOSS_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prior support */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={fieldLabel}>Prior Support History (approximate counts)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {SUPPORT_TYPES.map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '0.4rem 0.75rem' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: C.navy }}>
                {SUPPORT_LABELS[k]}
              </span>
              <input type="number" min="0" style={{ ...inp, width: 50, padding: '0.25rem 0.4rem', textAlign: 'center' as const }}
                value={priorSupport[k]}
                onChange={e => setPriorSupport(r => ({ ...r, [k]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
      </div>

      {msg && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
          color: msg.includes('Error') ? C.danger : C.success, margin: '0 0 0.75rem', fontWeight: 600 }}>{msg}</p>
      )}
      <button type="submit" disabled={saving} style={btn(C.navy, '#fff')}>
        {saving ? 'Saving…' : 'Save Pre-Program Data'}
      </button>
    </form>
  );
}

/* ── 2C: Post-Program form ── */
function PostProgramForm({ cohortId, preCount, existing, onSaved }: {
  cohortId: string; preCount: number; existing?: CohortOutcome; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [postCount, setPostCount] = useState(String(existing?.post_participant_count ?? ''));
  const [grief, setGrief] = useState(existing?.post_grief_intensity_rating ?? 0);
  const [connection, setConnection] = useState(existing?.post_connection_rating ?? 0);
  const [selfCare, setSelfCare] = useState(existing?.post_self_care_rating ?? 0);
  const [hope, setHope] = useState(existing?.post_hope_rating ?? 0);
  const [observations, setObservations] = useState(existing?.post_facilitator_observations ?? '');
  const [reportReady, setReportReady] = useState(!!existing?.post_submitted_at);

  const completionRate = preCount > 0 && postCount
    ? Math.round((Number(postCount) / preCount) * 100) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!grief || !connection || !selfCare || !hope) {
      setMsg('Please rate all four outcome dimensions before submitting.');
      return;
    }
    setSaving(true); setMsg('Submitting outcomes and generating report…');
    const res = await fetch('/api/hub/cohort-outcomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohort_id: cohortId, phase: 'post',
        post_participant_count: postCount ? Number(postCount) : null,
        post_grief_intensity_rating: grief,
        post_connection_rating: connection,
        post_self_care_rating: selfCare,
        post_hope_rating: hope,
        post_facilitator_observations: observations || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('');
      setReportReady(true);
      onSaved();
    } else {
      const d = await res.json();
      setMsg('Error: ' + d.error);
    }
  }

  if (reportReady) {
    return (
      <div style={{ background: '#F0FAF4', border: `1px solid #86EFAC`,
        borderRadius: 10, padding: '1.25rem', marginTop: '1rem' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem',
          color: '#166534', margin: '0 0 0.75rem', fontWeight: 700 }}>
          ✓ Outcomes submitted — Cohort marked complete
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#166534', margin: '0 0 1rem' }}>
          Your Cohort Summary Report will be available in the Reports tab once generated.
          Wayne has been notified.
        </p>
        <button
          onClick={() => window.open('/facilitators/hub/dashboard?tab=reports', '_self')}
          style={btn(C.success, '#fff')}>
          View Reports Tab →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: '#FAFAF8', border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '1.25rem', marginTop: '1rem' }}>
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: C.navy, margin: '0 0 1rem' }}>
        Post-Program Outcomes
      </h3>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <label style={fieldLabel}>Participants Who Completed the Full Program</label>
          <input type="number" min="0" max={preCount || 999} style={{ ...inp, width: 100 }}
            value={postCount} onChange={e => setPostCount(e.target.value)} />
        </div>
        {completionRate !== null && (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.navy,
            fontWeight: 600, paddingBottom: 6 }}>
            {postCount} of {preCount} participants completed
            {' '}
            <span style={{ color: completionRate >= 70 ? C.success : completionRate >= 50 ? C.warn : C.danger }}>
              ({completionRate}%)
            </span>
          </div>
        )}
      </div>

      <div style={{ background: '#F5F3EE', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted,
          margin: '0 0 0.5rem', fontStyle: 'italic' }}>
          Rate the observable improvement in your group across these four dimensions.
          These are your facilitated observations — not participant self-reports.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
          <StarRating value={grief} onChange={setGrief}
            label="Grief Intensity"
            hint="Did participants demonstrate reduced grief intensity over 13 weeks?" />
          <StarRating value={connection} onChange={setConnection}
            label="Connection to Others"
            hint="Did participants demonstrate increased connection and reduced isolation?" />
          <StarRating value={selfCare} onChange={setSelfCare}
            label="Self-Care Practices"
            hint="Did participants adopt and maintain self-care practices?" />
          <StarRating value={hope} onChange={setHope}
            label="Hope"
            hint="Did participants demonstrate increased hope and engagement with life?" />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={fieldLabel}>Facilitator Observations</label>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted, margin: '0 0 6px' }}>
          What did you observe in your group over these 13 weeks?
          This narrative becomes part of your Cohort Summary Report.
        </p>
        <textarea style={{ ...inp, height: 120, resize: 'vertical' }}
          placeholder="Describe what you witnessed — growth, challenges, moments of connection, transformation…"
          value={observations} onChange={e => setObservations(e.target.value)} />
      </div>

      {msg && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
          color: msg.startsWith('Error') ? C.danger : C.gold, margin: '0 0 0.75rem', fontWeight: 600 }}>{msg}</p>
      )}
      <button type="submit" disabled={saving} style={btn(C.gold, '#fff')}>
        {saving ? 'Submitting…' : 'Submit Outcomes & Generate Report'}
      </button>
    </form>
  );
}

/* ── Main Cohorts Card ── */
function CohortsCard({ cohorts, onAdded }: { cohorts: Cohort[]; onAdded: () => void }) {
  const [showForm,    setShowForm]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState('');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<Record<string, SessionLog[]>>({});
  const [outcomes,    setOutcomes]    = useState<Record<string, CohortOutcome>>({});
  const [form, setForm] = useState({
    book_number: '', start_date: '', end_date: '',
    participant_count: '', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function loadCohortData(cohortId: string) {
    const [logsRes, outcomeRes] = await Promise.all([
      fetch(`/api/hub/session-logs?cohort_id=${cohortId}`),
      fetch(`/api/hub/cohort-outcomes?cohort_id=${cohortId}`),
    ]);
    if (logsRes.ok) {
      const d = await logsRes.json();
      setSessionLogs(prev => ({ ...prev, [cohortId]: d.logs ?? [] }));
    }
    if (outcomeRes.ok) {
      const d = await outcomeRes.json();
      if (d.outcome) setOutcomes(prev => ({ ...prev, [cohortId]: d.outcome }));
    }
  }

  function toggleExpand(cohortId: string) {
    if (expandedId === cohortId) {
      setExpandedId(null);
    } else {
      setExpandedId(cohortId);
      if (!sessionLogs[cohortId]) loadCohortData(cohortId);
    }
  }

  async function submitNewCohort(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const res = await fetch('/api/hub/cohorts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setMsg('Cohort created.');
      setForm({ book_number: '', start_date: '', end_date: '', participant_count: '', notes: '' });
      setShowForm(false); onAdded();
    } else {
      const d = await res.json();
      setMsg('Error: ' + d.error);
    }
  }

  const active    = cohorts.filter(c => c.status === 'active');
  const completed = cohorts.filter(c => c.status !== 'active');

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ ...sectionTitle, margin: 0 }}>My Cohorts</h2>
        <button onClick={() => setShowForm(s => !s)} style={btn(C.gold, '#fff', true)}>
          {showForm ? 'Cancel' : '+ New Cohort'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitNewCohort} style={{ background: C.bg, borderRadius: 8, padding: '1rem',
          marginBottom: '1.25rem', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem', marginBottom: '0.75rem' }}>
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
              <label style={fieldLabel}>Participants (initial estimate)</label>
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
            {loading ? 'Saving…' : 'Create Cohort'}
          </button>
        </form>
      )}

      {cohorts.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
          No cohorts yet. Use &quot;+ New Cohort&quot; to record your first group.
        </p>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 700,
                textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Active</div>
              {active.map(c => (
                <CohortExpandRow key={c.id} c={c}
                  expanded={expandedId === c.id}
                  onToggle={() => toggleExpand(c.id)}
                  logs={sessionLogs[c.id] ?? null}
                  outcome={outcomes[c.id]}
                  onDataSaved={() => loadCohortData(c.id)}
                />
              ))}
            </>
          )}
          {completed.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 700,
                textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                fontFamily: 'Inter, sans-serif', margin: '1rem 0 8px' }}>Completed</div>
              {completed.map(c => (
                <CohortExpandRow key={c.id} c={c}
                  expanded={expandedId === c.id}
                  onToggle={() => toggleExpand(c.id)}
                  logs={sessionLogs[c.id] ?? null}
                  outcome={outcomes[c.id]}
                  onDataSaved={() => loadCohortData(c.id)}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Expandable cohort row with all 3 sub-sections ── */
function CohortExpandRow({ c, expanded, onToggle, logs, outcome, onDataSaved }: {
  c: Cohort; expanded: boolean; onToggle: () => void;
  logs: SessionLog[] | null; outcome?: CohortOutcome; onDataSaved: () => void;
}) {
  const logsLogged   = (logs ?? []).length;
  const hasIncident  = (logs ?? []).some(l => l.critical_incident);
  const allLogged    = logsLogged === 13;
  const preSubmitted = !!outcome?.pre_submitted_at;
  const postSubmitted = !!outcome?.post_submitted_at;

  const logMap: Record<number, SessionLog> = {};
  (logs ?? []).forEach(l => { logMap[l.week_number] = l; });

  // Progress bar
  const pct = Math.round((logsLogged / 13) * 100);

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 8, padding: '0.65rem 0.85rem', borderRadius: expanded ? '7px 7px 0 0' : 7,
        border: `1px solid ${expanded ? C.gold : C.border}`,
        background: expanded ? C.goldLt : C.bg,
        cursor: 'pointer' }} onClick={onToggle}>
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
            {c.start_date}{c.end_date ? ` → ${c.end_date}` : ''}
          </span>
          {c.participant_count && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
              {c.participant_count} participants
            </span>
          )}
          <StatusBadge s={c.status} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
            color: hasIncident ? C.danger : allLogged ? C.success : C.muted }}>
            {logsLogged}/13 weeks
          </span>
          <span style={{ fontSize: '0.8rem', color: C.gold }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && logs !== null && (
        <div style={{ border: `1px solid ${C.gold}`, borderTop: 'none', borderRadius: '0 0 7px 7px',
          padding: '1.25rem', background: C.white }}>

          {/* Progress bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
                Session Logs Progress
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600,
                color: allLogged ? C.success : C.navy }}>
                {logsLogged} of 13 weeks logged
              </span>
            </div>
            <div style={{ background: C.border, borderRadius: 99, height: 8 }}>
              <div style={{ background: allLogged ? C.success : C.gold, borderRadius: 99,
                height: 8, width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* 2A — Pre-Program */}
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 0.75rem' }}>
            {preSubmitted ? '✓ ' : ''}Pre-Program Setup
          </h3>
          <PreProgramForm
            cohortId={c.id}
            existing={outcome}
            onSaved={(updated) => onDataSaved()}
          />

          {/* 2B — Weekly Logs */}
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '1.25rem 0 0.75rem' }}>
            Weekly Session Logs
          </h3>
          {Array.from({ length: 13 }, (_, i) => i + 1).map(w => (
            <WeekLogRow key={w} cohortId={c.id} weekNum={w}
              log={logMap[w]} onSaved={onDataSaved} />
          ))}

          {/* 2C — Post-Program (unlocks when all 13 logged or completed status) */}
          {(allLogged || c.status === 'completed') && (
            <>
              <div style={{ margin: '1.25rem 0 0.75rem', padding: '0.75rem 1rem',
                background: allLogged && !postSubmitted ? '#FEF9EE' : C.bg,
                borderRadius: 8, border: `1px solid ${allLogged && !postSubmitted ? C.gold : C.border}` }}>
                {!postSubmitted && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                    color: C.gold, margin: 0, fontWeight: 600 }}>
                    ✓ All 13 sessions logged — Post-Program Outcomes now available
                  </p>
                )}
                <PostProgramForm
                  cohortId={c.id}
                  preCount={outcome?.pre_participant_count ?? c.participant_count ?? 0}
                  existing={outcome}
                  onSaved={onDataSaved}
                />
              </div>
            </>
          )}

          {!allLogged && c.status !== 'completed' && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem',
              background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.83rem', color: C.muted, margin: 0 }}>
                Post-Program Outcomes will unlock once all 13 session logs are submitted.
              </p>
            </div>
          )}
        </div>
      )}
      {expanded && logs === null && (
        <div style={{ border: `1px solid ${C.gold}`, borderTop: 'none', borderRadius: '0 0 7px 7px',
          padding: '1.5rem', textAlign: 'center' as const, color: C.muted,
          fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
          Loading…
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CODES TAB
═════════════════════════════════════════════════════════════*/
function CodesCard({ profile, cohorts }: { profile: Profile; cohorts: Cohort[] }) {
  /* ── form state ── */
  const [bookNum,     setBookNum]     = useState('');
  const [cohortId,    setCohortId]    = useState('');
  const [batchSize,   setBatchSize]   = useState('15');
  const [expiryDate,  setExpiryDate]  = useState('');
  const [notes,       setNotes]       = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [genError,    setGenError]    = useState('');

  /* ── result state ── */
  const [lastBatch,   setLastBatch]   = useState<{ batch: CodeBatch; codes: string[] } | null>(null);
  const [copyMsg,     setCopyMsg]     = useState('');

  /* ── active batches ── */
  const [batches,      setBatches]    = useState<CodeBatch[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);
  const [expandedId,   setExpandedId] = useState<string | null>(null);
  const [revoking,     setRevoking]   = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const certified = (profile.books_certified ?? []).sort();

  /* Auto-calc expiry when cohort changes */
  useEffect(() => {
    if (cohortId) {
      const c = cohorts.find(x => x.id === cohortId);
      if (c?.end_date) {
        const d = new Date(c.end_date);
        d.setDate(d.getDate() + 6 * 7);
        setExpiryDate(d.toISOString().slice(0, 10));
        return;
      }
    }
    // Default: today + 19 weeks
    const d = new Date();
    d.setDate(d.getDate() + 19 * 7);
    setExpiryDate(d.toISOString().slice(0, 10));
  }, [cohortId, cohorts]);

  /* Load batches */
  const loadBatches = useCallback(async () => {
    setBatchLoading(true);
    try {
      const res = await fetch('/api/hub/codes');
      if (!res.ok) { setBatches([]); return; }
      const data = await res.json();
      setBatches(data.batches ?? []);
    } finally {
      setBatchLoading(false);
    }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenError(''); setGenerating(true); setLastBatch(null);
    try {
      const res = await fetch('/api/generate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_number: Number(bookNum),
          batch_size:  Number(batchSize),
          cohort_id:   cohortId || undefined,
          cohort_end_date: cohortId ? undefined : expiryDate
            ? new Date(new Date(expiryDate).getTime() - 6 * 7 * 86400000).toISOString().slice(0, 10)
            : undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error ?? 'Generation failed'); return; }
      setLastBatch({ batch: data.batch, codes: data.codes });
      await loadBatches();
    } catch (err) {
      setGenError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  function copyAll() {
    if (!lastBatch) return;
    const text = lastBatch.codes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  function downloadCsv() {
    if (!lastBatch) return;
    const { batch, codes } = lastBatch;
    const rows = [
      ['Code', 'Book', 'Expires', 'Status'],
      ...codes.map(c => [c, `Book ${batch.book_number}`, batch.expires_at.slice(0, 10), 'active']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a   = document.createElement('a');
    a.href = url; a.download = `LGS-codes-book${batch.book_number}-${batch.expires_at.slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function printCodes() {
    if (!lastBatch) return;
    const { batch, codes } = lastBatch;
    const w = window.open('', '_blank')!;
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>Live and Grieve™ Access Codes</title>
      <style>
        body { font-family: Georgia, serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
        h1 { font-size: 1.5rem; margin-bottom: 4px; }
        .sub { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
        .url { font-size: 1rem; font-weight: bold; margin-bottom: 1.5rem; color: #B8942F; }
        .code { font-family: 'Courier New', monospace; font-size: 1.4rem; letter-spacing: 0.1em;
          padding: 10px 0; border-bottom: 1px solid #ddd; color: #1a1a1a; }
        .footer { margin-top: 2rem; font-size: 0.8rem; color: #888; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>
      <h1>Live and Grieve™ — Group Supplement</h1>
      <div class="sub">Book ${batch.book_number} · ${batch.batch_size} codes · Expires ${batch.expires_at.slice(0, 10)}</div>
      <div class="url">Redeem at: solo.tripillarstudio.com</div>
      ${codes.map(c => `<div class="code">${c}</div>`).join('')}
      <div class="footer">Each code is single-use. Expires ${batch.expires_at.slice(0, 10)}. Questions? Contact your facilitator.</div>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  async function revokeBatch(batchId: string) {
    if (!confirm('Revoke all codes in this batch? This cannot be undone.')) return;
    setRevoking(batchId);
    const res = await fetch('/api/hub/codes/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batchId }),
    });
    setRevoking(null);
    if (res.ok) { await loadBatches(); }
    else {
      const d = await res.json();
      alert('Revoke failed: ' + (d.error ?? 'unknown error'));
    }
  }

  async function expandBatch(batchId: string) {
    if (expandedId === batchId) { setExpandedId(null); return; }
    setExpandedId(batchId);
    // Load individual codes if not yet loaded
    const existing = batches.find(b => b.id === batchId);
    if (existing?.codes) return;

    const res  = await fetch(`/api/hub/codes?batch_id=${batchId}`);
    const data = await res.json();
    if (data.codes) {
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, codes: data.codes } : b));
    }
  }

  /* Cohorts with end dates for selector */
  const cohortsWithDates = cohorts.filter(c => c.end_date);

  return (
    <>
      {/* ── Generate Section ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Generate Codes</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.muted,
          marginTop: -8, marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Generate single-use access codes for your group participants. Each code unlocks the Group Supplement
          for one participant until the expiry date.
        </p>

        <form onSubmit={generate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem', marginBottom: '1rem' }}>
            {/* Book selector — certified books only */}
            <div>
              <label style={fieldLabel}>Book *</label>
              {certified.length === 0 ? (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.danger }}>
                  No books certified. Contact wayne@tripillarstudio.com.
                </p>
              ) : (
                <select style={inp} value={bookNum}
                  onChange={e => setBookNum(e.target.value)} required>
                  <option value="">— Select —</option>
                  {certified.map(b => (
                    <option key={b} value={b}>Book {b} — {BOOKS_MAP[b] ?? ''}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Cohort selector */}
            <div>
              <label style={fieldLabel}>Cohort (optional)</label>
              <select style={inp} value={cohortId} onChange={e => setCohortId(e.target.value)}>
                <option value="">No cohort / use default expiry</option>
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>
                    Book {c.book_number}{c.end_date ? ` — ends ${c.end_date}` : ''}{c.notes ? ` (${c.notes})` : ''}
                  </option>
                ))}
              </select>
              {cohortsWithDates.length === 0 && (
                <span style={{ fontSize: '0.72rem', color: C.muted, fontFamily: 'Inter, sans-serif',
                  marginTop: 4, display: 'block' }}>
                  Log a cohort with an end date to auto-set expiry.
                </span>
              )}
            </div>

            {/* Batch size */}
            <div>
              <label style={fieldLabel}>Number of Codes (1–20)</label>
              <input type="number" min="1" max="20" style={inp}
                value={batchSize} onChange={e => setBatchSize(e.target.value)} required />
            </div>

            {/* Expiry */}
            <div>
              <label style={fieldLabel}>
                Code Expiry
                <span style={{ color: C.gold, fontWeight: 400, marginLeft: 4 }}>
                  {cohortId && cohorts.find(c => c.id === cohortId)?.end_date
                    ? '(cohort end + 6 weeks)'
                    : '(today + 19 weeks)'}
                </span>
              </label>
              <input type="date" style={inp} value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)} required />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel}>Notes (optional)</label>
            <input type="text" style={inp} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Spring 2026 cohort — First Church" />
          </div>

          {genError && (
            <p style={{ fontSize: '0.875rem', color: C.danger, fontFamily: 'Inter, sans-serif',
              marginBottom: '0.75rem', padding: '0.5rem 0.75rem',
              background: C.danger + '12', borderRadius: 6 }}>
              {genError}
            </p>
          )}

          <button type="submit" disabled={generating || certified.length === 0}
            style={{ ...btn(C.navy), opacity: (generating || certified.length === 0) ? 0.6 : 1 }}>
            {generating ? 'Generating…' : `Generate ${batchSize || '15'} Codes`}
          </button>
        </form>
      </div>

      {/* ── Generated codes display ── */}
      {lastBatch && (
        <div style={{ ...card, border: `2px solid ${C.gold}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>
              ✓ {lastBatch.codes.length} Codes Generated
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={copyAll} style={btn(C.gold, '#fff', true)}>
                {copyMsg || '⎘ Copy All'}
              </button>
              <button onClick={downloadCsv} style={btn(C.navy, '#fff', true)}>
                ↓ CSV
              </button>
              <button onClick={printCodes} style={{
                ...btn(C.bg, C.navy, true),
                border: `1px solid ${C.border}`,
              }}>
                🖨 Print
              </button>
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
            marginBottom: '1.25rem', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted }}>
            <span>Book {lastBatch.batch.book_number} — {BOOKS_MAP[lastBatch.batch.book_number] ?? ''}</span>
            <span>Expires {lastBatch.batch.expires_at.slice(0, 10)}</span>
            <span style={{ color: C.gold, fontWeight: 600 }}>solo.tripillarstudio.com</span>
          </div>

          {/* Code grid */}
          <div ref={printRef} style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {lastBatch.codes.map(code => (
              <div key={code} style={{
                background: C.goldLt, border: `1px solid ${C.gold}50`,
                borderRadius: 8, padding: '0.7rem 1rem', textAlign: 'center',
              }}>
                <span style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '1.2rem', fontWeight: 700,
                  color: C.navy, letterSpacing: '0.08em',
                }}>
                  {code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Batches ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Active Batches</h2>

        {batchLoading ? (
          <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>Loading…</p>
        ) : batches.length === 0 ? (
          <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
            No code batches yet. Generate your first batch above.
          </p>
        ) : (
          <div>
            {batches.map(batch => {
              const isExpired = new Date(batch.expires_at) < new Date();
              const redeemed  = batch.redeemed_count ?? 0;
              const pct       = batch.batch_size > 0 ? Math.round((redeemed / batch.batch_size) * 100) : 0;
              const barColor  = isExpired ? C.muted : redeemed === batch.batch_size ? C.success : C.gold;
              const isOpen    = expandedId === batch.id;

              return (
                <div key={batch.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8,
                  marginBottom: 10, overflow: 'hidden' }}>
                  {/* Batch header row */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                    gap: 12, padding: '0.85rem 1rem', background: C.bg,
                    cursor: 'pointer' }} onClick={() => expandBatch(batch.id)}>
                    {/* Book + date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                        color: C.navy, fontSize: '0.9rem' }}>
                        Book {batch.book_number} — {BOOKS_MAP[batch.book_number] ?? ''}
                        {batch.notes && (
                          <span style={{ fontWeight: 400, color: C.muted, marginLeft: 8,
                            fontSize: '0.8rem' }}>{batch.notes}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                        color: C.muted, marginTop: 2 }}>
                        Generated {new Date(batch.created_at).toLocaleDateString()} · Expires {batch.expires_at.slice(0, 10)}
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                        fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                        {redeemed}/{batch.batch_size} redeemed
                      </div>
                      <div style={{ background: C.border, borderRadius: 99, height: 6, width: 100, overflow: 'hidden' }}>
                        <div style={{ background: barColor, width: `${pct}%`, height: '100%', borderRadius: 99 }} />
                      </div>
                    </div>

                    {/* Status + expand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge s={isExpired ? 'expired' : 'active'} />
                      <span style={{ color: C.muted, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded codes */}
                  {isOpen && (
                    <div style={{ padding: '1rem', borderTop: `1px solid ${C.border}` }}>
                      {!batch.codes ? (
                        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif',
                          fontSize: '0.875rem' }}>Loading codes…</p>
                      ) : (
                        <>
                          <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8,
                            marginBottom: '1rem' }}>
                            {batch.codes.map(code => (
                              <div key={code.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.5rem 0.75rem', borderRadius: 6,
                                background: code.status === 'redeemed' ? C.border + '60'
                                  : code.status === 'revoked' ? C.danger + '12' : C.goldLt,
                                border: `1px solid ${
                                  code.status === 'redeemed' ? C.border
                                  : code.status === 'revoked' ? C.danger + '30' : C.gold + '50'
                                }`,
                              }}>
                                <span style={{
                                  fontFamily: '"Courier New", monospace',
                                  fontSize: '0.95rem', fontWeight: 700,
                                  color: code.status === 'revoked' ? C.muted : C.navy,
                                  letterSpacing: '0.06em',
                                  textDecoration: code.status === 'revoked' ? 'line-through' : 'none',
                                }}>
                                  {code.code}
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                  <StatusBadge s={code.status} />
                                  {code.redeemed_by_email && (
                                    <div style={{ fontSize: '0.65rem', color: C.muted,
                                      fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                                      {code.redeemed_by_email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Revoke button */}
                          {!isExpired && batch.codes.some(c => c.status === 'active') && (
                            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
                              <button
                                onClick={() => revokeBatch(batch.id)}
                                disabled={revoking === batch.id}
                                style={{ ...btn(C.danger, '#fff', true),
                                  opacity: revoking === batch.id ? 0.6 : 1 }}>
                                {revoking === batch.id ? 'Revoking…' : '⊘ Revoke All Active Codes'}
                              </button>
                              <span style={{ marginLeft: 10, fontSize: '0.75rem', color: C.muted,
                                fontFamily: 'Inter, sans-serif' }}>
                                Emergency use only. Cannot be undone.
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   REPORTS TAB  —  Section 1: Impact · Section 2: Cohort PDFs · Section 3: Charts
═════════════════════════════════════════════════════════════*/

/* ── API shape mirrors /api/reports/facilitator/[id] ── */
interface FacReportCohort {
  cohort_id: string;
  book_number: number;
  status: string;
  start_date: string;
  end_date?: string;
  sessions_logged: number;
  sessions_total: number;
  pre_enrollment: number | null;
  post_completions: number | null;
  completion_rate: number | null;
  avg_outcome_rating: number | null;
  outcome_ratings: {
    grief_intensity: number | null;
    connection: number | null;
    self_care: number | null;
    hope: number | null;
  } | null;
}
interface FacReport {
  profile: { full_name: string; cert_id: string; cert_status: string; org?: { name: string } };
  totals: {
    total_participants_served: number;
    total_cohorts_completed: number;
    avg_completion_rate: number | null;
    avg_outcome_rating: number | null;
  };
  cohort_summaries: FacReportCohort[];
}

/* ── Section 1: Impact Tiles ── */
function ImpactTiles({ totals }: { totals: FacReport['totals'] }) {
  const tiles = [
    {
      icon: '👥',
      label: 'People You\'ve Served',
      value: totals.total_participants_served,
      color: C.navy,
      note: 'participants who completed your programs',
    },
    {
      icon: '✅',
      label: 'Cohorts Completed',
      value: totals.total_cohorts_completed,
      color: C.success,
      note: 'full 13-week programs facilitated',
    },
    {
      icon: '📊',
      label: 'Avg Completion Rate',
      value: totals.avg_completion_rate != null ? `${totals.avg_completion_rate}%` : '—',
      color: C.gold,
      note: 'of participants who enrolled finished the program',
    },
    {
      icon: '⭐',
      label: 'Avg Outcome Rating',
      value: totals.avg_outcome_rating != null ? `${totals.avg_outcome_rating}/5` : '—',
      color: C.navy,
      note: 'observable improvement across all dimensions',
    },
  ];

  return (
    <div style={{ ...card, borderTop: `3px solid ${C.gold}` }}>
      <h2 style={sectionTitle}>Your Impact</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, margin: '-0.5rem 0 1.25rem', lineHeight: 1.6 }}>
        This is the record of your work. Every number here represents real people who walked through grief with you as their companion.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
        {tiles.map(t => (
          <div key={t.label} style={{
            background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`,
            padding: '1.1rem 1rem', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '2rem', fontWeight: 700, color: t.color, lineHeight: 1.1 }}>
              {t.value ?? '—'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: C.navy, margin: '4px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.label}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: C.muted, lineHeight: 1.4 }}>
              {t.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section 2: Cohort Reports List ── */
function CohortReportsList({ cohorts, facId }: { cohorts: FacReportCohort[]; facId: string }) {
  const completed = cohorts.filter(c => c.status === 'completed');
  const [generating, setGenerating] = useState<string | null>(null);
  const [urls,        setUrls]       = useState<Record<string, string>>({});
  const [errs,        setErrs]       = useState<Record<string, string>>({});

  async function getReport(cohortId: string) {
    setGenerating(cohortId);
    setErrs(e => { const n = { ...e }; delete n[cohortId]; return n; });
    try {
      const r = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cohort', entity_id: cohortId }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setErrs(e => ({ ...e, [cohortId]: d.error ?? 'Generation failed' }));
      } else {
        setUrls(u => ({ ...u, [cohortId]: d.url }));
        window.open(d.url, '_blank');
      }
    } catch (e) {
      setErrs(err => ({ ...err, [cohortId]: String(e) }));
    }
    setGenerating(null);
  }

  if (completed.length === 0) {
    return (
      <div style={{ ...card }}>
        <h2 style={sectionTitle}>Cohort Reports</h2>
        <div style={{ padding: '1.5rem', background: C.bg, borderRadius: 8, textAlign: 'center' as const }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.muted, margin: 0, lineHeight: 1.7 }}>
            Your Cohort Summary Reports will appear here once you complete a 13-week cohort and submit post-program outcomes.<br />
            <span style={{ color: C.navy, fontWeight: 600 }}>Each completed cohort generates a personalized PDF summary of your facilitation work.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...card }}>
      <h2 style={sectionTitle}>Cohort Reports</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, margin: '-0.5rem 0 1.25rem', lineHeight: 1.6 }}>
        Each report is a Tri-Pillars™ PDF summary of your facilitation work for that cohort — yours to keep, share, or include in professional portfolios.
      </p>

      <div style={{ display: 'grid', gap: '0.875rem' }}>
        {completed.map(c => {
          const isGen = generating === c.cohort_id;
          const url   = urls[c.cohort_id];
          const err   = errs[c.cohort_id];
          const avgOutcome = c.avg_outcome_rating;

          return (
            <div key={c.cohort_id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexWrap: 'wrap', gap: '0.75rem',
              padding: '1rem 1.1rem', borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg,
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.navy, fontSize: '0.9rem', marginBottom: 4 }}>
                  Book {c.book_number} — {BOOKS_MAP[c.book_number] ?? ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
                    {c.start_date}{c.end_date ? ` → ${c.end_date}` : ''}
                  </span>
                  {c.pre_enrollment != null && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
                      {c.post_completions ?? '?'} of {c.pre_enrollment} completed
                      {c.completion_rate != null && (
                        <span style={{ color: c.completion_rate >= 70 ? C.success : c.completion_rate >= 50 ? C.warn : C.danger, fontWeight: 600, marginLeft: 4 }}>
                          ({c.completion_rate}%)
                        </span>
                      )}
                    </span>
                  )}
                  {avgOutcome != null && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.gold, fontWeight: 600 }}>
                      ⭐ {avgOutcome}/5 avg outcome
                    </span>
                  )}
                </div>
                {err && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.danger, margin: '4px 0 0' }}>{err}</p>}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                     style={{ ...btn(C.success, '#fff', true), textDecoration: 'none', display: 'inline-block' }}>
                    ✅ Open Report
                  </a>
                ) : (
                  <button onClick={() => getReport(c.cohort_id)} disabled={isGen}
                    style={{ ...btn(isGen ? C.muted : C.navy, '#fff', true), cursor: isGen ? 'not-allowed' : 'pointer' }}>
                    {isGen ? 'Generating…' : '📄 Download PDF'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Section 3: Trend Charts (SVG, no deps) ── */
interface ChartPoint { label: string; value: number; }

function SparkLine({ points, color = C.gold, height = 80 }: { points: ChartPoint[]; color?: string; height?: number }) {
  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
        Not enough data yet
      </div>
    );
  }
  const W = 340;
  const PAD = { t: 12, b: 28, l: 28, r: 12 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const maxV = Math.max(...points.map(p => p.value), 5);
  const minV = Math.min(...points.map(p => p.value), 0);
  const range = maxV - minV || 1;

  const xs = points.map((_, i) => PAD.l + (i / (points.length - 1)) * innerW);
  const ys = points.map(p => PAD.t + innerH - ((p.value - minV) / range) * innerH);

  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${xs[xs.length - 1].toFixed(1)} ${(PAD.t + innerH).toFixed(1)} L ${PAD.l.toFixed(1)} ${(PAD.t + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
      {/* Y axis */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke={C.border} strokeWidth={1} />
      {/* area fill */}
      <path d={areaD} fill={color} fillOpacity={0.08} />
      {/* line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* dots */}
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={4} fill={C.white} stroke={color} strokeWidth={2} />
      ))}
      {/* x labels */}
      {points.map((p, i) => (
        <text key={i} x={xs[i]} y={height - 4} textAnchor="middle"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: C.muted }}>
          {p.label}
        </text>
      ))}
      {/* y axis ticks */}
      {[0, 0.5, 1].map(f => {
        const y = PAD.t + innerH - f * innerH;
        const v = minV + f * range;
        return (
          <g key={f}>
            <line x1={PAD.l - 3} y1={y} x2={PAD.l} y2={y} stroke={C.border} strokeWidth={1} />
            <text x={PAD.l - 5} y={y + 4} textAnchor="end"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fill: C.muted }}>
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MiniBarChart({ points, color = C.gold, height = 80 }: { points: ChartPoint[]; color?: string; height?: number }) {
  if (points.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted }}>
        No completed cohorts yet
      </div>
    );
  }
  const W = 340;
  const PAD = { t: 12, b: 28, l: 28, r: 12 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const maxV = Math.max(...points.map(p => p.value), 100);

  const barW = Math.min(40, innerW / points.length - 6);
  const xs   = points.map((_, i) => PAD.l + (i + 0.5) * (innerW / points.length));

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="xMidYMid meet">
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + innerH} stroke={C.border} strokeWidth={1} />
      <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke={C.border} strokeWidth={1} />
      {points.map((p, i) => {
        const barH = (p.value / maxV) * innerH;
        const y    = PAD.t + innerH - barH;
        const x    = xs[i] - barW / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} fillOpacity={0.8} />
            <text x={xs[i]} y={y - 3} textAnchor="middle"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fill: color, fontWeight: 700 }}>
              {p.value}%
            </text>
            <text x={xs[i]} y={height - 4} textAnchor="middle"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: C.muted }}>
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DataCharts({ cohorts }: { cohorts: FacReportCohort[] }) {
  const completed = cohorts
    .filter(c => c.status === 'completed')
    .sort((a, b) => (a.start_date > b.start_date ? 1 : -1));

  // Build chart data — label = Book # + short date
  const makeLabel = (c: FacReportCohort, i: number) =>
    completed.length <= 6 ? `B${c.book_number}` : `#${i + 1}`;

  // Completion rate bar chart
  const completionPoints: ChartPoint[] = completed
    .filter(c => c.completion_rate != null)
    .map((c, i) => ({ label: makeLabel(c, i), value: c.completion_rate! }));

  // Avg outcome rating trend
  const outcomePoints: ChartPoint[] = completed
    .filter(c => c.avg_outcome_rating != null)
    .map((c, i) => ({ label: makeLabel(c, i), value: c.avg_outcome_rating! }));

  // Per-dimension radar-style breakdown (last completed cohort)
  const lastWithOutcome = [...completed].reverse().find(c => c.outcome_ratings);
  const dims = lastWithOutcome?.outcome_ratings
    ? [
        { key: 'grief_intensity', label: 'Grief Intensity',   val: lastWithOutcome.outcome_ratings.grief_intensity ?? 0 },
        { key: 'connection',      label: 'Connection',        val: lastWithOutcome.outcome_ratings.connection      ?? 0 },
        { key: 'self_care',       label: 'Self-Care',         val: lastWithOutcome.outcome_ratings.self_care        ?? 0 },
        { key: 'hope',            label: 'Hope',              val: lastWithOutcome.outcome_ratings.hope             ?? 0 },
      ]
    : null;

  if (completed.length === 0) {
    return (
      <div style={{ ...card }}>
        <h2 style={sectionTitle}>My Progress Over Time</h2>
        <div style={{ padding: '1.5rem', background: C.bg, borderRadius: 8, textAlign: 'center' as const }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.muted, margin: 0, lineHeight: 1.7 }}>
            Your progress charts will appear here after you complete your first cohort.<br />
            <span style={{ color: C.navy, fontWeight: 600 }}>You&apos;re building something meaningful — keep going.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...card }}>
      <h2 style={sectionTitle}>My Progress Over Time</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, margin: '-0.5rem 0 1.5rem', lineHeight: 1.6 }}>
        These are your trends across all completed cohorts. Growth isn't always linear — but it's real.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Completion Rate */}
        <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, padding: '1rem' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.navy, fontSize: '0.85rem', marginBottom: 4 }}>
            Completion Rates by Cohort
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, marginBottom: 12 }}>
            % of enrolled participants who completed the full program
          </div>
          <MiniBarChart points={completionPoints} color={C.success} height={100} />
          {completionPoints.length >= 2 && (() => {
            const first = completionPoints[0].value;
            const last  = completionPoints[completionPoints.length - 1].value;
            const diff  = last - first;
            return (
              <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                color: diff >= 0 ? C.success : C.warn, fontWeight: 600 }}>
                {diff >= 0 ? `↑ Up ${diff}% from your first cohort` : `↓ ${Math.abs(diff)}% from your first cohort`}
              </div>
            );
          })()}
        </div>

        {/* Outcome Rating Trend */}
        <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, padding: '1rem' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.navy, fontSize: '0.85rem', marginBottom: 4 }}>
            Average Outcome Rating Trend
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, marginBottom: 12 }}>
            Your observed improvement ratings across cohorts (1–5 scale)
          </div>
          <SparkLine points={outcomePoints} color={C.gold} height={100} />
          {outcomePoints.length >= 2 && (() => {
            const first = outcomePoints[0].value;
            const last  = outcomePoints[outcomePoints.length - 1].value;
            const diff  = Math.round((last - first) * 10) / 10;
            return (
              <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                color: diff >= 0 ? C.gold : C.muted, fontWeight: 600 }}>
                {diff >= 0
                  ? `↑ ${diff} points higher than your first cohort`
                  : `${diff} compared to your first cohort`}
              </div>
            );
          })()}
        </div>

        {/* Per-dimension breakdown (most recent cohort) */}
        {dims && (
          <div style={{ background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, padding: '1rem',
            gridColumn: 'span 1' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.navy, fontSize: '0.85rem', marginBottom: 4 }}>
              Most Recent Cohort — Outcome Dimensions
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, marginBottom: 16 }}>
              Your observed improvement in each dimension for your last completed cohort
            </div>
            {dims.map(d => (
              <div key={d.key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.navy, fontWeight: 600 }}>
                    {d.label}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.gold, fontWeight: 700 }}>
                    {d.val}/5
                  </span>
                </div>
                <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(d.val / 5) * 100}%`, height: '100%',
                    background: d.val >= 4 ? C.success : d.val >= 3 ? C.gold : C.warn,
                    borderRadius: 99, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted, lineHeight: 1.5, fontStyle: 'italic' }}>
              These reflect your facilitated observations — the real transformation you witnessed in your group.
            </div>
          </div>
        )}
      </div>

      {/* Encouragement footer */}
      <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: C.goldLt,
        borderRadius: 8, border: `1px solid ${C.gold}30` }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: C.navy,
          margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
          &ldquo;The companion does not set the agenda but is present to the mourner&rsquo;s needs.
          Your presence is the intervention.&rdquo;
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, margin: '6px 0 0' }}>
          — Live and Grieve™ Companioning Framework
        </p>
      </div>
    </div>
  );
}

/* ── Get Support Tab ── */
type ConsultRequest = {
  id: string; request_type: string; description: string;
  week_number: string | null; status: string; created_at: string;
};

const REQUEST_TYPES = [
  'Curriculum question',
  'Group dynamics',
  'Participant concern',
  'Critical incident follow-up',
  'Other',
] as const;

function SupportTab() {
  const [requests, setRequests]   = useState<ConsultRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({
    request_type: '' as string,
    description: '',
    week_number: '',
  });

  useEffect(() => {
    fetch('/api/hub/consultation-requests')
      .then(r => r.json())
      .then(d => setRequests(d.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.request_type) { setError('Please select a request type.'); return; }
    if (!form.description.trim()) { setError('Please describe your question or concern.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hub/consultation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      setSubmitted(true);
      setForm({ request_type: '', description: '', week_number: '' });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor = (s: string) =>
    s === 'pending' ? '#A0843A' : s === 'in_progress' ? '#2E5FA3' : '#2E7D4F';

  return (
    <div>
      {/* Submit form */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem',
          color: C.navy, marginBottom: '0.25rem' }}>Request Consultation Support</h3>
        <p style={{ color: C.muted, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Wayne or Jamie will follow up within 2 business days.
        </p>

        {submitted ? (
          <div style={{ background: '#F0F7F0', border: '1px solid #B8D8B8', borderRadius: 8,
            padding: '1rem', color: '#2E5D2E', fontSize: '0.9rem' }}>
            ✅ Your request has been sent. Wayne or Jamie will follow up within 2 business days.
            <button onClick={() => setSubmitted(false)}
              style={{ display: 'block', marginTop: '0.75rem', background: 'none', border: 'none',
                color: C.gold, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: C.navy, marginBottom: '0.35rem' }}>Request Type *</label>
              <select value={form.request_type}
                onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}
                disabled={submitting}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 6,
                  border: `1px solid ${C.border}`, fontSize: '0.875rem', color: form.request_type ? C.navy : C.muted,
                  background: C.white, appearance: 'auto' }}>
                <option value="">— Select type —</option>
                {REQUEST_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: C.navy, marginBottom: '0.35rem' }}>
                Brief Description * <span style={{ color: C.muted, fontWeight: 400 }}>
                  ({form.description.length}/500)
                </span>
              </label>
              <textarea value={form.description} rows={4}
                onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 500) }))}
                disabled={submitting}
                placeholder="Describe your question or situation..."
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 6,
                  border: `1px solid ${C.border}`, fontSize: '0.875rem', color: C.navy,
                  resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: C.navy, marginBottom: '0.35rem' }}>
                Week or Session Number <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" value={form.week_number}
                onChange={e => setForm(f => ({ ...f, week_number: e.target.value }))}
                disabled={submitting}
                placeholder="e.g. Week 4, Session 2"
                style={{ width: '100%', maxWidth: 240, padding: '0.6rem 0.75rem', borderRadius: 6,
                  border: `1px solid ${C.border}`, fontSize: '0.875rem', color: C.navy,
                  boxSizing: 'border-box' }} />
            </div>

            {error && (
              <p style={{ color: '#C0392B', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
            )}

            <button type="submit" disabled={submitting}
              style={{ ...btn(C.gold, '#fff', true), opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Sending…' : 'Send Request'}
            </button>
          </form>
        )}
      </div>

      {/* Past requests */}
      <div>
        <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem',
          color: C.navy, marginBottom: '0.75rem' }}>Your Past Requests</h4>
        {loading ? (
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>Loading…</p>
        ) : requests.length === 0 ? (
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>No requests submitted yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map(r => (
              <div key={r.id} style={{ background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: C.navy }}>{r.request_type}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor(r.status),
                    background: `${statusColor(r.status)}18`, borderRadius: 20, padding: '2px 10px',
                    textTransform: 'capitalize' }}>{r.status.replace('_', ' ')}</span>
                </div>
                {r.week_number && (
                  <p style={{ fontSize: '0.78rem', color: C.muted, marginBottom: '0.35rem' }}>
                    Week/Session: {r.week_number}
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', color: C.navy, marginBottom: '0.5rem',
                  lineHeight: 1.5 }}>{r.description}</p>
                <p style={{ fontSize: '0.75rem', color: C.muted }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Full Reports Tab shell ── */
function ReportsTab({ profile }: { profile: Profile }) {
  const [report,   setReport]  = useState<FacReport | null>(null);
  const [loading,  setLoading] = useState(true);
  const [err,      setErr]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/reports/facilitator/${profile.id}`);
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setErr(d.error ?? `Error ${r.status}`);
          setLoading(false);
          return;
        }
        const d = await r.json();
        setReport(d);
      } catch (e) { setErr(String(e)); }
      setLoading(false);
    }
    load();
  }, [profile.id]);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center' as const, fontFamily: 'Inter, sans-serif', color: C.muted }}>
      Loading your impact data…
    </div>
  );

  if (err || !report) return (
    <div style={{ ...card, borderLeft: `3px solid ${C.danger}` }}>
      <p style={{ fontFamily: 'Inter, sans-serif', color: C.danger, margin: 0 }}>
        {err || 'Could not load report data.'}
      </p>
    </div>
  );

  return (
    <>
      {/* Section 1 */}
      <ImpactTiles totals={report.totals} />

      {/* Section 2 */}
      <CohortReportsList cohorts={report.cohort_summaries} facId={profile.id} />

      {/* Section 3 */}
      <DataCharts cohorts={report.cohort_summaries} />
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT DASHBOARD
═════════════════════════════════════════════════════════════*/
type Tab = 'overview' | 'documents' | 'cohorts' | 'codes' | 'reports' | 'support';

export default function HubDashboard() {
  const router = useRouter();

  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [documents,     setDocuments]     = useState<Document[]>([]);
  const [cohorts,       setCohorts]       = useState<Cohort[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'reports' || p === 'cohorts' || p === 'documents' || p === 'codes' || p === 'support') return p as Tab;
    }
    return 'overview';
  });
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

  const TAB_LABELS: Record<Tab, string> = {
    overview: 'Overview', documents: 'Documents', cohorts: 'My Cohorts', codes: 'Codes', reports: 'My Reports', support: 'Get Support',
  };

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
            <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '0.875rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="https://tripillarstudio.com" style={{ color: 'rgba(248,244,238,0.55)', fontSize: '0.78rem', textDecoration: 'none', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              ← tripillarstudio.com
            </a>
            <button onClick={logout} style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>
              Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`,
          display: 'flex', padding: '0 1.25rem', position: 'sticky', top: 58, zIndex: 99,
          overflowX: 'auto' }}>
          {(['overview', 'documents', 'cohorts', 'codes', 'reports', 'support'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
              padding: '0.85rem 1rem', whiteSpace: 'nowrap',
              borderBottom: tab === t ? `3px solid ${C.gold}` : '3px solid transparent',
              color: tab === t ? C.navy : C.muted,
            }}>{TAB_LABELS[t]}</button>
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
          {tab === 'documents' && <DocumentsCard documents={documents} />}
          {tab === 'cohorts'   && <CohortsCard cohorts={cohorts} onAdded={loadHub} />}
          {tab === 'codes'     && <CodesCard profile={profile} cohorts={cohorts} />}
          {tab === 'reports'   && <ReportsTab profile={profile} />}
          {tab === 'support'  && <SupportTab />}
        </div>
      </div>
    </>
  );
}
