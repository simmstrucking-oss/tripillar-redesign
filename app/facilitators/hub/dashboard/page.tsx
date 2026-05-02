'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import SignatureField from '@/app/components/SignatureField';
import { WEEK1_CONTENT, IWG_CONTENT, PAG_CONTENT, COC_CONTENT, type DocParagraph } from '@/lib/week1-content';

/* ── Fonts ── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

/* ── Design tokens ── */
const C = {
  navy:   '#1c3028',
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
  status?: string;
  onboarding_checklist?: Record<string, boolean>;
  onboarding_complete?: boolean;
  training_date?: string;
  training_location?: string;
  training_confirmed?: boolean;
  dismissed_orientation?: boolean;
  lgy_certified_tracks?: string[] | null;
  lgy_trainer?: boolean;
  lgy_authorized_tracks?: string[] | null;
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
  1: 'In The Quiet', 2: 'Through The Weight',
  3: 'Toward the Light', 4: 'With the Memory',
  
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

/* ── Documents Library ── */
interface DocLibDoc {
  name: string; bucket: string; path: string; url: string | null;
  locked: boolean; lockReason: string | null;
}
interface DocLibSection {
  title: string; program_type: string; documents: DocLibDoc[];
}

function DocumentsLibrary({ profile }: { profile: Profile | null }) {
  const [sections, setSections]   = useState<DocLibSection[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [physicalNotice, setPhysicalNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetch('/api/hub/documents', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setSections(data.sections ?? []);
        setPhysicalNotice(data.physicalMaterialsNotice ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [profile]);

  async function download(doc: DocLibDoc) {
    if (doc.locked || !doc.url) return;
    setDownloading(doc.path);
    // Re-fetch fresh signed URL
    const res = await fetch('/api/hub/documents', { credentials: 'include' });
    const data = await res.json();
    const freshSections: DocLibSection[] = data.sections ?? [];
    let freshUrl: string | null = null;
    for (const s of freshSections) {
      const found = s.documents.find(d => d.path === doc.path);
      if (found?.url) { freshUrl = found.url; break; }
    }
    if (freshUrl) window.open(freshUrl, '_blank');
    else alert('Download link unavailable. Please refresh and try again.');
    setDownloading(null);
  }

  const visibleSections = sections
    .map(s => ({ ...s, documents: s.documents.filter(d => !d.locked) }))
    .filter(s => s.documents.length > 0);

  const filtered = search
    ? visibleSections.map(s => ({
        ...s,
        documents: s.documents.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
      })).filter(s => s.documents.length > 0)
    : visibleSections;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ ...sectionTitle, margin: 0 }}>Document Library</h2>
        <input
          type="text" placeholder="Search documents..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, width: 220, fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
        />
      </div>

      {physicalNotice && !loading && (
        <div style={{
          background: '#F9F7F3', border: `1px solid ${C.goldLt}`, borderRadius: 8,
          padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: '1rem' }}>📚</span>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, margin: 0 }}>
            {physicalNotice}
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>Loading documents...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
          {search ? 'No documents match your search.' : 'No documents available yet.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filtered.map(section => (
            <div key={section.title}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.navy,
                fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.35rem',
                borderBottom: `2px solid ${C.goldLt}` }}>
                {section.title}
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {section.documents.map(doc => (
                  <div key={doc.path} style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0.7rem 0.85rem', borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.bg, gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600,
                          color: C.navy, fontSize: '0.85rem' }}>
                          {doc.name.replace(/\.docx$/, '').replace(/^LG_/, '').replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => download(doc)}
                        disabled={downloading === doc.path}
                        style={{ ...btn(C.navy, '#fff', true),
                          opacity: downloading === doc.path ? 0.6 : 1 }}>
                        {downloading === doc.path ? '...' : '↓ Download'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {profile?.role !== "super_admin" && (profile?.books_certified?.length ?? 0) > 0 && (profile?.books_certified?.length ?? 0) < 4 && (
            <p style={{ color: C.muted, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", marginTop: 16, textAlign: "center" }}>
              Additional materials become available as you complete certification for each book.
            </p>
          )}
        </div>
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
  session_delivered?: boolean; observation?: string;
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

/* ── Shared print utility ── */
function printForm(title: string, rows: { label: string; value: string | number | boolean | null | undefined }[]) {
  const rowsHtml = rows.map(r => {
    const val = r.value === true ? 'Yes' : r.value === false ? 'No' : (r.value ?? '—');
    return `<div class="row"><div class="label">${r.label}</div><div class="value">${String(val).replace(/\n/g, '<br>') || '—'}</div></div>`;
  }).join('');
  const win = window.open('', '_blank')!;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
body{font-family:Georgia,serif;max-width:680px;margin:40px auto;color:#1a1a1a;font-size:0.95rem;line-height:1.6}
h1{font-family:Georgia,serif;font-size:1.4rem;color:#1c3028;margin:0 0 4px}
.sub{font-size:0.8rem;color:#888;margin:0 0 24px}
.row{border-bottom:1px solid #e5e5e5;padding:10px 0;display:grid;grid-template-columns:200px 1fr;gap:16px}
.label{font-family:Arial,sans-serif;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9a7b2f;padding-top:2px}
.value{color:#1c3028;white-space:pre-wrap}
.note{font-size:0.75rem;color:#aaa;margin-top:32px;border-top:1px solid #eee;padding-top:10px}
@media print{button{display:none}}
</style></head><body>
<h1>${title}</h1>
<p class="sub">Live and Grieve™ · Tri-Pillars™ LLC · Printed ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
${rowsHtml}
<p class="note">This document was generated from the Live and Grieve™ Facilitator Hub. Keep for your records.</p>
</body></html>`);
  win.document.close();
  win.print();
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
    session_delivered: log?.session_delivered ?? true,
    observation: log?.observation ?? '',
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
        session_delivered: form.session_delivered,
        observation: form.observation || null,
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

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.session_delivered}
                onChange={e => set('session_delivered', e.target.checked)}
                style={{ width: 16, height: 16 }} />
              <span>Full session delivered?</span>
            </label>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>One observation — what stood out? Any concerns?
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                — Optional, max 500 characters
              </span>
            </label>
            <textarea style={{ ...inp, height: 60, resize: 'vertical' }} maxLength={500}
              placeholder="What stood out this week…"
              value={form.observation} onChange={e => set('observation', e.target.value)} />
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

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <button type="submit" disabled={saving} style={btn(C.navy, '#fff', true)}>
              {saving ? 'Saving…' : 'Save Session Log'}
            </button>
            <button type="button" onClick={() => printForm(`Session ${weekNum} Log`, [
              { label: 'Week', value: weekNum },
              { label: 'Duration (min)', value: form.session_duration_minutes },
              { label: 'Participants Attended', value: form.participants_attended },
              { label: 'Session Delivered', value: form.session_delivered },
              { label: 'Group Stable', value: form.group_composition_stable },
              { label: 'Co-Facilitated', value: form.co_facilitated },
              { label: 'Confidence Rating', value: form.facilitator_confidence_rating },
              { label: 'Notes', value: form.notes },
              { label: 'Observation', value: form.observation },
              { label: 'Critical Incident', value: form.critical_incident },
            ])} style={btn(C.muted, '#fff', true)}>↓ Print / Save PDF</button>
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <button type="submit" disabled={saving} style={btn(C.navy, '#fff')}>
          {saving ? 'Saving…' : 'Save Pre-Program Data'}
        </button>
        <button type="button" onClick={() => printForm('Pre-Program Setup', [
          { label: 'Participant Count', value: partCount },
          { label: 'Setting Type', value: settingType },
          { label: 'Community Type', value: communityType },
          { label: 'Time Since Loss', value: timeSinceLoss },
          { label: 'Age Ranges', value: Object.entries(ageRanges).filter(([,v])=>Number(v)>0).map(([k,v])=>`${AGE_LABELS[k]}: ${v}`).join(', ') || '—' },
          { label: 'Loss Types', value: Object.entries(lossTypes).filter(([,v])=>Number(v)>0).map(([k,v])=>`${LOSS_LABELS[k]}: ${v}`).join(', ') || '—' },
          { label: 'Prior Support', value: Object.entries(priorSupport).filter(([,v])=>Number(v)>0).map(([k,v])=>`${SUPPORT_LABELS[k]}: ${v}`).join(', ') || '—' },
        ])} style={btn(C.muted, '#fff')}>↓ Print / Save PDF</button>
      </div>
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
          Tri-Pillars™ has been notified.
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <button type="submit" disabled={saving} style={btn(C.gold, '#fff')}>
          {saving ? 'Submitting…' : 'Submit Outcomes & Generate Report'}
        </button>
        <button type="button" onClick={() => printForm('Post-Program Outcomes', [
          { label: 'Participants Completed', value: postCount },
          { label: 'Grief Intensity Rating', value: grief },
          { label: 'Connection Rating', value: connection },
          { label: 'Self-Care Rating', value: selfCare },
          { label: 'Hope Rating', value: hope },
          { label: 'Facilitator Observations', value: observations },
        ])} style={btn(C.muted, '#fff')}>↓ Print / Save PDF</button>
      </div>
    </form>
  );
}

/* ── Cohort Completion Summary Form ── */
function CohortSummaryForm({ cohortId, facilitatorId, onCompleted }: {
  cohortId: string; facilitatorId: string; onCompleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    total_enrolled: '', total_completed: '', dropout_reasons: '',
    facilitator_assessment: '', notable_outcomes: '',
    would_run_again: '', curriculum_feedback: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.total_enrolled || !form.total_completed || !form.facilitator_assessment || !form.would_run_again) {
      setMsg('Please fill all required fields.'); return;
    }
    setSaving(true); setMsg('');
    const res = await fetch(`/api/hub/cohorts/${cohortId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facilitator_id: facilitatorId,
        total_enrolled: Number(form.total_enrolled),
        total_completed: Number(form.total_completed),
        dropout_reasons: form.dropout_reasons || null,
        facilitator_assessment: form.facilitator_assessment,
        notable_outcomes: form.notable_outcomes || null,
        would_run_again: form.would_run_again === 'yes',
        curriculum_feedback: form.curriculum_feedback || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Cohort marked complete. Tri-Pillars™ has been notified.');
      onCompleted();
    } else {
      const d = await res.json();
      setMsg('Error: ' + d.error);
    }
  }

  if (!open) {
    return (
      <div style={{ marginTop: '1.25rem' }}>
        <button onClick={() => setOpen(true)} style={btn(C.navy, '#fff')}>
          Mark Complete &amp; Submit Summary
        </button>
      </div>
    );
  }

  if (msg && !msg.startsWith('Error') && msg.includes('complete')) {
    return (
      <div style={{ marginTop: '1.25rem', background: '#F0FAF4', border: '1px solid #86EFAC',
        borderRadius: 10, padding: '1.25rem' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem',
          color: '#166534', margin: 0, fontWeight: 700 }}>
          ✓ {msg}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ marginTop: '1.25rem', background: '#FAFAF8',
      border: `1px solid ${C.border}`, borderRadius: 10, padding: '1.25rem' }}>
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: C.navy,
        margin: '0 0 0.5rem' }}>
        Cohort Completion Summary
      </h3>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted,
        margin: '0 0 1rem', fontStyle: 'italic' }}>
        Completing this form will mark the cohort as finished. Tri-Pillars™ will receive a notification.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={fieldLabel}>Total Participants Enrolled *</label>
          <input type="number" min="0" style={{ ...inp, width: 120 }}
            value={form.total_enrolled} onChange={e => set('total_enrolled', e.target.value)} required />
        </div>
        <div>
          <label style={fieldLabel}>Total Participants Completed *</label>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: C.muted, margin: '0 0 4px' }}>
            Attended 10 or more of 13 sessions
          </p>
          <input type="number" min="0" style={{ ...inp, width: 120 }}
            value={form.total_completed} onChange={e => set('total_completed', e.target.value)} required />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={fieldLabel}>Dropout Reasons (if known)</label>
        <textarea style={{ ...inp, height: 60, resize: 'vertical' }}
          placeholder="e.g. scheduling conflicts, moved away, personal reasons…"
          value={form.dropout_reasons} onChange={e => set('dropout_reasons', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={fieldLabel}>Overall Cohort Assessment *</label>
          <select style={inp} value={form.facilitator_assessment}
            onChange={e => set('facilitator_assessment', e.target.value)} required>
            <option value="">— Select —</option>
            <option value="Strong">Strong</option>
            <option value="Moderate">Moderate</option>
            <option value="Challenging">Challenging</option>
          </select>
        </div>
        <div>
          <label style={fieldLabel}>Would you run this cohort again? *</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: 6 }}>
            {['yes', 'no'].map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy, cursor: 'pointer' }}>
                <input type="radio" name="would_run_again" value={v}
                  checked={form.would_run_again === v}
                  onChange={() => set('would_run_again', v)} />
                {v === 'yes' ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={fieldLabel}>Notable Outcomes or Milestones</label>
        <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
          placeholder="Breakthroughs, group dynamics, participant growth moments…"
          value={form.notable_outcomes} onChange={e => set('notable_outcomes', e.target.value)} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={fieldLabel}>Curriculum Feedback for Tri-Pillars</label>
        <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
          placeholder="Suggestions for content, pacing, structure, or resources…"
          value={form.curriculum_feedback} onChange={e => set('curriculum_feedback', e.target.value)} />
      </div>

      {msg && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
          color: msg.startsWith('Error') ? C.danger : C.success,
          margin: '0 0 0.75rem', fontWeight: 600 }}>{msg}</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const }}>
        <button type="submit" disabled={saving} style={btn(C.navy, '#fff')}>
          {saving ? 'Submitting…' : 'Submit Summary & Complete Cohort'}
        </button>
        <button type="button" onClick={() => printForm('Cohort Completion Summary', [
          { label: 'Total Enrolled', value: form.total_enrolled },
          { label: 'Total Completed', value: form.total_completed },
          { label: 'Dropout Reasons', value: form.dropout_reasons },
          { label: 'Facilitator Assessment', value: form.facilitator_assessment },
          { label: 'Would Run Again', value: form.would_run_again },
          { label: 'Notable Outcomes', value: form.notable_outcomes },
          { label: 'Curriculum Feedback', value: form.curriculum_feedback },
        ])} style={btn(C.muted, '#fff')}>↓ Print / Save PDF</button>
        <button type="button" onClick={() => setOpen(false)} style={btn(C.border, C.navy, true)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Main Cohorts Card ── */
function CohortsCard({ cohorts, profile, onAdded }: { cohorts: Cohort[]; profile: Profile; onAdded: () => void }) {
  const [showForm,    setShowForm]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState('');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<Record<string, SessionLog[]>>({});
  const [outcomes,    setOutcomes]    = useState<Record<string, CohortOutcome>>({});
  const [feedbackData, setFeedbackData] = useState<Record<string, { session_number: number; participants_present: number; forms_collected: number; avg_satisfaction: number | null }[]>>({});
  const [form, setForm] = useState({
    book_number: '', start_date: '', end_date: '',
    participant_count: '', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function loadCohortData(cohortId: string) {
    const [logsRes, outcomeRes, feedbackRes] = await Promise.all([
      fetch(`/api/hub/session-logs?cohort_id=${cohortId}`),
      fetch(`/api/hub/cohort-outcomes?cohort_id=${cohortId}`),
      fetch(`/api/hub/session-feedback?cohort_id=${cohortId}`),
    ]);
    if (logsRes.ok) {
      const d = await logsRes.json();
      setSessionLogs(prev => ({ ...prev, [cohortId]: d.logs ?? [] }));
    }
    if (outcomeRes.ok) {
      const d = await outcomeRes.json();
      if (d.outcome) setOutcomes(prev => ({ ...prev, [cohortId]: d.outcome }));
    }
    if (feedbackRes.ok) {
      const d = await feedbackRes.json();
      setFeedbackData(prev => ({ ...prev, [cohortId]: d.feedback ?? [] }));
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
                {[1,2,3,4].map(b => <option key={b} value={b}>Book {b} — {BOOKS_MAP[b]}</option>)}
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
                  feedback={feedbackData[c.id] ?? null}
                  onDataSaved={() => { loadCohortData(c.id); onAdded(); }}
                  facilitatorId={profile.id}
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
                  feedback={feedbackData[c.id] ?? null}
                  onDataSaved={() => { loadCohortData(c.id); onAdded(); }}
                  facilitatorId={profile.id}
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
function CohortExpandRow({ c, expanded, onToggle, logs, outcome, feedback, onDataSaved, facilitatorId }: {
  c: Cohort; expanded: boolean; onToggle: () => void;
  logs: SessionLog[] | null; outcome?: CohortOutcome;
  feedback: { session_number: number; participants_present: number; forms_collected: number; avg_satisfaction: number | null }[] | null;
  onDataSaved: () => void;
  facilitatorId: string;
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

          {/* 2D — Cohort Completion Summary (only for non-completed cohorts) */}
          {c.status !== 'completed' && (
            <CohortSummaryForm cohortId={c.id} facilitatorId={facilitatorId} onCompleted={onDataSaved} />
          )}

          {/* Satisfaction Trend */}
          {feedback && feedback.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em',
                margin: '0 0 0.75rem' }}>
                Satisfaction Trend
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {['Session', 'Participants', 'Forms', 'Avg Rating'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: C.muted,
                          fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map(fb => (
                      <tr key={fb.session_number} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '0.45rem 0.75rem', color: C.navy, fontWeight: 500 }}>Session {fb.session_number}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: C.navy }}>{fb.participants_present}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: C.navy }}>{fb.forms_collected}</td>
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600,
                          color: fb.avg_satisfaction != null && fb.avg_satisfaction < 3 ? C.danger
                            : fb.avg_satisfaction != null && fb.avg_satisfaction >= 4 ? C.success : C.navy }}>
                          {fb.avg_satisfaction != null ? fb.avg_satisfaction.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${C.border}`, background: C.bg }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: C.navy }} colSpan={3}>Overall Average</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: C.gold }}>
                        {(() => {
                          const rated = feedback.filter(f => f.avg_satisfaction != null);
                          if (rated.length === 0) return '—';
                          const avg = rated.reduce((s, f) => s + Number(f.avg_satisfaction), 0) / rated.length;
                          return avg.toFixed(1);
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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

/* ── Submit Feedback Tab ── */
const SATISFACTION_OPTIONS = [
  { value: '1',   label: '1 — Very Low' },
  { value: '1.5', label: '1.5' },
  { value: '2',   label: '2 — Low' },
  { value: '2.5', label: '2.5' },
  { value: '3',   label: '3 — Moderate' },
  { value: '3.5', label: '3.5' },
  { value: '4',   label: '4 — High' },
  { value: '4.5', label: '4.5' },
  { value: '5',   label: '5 — Very High' },
] as const;

function FeedbackTab({ profile, cohorts }: { profile: Profile; cohorts: Cohort[] }) {
  const activeCohorts = cohorts.filter(c => c.status === 'active');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    cohort_id: '', session_number: '', participants_present: '',
    forms_collected: '', avg_satisfaction: '', themes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setMsg(null);
    try {
      const res = await fetch('/api/hub/session-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort_id: form.cohort_id,
          session_number: Number(form.session_number),
          participants_present: Number(form.participants_present),
          forms_collected: Number(form.forms_collected),
          avg_satisfaction: form.avg_satisfaction ? Number(form.avg_satisfaction) : null,
          themes: form.themes || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: 'Feedback submitted successfully.', ok: true });
        setForm({ cohort_id: '', session_number: '', participants_present: '', forms_collected: '', avg_satisfaction: '', themes: '' });
      } else {
        setMsg({ text: data.error ?? 'Submission failed.', ok: false });
      }
    } catch {
      setMsg({ text: 'Network error. Please try again.', ok: false });
    }
    setSubmitting(false);
  }

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Submit Session Feedback</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, margin: '0 0 1.25rem' }}>
        After collecting participant feedback forms, submit a summary here for each session.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={fieldLabel}>Cohort *</label>
            <select style={inp} value={form.cohort_id} onChange={e => set('cohort_id', e.target.value)} required>
              <option value="">— Select Cohort —</option>
              {activeCohorts.map(c => (
                <option key={c.id} value={c.id}>Book {c.book_number} — {BOOKS_MAP[c.book_number] ?? ''} ({c.start_date})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Session Number *</label>
            <select style={inp} value={form.session_number} onChange={e => set('session_number', e.target.value)} required>
              <option value="">— Select —</option>
              {Array.from({ length: 13 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>Session {n}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Participants Present *</label>
            <input type="number" min="0" style={inp} value={form.participants_present}
              onChange={e => set('participants_present', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Feedback Forms Collected *</label>
            <input type="number" min="0" style={inp} value={form.forms_collected}
              onChange={e => set('forms_collected', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Average Satisfaction Rating</label>
            <select style={inp} value={form.avg_satisfaction} onChange={e => set('avg_satisfaction', e.target.value)}>
              <option value="">— Select —</option>
              {SATISFACTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={fieldLabel}>Themes or Notable Comments</label>
          <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
            value={form.themes} onChange={e => set('themes', e.target.value)}
            placeholder="Any recurring themes, notable feedback, or observations from participants…" />
        </div>

        {msg && (
          <p style={{ fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500,
            color: msg.ok ? C.success : C.danger, margin: '0 0 0.75rem' }}>
            {msg.text}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          <button type="submit" disabled={submitting} style={btn(C.navy, '#fff')}>
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
          <button type="button" onClick={() => printForm('Session Feedback', [
            { label: 'Session Number', value: form.session_number },
            { label: 'Participants Present', value: form.participants_present },
            { label: 'Forms Collected', value: form.forms_collected },
            { label: 'Avg Satisfaction', value: form.avg_satisfaction },
            { label: 'Themes / Comments', value: form.themes },
          ])} style={btn(C.muted, '#fff')}>↓ Print / Save PDF</button>
        </div>
      </form>
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

/* ── Youth (LGY) Tab ── */
function YouthTab({ profile }: { profile: Profile }) {
  const tracks: string[] = profile.lgy_certified_tracks ?? [];
  const hasElementary = tracks.includes('elementary');
  const hasMH = tracks.includes('middle_high');

  interface LgyDoc { path: string; label: string; url: string; category: string; }
  interface LgySections { [key: string]: { label: string; docs: LgyDoc[] }; }
  const [sections, setSections]     = useState<LgySections>({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch('/api/hub/lgy-documents', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setSections(d.sections ?? {}))
      .catch(() => setError('Could not load Youth documents.'))
      .finally(() => setLoading(false));
  }, []);

  const sectionOrder = ['shared', 'elementary', 'middle_high'];
  const sectionColors: Record<string, string> = {
    shared: '#1B2B4B',
    elementary: '#2E6B4F',
    middle_high: '#5B3A8C',
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.35rem', color: '#1B2B4B', margin: '0 0 0.4rem' }}>
          Live and Grieve™ Youth
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
          {tracks.length === 0
            ? 'No LGY tracks assigned. Contact Tri-Pillars™ to add your certification.'
            : `Certified tracks: ${[
                hasElementary ? 'Elementary (Ages 8–12)' : null,
                hasMH ? 'Middle/High (Ages 13–17)' : null,
              ].filter(Boolean).join(', ')}`}
        </p>
      </div>

      {tracks.length === 0 && (
        <div style={{ background: '#FFF9EC', border: '1px solid #C9A84C', borderRadius: 8,
          padding: '1rem 1.25rem', color: '#6B4F0A', fontSize: '0.875rem' }}>
          Your Youth certification tracks will appear here once Tri-Pillars™ assigns them after your LGY training is complete.
        </div>
      )}

      {loading && tracks.length > 0 && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Loading documents…</p>
      )}
      {error && (
        <p style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</p>
      )}

      {!loading && !error && sectionOrder.map(key => {
        const section = sections[key];
        if (!section) return null;
        const color = sectionColors[key] ?? '#1B2B4B';
        return (
          <div key={key} style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color,
              margin: '0 0 0.85rem', paddingBottom: '0.5rem',
              borderBottom: `2px solid ${color}20` }}>
              {section.label}
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {section.docs.map((doc: LgyDoc) => (
                <a key={doc.path} href={doc.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 1rem', borderRadius: 8, textDecoration: 'none',
                    background: '#F9F7F3', border: '1px solid #E5E0D8',
                    color: '#1B2B4B', fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background 0.15s' }}>
                  <span style={{ fontSize: '1.1rem' }}>📄</span>
                  {doc.label}
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    Download ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
          your Tri-Pillars™ support team will follow up within 2 business days.
        </p>

        {submitted ? (
          <div style={{ background: '#F0F7F0', border: '1px solid #B8D8B8', borderRadius: 8,
            padding: '1rem', color: '#2E5D2E', fontSize: '0.9rem' }}>
            ✅ Your request has been sent. your Tri-Pillars™ support team will follow up within 2 business days.
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
   INCIDENT TAB
═════════════════════════════════════════════════════════════*/
const PARTICIPANT_STATUSES = ['Stable', 'Referred to professional', 'Unknown', '911 called'] as const;

function IncidentTab({ profile, cohorts }: { profile: Profile; cohorts: Cohort[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({
    incident_date: '',
    session_number: '',
    cohort_id: '',
    description: '',
    action_taken: '',
    followup_planned: '',
    participant_status: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.incident_date)       { setError('Date of incident is required.'); return; }
    if (!form.description.trim())  { setError('Please provide a brief description.'); return; }
    if (!form.participant_status)  { setError('Participant status is required.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hub/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilitator_id: profile.id,
          facilitator_name: profile.full_name,
          cert_id: profile.cert_id,
          cohort_id: form.cohort_id || null,
          incident_date: form.incident_date,
          session_number: form.session_number ? Number(form.session_number) : null,
          description: form.description,
          action_taken: form.action_taken || null,
          followup_planned: form.followup_planned || null,
          participant_status: form.participant_status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      setSubmitted(true);
      setForm({ incident_date: '', session_number: '', cohort_id: '', description: '', action_taken: '', followup_planned: '', participant_status: '' });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const activeCohorts = cohorts.filter(c => c.status === 'active' || c.status === 'in_progress');

  return (
    <div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem',
          color: C.navy, marginBottom: '0.25rem' }}>Critical Incident Report</h3>
        <p style={{ color: C.muted, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Use this form to report any critical incident that occurred during a session. Tri-Pillars™ will be notified immediately.
        </p>

        {submitted ? (
          <div style={{ background: '#F0F7F0', border: '1px solid #B8D8B8', borderRadius: 8,
            padding: '1rem', color: '#2E5D2E', fontSize: '0.9rem' }}>
            Your report has been submitted and Tri-Pillars™ has been notified. Keep a printed copy for your records.
            <button onClick={() => setSubmitted(false)}
              style={{ display: 'block', marginTop: '0.75rem', background: 'none', border: 'none',
                color: C.gold, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
              Submit another report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Date of Incident */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={fieldLabel}>Date of Incident *</label>
              <input type="date" value={form.incident_date}
                onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))}
                disabled={submitting} style={inp} required />
            </div>

            {/* Session Number */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={fieldLabel}>Session Number</label>
              <input type="number" min={1} max={52} placeholder="e.g. 3"
                value={form.session_number}
                onChange={e => setForm(f => ({ ...f, session_number: e.target.value }))}
                disabled={submitting} style={inp} />
            </div>

            {/* Cohort */}
            {activeCohorts.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabel}>Cohort</label>
                <select value={form.cohort_id}
                  onChange={e => setForm(f => ({ ...f, cohort_id: e.target.value }))}
                  disabled={submitting}
                  style={{ ...inp, appearance: 'auto', color: form.cohort_id ? C.navy : C.muted }}>
                  <option value="">— Select cohort (optional) —</option>
                  {activeCohorts.map(c => (
                    <option key={c.id} value={c.id}>
                      Book {c.book_number} — Started {c.start_date}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={fieldLabel}>Brief Description * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.muted }}>({form.description.length}/1000)</span></label>
              <textarea value={form.description} maxLength={1000} rows={4}
                placeholder="Describe the incident briefly…"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                disabled={submitting}
                style={{ ...inp, resize: 'vertical' as const, minHeight: 90 }} required />
            </div>

            {/* Action Taken */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={fieldLabel}>Action Taken During Session</label>
              <textarea value={form.action_taken} rows={3}
                placeholder="What steps were taken during the session?"
                onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))}
                disabled={submitting}
                style={{ ...inp, resize: 'vertical' as const, minHeight: 70 }} />
            </div>

            {/* Follow-up Planned */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={fieldLabel}>Follow-up Action Planned</label>
              <textarea value={form.followup_planned} rows={3}
                placeholder="What follow-up is planned?"
                onChange={e => setForm(f => ({ ...f, followup_planned: e.target.value }))}
                disabled={submitting}
                style={{ ...inp, resize: 'vertical' as const, minHeight: 70 }} />
            </div>

            {/* Participant Status */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Participant Status *</label>
              <select value={form.participant_status}
                onChange={e => setForm(f => ({ ...f, participant_status: e.target.value }))}
                disabled={submitting}
                style={{ ...inp, appearance: 'auto', color: form.participant_status ? C.navy : C.muted }} required>
                <option value="">— Select status —</option>
                {PARTICIPANT_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {error && (
              <div style={{ background: '#FEE', border: '1px solid #E8B0B0', borderRadius: 8,
                padding: '0.75rem', color: C.danger, fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              <button type="submit" disabled={submitting} style={btn(C.danger)}>
                {submitting ? 'Submitting…' : 'Submit Critical Incident Report'}
              </button>
              <button type="button" onClick={() => printForm('Critical Incident Report', [
                { label: 'Date of Incident', value: form.incident_date },
                { label: 'Session Number', value: form.session_number },
                { label: 'Description', value: form.description },
                { label: 'Action Taken', value: form.action_taken },
                { label: 'Follow-up Planned', value: form.followup_planned },
                { label: 'Participant Status', value: form.participant_status },
              ])} style={btn(C.muted, '#fff')}>↓ Print / Save PDF</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   REFLECTION LOG TAB  —  Private to facilitator, no admin access
═════════════════════════════════════════════════════════════*/
interface Reflection {
  id: string; cohort_id?: string; session_number?: number;
  went_well?: string; challenges?: string; concerns?: string;
  self_care?: boolean; submitted_at: string;
}

function ReflectionTab({ profile, cohorts }: { profile: Profile; cohorts: Cohort[] }) {
  const activeCohorts = cohorts.filter(c => c.status === 'active' || c.status === 'in_progress');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    cohort_id: '', session_number: '', went_well: '', challenges: '', concerns: '', self_care: false,
  });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const loadReflections = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/hub/reflections?facilitator_id=${profile.id}`);
      const data = await res.json();
      if (res.ok) setReflections(data.reflections ?? []);
    } catch { /* silent */ }
    setLoadingHistory(false);
  }, [profile.id]);

  useEffect(() => { loadReflections(); }, [loadReflections]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setMsg(null);
    try {
      const res = await fetch('/api/hub/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilitator_id: profile.id,
          cohort_id: form.cohort_id || null,
          session_number: form.session_number ? Number(form.session_number) : null,
          went_well: form.went_well || null,
          challenges: form.challenges || null,
          concerns: form.concerns || null,
          self_care: form.self_care,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: 'Reflection saved.', ok: true });
        setForm({ cohort_id: '', session_number: '', went_well: '', challenges: '', concerns: '', self_care: false });
        loadReflections();
      } else {
        setMsg({ text: data.error ?? 'Submission failed.', ok: false });
      }
    } catch {
      setMsg({ text: 'Network error. Please try again.', ok: false });
    }
    setSubmitting(false);
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Privacy banner */}
      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10,
        padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🔒</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#3730A3', fontWeight: 600 }}>
          Your reflections are private.
        </span>
      </div>

      {/* Form */}
      <div style={card}>
        <h2 style={sectionTitle}>New Reflection</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={fieldLabel}>Cohort</label>
              <select style={inp} value={form.cohort_id} onChange={e => set('cohort_id', e.target.value)}>
                <option value="">— Select Cohort (optional) —</option>
                {activeCohorts.map(c => (
                  <option key={c.id} value={c.id}>Book {c.book_number} — {BOOKS_MAP[c.book_number] ?? ''} ({c.start_date})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Session Number</label>
              <select style={inp} value={form.session_number} onChange={e => set('session_number', e.target.value)}>
                <option value="">— Select (optional) —</option>
                {Array.from({ length: 13 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Session {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>What Went Well</label>
            <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
              value={form.went_well} onChange={e => set('went_well', e.target.value)}
              placeholder="What worked well in this session…" />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>What Was Challenging</label>
            <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
              value={form.challenges} onChange={e => set('challenges', e.target.value)}
              placeholder="Any difficulties or areas for growth…" />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={fieldLabel}>Any Participant Concerns to Monitor</label>
            <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
              value={form.concerns} onChange={e => set('concerns', e.target.value)}
              placeholder="Participants who may need extra attention…" />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy }}>
              <input type="checkbox" checked={form.self_care}
                onChange={e => set('self_care', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: C.gold }} />
              Self-care practice completed this week
            </label>
          </div>

          {msg && (
            <p style={{ fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500,
              color: msg.ok ? C.success : C.danger, margin: '0 0 0.75rem' }}>
              {msg.text}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <button type="submit" disabled={submitting} style={btn(C.navy, '#fff')}>
              {submitting ? 'Saving…' : 'Save Reflection'}
            </button>
            <button type="button" onClick={() => printForm('Facilitator Reflection', [
              { label: 'Session Number', value: form.session_number },
              { label: 'What Went Well', value: form.went_well },
              { label: 'Challenges', value: form.challenges },
              { label: 'Concerns', value: form.concerns },
              { label: 'Self-Care Practice', value: form.self_care },
            ])} style={btn(C.muted, '#fff')}>↓ Print / Save PDF</button>
          </div>
        </form>
      </div>

      {/* History */}
      <div style={card}>
        <h2 style={sectionTitle}>Your Reflection History</h2>
        {loadingHistory ? (
          <p style={{ color: C.muted, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
        ) : reflections.length === 0 ? (
          <p style={{ color: C.muted, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>No reflections yet.</p>
        ) : (
          <div>
            {reflections.map(r => {
              const date = new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const isOpen = expanded.has(r.id);
              const preview = r.went_well ? (r.went_well.length > 100 ? r.went_well.slice(0, 100) + '…' : r.went_well) : '—';
              return (
                <div key={r.id} style={{ borderBottom: `1px solid ${C.border}`, padding: '0.75rem 0' }}>
                  <div onClick={() => toggleExpand(r.id)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted }}>{date}</span>
                      {r.session_number != null && (
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.navy, marginLeft: '0.75rem', fontWeight: 600 }}>
                          Session {r.session_number}
                        </span>
                      )}
                      {!isOpen && (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {preview}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: C.muted, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                      {r.went_well && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ ...fieldLabel, marginBottom: 2 }}>Went Well</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, margin: 0, whiteSpace: 'pre-wrap' }}>{r.went_well}</p>
                        </div>
                      )}
                      {r.challenges && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ ...fieldLabel, marginBottom: 2 }}>Challenges</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, margin: 0, whiteSpace: 'pre-wrap' }}>{r.challenges}</p>
                        </div>
                      )}
                      {r.concerns && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span style={{ ...fieldLabel, marginBottom: 2 }}>Concerns</span>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, margin: 0, whiteSpace: 'pre-wrap' }}>{r.concerns}</p>
                        </div>
                      )}
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: r.self_care ? C.success : C.muted, margin: '0.25rem 0 0' }}>
                        Self-care: {r.self_care ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ONBOARDING WELCOME SCREEN (Phase 1)
═════════════════════════════════════════════════════════════*/
interface OnboardingState {
  id: string;
  cert_status?: string;
  onboarding_checklist: Record<string, boolean>;
  onboarding_complete: boolean;
  onboarding_step?: number;
  training_date: string | null;
  training_location: string | null;
  training_confirmed: boolean;
  dismissed_orientation: boolean;
  books_certified?: number[];
  grief_inventory?: Record<string, string> | null;
  inner_work_reflections?: Record<string, string> | null;
}

/* ── Chapter 1 Guided Walkthrough (Step 2) ── */
const GRIEF_INV_STORAGE = 'lg_grief_inventory_v1';

const GRIEF_INV_REFLECTIONS = [
  { id: 'q1', prompt: 'List the significant losses in your life. Not just deaths \u2014 include losses of relationship, identity, health, safety, or meaning. For each one, write: How old were you? Who supported you? How did you grieve \u2014 or not grieve \u2014 at the time?' },
  { id: 'q2', prompt: 'Which of these losses feel fully integrated \u2014 present but not raw? Which ones are still active in some way?' },
  { id: 'q3', prompt: 'If you were sitting in your own group as a participant, which week\u2019s topic would be hardest for you to sit with? What would that activate?' },
  { id: 'q4', prompt: 'Have you done your own grief work \u2014 through therapy, a grief group, spiritual practice, or another process? If not, what is getting in the way?' },
];

function GriefInventoryForm({ onComplete, initialAnswers, isPreview }: { onComplete: () => void; initialAnswers?: Record<string, string> | null; isPreview?: boolean }) {
  const initSaved = (): Record<string, string> => {
    // Prefer server-loaded answers; fall back to localStorage
    if (initialAnswers && Object.keys(initialAnswers).length > 0) return initialAnswers;
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(GRIEF_INV_STORAGE) || '{}'); } catch { return {}; }
  };
  const [answers, setAnswers] = React.useState<Record<string, string>>(initSaved);
  const [isSaving, setIsSaving] = React.useState(false);
  const allAnswered = GRIEF_INV_REFLECTIONS.every(q => (answers[q.id] || '').trim().length > 0);
  const [isSaved, setIsSaved] = React.useState(() => {
    const s = initSaved();
    return GRIEF_INV_REFLECTIONS.every(q => (s[q.id] || '').trim().length > 0);
  });

  function update(id: string, val: string) {
    const next = { ...answers, [id]: val };
    setAnswers(next);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(GRIEF_INV_STORAGE, JSON.stringify(next)); } catch { /* noop */ }
    }
  }

  async function save() {
    setIsSaving(true);
    // Mirror to localStorage always
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(GRIEF_INV_STORAGE, JSON.stringify(answers)); } catch { /* noop */ }
    }
    // Persist to Supabase via onboarding API (authenticated)
    if (!isPreview) {
      try {
        await fetch('/api/hub/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ grief_inventory: answers }),
        });
      } catch { /* non-fatal — localStorage is the fallback */ }
    }
    setIsSaving(false);
    setIsSaved(true);
    onComplete();
  }

  function printChapter() {
    const ans = answers;
    const reflHtml = GRIEF_INV_REFLECTIONS.map((q, i) =>
      `<div class="reflection"><div class="ref-label">Reflection ${i + 1}</div><p class="ref-q">${q.prompt}</p><div class="ans">${(ans[q.id] || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') || '&nbsp;'}</div></div>`
    ).join('');
    const win = window.open('', '_blank')!;
    win.document.write(`<!DOCTYPE html><html><head><title>Chapter 1 \u2014 Your Grief History</title>
<style>
body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a1a;line-height:1.75;font-size:1rem}
h1{font-family:'Georgia',serif;font-size:1.5rem;color:#1c3028;margin:0 0 4px}
.subtitle{font-size:0.85rem;color:#888;margin:0 0 28px}
h2{font-family:Georgia,serif;font-size:1.1rem;color:#1c3028;margin:2rem 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
.prose{margin:0 0 1rem}
.pull{border-left:3px solid #9a7b2f;padding:10px 16px;margin:1.5rem 0;font-style:italic;color:#1c3028;background:#faf8f2}
.reflection{margin:1.5rem 0;padding:16px 20px;border:1px solid #ddd;border-radius:6px;background:#fdfcf8}
.ref-label{font-family:Arial,sans-serif;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9a7b2f;margin-bottom:6px}
.ref-q{margin:0 0 10px;font-style:italic;color:#1c3028}
.ans{min-height:80px;color:#222;white-space:pre-wrap;font-family:Georgia,serif}
.practice{background:#eef4ef;border-left:3px solid #1c3028;padding:14px 18px;margin:1.5rem 0;border-radius:0 6px 6px 0}
.practice-label{font-family:Arial,sans-serif;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#1c3028;margin-bottom:8px}
.note{font-size:0.8rem;color:#aaa;margin-top:40px;border-top:1px solid #eee;padding-top:12px}
@media print{body{margin:20px}button{display:none}}
</style></head><body>
<h1>Chapter 1 \u2014 Your Grief History</h1>
<p class="subtitle">Live and Grieve\u2122 \u2014 Facilitator\u2019s Inner Work Guide \u00b7 Private and confidential</p>
<p class="prose">Nobody facilitates grief from a neutral place. You have lost people. You have experienced grief that was witnessed and grief that was not. You have had losses that were honored and losses that were dismissed. All of that is in the room with you, whether or not you named it during training.</p>
<p class="prose">This is not a liability. Lived experience with loss is one of your most important assets as a facilitator. It is the source of your credibility, your empathy, and your ability to say \u201cI know\u201d and mean it. But unexamined lived experience is something different. Unexamined, it leads you into the room wearing your own grief like a lens you don\u2019t know you\u2019re wearing.</p>
<div class="pull">The question is not whether your grief enters the room. It does. The question is whether you know it\u2019s there.</div>
<h2>The Inventory</h2>
<p class="prose">Before you facilitate your first group, complete this inventory honestly. Return to it at every annual renewal.</p>
${reflHtml}
<h2>What This Means in Practice</h2>
<p class="prose">Knowing your grief history does not mean it won\u2019t surface in the room. It means you will recognize it when it does. That recognition is the difference between a moment you can manage and a moment that manages you.</p>
<p class="prose">When a participant\u2019s story lands close to something in your own history, you may notice: a tightening in your chest, an urge to speak, a wave of your own emotion, a desire to end the moment sooner than it needs to end. These are signals. They are not instructions.</p>
<p class="prose">When you notice a signal, you have a choice. You can pause, breathe, stay in the room, and let the participant\u2019s experience belong to them. Or you can let your history pull you somewhere that isn\u2019t yours to go.</p>
<div class="practice"><div class="practice-label">Practice \u2014 The Recognition Practice</div>
<p style="margin:0">After each session, sit with this question for 5 minutes: <em>Was there a moment where I felt something that belonged to me rather than to the group?</em> Write it down in your Facilitator Reflection Log without judgment. Note what the trigger was, what you noticed in your body, and what you did. Over time, patterns will emerge \u2014 these patterns are your growth edge.</p></div>
<p class="note">This chapter is for your personal use. Your reflections are not submitted or reviewed by Tri-Pillars\u2122.</p>
</body></html>`);
    win.document.close();
    win.print();
  }

  // Styles
  const prose: React.CSSProperties = { fontFamily: 'Georgia, serif', fontSize: '0.97rem', color: C.navy, lineHeight: 1.75, margin: '0 0 1rem' };
  const pullQ: React.CSSProperties = { borderLeft: `3px solid ${C.gold}`, padding: '10px 16px', margin: '1.25rem 0', fontStyle: 'italic', fontFamily: 'Georgia, serif', color: C.navy, background: '#FAF8F2', fontSize: '1rem', lineHeight: 1.7 };
  const sectionH: React.CSSProperties = { fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.05rem', color: C.navy, margin: '1.75rem 0 0.5rem', paddingBottom: '0.3rem', borderBottom: `1px solid ${C.border}` };
  const refBox: React.CSSProperties = { background: '#FDFCF8', border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: '1.25rem' };
  const refLabel: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.gold, marginBottom: 6 };
  const refQ: React.CSSProperties = { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: C.navy, margin: '0 0 10px', lineHeight: 1.65 };
  const ta: React.CSSProperties = { width: '100%', minHeight: 100, padding: '0.55rem 0.75rem', border: `1px solid ${C.border}`, borderRadius: 5, resize: 'vertical' as const, fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: C.navy, background: '#fff', boxSizing: 'border-box' as const, lineHeight: 1.6 };
  const practiceBox: React.CSSProperties = { background: '#EEF4EF', borderLeft: `3px solid ${C.navy}`, borderRadius: '0 6px 6px 0', padding: '14px 18px', margin: '1.5rem 0' };
  const practiceLabel: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.navy, marginBottom: 8 };

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Chapter header */}
      <div style={{ background: C.navy, color: '#fff', borderRadius: 6, padding: '16px 20px', marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', opacity: 0.7, marginBottom: 4 }}>Chapter 1</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', fontWeight: 700 }}>Your Grief History</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', opacity: 0.75, marginTop: 2 }}>What you carry into every room you enter</div>
      </div>

      {/* Intro prose */}
      <p style={prose}>Nobody facilitates grief from a neutral place. You have lost people. You have experienced grief that was witnessed and grief that was not. You have had losses that were honored and losses that were dismissed. All of that is in the room with you, whether or not you named it during training.</p>
      <p style={prose}>This is not a liability. Lived experience with loss is one of your most important assets as a facilitator. It is the source of your credibility, your empathy, and your ability to say &ldquo;I know&rdquo; and mean it. But unexamined lived experience is something different. Unexamined, it leads you into the room wearing your own grief like a lens you don&rsquo;t know you&rsquo;re wearing.</p>

      {/* Pull quote */}
      <div style={pullQ}>The question is not whether your grief enters the room. It does. The question is whether you know it&rsquo;s there.</div>

      {/* Inventory heading */}
      <div style={sectionH}>The Inventory</div>
      <p style={{ ...prose, marginTop: '0.5rem' }}>Before you facilitate your first group, complete this inventory honestly. Return to it at every annual renewal.</p>

      {/* 4 Reflection fields */}
      {GRIEF_INV_REFLECTIONS.map((q, i) => (
        <div key={q.id} style={refBox}>
          <div style={refLabel}>Reflection {i + 1}</div>
          <p style={refQ}>{q.prompt}</p>
          <textarea style={ta} value={answers[q.id] || ''} onChange={e => update(q.id, e.target.value)} placeholder="Write here\u2026" />
        </div>
      ))}

      {/* What This Means in Practice */}
      <div style={sectionH}>What This Means in Practice</div>
      <p style={{ ...prose, marginTop: '0.5rem' }}>Knowing your grief history does not mean it won&rsquo;t surface in the room. It means you will recognize it when it does. That recognition is the difference between a moment you can manage and a moment that manages you.</p>
      <p style={prose}>When a participant&rsquo;s story lands close to something in your own history, you may notice: a tightening in your chest, an urge to speak, a wave of your own emotion, a desire to end the moment sooner than it needs to end. These are signals. They are not instructions.</p>
      <p style={prose}>When you notice a signal, you have a choice. You can pause, breathe, stay in the room, and let the participant&rsquo;s experience belong to them. Or you can let your history pull you somewhere that isn&rsquo;t yours to go.</p>

      {/* Practice box */}
      <div style={practiceBox}>
        <div style={practiceLabel}>Practice &mdash; The Recognition Practice</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: C.navy, margin: 0, lineHeight: 1.7 }}>After each session, sit with this question for 5 minutes: <em>Was there a moment where I felt something that belonged to me rather than to the group?</em> Write it down in your Facilitator Reflection Log without judgment. Note what the trigger was, what you noticed in your body, and what you did. Over time, patterns will emerge &mdash; these patterns are your growth edge.</p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: '1.25rem' }}>
        <button onClick={save} disabled={!allAnswered || isSaving} style={{ ...btn(C.gold, '#fff'), opacity: (allAnswered && !isSaving) ? 1 : 0.5 }}>
          {isSaving ? 'Saving\u2026' : isSaved ? '\u2713 Saved' : 'Save My Reflections'}
        </button>
        <button onClick={printChapter} style={btn(C.navy, '#fff')}>
          Print / Download
        </button>
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, margin: '8px 0 0' }}>
        Your reflections are saved to your account and never reviewed by Tri-Pillars&trade; or anyone else.
      </p>
    </div>
  );
}

