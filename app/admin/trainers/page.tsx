'use client';

import { useState, useEffect, useCallback } from 'react';

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  virtual_cohort:   'Virtual Cohort',
  hosted_virtual:   'Hosted Virtual',
  hosted_in_person: 'Hosted In-Person',
};

interface TrainerEvent {
  id: string;
  book_number: number;
  event_type: string;
  event_date: string;
  host_organization: string | null;
  participant_count: number;
  certification_fees_collected: number;
  fees_remitted: boolean;
  fees_remitted_at: string | null;
  created_at: string;
  trainer_id: string;
  facilitator_profiles: {
    full_name: string;
    email: string;
    trainer_cert_id: string | null;
  } | null;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function usd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminTrainersPage() {
  const [events, setEvents]   = useState<TrainerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<'all' | 'pending' | 'remitted'>('all');
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);
  const [saving, setSaving]   = useState<string | null>(null);

  // Trainer listing toggle state
  const [trainers, setTrainers]     = useState<{ id: string; user_id: string; full_name: string; is_publicly_listed: boolean }[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const adminHeaders = { 'x-admin-secret': 'tripillar-admin-2024', 'Content-Type': 'application/json' };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filter === 'pending')  params.set('fees_remitted', 'false');
    if (filter === 'remitted') params.set('fees_remitted', 'true');

    const r = await fetch(`/api/admin/trainer-events?${params}`, { headers: adminHeaders });
    const d = await r.json();
    if (d.error) { setError(d.error); } else {
      setEvents(d.data ?? []);
      setTotal(d.count ?? 0);
      setPages(d.pages ?? 1);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const loadTrainers = useCallback(async () => {
    setListLoading(true);
    const r = await fetch('/api/admin/facilitators?page=1&status=active', { headers: adminHeaders });
    const d = await r.json();
    // Filter to trainers only
    const ts = (d.data ?? []).filter((f: { role: string }) => f.role === 'trainer');
    setTrainers(ts);
    setListLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadTrainers(); }, [loadTrainers]);

  async function toggleRemitted(eventId: string, current: boolean) {
    setSaving(eventId);
    await fetch('/api/admin/trainer-events', {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ event_id: eventId, fees_remitted: !current }),
    });
    await loadEvents();
    setSaving(null);
  }

  async function togglePublicListing(userId: string, current: boolean) {
    await fetch('/api/admin/facilitators', {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ user_id: userId, is_publicly_listed: !current }),
    });
    setTrainers(ts => ts.map(t => t.user_id === userId ? { ...t, is_publicly_listed: !current } : t));
  }

  const pendingFees = events.filter(e => !e.fees_remitted).reduce((s, e) => s + e.certification_fees_collected, 0);
  const totalFees   = events.reduce((s, e) => s + e.certification_fees_collected, 0);

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" />
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <a href="/admin/facilitators" style={{ color: C.gold, fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Facilitators</a>
            <h1 style={{ fontFamily: 'Playfair Display, serif', color: C.navy, fontSize: '1.8rem', margin: '0.5rem 0 0' }}>
              Trainer Management
            </h1>
          </div>

          {/* Trainer Listing Toggles */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ color: C.navy, fontSize: '1rem', margin: '0 0 1rem', fontWeight: 600 }}>
              Public Trainer Registry — Listing Control
            </h2>
            {listLoading ? (
              <p style={{ color: C.muted }}>Loading trainers…</p>
            ) : trainers.length === 0 ? (
              <p style={{ color: C.muted }}>No active trainers found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: C.muted, fontWeight: 500 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: C.muted, fontWeight: 500 }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: C.muted, fontWeight: 500 }}>Cert ID</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', color: C.muted, fontWeight: 500 }}>Listed Publicly</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '0.6rem 0.75rem', color: C.navy, fontWeight: 500 }}>{t.full_name}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: C.muted }}>{(t as unknown as Record<string, unknown>).email as string}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: C.muted, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {((t as unknown as Record<string, unknown>).trainer_cert_id as string) ?? '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => togglePublicListing(t.user_id, t.is_publicly_listed)}
                          style={{
                            background: t.is_publicly_listed ? C.success : C.border,
                            color: t.is_publicly_listed ? C.white : C.muted,
                            border: 'none', borderRadius: 20, padding: '0.3rem 1rem',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all .2s',
                          }}
                        >
                          {t.is_publicly_listed ? '✓ Listed' : 'Not Listed'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Fee Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Events', value: String(total) },
              { label: 'Fees Pending Remittance', value: usd(pendingFees), color: pendingFees > 0 ? C.warn : C.success },
              { label: 'Total Fees (this page)', value: usd(totalFees) },
            ].map((s) => (
              <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '1rem 1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '1.4rem', fontWeight: 700, color: s.color ?? C.navy }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {(['all', 'pending', 'remitted'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                style={{
                  background: filter === f ? C.navy : C.white,
                  color: filter === f ? C.white : C.muted,
                  border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem',
                  fontWeight: filter === f ? 600 : 400,
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Events Table */}
          {error && <p style={{ color: C.danger }}>{error}</p>}
          {loading ? (
            <p style={{ color: C.muted }}>Loading events…</p>
          ) : events.length === 0 ? (
            <p style={{ color: C.muted }}>No training events found.</p>
          ) : (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                    {['Date', 'Trainer', 'Book', 'Type', 'Participants', 'Fees', 'Remitted', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '0.75rem 1rem', color: C.navy, whiteSpace: 'nowrap' }}>{fmt(ev.event_date)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: C.navy }}>{ev.facilitator_profiles?.full_name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace' }}>
                          {ev.facilitator_profiles?.trainer_cert_id ?? ev.trainer_id.slice(0, 8)}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: C.navy }}>Book {ev.book_number}</td>
                      <td style={{ padding: '0.75rem 1rem', color: C.muted, whiteSpace: 'nowrap' }}>
                        {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: C.navy, textAlign: 'center' }}>{ev.participant_count}</td>
                      <td style={{ padding: '0.75rem 1rem', color: C.navy, fontWeight: 600 }}>
                        {usd(ev.certification_fees_collected)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {ev.fees_remitted ? (
                          <span style={{ color: C.success, fontWeight: 600, fontSize: '0.8rem' }}>
                            ✓ {fmt(ev.fees_remitted_at)}
                          </span>
                        ) : (
                          <span style={{ color: C.warn, fontWeight: 600, fontSize: '0.8rem' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => toggleRemitted(ev.id, ev.fees_remitted)}
                          disabled={saving === ev.id}
                          style={{
                            background: ev.fees_remitted ? C.border : C.navy,
                            color: ev.fees_remitted ? C.muted : C.white,
                            border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem',
                            cursor: saving === ev.id ? 'wait' : 'pointer', fontSize: '0.78rem',
                          }}
                        >
                          {saving === ev.id ? '…' : ev.fees_remitted ? 'Unmark' : 'Mark Remitted'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pages > 1 && (
                <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    style={{ padding: '0.4rem 1rem', borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', background: C.white }}>
                    ← Prev
                  </button>
                  <span style={{ padding: '0.4rem 0.75rem', color: C.muted, fontSize: '0.85rem' }}>
                    {page} / {pages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
                    style={{ padding: '0.4rem 1rem', borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', background: C.white }}>
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
