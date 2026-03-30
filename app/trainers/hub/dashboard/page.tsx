'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

/* ── Books ── */
const BOOKS = [
  { id: 1, label: 'Book 1 — In The Quiet' },
  { id: 2, label: 'Book 2 — Through The Weight' },
  { id: 3, label: 'Book 3 — Toward the Light' },
  { id: 4, label: 'Book 4 — With the Memory' },
];

const BOOKS_MAP: Record<number, string> = {};
BOOKS.forEach(b => { BOOKS_MAP[b.id] = b.label; });

/* ── Types ── */
interface TrainerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  trainer_cert_id?: string;
  trainer_status?: string;
  trainer_cert_issued?: string;
  trainer_cert_renewal?: string;
  books_authorized_to_train?: number[];
  dismissed_trainer_orientation?: boolean;
}

interface Facilitator {
  id: string;
  full_name: string;
  email: string;
  organization?: string;
  cert_date?: string;
  cert_status: string;
  last_active?: string;
  book_number: number;
}

interface FacilitatorCohort {
  id: string;
  book_number: number;
  start_date: string;
  end_date?: string;
  participant_count?: number;
  status: string;
}

interface TrainingEvent {
  id: string;
  book_number: number;
  event_type: string;
  event_date: string;
  host_organization?: string;
  participant_count: number;
  fees_owed: number;
  fees_remitted: boolean;
  status?: string;
}

interface ImpactStats {
  total_facilitators_certified: number;
  active_in_network: number;
  total_participants_served: number;
  avg_completion_rate: number | null;
  avg_outcome_rating: number | null;
}

interface ResourceDoc {
  name: string;
  url: string | null;
  confidential: boolean;
  bucket?: string;
  path?: string;
}

interface ResourceSection {
  title: string;
  documents: ResourceDoc[];
}

interface ResourceGroup {
  groupTitle: string;
  groupDesc: string;
  sections: ResourceSection[];
}