/* ── Shared inline document renderer ── */
function renderDocInline(content: DocParagraph[], C: Record<string, string>) {
  return (
    <div style={{
      background: '#FDFCF8', border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '1.5rem 1.75rem', margin: '1.25rem 0', maxHeight: '60vh',
      overflowY: 'auto', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
      lineHeight: 1.75, color: C.navy,
    }}>
      {content.map((p, i) => {
        if (!p.text.trim()) return <div key={i} style={{ height: '0.5rem' }} />;
        if (p.style === 'Heading 1') return (
          <h2 key={i} style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', fontWeight: 700, color: C.navy, margin: '1.5rem 0 0.5rem', borderBottom: `2px solid ${C.gold}`, paddingBottom: '0.4rem' }}>{p.text}</h2>
        );
        if (p.style === 'Heading 2') return (
          <h3 key={i} style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.975rem', fontWeight: 600, color: C.navy, margin: '1.25rem 0 0.35rem', borderLeft: `3px solid ${C.gold}`, paddingLeft: '0.6rem' }}>{p.text}</h3>
        );
        if (p.style === 'Heading 3') return (
          <h4 key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: C.navy, margin: '1rem 0 0.25rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{p.text}</h4>
        );
        if (p.style === 'List Paragraph') return (
          <div key={i} style={{ paddingLeft: '1.25rem', margin: '0.2rem 0', position: 'relative' as const }}>
            <span style={{ position: 'absolute' as const, left: 0, color: C.gold }}>›</span>{p.text}
          </div>
        );
        return <p key={i} style={{ margin: '0.35rem 0' }}>{p.text}</p>;
      })}
    </div>
  );
}

/* ── IWG Reflections Form (Step 1) ── */
const IWG_REFLECTIONS_STORAGE = 'lg_iwg_reflections_v1';

const IWG_REFLECTIONS_LIST = [
  { id: 'r1', section: 'Chapter 1 — Your Grief History', prompt: 'List the significant losses in your life. Not just deaths \u2014 include losses of relationship, identity, health, safety, or meaning. For each one, write: How old were you? Who supported you? How did you grieve \u2014 or not grieve \u2014 at the time?' },
  { id: 'r2', section: 'Chapter 1 — Your Grief History', prompt: 'Which of these losses feel fully integrated \u2014 present but not raw? Which ones are still active in some way?' },
  { id: 'r3', section: 'Chapter 1 — Your Grief History', prompt: 'If you were sitting in your own group as a participant, which week\u2019s topic would be hardest for you to sit with? What would that activate?' },
  { id: 'r4', section: 'Chapter 1 — Your Grief History', prompt: 'Have you done your own grief work \u2014 through therapy, a grief group, spiritual practice, or another process? If not, what is getting in the way?' },
  { id: 'r5', section: 'Chapter 2 — Your Nervous System', prompt: 'Think of a time when you were facilitating \u2014 or in any high-stakes interpersonal moment \u2014 when you were genuinely regulated. What did that feel like in your body? What made it possible?' },
  { id: 'r6', section: 'Chapter 2 — Your Nervous System', prompt: 'Think of a time when you were activated in the room. What happened? What did you do? What do you wish you had done?' },
  { id: 'r7', section: 'Chapter 2 — Your Nervous System', prompt: 'Write your arrival practice. Be specific \u2014 not \u201cI will breathe\u201d but exactly what, for how long, with what intention.' },
  { id: 'r8', section: 'Chapter 3 — Peer Consultation and Support', prompt: 'Who are your current peer consultants? If you do not have one, name one person you could approach. What would you need to say to begin that relationship?' },
  { id: 'r9', section: 'Chapter 3 — Peer Consultation and Support', prompt: 'What is your current personal support structure? Where do you go when you are not okay? Is it enough for this work?' },
  { id: 'r10', section: 'Chapter 3 — Peer Consultation and Support', prompt: 'Have you experienced any signs of secondary traumatic stress before \u2014 in this work or in other caregiving roles? What helped? What made it worse?' },
  { id: 'r11', section: 'Chapter 4 — Presence and Language', prompt: 'On a scale of 1\u201310, how comfortable are you with silence in emotionally charged settings? What drives your impulse to fill it? What would it mean to trust the silence?' },
  { id: 'r12', section: 'Chapter 4 — Presence and Language', prompt: 'Which of the \u201cclosing\u201d phrases do you find yourself drawn to, even though you know better? What does that impulse protect in you?' },
  { id: 'r13', section: 'Chapter 4 — Presence and Language', prompt: 'Think of a facilitation moment \u2014 real or imagined \u2014 where you filled space that did not need to be filled. What were you protecting yourself from? What did the group miss because of it?' },
];