/* ── Status Badge ── */
function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success : s === 'pending_renewal' ? C.warn
    : s === 'expired' ? C.danger : s === 'revoked' ? C.danger : C.muted;
  return (
    <span style={{ background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
      fontWeight: 600, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 1 — My Certified Facilitators
═════════════════════════════════════════════════════════════*/
function FacilitatorsTab({ profile }: { profile: TrainerProfile }) {
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cohorts, setCohorts] = useState<Record<string, FacilitatorCohort[]>>({});
  const [loadingCohorts, setLoadingCohorts] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trainer/facilitators', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setFacilitators(data.facilitators ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleExpand(fac: Facilitator) {
    if (expandedId === fac.id) { setExpandedId(null); return; }
    setExpandedId(fac.id);
    if (!cohorts[fac.id]) {
      setLoadingCohorts(fac.id);
      try {
        const res = await fetch(`/api/trainer/facilitators/${fac.id}/cohorts`, { credentials: 'include' });
        const data = await res.json();
        setCohorts(prev => ({ ...prev, [fac.id]: data.cohorts ?? [] }));
      } catch { /* ignore */ }
      setLoadingCohorts(null);
    }
  }

  if (loading) return <div style={{ ...card, color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading facilitators...</div>;

  const total = facilitators.length;
  const active = facilitators.filter(f => f.cert_status === 'active').length;
  const inactive = total - active;

  /* Group by book */
  const byBook: Record<number, Facilitator[]> = {};
  facilitators.forEach(f => {
    if (!byBook[f.book_number]) byBook[f.book_number] = [];
    byBook[f.book_number].push(f);
  });

  return (
    <>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Certified', value: total, color: C.navy },
          { label: 'Active', value: active, color: C.success },
          { label: 'Inactive', value: inactive, color: C.muted },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Grouped by book */}
      {BOOKS.map(book => {
        const group = byBook[book.id];
        if (!group || group.length === 0) return null;
        return <BookGroup key={book.id} book={book} facilitators={group}
          expandedId={expandedId} cohorts={cohorts} loadingCohorts={loadingCohorts}
          onToggle={toggleExpand} />;
      })}

      {facilitators.length === 0 && (
        <div style={{ ...card, color: C.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '2rem' }}>
          No certified facilitators yet.
        </div>
      )}
    </>
  );
}

function BookGroup({ book, facilitators, expandedId, cohorts, loadingCohorts, onToggle }: {
  book: { id: number; label: string };
  facilitators: Facilitator[];
  expandedId: string | null;
  cohorts: Record<string, FacilitatorCohort[]>;
  loadingCohorts: string | null;
  onToggle: (f: Facilitator) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={card}>
      <div onClick={() => setCollapsed(!collapsed)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <h2 style={{ ...sectionTitle, margin: 0 }}>
          {book.label}
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted, fontWeight: 500, marginLeft: 10 }}>
            ({facilitators.length})
          </span>
        </h2>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted }}>
          {collapsed ? '+' : '\u2212'}
        </span>
      </div>

      {!collapsed && (
        <div style={{ marginTop: '1rem' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
            gap: '0.5rem', padding: '0.5rem 0', borderBottom: `1px solid ${C.border}`,
            fontSize: '0.72rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase',
            letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif' }}>
            <span>Name</span>
            <span>Organization</span>
            <span>Cert Date</span>
            <span>Status</span>
            <span>Last Active</span>
          </div>

          {facilitators.map(f => (
            <div key={f.id}>
              <div onClick={() => onToggle(f)}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
                  gap: '0.5rem', padding: '0.65rem 0', borderBottom: `1px solid ${C.border}`,
                  fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy,
                  cursor: 'pointer', alignItems: 'center',
                  background: expandedId === f.id ? C.goldLt : 'transparent' }}>
                <span style={{ fontWeight: 500 }}>{f.full_name}</span>
                <span style={{ color: C.muted }}>{f.organization ?? '\u2014'}</span>
                <span style={{ color: C.muted }}>{f.cert_date ?? '\u2014'}</span>
                <StatusBadge s={f.cert_status} />
                <span style={{ color: C.muted }}>{f.last_active ?? '\u2014'}</span>
              </div>

              {/* Expanded cohorts */}
              {expandedId === f.id && (
                <div style={{ background: C.bg, padding: '0.75rem 1rem', borderBottom: `1px solid ${C.border}` }}>
                  {loadingCohorts === f.id ? (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted }}>Loading cohorts...</div>
                  ) : (cohorts[f.id]?.length ?? 0) === 0 ? (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted }}>No cohorts recorded.</div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr 1fr',
                        gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.7rem', fontWeight: 600,
                        color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
                        fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}` }}>
                        <span>Book</span>
                        <span>Start</span>
                        <span>End</span>
                        <span>Participants</span>
                        <span>Status</span>
                      </div>
                      {cohorts[f.id].map(ch => (
                        <div key={ch.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr 1fr',
                          gap: '0.5rem', padding: '0.5rem 0', fontSize: '0.82rem', color: C.navy,
                          fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}40` }}>
                          <span>{BOOKS_MAP[ch.book_number] ?? `Book ${ch.book_number}`}</span>
                          <span style={{ color: C.muted }}>{ch.start_date}</span>
                          <span style={{ color: C.muted }}>{ch.end_date ?? '\u2014'}</span>
                          <span style={{ color: C.muted }}>{ch.participant_count ?? '\u2014'}</span>
                          <StatusBadge s={ch.status} />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 2 — My Training Events
═════════════════════════════════════════════════════════════*/
function TrainingEventsTab() {
  /* New event form */
  const [bookNumber, setBookNumber] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [hostOrg, setHostOrg] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* Event history */
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadEvents = useCallback(() => {
    fetch('/api/trainer/events', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setEvents(data.events ?? []); setLoadingEvents(false); })
      .catch(() => setLoadingEvents(false));
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  async function handleSubmit() {
    if (!bookNumber || !eventType || !eventDate || !participantCount) {
      setFormMsg({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await fetch('/api/trainer/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_number: parseInt(bookNumber),
          event_type: eventType,
          event_date: eventDate,
          host_organization: hostOrg || undefined,
          participant_count: parseInt(participantCount),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormMsg({ type: 'success', text: 'Training event logged successfully.' });
        setBookNumber(''); setEventType(''); setEventDate(''); setHostOrg(''); setParticipantCount('');
        loadEvents();
      } else {
        setFormMsg({ type: 'error', text: data.error ?? 'Failed to log event.' });
      }
    } catch {
      setFormMsg({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSubmitting(false);
  }

  async function markRemitted(eventId: string) {
    setMarkingId(eventId);
    try {
      await fetch(`/api/trainer/events/${eventId}/remit`, {
        method: 'PATCH',
        credentials: 'include',
      });
      loadEvents();
    } catch { /* ignore */ }
    setMarkingId(null);
  }

  const count = parseInt(participantCount) || 0;
  const fee = 450;
  const total = fee * count;

  function eventStatusBadge(ev: TrainingEvent) {
    if (ev.fees_remitted) return <StatusBadge s="Fees Remitted" />;
    const daysSince = Math.floor((Date.now() - new Date(ev.event_date).getTime()) / 86400000);
    if (daysSince > 30) {
      return (
        <span style={{ background: C.danger + '18', color: C.danger, border: `1px solid ${C.danger}40`,
          borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
          fontWeight: 600, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
          Overdue
        </span>
      );
    }
    return (
      <span style={{ background: C.warn + '18', color: C.warn, border: `1px solid ${C.warn}40`,
        borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem',
        fontWeight: 600, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
        Pending Remittance
      </span>
    );
  }

  return (
    <>
      {/* Log New Event */}
      <div style={card}>
        <h2 style={sectionTitle}>Log New Training Event</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={fieldLabel}>Book</label>
            <select style={inp} value={bookNumber} onChange={e => setBookNumber(e.target.value)}>
              <option value="">Select book...</option>
              {BOOKS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Event Type</label>
            <select style={inp} value={eventType} onChange={e => setEventType(e.target.value)}>
              <option value="">Select type...</option>
              <option value="Virtual Cohort">Virtual Cohort</option>
              <option value="Hosted Virtual">Hosted Virtual</option>
              <option value="Hosted In-Person">Hosted In-Person</option>
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Event Date</label>
            <input type="date" style={inp} value={eventDate} onChange={e => setEventDate(e.target.value)} />
          </div>
          <div>
            <label style={fieldLabel}>Host Organization (optional)</label>
            <input type="text" style={inp} value={hostOrg} onChange={e => setHostOrg(e.target.value)}
              placeholder="Organization name" />
          </div>
          <div>
            <label style={fieldLabel}>Participant Count</label>
            <input type="number" style={inp} value={participantCount}
              onChange={e => setParticipantCount(e.target.value)} min="0" placeholder="0" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {count > 0 && (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: C.gold, fontWeight: 600 }}>
                ${fee} &times; {count} = ${total.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {formMsg && (
          <div style={{ marginTop: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
            color: formMsg.type === 'success' ? C.success : C.danger, fontWeight: 500 }}>
            {formMsg.text}
          </div>
        )}

        <div style={{ marginTop: '1.25rem' }}>
          <button style={btn(C.gold)} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Log Event'}
          </button>
        </div>
      </div>

      {/* Event History */}
      <div style={card}>
        <h2 style={sectionTitle}>Event History</h2>

        {loadingEvents ? (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted, textAlign: 'center', padding: '1.5rem' }}>
            No training events logged yet.
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.2fr 0.8fr 1fr 1.2fr 1fr',
              gap: '0.5rem', padding: '0.5rem 0', borderBottom: `1px solid ${C.border}`,
              fontSize: '0.72rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif' }}>
              <span>Date</span>
              <span>Book</span>
              <span>Event Type</span>
              <span>Participants</span>
              <span>Fees Owed</span>
              <span>Status</span>
              <span></span>
            </div>

            {events.map(ev => (
              <div key={ev.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.2fr 0.8fr 1fr 1.2fr 1fr',
                gap: '0.5rem', padding: '0.65rem 0', borderBottom: `1px solid ${C.border}`,
                fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, alignItems: 'center' }}>
                <span style={{ color: C.muted }}>{ev.event_date}</span>
                <span>{BOOKS_MAP[ev.book_number] ?? `Book ${ev.book_number}`}</span>
                <span style={{ color: C.muted }}>{ev.event_type}</span>
                <span>{ev.participant_count}</span>
                <span style={{ fontWeight: 600 }}>${ev.fees_owed?.toLocaleString() ?? '0'}</span>
                {eventStatusBadge(ev)}
                <span>
                  {!ev.fees_remitted && (
                    <button style={btn(C.navy, '#fff', true)} onClick={() => markRemitted(ev.id)}
                      disabled={markingId === ev.id}>
                      {markingId === ev.id ? '...' : 'Mark Remitted'}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 3 — My Impact
═════════════════════════════════════════════════════════════*/
function ImpactTab() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trainer/impact', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ ...card, color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading impact data...</div>;
  if (!stats) return <div style={{ ...card, color: C.muted, fontFamily: 'Inter, sans-serif' }}>Unable to load impact data.</div>;

  const items = [
    { label: 'Total Facilitators Certified', value: stats.total_facilitators_certified },
    { label: 'Active in Network', value: stats.active_in_network },
    { label: 'Total Participants Served', value: stats.total_participants_served },
    { label: 'Avg Completion Rate', value: stats.avg_completion_rate != null ? `${Math.round(stats.avg_completion_rate)}%` : 'No data yet' },
    { label: 'Avg Outcome Rating', value: stats.avg_outcome_rating != null ? stats.avg_outcome_rating.toFixed(1) : 'No data yet' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ ...card, background: C.goldLt, textAlign: 'center', padding: '1.5rem 1rem' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: C.gold }}>
            {item.value}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: C.navy, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 8 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 4 — My Certification
═════════════════════════════════════════════════════════════*/
function CertificationTab({ profile }: { profile: TrainerProfile }) {
  const renewalDate = profile.trainer_cert_renewal ? new Date(profile.trainer_cert_renewal) : null;
  const daysLeft = renewalDate ? Math.ceil((renewalDate.getTime() - Date.now()) / 86400000) : 0;
  const pct = Math.max(0, Math.min(100, Math.round((daysLeft / 365) * 100)));
  const barColor = daysLeft > 90 ? C.success : daysLeft > 30 ? C.warn : C.danger;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>My Trainer Certification</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Cert ID */}
        <div>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
            Trainer Cert ID
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: C.gold, background: C.goldLt,
            padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>
            {profile.trainer_cert_id ?? '\u2014'}
          </span>
        </div>

        {/* Status */}
        <div>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
            Status
          </div>
          <StatusBadge s={profile.trainer_status ?? 'unknown'} />
        </div>

        {/* Cert Issued */}
        <div>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
            Cert Issued
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', color: C.navy, fontWeight: 500 }}>
            {profile.trainer_cert_issued ? new Date(profile.trainer_cert_issued).toLocaleDateString() : '\u2014'}
          </div>
        </div>

        {/* Cert Renewal */}
        <div>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
            Cert Renewal
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', color: C.navy, fontWeight: 500 }}>
            {profile.trainer_cert_renewal ? new Date(profile.trainer_cert_renewal).toLocaleDateString() : '\u2014'}
          </div>
        </div>
      </div>

      {/* Books Authorized */}
      {(profile.books_authorized_to_train?.length ?? 0) > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
            Books Authorized to Train
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.books_authorized_to_train!.sort((a, b) => a - b).map(b => (
              <span key={b} style={{ background: C.goldLt, color: C.gold, border: `1px solid ${C.gold}40`,
                borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem',
                fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                {BOOKS_MAP[b] ?? `Book ${b}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Renewal progress bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem',
          color: C.muted, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
          <span>Time remaining</span>
          <span style={{ color: barColor, fontWeight: 600 }}>{daysLeft > 0 ? `${daysLeft} days` : 'Expired'}</span>
        </div>
        <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{ background: barColor, width: `${pct}%`, height: '100%',
            borderRadius: 99, transition: 'width .5s ease' }} />
        </div>
        {daysLeft <= 90 && daysLeft > 30 && (
          <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
            color: C.warn, fontWeight: 500 }}>
            Renewal approaching
          </div>
        )}
        {daysLeft <= 30 && (
          <div style={{ marginTop: 8, fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
            color: C.danger, fontWeight: 500 }}>
            Renewal overdue — contact wayne@tripillarstudio.com
          </div>
        )}
      </div>

      {/* Renewal instructions */}
      <div style={{ background: C.bg, borderRadius: 8, padding: '1rem 1.25rem', border: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy, lineHeight: 1.7 }}>
          To renew your Trainer authorization, reply to your renewal reminder email or contact{' '}
          <a href="mailto:wayne@tripillarstudio.com" style={{ color: C.gold, fontWeight: 600 }}>wayne@tripillarstudio.com</a>{' '}
          at least 30 days before your renewal date. Renewal requires: $250 renewal fee, at least one training event in the past year,
          all certification records and fees submitted.
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB 5 — Resources
═════════════════════════════════════════════════════════════*/
function ResourcesTab({ profile: _profile }: { profile: TrainerProfile }) {
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ name: string; url: string } | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/trainer/resources', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setGroups(data.sections ?? []);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load resources.'); setLoading(false); });
  }, []);

  async function handleConfirmDownload() {
    if (!confirmModal) return;
    try {
      await fetch('/api/trainer/resources', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_name: confirmModal.name }),
      });
    } catch { /* logging failure — still allow download */ }
    window.open(confirmModal.url, '_blank');
    setConfirmModal(null);
  }

  function toggleSection(key: string) {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) return (
    <div style={{ ...card, color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading resources…</div>
  );

  if (error) return (
    <div style={{ ...card, color: C.danger, fontFamily: 'Inter, sans-serif' }}>{error}</div>
  );

  if (groups.length === 0) return (
    <div style={{ ...card, color: C.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '2rem' }}>
      No resources available.
    </div>
  );

  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: '2rem' }}>
          {/* Group header */}
          <div style={{
            background: gi === 0 ? C.navy : C.goldLt,
            borderRadius: 8,
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            borderLeft: `4px solid ${gi === 0 ? C.gold : C.gold}`,
          }}>
            <div style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: gi === 0 ? C.gold : C.navy,
              marginBottom: '0.3rem',
            }}>
              {group.groupTitle}
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.82rem',
              color: gi === 0 ? 'rgba(255,255,255,.75)' : C.muted,
              lineHeight: 1.5,
            }}>
              {group.groupDesc}
            </div>
          </div>

          {/* Sections within this group */}
          {group.sections.map((sec, si) => {
            const sectionKey = `${gi}-${si}`;
            const collapsed = collapsedSections[sectionKey] ?? false;
            const availableDocs = sec.documents.filter(d => d.url !== null);
            if (availableDocs.length === 0) return null;

            return (
              <div key={si} style={{ ...card, marginBottom: '0.75rem' }}>
                {/* Section header — collapsible */}
                <div
                  onClick={() => toggleSection(sectionKey)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <h3 style={{ ...sectionTitle, margin: 0, fontSize: '1rem' }}>{sec.title}</h3>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted }}>
                    {availableDocs.length} doc{availableDocs.length !== 1 ? 's' : ''} {collapsed ? '▸' : '▾'}
                  </span>
                </div>

                {!collapsed && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {availableDocs.map((doc, di) => (
                      <div
                        key={di}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.6rem 0',
                          borderBottom: di < availableDocs.length - 1 ? `1px solid ${C.border}` : 'none',
                        }}
                      >
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy, flex: 1, paddingRight: '1rem' }}>
                          {doc.name}
                          {doc.confidential && (
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: '0.68rem',
                              color: '#fff', background: C.danger,
                              fontWeight: 700, marginLeft: 8,
                              padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em',
                            }}>
                              CONFIDENTIAL
                            </span>
                          )}
                        </span>
                        {doc.confidential ? (
                          <button
                            style={btn(C.navy, '#fff', true)}
                            onClick={() => doc.url && setConfirmModal({ name: doc.name, url: doc.url })}
                          >
                            Download
                          </button>
                        ) : (
                          <a href={doc.url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <button style={btn(C.gold, '#fff', true)}>Download</button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Confidential download confirmation modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ ...card, maxWidth: 480, margin: '1rem' }}>
            <h3 style={sectionTitle}>Confidential Document</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.navy, lineHeight: 1.6, marginBottom: '0.75rem' }}>
              <strong>{confirmModal.name}</strong>
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy, lineHeight: 1.6 }}>
              This document is confidential. Do not share, reproduce, or distribute under any circumstances.
              This download will be logged. By proceeding you accept full responsibility for its security.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button style={btn(C.border, C.navy, true)} onClick={() => setConfirmModal(null)}>Cancel</button>
              <button style={btn(C.danger)} onClick={handleConfirmDownload}>I Understand — Download</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT — Trainer Hub Dashboard
═════════════════════════════════════════════════════════════*/
type Tab = 'facilitators' | 'events' | 'impact' | 'certification' | 'resources';

const TAB_LABELS: Record<Tab, string> = {
  facilitators: 'My Certified Facilitators',
  events: 'My Training Events',
  impact: 'My Impact',
  certification: 'My Certification',
  resources: 'Resources',
};

export default function TrainerHubDashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && (p === 'facilitators' || p === 'events' || p === 'impact' || p === 'certification' || p === 'resources')) {
        return p as Tab;
      }
    }
    return 'facilitators';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ── Load font ── */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.querySelector(`link[href="${FONT_LINK}"]`);
    if (existing) return;
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);
    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = '';
    document.head.appendChild(preconnect2);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);

  /* ── Auth + profile load (cookie-based via /api/auth/me) ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) { router.push('/facilitators/login'); return; }
        if (!res.ok) { setError('Failed to load profile.'); setLoading(false); return; }

        const data = await res.json();
        const prof = data.profile;

        if (!prof || (prof.role !== 'trainer' && prof.role !== 'super_admin')) {
          router.push('/facilitators/hub/dashboard');
          return;
        }

        const trainerProf = prof as TrainerProfile;
        setProfile(trainerProf);

        // Check dismissed_trainer_orientation via dedicated endpoint
        // (separate column from facilitator dismissed_orientation — avoids shared-state collision)
        try {
          const dismissRes = await fetch('/api/trainer/dismiss-orientation', { credentials: 'include' });
          if (dismissRes.ok) {
            const dismissData = await dismissRes.json();
            if (!dismissData.dismissed) setShowWelcome(true);
          } else {
            // Endpoint error — default to showing welcome
            setShowWelcome(true);
          }
        } catch {
          setShowWelcome(true);
        }
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load profile.');
        setLoading(false);
      }
    })();
  }, [router]);

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    router.replace('/facilitators/login');
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: C.muted }}>
      Loading...
    </div>
  );

  /* ── Error ── */
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
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
        {/* Topbar */}
        <div style={{ background: C.navy, height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 1.25rem',
          position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold,
              fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
              Trainer Hub
            </span>
            <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '0.875rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="https://tripillarstudio.com" style={{ color: 'rgba(248,244,238,0.55)', fontSize: '0.78rem',
              textDecoration: 'none', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              &larr; tripillarstudio.com
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
          {(['facilitators', 'events', 'impact', 'certification', 'resources'] as Tab[]).map(t => (
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
          {/* Preview mode banner */}
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1' && (
            <div style={{
              background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 8,
              padding: '0.75rem 1.1rem', marginBottom: '1.25rem',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.gold, fontWeight: 600,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Preview mode: viewing as Trainer.</span>
              <a href="/facilitators/hub/dashboard" style={{
                color: C.navy, fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
              }}>Exit preview →</a>
            </div>
          )}
          {/* Trainer Welcome Banner — first login only */}
          {showWelcome && (
            <div style={{
              background: '#FFFBF0', border: '1px solid #C9A84C', borderLeft: '4px solid #C9A84C',
              borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
              fontFamily: 'Inter, sans-serif',
            }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#1B2B4B', margin: '0 0 0.75rem' }}>
                Welcome to the Live and Grieve™ Trainer Hub.
              </h2>
              <p style={{ color: '#2D3142', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
                Your authorization is active. Before you schedule your first certification event, review your Trainer Agreement in the Resources tab — specifically the fee remittance timeline, assessment administration procedures, and Answer Key confidentiality requirements. Everything else you need is in the tabs above. If you have questions before your first event, use the support contact in your Hub.
              </p>
              <button
                onClick={async () => {
                  setShowWelcome(false);
                  await fetch('/api/trainer/dismiss-orientation', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({}),
                  });
                }}
                style={{ background: '#1B2B4B', color: '#F8F4EE', border: 'none', borderRadius: 6,
                  padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Got it
              </button>
            </div>
          )}
          {tab === 'facilitators'   && <FacilitatorsTab profile={profile} />}
          {tab === 'events'         && <TrainingEventsTab />}
          {tab === 'impact'         && <ImpactTab />}
          {tab === 'certification'  && <CertificationTab profile={profile} />}
          {tab === 'resources'      && <ResourcesTab profile={profile} />}
        </div>
      </div>
    </>
  );
}