function IWGReflectionsForm({ onComplete, initialAnswers, isPreview }: { onComplete: () => void; initialAnswers?: Record<string, string> | null; isPreview?: boolean }) {
  const initSaved = (): Record<string, string> => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) return initialAnswers;
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(IWG_REFLECTIONS_STORAGE) || '{}'); } catch { return {}; }
  };
  const [answers, setAnswers] = React.useState<Record<string, string>>(initSaved);
  const [isSaving, setIsSaving] = React.useState(false);
  const allAnswered = IWG_REFLECTIONS_LIST.every(q => (answers[q.id] || '').trim().length > 0);
  const [isSaved, setIsSaved] = React.useState(() => {
    const s = initSaved();
    return IWG_REFLECTIONS_LIST.every(q => (s[q.id] || '').trim().length > 0);
  });

  function update(id: string, val: string) {
    const next = { ...answers, [id]: val };
    setAnswers(next);
    setIsSaved(false);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(IWG_REFLECTIONS_STORAGE, JSON.stringify(next)); } catch { /* noop */ }
    }
  }

  async function save() {
    setIsSaving(true);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(IWG_REFLECTIONS_STORAGE, JSON.stringify(answers)); } catch { /* noop */ }
    }
    if (!isPreview) {
      try {
        await fetch('/api/hub/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ inner_work_reflections: answers }),
        });
      } catch { /* non-fatal — localStorage is fallback */ }
    }
    setIsSaving(false);
    setIsSaved(true);
    onComplete();
  }

  const refBox: React.CSSProperties = { background: '#FDFCF8', border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: '1.25rem' };
  const refLabel: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: C.gold, marginBottom: 4 };
  const refSection: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: C.muted, marginBottom: 6 };
  const refQ: React.CSSProperties = { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: C.navy, margin: '0 0 10px', lineHeight: 1.65 };
  const ta: React.CSSProperties = { width: '100%', minHeight: 100, padding: '0.55rem 0.75rem', border: `1px solid ${C.border}`, borderRadius: 5, resize: 'vertical' as const, fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: C.navy, background: '#fff', boxSizing: 'border-box' as const, lineHeight: 1.6 };

  return (
    <div style={{ marginTop: '1rem' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, margin: '0 0 1.25rem', lineHeight: 1.6 }}>
        Answer each reflection after reading the guide. Your responses are saved to your account and are completely private — never reviewed by anyone at Tri-Pillars™. You can save progress and return at any time.
      </p>

      {IWG_REFLECTIONS_LIST.map((q, i) => (
        <div key={q.id} style={refBox}>
          <div style={refLabel}>Reflection {i + 1}</div>
          <div style={refSection}>{q.section}</div>
          <p style={refQ}>{q.prompt}</p>
          <textarea style={ta} value={answers[q.id] || ''} onChange={e => update(q.id, e.target.value)} placeholder="Write here\u2026" />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: '1rem' }}>
        <button onClick={save} disabled={!allAnswered || isSaving} style={{ ...btn(C.gold, '#fff'), opacity: (allAnswered && !isSaving) ? 1 : 0.5 }}>
          {isSaving ? 'Saving\u2026' : isSaved ? '\u2713 Saved' : 'Save My Reflections'}
        </button>
      </div>
      {!allAnswered && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, margin: '8px 0 0' }}>
          Complete all {IWG_REFLECTIONS_LIST.length} reflections to continue.
        </p>
      )}
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, margin: '8px 0 0' }}>
        Your reflections are private and never reviewed by Tri-Pillars\u2122 or anyone else.
      </p>
    </div>
  );
}

/* ── Onboarding Wizard (replaces checklist) ── */
function OnboardingWizard({ profile, onboarding, onUpdate, onComplete, isPreview = false }: {
  profile: Profile;
  onboarding: OnboardingState;
  onUpdate: (ob: Partial<OnboardingState>) => void;
  onComplete: () => void;
  isPreview?: boolean;
}) {
  const [step, setStep] = useState(onboarding.onboarding_step ?? 0);
  const [checked, setChecked] = useState(false);
  const [signed, setSigned] = useState(false);
  const [trainingDate, setTrainingDate] = useState(onboarding.training_date ?? '');
  const [trainingLocation, setTrainingLocation] = useState(onboarding.training_location ?? '');
  const [trainingUnderstood, setTrainingUnderstood] = useState(false);
  const [savingTraining, setSavingTraining] = useState(false);
  const [trainingSaved, setTrainingSaved] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);

  // Reset per-step state when step changes
  useEffect(() => {
    setChecked(false);
    setSigned(false);
    setTrainingSaved(false);
  }, [step]);

  async function advance() {
    const newStep = step + 1;
    setStep(newStep);
    if (!isPreview) {
      await fetch('/api/hub/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ step: newStep }),
      });
    }
    onUpdate({ onboarding_step: newStep });
  }

    async function getDocUrl(pathFragment: string): Promise<string | null> {
    const res = await fetch('/api/hub/documents', { credentials: 'include' });
    const data = await res.json();
    const sections = data.sections ?? [];
    for (const s of sections) {
      const found = s.documents?.find((d: { path: string; url: string | null }) =>
        d.path.includes(pathFragment)
      );
      if (found?.url) return found.url;
    }
    return null;
  }

  async function findAndOpenDoc(pathFragment: string) {
    setOpeningDoc(true);
    try {
      const rawUrl = await getDocUrl(pathFragment);
      if (rawUrl) {
        // .docx files would trigger a download on mobile — open in Google Docs Viewer instead
        const viewUrl = rawUrl.toLowerCase().endsWith('.docx')
          ? `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`
          : rawUrl;
        const a = document.createElement('a');
        a.href = viewUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setOpeningDoc(false);
        return;
      }
      alert('Document not available yet. Please check back later.');
    } catch { alert('Failed to load document.'); }
    setOpeningDoc(false);
  }

  async function findAndDownloadDoc(pathFragment: string) {
    setOpeningDoc(true);
    try {
      const rawUrl = await getDocUrl(pathFragment);
      if (rawUrl) {
        const a = document.createElement('a');
        a.href = rawUrl;
        a.download = '';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setOpeningDoc(false);
        return;
      }
      alert('Document not available yet. Please check back later.');
    } catch { alert('Failed to load document.'); }
    setOpeningDoc(false);
  }

  async function saveTraining() {
    if (!trainingDate || !trainingLocation || !trainingUnderstood) return;
    setSavingTraining(true);
    if (!isPreview) {
      await fetch('/api/hub/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ training_date: trainingDate, training_location: trainingLocation, training_confirmed: true }),
      });
    }
    onUpdate({ training_date: trainingDate, training_location: trainingLocation, training_confirmed: true });
    setSavingTraining(false);
    setTrainingSaved(true);
  }

  async function completeOnboarding() {
    if (!isPreview) {
      await fetch('/api/hub/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ complete: true }),
      });
    }
    onUpdate({ onboarding_complete: true });
    onComplete();
  }

  const progressBar = (currentStep: number) => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ fontSize: '0.8rem', color: C.muted, fontFamily: 'Inter, sans-serif', marginBottom: 8, textAlign: 'center' }}>
        Step {currentStep} of 7
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i < currentStep ? C.gold : C.border,
            transition: 'background .3s',
          }} />
        ))}
      </div>
    </div>
  );

  const heading = (text: string) => (
    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: C.navy, margin: '0 0 1rem' }}>
      {text}
    </h1>
  );

  const body = (text: string) => (
    <p style={{ color: C.navy, fontSize: '0.95rem', lineHeight: 1.75, fontFamily: 'Inter, sans-serif', margin: '0 0 1.5rem' }}>
      {text}
    </p>
  );

  const nextBtn = (disabled: boolean) => (
    <button onClick={advance} disabled={disabled}
      style={{ ...btn(C.gold, '#fff'), opacity: disabled ? 0.4 : 1, marginTop: '1rem' }}>
      Next →
    </button>
  );

  const checkboxRow = (label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: C.navy,
      fontFamily: 'Inter, sans-serif', cursor: 'pointer', margin: '1rem 0' }}>
      <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: C.gold, flexShrink: 0 }} />
      {label}
    </label>
  );

  const firstBook = (profile.books_certified?.length ?? 0) > 0 ? profile.books_certified![0] : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem 1.25rem' }}>

        {/* Step 0 — Intro */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            {heading("Welcome.")}
            {body("We\u2019re glad you\u2019re here. This Hub is where your journey as a Live and Grieve\u2122 facilitator begins \u2014 and where it continues long after training day. Over the next seven steps, we\u2019ll walk through your preparation together. Some is reading. Some is reflection. Some is practical. Take your time with each one.")}
            <button onClick={advance}
              style={{ ...btn(C.gold, '#fff'), fontSize: '1rem', padding: '0.75rem 2rem' }}>
              I&apos;m ready. Let&apos;s begin.
            </button>
          </div>
        )}

        {/* Step 1 — Inner Work Guide with Reflections */}
        {step === 1 && (
          <div>
            {progressBar(1)}
            {heading("Step 1 of 7 \u2014 The Inner Work Guide")}
            {body("The Inner Work Guide is where your preparation begins. Read it in full, then answer each reflection below. Your answers are private \u2014 saved to your account, never reviewed by anyone. You can save progress and return at any time.")}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, margin: '1rem 0 0' }}>
              <button onClick={() => findAndOpenDoc('Facilitator_Inner_Work_Guide')}
                disabled={openingDoc}
                style={{ ...btn(C.navy, '#fff'), opacity: openingDoc ? 0.6 : 1 }}>
                {openingDoc ? 'Loading...' : 'Open Inner Work Guide'}
              </button>
              <button onClick={() => findAndDownloadDoc('Facilitator_Inner_Work_Guide')}
                disabled={openingDoc}
                style={{ ...btn(C.muted, '#fff'), opacity: openingDoc ? 0.6 : 1 }}>
                ↓ Download / Print
              </button>
            </div>
            <IWGReflectionsForm onComplete={() => setChecked(true)} initialAnswers={onboarding.inner_work_reflections} isPreview={isPreview} />
            {checked && <div style={{ color: '#16A34A', fontWeight: 600, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', margin: '0.5rem 0' }}>&#10003; Reflections saved</div>}
            {nextBtn(!checked)}
          </div>
        )}

        {/* Step 2 — Grief Inventory */}
        {step === 2 && (
          <div>
            {progressBar(2)}
            {heading("Step 2 of 7 \u2014 Your Grief Inventory")}
            {body("These four reflections are yours alone \u2014 private, not submitted, not reviewed by anyone. Write as much or as little as feels right. Come to training day having sat with your own answers.")}
            <GriefInventoryForm onComplete={() => setChecked(true)} initialAnswers={onboarding.grief_inventory} isPreview={isPreview} />
            {checked && <div style={{ color: '#16A34A', fontWeight: 600, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', margin: '0.5rem 0' }}>&#10003; Inventory saved</div>}
            {nextBtn(!checked)}
          </div>
        )}

        {/* Step 3 — Participant Appropriateness Guide (inline) */}
        {step === 3 && (
          <div>
            {progressBar(3)}
            {heading("Step 3 of 7 \u2014 Who This Program Serves")}
            {body("Part of caring well for the people who come to you is knowing what Live and Grieve\u2122 can and can\u2019t hold. Read the guide below in full before moving on.")}
            {renderDocInline(PAG_CONTENT, C)}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, margin: '0.5rem 0 0' }}>
              <button onClick={() => findAndDownloadDoc('Participant_Appropriateness_Guide')}
                disabled={openingDoc}
                style={{ ...btn(C.muted, '#fff'), opacity: openingDoc ? 0.6 : 1, fontSize: '0.82rem' }}>
                ↓ Download / Print
              </button>
            </div>
            {checkboxRow("I have read the Participant Appropriateness Guide.")}
            {nextBtn(!checked)}
          </div>
        )}

        {/* Step 4 — Code of Conduct (inline) */}
        {step === 4 && (
          <div>
            {progressBar(4)}
            {heading("Step 4 of 7 \u2014 The Code of Conduct")}
            {body("Read the Code of Conduct below in full. When you\u2019ve read it, check the box and sign.")}
            {renderDocInline(COC_CONTENT, C)}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, margin: '0.5rem 0 0' }}>
              <button onClick={() => findAndDownloadDoc('Code_of_Conduct')}
                disabled={openingDoc}
                style={{ ...btn(C.muted, '#fff'), opacity: openingDoc ? 0.6 : 1, fontSize: '0.82rem' }}>
                ↓ Download / Print
              </button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: C.navy,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer', margin: '1rem 0' }}>
              <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: C.gold, flexShrink: 0 }} />
              I have read the Facilitator Code of Conduct in full.
            </label>
            {checked && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: C.navy, margin: '0 0 0.75rem' }}>
                  Sign below to confirm your agreement.
                </h3>
                <SignatureField documentName="Facilitator Code of Conduct" onSuccess={() => setSigned(true)} />
              </div>
            )}
            {nextBtn(!(checked && signed))}
          </div>
        )}

        {/* Step 5 — Week 1 Preview */}
        {step === 5 && (
          <div>
            {progressBar(5)}
            {heading('Step 5 of 7 \u2014 Your First Session')}

            {firstBook ? (
              <>
                {body('Below is Week 1 of your Master Facilitator Manual. Read it before training day. Every layer is here \u2014 what participants will be working through, how the session is structured, and guidance for you as you hold the room. Familiarity with Week 1 before training day will make the experience much richer.')}

                {/* Inline Week 1 content */}
                <div style={{
                  background: '#FDFCF8',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '1.5rem 1.75rem',
                  margin: '1.25rem 0',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  lineHeight: 1.75,
                  color: C.navy,
                }}>
                  {WEEK1_CONTENT.map((p: DocParagraph, i: number) => {
                    if (!p.text.trim()) return <div key={i} style={{ height: '0.5rem' }} />;

                    if (p.style === 'Heading 1') return (
                      <h2 key={i} style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: C.navy,
                        margin: '1.5rem 0 0.5rem',
                        borderBottom: `2px solid ${C.gold}`,
                        paddingBottom: '0.4rem',
                      }}>{p.text}</h2>
                    );

                    if (p.style === 'Heading 2') return (
                      <h3 key={i} style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '0.975rem',
                        fontWeight: 600,
                        color: C.navy,
                        margin: '1.25rem 0 0.35rem',
                        borderLeft: `3px solid ${C.gold}`,
                        paddingLeft: '0.6rem',
                      }}>{p.text}</h3>
                    );

                    if (p.style === 'Heading 3') return (
                      <h4 key={i} style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: C.navy,
                        margin: '1rem 0 0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>{p.text}</h4>
                    );

                    if (p.style === 'List Paragraph') return (
                      <div key={i} style={{
                        paddingLeft: '1.25rem',
                        margin: '0.2rem 0',
                        position: 'relative',
                      }}>
                        <span style={{ position: 'absolute', left: 0, color: C.gold }}>›</span>
                        {p.text}
                      </div>
                    );

                    // Normal — detect special marker lines and style them distinctly
                    const text = p.text;

                    // Facilitator layer headers (▸ FACILITATION LAYER)
                    if (text.startsWith('\u25b8 FACILITATION LAYER') || text.startsWith('\u25b8  First sessions')) {
                      return (
                        <div key={i} style={{
                          background: '#EEF2FF',
                          borderLeft: `3px solid #4F46E5`,
                          borderRadius: '0 4px 4px 0',
                          padding: '0.4rem 0.75rem',
                          margin: '0.5rem 0 0.2rem',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: '#3730A3',
                        }}>{text}</div>
                      );
                    }

                    // Participant workbook markers (▮ PARTICIPANT WORKBOOK)
                    if (text.startsWith('\u25ae PARTICIPANT WORKBOOK')) {
                      return (
                        <div key={i} style={{
                          background: C.goldLt,
                          borderLeft: `3px solid ${C.gold}`,
                          borderRadius: '0 4px 4px 0',
                          padding: '0.4rem 0.75rem',
                          margin: '0.5rem 0 0.2rem',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: '#7A5C10',
                        }}>{text}</div>
                      );
                    }

                    // Invite lines (► Invite participants)
                    if (text.startsWith('\u25ba Invite') || text.startsWith('\u25ba Point')) {
                      return (
                        <div key={i} style={{
                          color: '#7A5C10',
                          fontStyle: 'italic',
                          fontSize: '0.84rem',
                          margin: '0.4rem 0',
                          paddingLeft: '0.5rem',
                        }}>{text}</div>
                      );
                    }

                    // Facilitator Tips
                    if (text.startsWith('Facilitator Tip:')) {
                      return (
                        <div key={i} style={{
                          background: '#F0FDF4',
                          borderLeft: `3px solid #16A34A`,
                          borderRadius: '0 4px 4px 0',
                          padding: '0.4rem 0.75rem',
                          margin: '0.4rem 0',
                          fontSize: '0.84rem',
                          color: '#166534',
                        }}>{text}</div>
                      );
                    }

                    // Watch for / Transition / Closing ritual markers
                    if (text.startsWith('\u2691 WATCH') || text.startsWith('\u2194 TRANSITION') || text.startsWith('\u25ce CLOSING') || text.startsWith('\u2192 LOOKING')) {
                      return (
                        <div key={i} style={{
                          background: '#FFF7ED',
                          borderLeft: `3px solid #D97706`,
                          borderRadius: '0 4px 4px 0',
                          padding: '0.4rem 0.75rem',
                          margin: '0.6rem 0 0.2rem',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: '#92400E',
                        }}>{text}</div>
                      );
                    }

                    // Trauma-sensitive tip (▲)
                    if (text.startsWith('\u25b2 Trauma')) {
                      return (
                        <div key={i} style={{
                          background: '#FFF1F2',
                          borderLeft: `3px solid #E11D48`,
                          borderRadius: '0 4px 4px 0',
                          padding: '0.4rem 0.75rem',
                          margin: '0.6rem 0',
                          fontSize: '0.84rem',
                          color: '#881337',
                        }}>{text}</div>
                      );
                    }

                    // Watch-for bullets (· Someone...)
                    if (text.startsWith('\u00b7  ')) {
                      return (
                        <div key={i} style={{
                          paddingLeft: '1rem',
                          margin: '0.2rem 0',
                          fontSize: '0.85rem',
                          color: '#92400E',
                        }}>{text}</div>
                      );
                    }

                    // Session at-a-glance block (◉ SESSION AT-A-GLANCE)
                    if (text.startsWith('\u25c9 SESSION AT-A-GLANCE') || text.startsWith('\u25c8 BEFORE THE SESSION')) {
                      return (
                        <div key={i} style={{
                          background: C.navy,
                          color: '#fff',
                          borderRadius: 4,
                          padding: '0.4rem 0.75rem',
                          margin: '0.75rem 0 0.2rem',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          letterSpacing: '0.03em',
                        }}>{text}</div>
                      );
                    }

                    // Timing lines (⏱)
                    if (text.startsWith('\u23f1')) {
                      return (
                        <div key={i} style={{
                          color: C.muted,
                          fontSize: '0.82rem',
                          fontStyle: 'italic',
                          margin: '0.15rem 0 0.4rem',
                        }}>{text}</div>
                      );
                    }

                    // At-a-glance timing rows (indented dot-leader lines)
                    if (text.startsWith('  ') && text.includes('\u00b7\u00b7\u00b7')) {
                      return (
                        <div key={i} style={{
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          color: C.navy,
                          margin: '0.1rem 0',
                          paddingLeft: '0.5rem',
                        }}>{text}</div>
                      );
                    }

                    // Default normal paragraph
                    return (
                      <p key={i} style={{ margin: '0.35rem 0' }}>{text}</p>
                    );
                  })}
                </div>

                {/* Open Full Manual button */}
                <button
                  onClick={() => { findAndOpenDoc('FM'); }}
                  disabled={openingDoc}
                  style={{ ...btn(C.navy, '#fff'), opacity: openingDoc ? 0.6 : 1, margin: '1rem 0' }}
                >
                  {openingDoc ? 'Loading\u2026' : `Open Full Manual \u2014 Book ${firstBook}`}
                </button>

                {checkboxRow('I have read Week 1 of the Master Facilitator Manual and am ready for training day.')}
              </>
            ) : (
              <>
                <p style={{ color: C.navy, fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.7, margin: '0 0 1.25rem' }}>
                  Your book assignment will be confirmed by your trainer before training day. Once assigned, your Week 1 session will appear here. Check back after you hear from your trainer.
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.9rem', color: C.navy,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer', margin: '1rem 0' }}>
                  <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: C.gold, flexShrink: 0, marginTop: 2 }} />
                  I understand my Week 1 content will be here once my book is assigned.
                </label>
              </>
            )}

            {nextBtn(!checked)}
          </div>
        )}

        {/* Step 6 — Training Details */}
        {step === 6 && (
          <div>
            {progressBar(6)}
            {heading("Step 6 of 7 \u2014 Your Training Day")}
            {body("You\u2019re almost there. Confirm your training details below so we have everything on file and can prepare well for your day together.")}
            <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 400 }}>
              <div>
                <label style={fieldLabel}>Training Date</label>
                <input type="date" style={inp} value={trainingDate}
                  onChange={e => setTrainingDate(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>Training Location</label>
                <input type="text" style={inp} placeholder="City, State or venue name"
                  value={trainingLocation}
                  onChange={e => setTrainingLocation(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: C.navy, cursor: 'pointer' }}>
                <input type="checkbox" checked={trainingUnderstood}
                  onChange={e => setTrainingUnderstood(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.gold }} />
                I understand what to bring and what is expected of me before I arrive.
              </label>
              <button onClick={saveTraining}
                disabled={!trainingDate || !trainingLocation || !trainingUnderstood || savingTraining || trainingSaved}
                style={{ ...btn(C.gold, '#fff', true),
                  opacity: (!trainingDate || !trainingLocation || !trainingUnderstood) ? 0.5 : 1,
                  width: 'fit-content' }}>
                {savingTraining ? 'Saving...' : trainingSaved ? 'Saved' : 'Save & Continue'}
              </button>
            </div>
            {nextBtn(!trainingSaved)}
          </div>
        )}

        {/* Step 7 — Complete */}
        {step === 7 && (
          <div>
            {progressBar(7)}
            {heading("Step 7 of 7 \u2014 You\u2019re ready.")}
            {body("Your pre-training preparation is complete. We\u2019ll see you on training day. Between now and then, your Hub is here \u2014 and so are we. If anything comes up \u2014 questions, something you want to think through, anything at all \u2014 the Get Support tab is always open.")}
            <button onClick={completeOnboarding}
              style={{ ...btn(C.gold, '#fff'), fontSize: '1rem', padding: '0.75rem 2rem' }}>
              Enter your Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Persistent onboarding banner ── */
function OnboardingBanner({ onboardingStep }: { onboardingStep: number }) {
  if (onboardingStep >= 7) return null;

  return (
    <div style={{
      background: C.goldLt, border: `1px solid ${C.gold}40`, borderRadius: 8,
      padding: '0.75rem 1.1rem', marginBottom: '1.25rem',
      fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.gold, fontWeight: 600,
    }}>
      Pre-training preparation: step {onboardingStep} of 7
    </div>
  );
}

/* ── Orientation Panel (Phase 2) ── */
function OrientationPanel({ onDismiss }: { onDismiss: () => void }) {
  const [dismissing, setDismissing] = useState(false);

  async function dismiss() {
    setDismissing(true);
    await fetch('/api/hub/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ dismissed_orientation: true }),
    });
    setDismissing(false);
    onDismiss();
  }

  return (
    <div style={{
      background: C.white, border: `1px solid ${C.gold}40`, borderRadius: 10,
      padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
      borderLeft: `4px solid ${C.gold}`,
    }}>
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: C.navy, margin: '0 0 0.75rem' }}>
        Welcome to your Hub
      </h3>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy, lineHeight: 1.75 }}>
        <p style={{ margin: '0 0 0.5rem' }}>Here is everything you need to know:</p>
        <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem' }}>
          <li><strong>Library tab:</strong> forms, outcome tracking, certification materials, and reference documents are here. Physical program materials are provided at certification training.</li>
          <li><strong>Forms tab:</strong> submit incident reports, session feedback, reflections, and cohort summaries digitally. All submissions are logged.</li>
          <li><strong>Get Support tab:</strong> send a consultation request to Tri-Pillars™ any time.</li>
          <li>Your reflections are private. Everything else is logged for program records.</li>
          <li>Questions? Use the Get Support tab.</li>
        </ul>
      </div>
      <button onClick={dismiss} disabled={dismissing}
        style={{ ...btn(C.bg, C.navy, true), border: `1px solid ${C.border}` }}>
        {dismissing ? 'Dismissing...' : 'Dismiss'}
      </button>
    </div>
  );
}

/* ── Certification Acknowledgment section ── */
function CertAcknowledgmentCard() {
  return (
    <div style={card}>
      <h2 style={sectionTitle}>Certification Acknowledgment</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.muted, lineHeight: 1.6, margin: '0 0 1rem' }}>
        By signing below, you acknowledge that you have completed the certification requirements for the Live and Grieve™ Facilitator program and agree to uphold program standards.
      </p>
      <SignatureField documentName="Certification Acknowledgment" />
    </div>
  );
}

/* ── Group Use License section ── */
function GroupUseLicenseCard() {
  return (
    <div style={card}>
      <h2 style={sectionTitle}>Group Use License</h2>
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '1rem 1.25rem', marginBottom: '1rem',
        fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy, lineHeight: 1.7,
      }}>
        I agree to use Live and Grieve™ materials only within my certified facilitator role, not to reproduce or redistribute materials without written permission from Tri-Pillars LLC, and to follow the Facilitator Code of Conduct at all times.
      </div>
      <SignatureField documentName="Group Use License" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT DASHBOARD
═════════════════════════════════════════════════════════════*/
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

type PreviewRole = 'admin' | 'facilitator_book1' | 'facilitator_all' | 'trainer' | 'org_contact' | 'participant';
const PREVIEW_ROLES: { value: PreviewRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'facilitator_book1', label: 'Facilitator — Book 1 only' },
  { value: 'facilitator_all', label: 'Facilitator — All Books' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'org_contact', label: 'Organization Contact' },
  { value: 'participant', label: 'Participant' },
];

function previewRoleLabel(role: PreviewRole): string {
  return PREVIEW_ROLES.find(r => r.value === role)?.label ?? role;
}

/* ── Outcomes Tab ── */
interface OutcomesReport {
  participant_count: number;
  pre:  { count: number; avg_emotions: number | null; avg_disruption: number | null; avg_isolation: number | null; avg_meaning: number | null; avg_selfcare: number | null; avg_manageability: number | null };
  mid:  { count: number; avg_emotions: number | null; avg_manageability: number | null; avg_connection: number | null };
  post: { count: number; avg_emotions: number | null; avg_disruption: number | null; avg_isolation: number | null; avg_meaning: number | null; avg_selfcare: number | null; avg_manageability: number | null; avg_program_helpful: number | null; avg_safety: number | null; avg_facilitator_support: number | null };
  followup: { count: number; avg_manageability: number | null };
}

function trendArrow(pre: number | null, post: number | null): string {
  if (pre == null || post == null) return '';
  const diff = post - pre;
  if (diff > 0.5) return ' ↑';
  if (diff < -0.5) return ' ↓';
  return ' →';
}

function OutcomesTab({ cohorts }: { cohorts: Cohort[] }) {
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [report, setReport] = useState<OutcomesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadReport(cohortId: string) {
    setSelectedCohort(cohortId);
    if (!cohortId) { setReport(null); return; }
    setLoading(true); setError('');
    const res = await fetch(`/api/hub/outcomes-report?cohort_id=${cohortId}`);
    setLoading(false);
    if (!res.ok) { setError('Failed to load report'); return; }
    setReport(await res.json());
  }

  const CORE_MEASURES = [
    { key: 'emotions', label: 'Acknowledge & name grief emotions' },
    { key: 'disruption', label: 'Grief disruption to daily functioning' },
    { key: 'isolation', label: 'Isolation' },
    { key: 'meaning', label: 'Meaning and purpose' },
    { key: 'selfcare', label: 'Self-care (sleep, eating, basic needs)' },
    { key: 'manageability', label: 'Manageability of grief' },
  ];

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Participant Outcomes</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={fieldLabel}>Select Cohort</label>
        <select style={inp} value={selectedCohort} onChange={e => loadReport(e.target.value)}>
          <option value="">— Choose a cohort —</option>
          {cohorts.map(c => (
            <option key={c.id} value={c.id}>
              Book {c.book_number} — started {c.start_date} ({c.status})
            </option>
          ))}
        </select>
      </div>

      {loading && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.muted }}>Loading…</p>}
      {error && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.danger }}>{error}</p>}

      {report && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              ['Registered', report.participant_count],
              ['Pre Forms', report.pre.count],
              ['Mid Forms', report.mid.count],
              ['Post Forms', report.post.count],
              ['Follow-Up', report.followup.count],
            ].map(([label, val]) => (
              <div key={String(label)} style={{ background: C.bg, borderRadius: 8, padding: '0.75rem', textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: C.navy }}>{val}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Core measures comparison table */}
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Core Measures (Avg 1–10)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left' as const, padding: '0.5rem 0.75rem', color: C.navy }}>Measure</th>
                  <th style={{ textAlign: 'center' as const, padding: '0.5rem 0.5rem', color: C.navy }}>Pre</th>
                  <th style={{ textAlign: 'center' as const, padding: '0.5rem 0.5rem', color: C.navy }}>Post</th>
                  <th style={{ textAlign: 'center' as const, padding: '0.5rem 0.5rem', color: C.navy }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {CORE_MEASURES.map(m => {
                  const preVal = report.pre[`avg_${m.key}` as keyof typeof report.pre] as number | null;
                  const postVal = report.post[`avg_${m.key}` as keyof typeof report.post] as number | null;
                  const arrow = trendArrow(preVal, postVal);
                  const arrowColor = arrow.includes('↑') ? C.success : arrow.includes('↓') ? C.danger : C.muted;
                  return (
                    <tr key={m.key} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: C.navy }}>{m.label}</td>
                      <td style={{ textAlign: 'center' as const, padding: '0.5rem', color: C.muted }}>{preVal ?? '—'}</td>
                      <td style={{ textAlign: 'center' as const, padding: '0.5rem', color: C.muted }}>{postVal ?? '—'}</td>
                      <td style={{ textAlign: 'center' as const, padding: '0.5rem', color: arrowColor, fontWeight: 700 }}>{arrow || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mid-program snapshot */}
          {report.mid.count > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Mid-Program (Session 7)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  ['Emotions (vs Wk1)', report.mid.avg_emotions],
                  ['Manageability (vs Wk1)', report.mid.avg_manageability],
                  ['Group Connection', report.mid.avg_connection],
                ].map(([l, v]) => (
                  <div key={String(l)} style={{ background: C.bg, borderRadius: 6, padding: '0.5rem 0.75rem', textAlign: 'center' as const }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: C.navy }}>{v ?? '—'}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', color: C.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post-program extras */}
          {report.post.count > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Post-Program Experience
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  ['Program Helpful', report.post.avg_program_helpful],
                  ['Felt Safe', report.post.avg_safety],
                  ['Facilitator Support', report.post.avg_facilitator_support],
                ].map(([l, v]) => (
                  <div key={String(l)} style={{ background: C.bg, borderRadius: 6, padding: '0.5rem 0.75rem', textAlign: 'center' as const }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: C.navy }}>{v ?? '—'}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', color: C.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up */}
          {report.followup.count > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                90-Day Follow-Up
              </h3>
              <div style={{ background: C.bg, borderRadius: 6, padding: '0.5rem 0.75rem', display: 'inline-block' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: C.navy }}>
                  {report.followup.avg_manageability ?? '—'}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: C.muted, marginLeft: 8 }}>
                  Manageability ({report.followup.count} responses)
                </span>
              </div>
            </div>
          )}

          {/* QR Pack link */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${C.border}` }}>
            <a href={`/outcomes/qr-pack?cohort=${selectedCohort}`} target="_blank" rel="noopener noreferrer"
              style={{ ...btn(C.navy, '#fff', true), textDecoration: 'none', display: 'inline-block' }}>
              Print QR Pack
            </a>
          </div>
        </>
      )}
    </div>
  );
}

type Tab = 'overview' | 'documents' | 'cohorts' | 'codes' | 'feedback' | 'reports' | 'support' | 'incident' | 'reflections' | 'outcomes' | 'youth';

export default function HubDashboard() {
  const router = useRouter();

  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [cohorts,       setCohorts]       = useState<Cohort[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'reports' || p === 'cohorts' || p === 'documents' || p === 'codes' || p === 'feedback' || p === 'support' || p === 'incident' || p === 'outcomes') return p as Tab;
    }
    return 'overview';
  });
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  /* ── Onboarding state ── */
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dismissedOrientation, setDismissedOrientation] = useState(false);

  /* ── Role preview (owners only) ── */
  const [previewRole, setPreviewRole] = useState<PreviewRole>('admin');
  const isOwner = !!profile && OWNER_EMAILS.includes(profile.email);
  const isPreviewActive = isOwner && previewRole !== 'admin';

  const loadHub = useCallback(async () => {
    const [profRes, cohortsRes, obRes] = await Promise.all([
      fetch('/api/hub/profile'),
      fetch('/api/hub/cohorts'),
      fetch('/api/hub/onboarding'),
    ]);

    if (profRes.status === 401) { router.replace('/facilitators/login?reason=session'); return; }

    const [profData, cohortData, obData] = await Promise.all([
      profRes.json(), cohortsRes.json(), obRes.json(),
    ]);

    if (profData.profile)           setProfile(profData.profile);
    else                            setError(profData.error ?? 'Failed to load profile');
    if (cohortData.cohorts)         setCohorts(cohortData.cohorts);
    if (cohortData.announcements)   setAnnouncements(cohortData.announcements);

    if (obData.onboarding) {
      const ob = obData.onboarding;
      setOnboarding(ob);
      setDismissedOrientation(!!ob.dismissed_orientation);
      // Show welcome screen for pending_certification who haven't completed onboarding
      if (!ob.onboarding_complete) {
        setShowWelcome(true);
      }
    }

    setLoading(false);
  }, [router]);

  useEffect(() => { loadHub(); }, [loadHub]);

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    router.replace('/facilitators/login');
  }

  function updateOnboarding(partial: Partial<OnboardingState>) {
    setOnboarding(prev => prev ? { ...prev, ...partial } : prev);
  }

  function handlePreviewChange(role: PreviewRole) {
    if (role === 'participant') {
      window.open('https://solo.tripillarstudio.com?owner=tripillar-owner-2024', '_blank');
      return; // stay on admin
    }
    setPreviewRole(role);
  }

  // Build a preview profile for facilitator previews
  const previewProfile: Profile | null = profile && isPreviewActive && (previewRole === 'facilitator_book1' || previewRole === 'facilitator_all')
    ? {
        ...profile,
        role: 'facilitator',
        books_certified: previewRole === 'facilitator_book1' ? [1] : [1, 2, 3, 4],
      }
    : profile;

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

  /* ── Show welcome screen if applicable ── */
  if (showWelcome && onboarding && !onboarding.onboarding_complete) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href={FONT_LINK} rel="stylesheet" />

        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
          {/* Topbar */}
          <div style={{ background: C.navy, height: 58, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 1.25rem' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold,
              fontWeight: 700, fontSize: '1.05rem' }}>Live and Grieve™</span>
            <button onClick={logout} style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>Log out</button>
          </div>
          <OnboardingWizard
            profile={profile}
            onboarding={onboarding}
            onUpdate={updateOnboarding}
            onComplete={() => setShowWelcome(false)}
            isPreview={false}
          />
        </div>
      </>
    );
  }

  const TAB_LABELS: Record<Tab, string> = {
    overview: 'Overview', documents: 'Documents', cohorts: 'My Cohorts', codes: 'Codes', feedback: 'Submit Feedback', reports: 'My Reports', support: 'Get Support', incident: 'Report Incident', reflections: 'Reflection Log', outcomes: 'Outcomes', youth: 'Youth (LGY)',
  };

  const hasLgy = (profile.lgy_certified_tracks ?? []).length > 0;

  /* ── Determine if orientation panel should show ── */
  const isPending = profile.cert_status === 'pending_certification';
  const isCertified = profile.cert_status === 'active' || profile.cert_status === 'certified';
  const showOrientation = !dismissedOrientation && (
    (isPending && onboarding?.onboarding_complete) || (isCertified)
  );

  /* ── Onboarding banner: show if pending + not all 7 done ── */
  const showBanner = isPending && !onboarding?.onboarding_complete;

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
            {isOwner && (
              <select
                value={previewRole}
                onChange={e => handlePreviewChange(e.target.value as PreviewRole)}
                style={{
                  background: 'rgba(255,255,255,.12)', color: C.goldLt, border: `1px solid rgba(255,255,255,.2)`,
                  borderRadius: 4, padding: '4px 8px', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', appearance: 'auto' as const,
                }}
              >
                {PREVIEW_ROLES.map(r => (
                  <option key={r.value} value={r.value} style={{ color: '#222', background: '#fff' }}>
                    {r.value === 'admin' ? 'Viewing as: Admin' : r.label}
                  </option>
                ))}
              </select>
            )}
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
          {(['overview', 'documents', 'cohorts', 'codes', 'feedback', 'reports', 'support', 'incident', 'reflections', 'outcomes'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
              padding: '0.85rem 1rem', whiteSpace: 'nowrap',
              borderBottom: tab === t ? `3px solid ${C.gold}` : '3px solid transparent',
              color: tab === t ? C.navy : C.muted,
            }}>{TAB_LABELS[t]}</button>
          ))}
          {/* Youth tab — only visible when lgy_certified_tracks is set */}
          {hasLgy && (
            <button onClick={() => setTab('youth')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
              padding: '0.85rem 1rem', whiteSpace: 'nowrap',
              borderBottom: tab === 'youth' ? '3px solid #2E6B4F' : '3px solid transparent',
              color: tab === 'youth' ? '#2E6B4F' : C.muted,
            }}>Youth (LGY)</button>
          )}
        </div>

        {/* Content */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1.25rem' }}>

          {/* Preview mode banner */}
          {isPreviewActive && (
            <div style={{
              background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 8,
              padding: '0.75rem 1.1rem', marginBottom: '1.25rem',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.gold, fontWeight: 600,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Preview mode: viewing as {previewRoleLabel(previewRole)}. Your data is not affected.</span>
              <button onClick={() => setPreviewRole('admin')}
                style={{ ...btn(C.navy, '#fff', true), marginLeft: 12 }}>
                Exit Preview
              </button>
            </div>
          )}

          {/* Trainer / Org Contact preview cards */}
          {isPreviewActive && previewRole === 'trainer' && (
            <div style={{ ...card, borderLeft: `4px solid ${C.gold}` }}>
              <h2 style={sectionTitle}>Trainer Hub preview</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.muted, lineHeight: 1.7, margin: 0 }}>
                This is how the Trainer Hub appears. Trainers see their authorized facilitators, certification events, impact metrics, and training resources.
              </p>
              <a href="/trainers/hub/dashboard?preview=1" target="_blank" rel="noopener noreferrer"
                style={{ ...btn(C.navy, '#fff', true), display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                Open full Trainer Hub preview →
              </a>
            </div>
          )}
          {isPreviewActive && previewRole === 'org_contact' && (
            <div style={{ ...card, borderLeft: `4px solid ${C.gold}` }}>
              <h2 style={sectionTitle}>Organization Hub preview</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.muted, lineHeight: 1.7, margin: 0 }}>
                This is how the Organization Hub appears. Organization contacts see their facilitators, cohorts, licensing status, and program usage reports.
              </p>
            </div>
          )}

          {/* Facilitator preview: show onboarding wizard */}
          {isPreviewActive && (previewRole === 'facilitator_book1' || previewRole === 'facilitator_all') && previewProfile && (
            <>
              <div style={{ ...card, borderLeft: `4px solid ${C.gold}`, marginBottom: '1.25rem' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, margin: '0 0 0.5rem' }}>
                  Previewing as: <strong>{previewRoleLabel(previewRole)}</strong> — books certified: {previewProfile.books_certified?.join(', ') ?? 'none'}
                </p>
              </div>
              <CertCard profile={previewProfile} />
              <DocumentsLibrary profile={previewProfile} />
            </>
          )}

          {/* Normal content (hidden during preview) */}
          {!isPreviewActive && (
            <>
              <CertBanner status={profile.cert_status} renewal={profile.cert_renewal} />

              {/* Onboarding banner */}
              {showBanner && <OnboardingBanner onboardingStep={onboarding?.onboarding_step ?? 0} />}

              {/* Onboarding complete banner */}
              {onboarding?.onboarding_complete && isPending && (
                <div style={{ background: C.success + '12', border: `1px solid ${C.success}40`, borderRadius: 8,
                  padding: '0.85rem 1.1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
                  fontWeight: 500, color: C.success, fontFamily: 'Inter, sans-serif' }}>
                  Pre-training preparation complete. Your training day is going to be great. ✓
                </div>
              )}

              {/* Orientation Panel (Phase 2) */}
              {showOrientation && (
                <OrientationPanel onDismiss={() => setDismissedOrientation(true)} />
              )}

              {tab === 'overview' && (
                <>
                  <AnnouncementsCard announcements={announcements} />
                  <CertCard profile={profile} />
                  <CertAcknowledgmentCard />
                </>
              )}
              {tab === 'documents' && (
                <>
                  <DocumentsLibrary profile={profile} />
                  <GroupUseLicenseCard />
                </>
              )}
              {tab === 'cohorts'   && <CohortsCard cohorts={cohorts} profile={profile} onAdded={loadHub} />}
              {tab === 'codes'     && <CodesCard profile={profile} cohorts={cohorts} />}
              {tab === 'feedback'  && <FeedbackTab profile={profile} cohorts={cohorts} />}
              {tab === 'reports'   && <ReportsTab profile={profile} />}
              {tab === 'support'  && <SupportTab />}
              {tab === 'incident' && <IncidentTab profile={profile} cohorts={cohorts} />}
              {tab === 'reflections' && <ReflectionTab profile={profile} cohorts={cohorts} />}
              {tab === 'outcomes'    && <OutcomesTab cohorts={cohorts} />}
              {tab === 'youth'      && <YouthTab profile={profile} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
