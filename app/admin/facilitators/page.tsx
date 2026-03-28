'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Google Fonts ── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

/* ── Design tokens ── */
const C = {
  navy:    '#2D3142',
  gold:    '#B8942F',
  goldLt:  '#F5EDD5',
  bg:      '#F5F4F0',
  white:   '#FFFFFF',
  border:  '#DDD9D0',
  muted:   '#6B7280',
  danger:  '#DC2626',
  success: '#16A34A',
  warn:    '#D97706',
  info:    '#2563EB',
};

/* ── Shared styles ── */
const inp: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem',
  border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
  background: C.white, boxSizing: 'border-box', color: C.navy,
};

const btn = (bg: string, fg = '#fff', small = false): React.CSSProperties => ({
  background: bg, color: fg, border: 'none', borderRadius: 6,
  padding: small ? '0.35rem 0.75rem' : '0.6rem 1.2rem',
  fontSize: small ? '0.78rem' : '0.875rem', fontWeight: 600,
  fontFamily: 'Inter, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' as const,
});

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: C.navy, marginBottom: 4, fontFamily: 'Inter, sans-serif',
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

const card: React.CSSProperties = {
  background: C.white, borderRadius: 10,
  border: `1px solid ${C.border}`,
  padding: '1.75rem', marginBottom: '1.5rem',
  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Playfair Display, serif', fontSize: '1.3rem',
  color: C.navy, fontWeight: 700, margin: '0 0 1.25rem',
};

/* ── Types ── */
interface Org {
  id: string; name: string; type?: string;
  license_type?: string; license_status?: string;
  license_start?: string; license_renewal?: string;
  contact_name?: string; contact_email?: string; contact_phone?: string;
  address?: string; state?: string; notes?: string;
  facilitator_count?: number; created_at?: string;
}

interface Facilitator {
  id: string; user_id: string; full_name: string; email: string;
  phone?: string; role: string; cert_id: string; cert_status: string;
  cert_issued: string; cert_renewal: string;
  organization_id?: string; books_certified?: number[];
  created_at: string; last_active?: string;
}

/* ── Helpers ── */
function adminSecret(): string {
  const m = document.cookie.match(/lg-admin-session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success
    : s === 'pending_renewal' ? C.warn
    : s === 'expired' ? C.danger : C.muted;
  return (
    <span style={{ background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600,
      fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
      {s.replace('_', ' ')}
    </span>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: ok ? C.success : C.danger, color: '#fff',
      borderRadius: 8, padding: '0.75rem 1.25rem',
      fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600,
      boxShadow: '0 4px 16px rgba(0,0,0,.18)',
    }}>{msg}</div>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 1 — Create Facilitator Form
═════════════════════════════════════════════════════════════*/
const BOOKS = [
  { id: 1, label: 'Book 1 — Understanding Grief' },
  { id: 2, label: 'Book 2 — The Grieving Body' },
  { id: 3, label: 'Book 3 — Relationships and Grief' },
  { id: 4, label: 'Book 4 — Finding Meaning' },
  { id: 5, label: 'Book 5 — Continuing Bonds' },
  { id: 6, label: 'Book 6 — Living Forward' },
];

const ROLES = [
  { value: 'community',    label: 'Community Track' },
  { value: 'professional', label: 'Professional Track' },
  { value: 'ministry',     label: 'Ministry Track' },
  { value: 'org_admin',    label: 'Org Admin' },
];

interface CreateResult { cert_id: string; temp_password: string; email: string; full_name: string; }

function CreateFacilitatorForm({ orgs, onCreated }: { orgs: Org[]; onCreated: () => void }) {
  const empty = {
    first_name: '', last_name: '', email: '', phone: '',
    temp_password: '', role: 'community', org_id: '',
  };
  const [form,         setForm]         = useState(empty);
  const [books,        setBooks]        = useState<number[]>([]);
  const [addOrg,       setAddOrg]       = useState(false);
  const [newOrgName,   setNewOrgName]   = useState('');
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<CreateResult | null>(null);
  const [error,        setError]        = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function toggleBook(id: number) {
    setBooks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id]);
  }

  function genPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);

    // If adding a new org inline, create it first
    let orgId = form.org_id;
    if (addOrg && newOrgName.trim()) {
      const r = await fetch('/api/admin/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      if (r.ok) {
        const d = await r.json();
        orgId = d.org?.id ?? '';
        onCreated(); // refresh org list
      } else {
        setError('Failed to create organization.');
        setLoading(false);
        return;
      }
    }

    const res = await fetch('/api/create-facilitator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret(),
      },
      body: JSON.stringify({
        ...form,
        track: form.role,
        org_id: orgId || undefined,
        books_certified: books,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult({
        cert_id:      data.facilitator.cert_id,
        temp_password: form.temp_password,
        email:        form.email,
        full_name:    `${form.first_name} ${form.last_name}`,
      });
      setForm(empty);
      setBooks([]);
      setNewOrgName('');
      setAddOrg(false);
      onCreated();
    } else {
      setError(data.error ?? 'Unknown error');
    }
  }

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Add New Facilitator</h2>

      {result && (
        <div style={{
          background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 8,
          padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: C.navy, margin: '0 0 0.75rem', fontWeight: 700 }}>
            ✓ Facilitator created — {result.full_name}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 1rem',
            fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: C.navy }}>
            <strong>Cert ID:</strong> <code style={{ background: C.white, padding: '2px 6px', borderRadius: 4 }}>{result.cert_id}</code>
            <strong>Email:</strong>   <span>{result.email}</span>
            <strong>Temp PW:</strong> <code style={{ background: C.white, padding: '2px 6px', borderRadius: 4 }}>{result.temp_password}</code>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted, margin: '0.75rem 0 0' }}>
            Welcome email sent automatically. Share the temp password with the facilitator — they set a new one on first login.
          </p>
          <button onClick={() => setResult(null)} style={{ ...btn(C.navy, '#fff', true), marginTop: '0.75rem' }}>
            Add another
          </button>
        </div>
      )}

      <form onSubmit={submit}>
        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={fieldLabel}>First Name *</label>
            <input style={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Last Name *</label>
            <input style={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Email *</label>
            <input type="email" style={inp} value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Phone</label>
            <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>

        {/* Role + password row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={fieldLabel}>Role / Track *</label>
            <select style={inp} value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Temp Password *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} value={form.temp_password}
                onChange={e => set('temp_password', e.target.value)} required
                placeholder="Min 8 chars" />
              <button type="button" onClick={() => set('temp_password', genPassword())}
                style={{ ...btn(C.border, C.navy, true), whiteSpace: 'nowrap', padding: '0.55rem 0.75rem' }}>
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={fieldLabel}>Organization</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!addOrg ? (
              <>
                <select style={{ ...inp, flex: 1, minWidth: 200 }}
                  value={form.org_id} onChange={e => set('org_id', e.target.value)}>
                  <option value="">— None / Individual —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <button type="button" onClick={() => setAddOrg(true)}
                  style={{ ...btn(C.border, C.navy, true) }}>
                  + New Org
                </button>
              </>
            ) : (
              <>
                <input style={{ ...inp, flex: 1, minWidth: 200 }} placeholder="Organization name"
                  value={newOrgName} onChange={e => setNewOrgName(e.target.value)} autoFocus />
                <button type="button" onClick={() => { setAddOrg(false); setNewOrgName(''); }}
                  style={{ ...btn(C.border, C.navy, true) }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Books certified */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={fieldLabel}>Books Certified to Facilitate</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', marginTop: 4 }}>
            {BOOKS.map(b => (
              <label key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy,
                padding: '0.5rem 0.75rem', borderRadius: 6,
                background: books.includes(b.id) ? C.goldLt : C.bg,
                border: `1px solid ${books.includes(b.id) ? C.gold : C.border}`,
              }}>
                <input type="checkbox" checked={books.includes(b.id)}
                  onChange={() => toggleBook(b.id)}
                  style={{ accentColor: C.gold, width: 16, height: 16 }} />
                {b.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: C.danger + '12', border: `1px solid ${C.danger}`,
            borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1rem',
            fontSize: '0.875rem', color: C.danger, fontFamily: 'Inter, sans-serif' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ ...btn(loading ? C.muted : C.gold), opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating…' : 'Create Facilitator + Send Welcome Email'}
        </button>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 2 — Facilitator List
═════════════════════════════════════════════════════════════*/
/* ── Facilitator codes summary (used inside FacilitatorProfile) ── */
interface CodeStats { total: number; active: number; redeemed: number; expired: number; revoked: number; }
interface CodeBatch { id: string; book_number: number; batch_size: number; expires_at: string; notes: string; created_at: string; }

function FacCodesSummary({ facilProfileId }: { facilProfileId: string }) {
  const [stats,   setStats]   = useState<CodeStats | null>(null);
  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res  = await fetch(`/api/admin/facilitator-codes/${facilProfileId}`);
      const json = await res.json();
      if (json.stats)   setStats(json.stats);
      if (json.batches) setBatches(json.batches);
      setLoading(false);
    })();
  }, [facilProfileId]);

  if (loading) return <p style={{ color: C.muted, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>Loading code data…</p>;
  if (!stats)  return null;

  const statItems = [
    { label: 'Total Generated', val: stats.total,    color: C.navy },
    { label: 'Active',          val: stats.active,   color: C.success },
    { label: 'Redeemed',        val: stats.redeemed, color: C.info },
    { label: 'Expired',         val: stats.expired,  color: C.muted },
    { label: 'Revoked',         val: stats.revoked,  color: C.danger },
  ];

  return (
    <div>
      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1rem' }}>
        {statItems.map(({ label, val, color }) => (
          <div key={label} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '10px 14px', minWidth: 90, textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color, fontFamily: 'Inter, sans-serif' }}>{val}</div>
            <div style={{ fontSize: '0.7rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Batches toggle */}
      {batches.length > 0 && (
        <div>
          <button onClick={() => setExpanded(e => !e)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.info,
            fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 600,
            padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
          }}>
            {expanded ? '▲ Hide batches' : `▼ View ${batches.length} batch${batches.length === 1 ? '' : 'es'}`}
          </button>
          {expanded && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem',
              fontFamily: 'Inter, sans-serif', marginTop: '0.6rem' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Book', 'Size', 'Expires', 'Notes', 'Created'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: C.muted,
                      fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                      fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '5px 8px', color: C.navy }}>Book {b.book_number}</td>
                    <td style={{ padding: '5px 8px', color: C.navy }}>{b.batch_size}</td>
                    <td style={{ padding: '5px 8px', color: C.muted, whiteSpace: 'nowrap' }}>
                      {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '5px 8px', color: C.muted }}>{b.notes ?? '—'}</td>
                    <td style={{ padding: '5px 8px', color: C.muted, whiteSpace: 'nowrap' }}>
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {batches.length === 0 && (
        <p style={{ color: C.muted, fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          No batches generated yet.
        </p>
      )}
    </div>
  );
}

function FacilitatorProfile({ f, orgs, onClose, onUpdate }: {
  f: Facilitator; orgs: Org[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [newPw,      setNewPw]      = useState('');
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwMsg,      setPwMsg]      = useState('');
  const [tagLoading, setTagLoading] = useState('');
  const [tagMsg,     setTagMsg]     = useState('');
  const [deactLoad,  setDeactLoad]  = useState(false);

  const org = orgs.find(o => o.id === f.organization_id);

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true); setPwMsg('');
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: f.user_id, new_password: newPw }),
    });
    setPwLoading(false);
    if (res.ok) { setPwMsg('Password reset.'); setNewPw(''); }
    else { const d = await res.json(); setPwMsg('Error: ' + d.error); }
  }

  async function applyTag(tag_key: string) {
    setTagLoading(tag_key); setTagMsg('');
    const res = await fetch('/api/admin/kit-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: f.user_id, tag_key }),
    });
    setTagLoading('');
    if (res.ok) setTagMsg('Tag applied + milestone email sent.');
    else { const d = await res.json(); setTagMsg('Error: ' + d.error); }
  }

  async function toggleStatus() {
    setDeactLoad(true);
    const newStatus = f.cert_status === 'active' ? 'inactive' : 'active';
    await fetch('/api/admin/facilitators', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: f.user_id, cert_status: newStatus }),
    });
    setDeactLoad(false);
    onUpdate();
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.white, borderRadius: 12, padding: '2rem',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ ...sectionTitle, margin: 0 }}>{f.full_name}</h2>
            <p style={{ color: C.muted, fontSize: '0.875rem', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>
              {f.email}{f.phone ? ` · ${f.phone}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: C.muted }}>×</button>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem',
          fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {[
            ['Cert ID',    f.cert_id],
            ['Status',     <StatusBadge key="s" s={f.cert_status} />],
            ['Role',       f.role],
            ['Renewal',    f.cert_renewal],
            ['Issued',     f.cert_issued],
            ['Last Active', f.last_active ? new Date(f.last_active).toLocaleDateString() : 'Never'],
            ['Organization', org?.name ?? '—'],
            ['Books', f.books_certified?.length ? f.books_certified.map(b => `Book ${b}`).join(', ') : 'None'],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <div style={{ color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{k}</div>
              <div style={{ color: C.navy, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Reset Password */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: '0.75rem' }}>
            Reset Password
          </h3>
          <form onSubmit={resetPassword} style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} type="text" placeholder="New password (min 8 chars)"
              value={newPw} onChange={e => setNewPw(e.target.value)} minLength={8} required />
            <button type="submit" disabled={pwLoading} style={btn(C.navy, '#fff', true)}>
              {pwLoading ? '…' : 'Reset'}
            </button>
          </form>
          {pwMsg && <p style={{ fontSize: '0.8rem', color: pwMsg.startsWith('Error') ? C.danger : C.success,
            margin: '0.4rem 0 0', fontFamily: 'Inter, sans-serif' }}>{pwMsg}</p>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Kit milestone tags */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: '0.75rem' }}>
            Add Kit Milestone Tag
          </h3>
          <p style={{ fontSize: '0.8rem', color: C.muted, margin: '0 0 0.75rem', fontFamily: 'Inter, sans-serif' }}>
            Applies tag in Kit and sends the corresponding milestone email sequence.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={!!tagLoading}
              onClick={() => applyTag('facilitator-milestone-first-session')}
              style={btn(C.info, '#fff', true)}>
              {tagLoading === 'facilitator-milestone-first-session' ? '…' : 'First Session Complete'}
            </button>
            <button disabled={!!tagLoading}
              onClick={() => applyTag('facilitator-milestone-book1-complete')}
              style={btn(C.info, '#fff', true)}>
              {tagLoading === 'facilitator-milestone-book1-complete' ? '…' : 'Book 1 Complete'}
            </button>
          </div>
          {tagMsg && <p style={{ fontSize: '0.8rem', color: tagMsg.startsWith('Error') ? C.danger : C.success,
            margin: '0.4rem 0 0', fontFamily: 'Inter, sans-serif' }}>{tagMsg}</p>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Code activity */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
            color: C.navy, marginBottom: '0.75rem' }}>
            Access Codes
          </h3>
          <FacCodesSummary facilProfileId={f.id} />
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Deactivate */}
        <button disabled={deactLoad} onClick={toggleStatus}
          style={btn(f.cert_status === 'active' ? C.danger : C.success)}>
          {deactLoad ? '…' : f.cert_status === 'active' ? 'Deactivate Facilitator' : 'Reactivate Facilitator'}
        </button>
      </div>
    </div>
  );
}

function FacilitatorList({ orgs, refresh, onFacilsLoaded }: {
  orgs: Org[];
  refresh: number;
  onFacilsLoaded?: (fs: Facilitator[]) => void;
}) {
  const [data,     setData]     = useState<Facilitator[]>([]);
  const [count,    setCount]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [q,        setQ]        = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState<Facilitator | null>(null);
  const [tick,     setTick]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (q) p.set('q', q);
    if (statusF) p.set('status', statusF);
    const res  = await fetch(`/api/admin/facilitators?${p}`);
    const json = await res.json();
    const list = json.data ?? [];
    setData(list);
    setCount(json.count ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
    if (onFacilsLoaded) onFacilsLoaded(list);
  }, [page, q, statusF]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load, refresh, tick]);

  const orgName = (id?: string) => orgs.find(o => o.id === id)?.name ?? '—';

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Facilitators{count > 0 ? ` (${count})` : ''}</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search name / email / cert ID…" value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          style={{ ...inp, flex: '1 1 200px', maxWidth: 320 }} />
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
          style={{ ...inp, width: 'auto', flex: '0 0 auto' }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_renewal">Pending Renewal</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={() => setTick(t => t + 1)} style={btn(C.navy, '#fff', true)}>Refresh</button>
      </div>

      {loading ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading…</p>
      ) : data.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '2rem 0' }}>
          No facilitators found.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div style={{ display: 'none' }} className="mobile-cards">
            {data.map(f => (
              <div key={f.user_id} onClick={() => setSelected(f)} style={{
                border: `1px solid ${C.border}`, borderRadius: 8, padding: '1rem',
                marginBottom: '0.75rem', cursor: 'pointer', background: C.bg,
              }}>
                <div style={{ fontWeight: 700, color: C.navy, fontFamily: 'Inter, sans-serif' }}>{f.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: C.muted, fontFamily: 'Inter, sans-serif', margin: '2px 0' }}>{f.email}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge s={f.cert_status} />
                  <span style={{ fontSize: '0.78rem', color: C.muted, fontFamily: 'monospace' }}>{f.cert_id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                  {['Name', 'Organization', 'Cert ID', 'Role', 'Status', 'Renewal', 'Last Active', ''].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left',
                      color: C.navy, fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.78rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(f => (
                  <tr key={f.user_id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: C.navy }}>{f.full_name}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: C.muted }}>{orgName(f.organization_id)}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: C.navy }}>{f.cert_id}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textTransform: 'capitalize', color: C.muted }}>{f.role}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><StatusBadge s={f.cert_status} /></td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: C.muted }}>{f.cert_renewal}</td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: C.muted }}>
                      {f.last_active ? new Date(f.last_active).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <button onClick={() => setSelected(f)} style={btn(C.navy, '#fff', true)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={btn(C.navy, '#fff', true)}>← Prev</button>
              <span style={{ fontSize: '0.85rem', color: C.muted }}>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={btn(C.navy, '#fff', true)}>Next →</button>
            </div>
          )}
        </>
      )}

      {selected && (
        <FacilitatorProfile
          f={selected}
          orgs={orgs}
          onClose={() => setSelected(null)}
          onUpdate={() => setTick(t => t + 1)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTION 3 — Organization Management
═════════════════════════════════════════════════════════════*/
const ORG_TYPES    = ['Hospital', 'Hospice', 'Church', 'Nonprofit', 'Corporate / EAP', 'Other'];
const LICENSE_TYPES = ['Standard', 'Enterprise', 'Pilot', 'Complimentary'];
const LICENSE_STATUSES = ['active', 'pending', 'expired', 'cancelled'];

interface OrgFormState {
  name: string; type: string; license_type: string; license_status: string;
  license_start: string; license_renewal: string;
  contact_name: string; contact_email: string; contact_phone: string;
  address: string; state: string; notes: string;
}

const emptyOrg: OrgFormState = {
  name: '', type: '', license_type: 'Standard', license_status: 'active',
  license_start: '', license_renewal: '',
  contact_name: '', contact_email: '', contact_phone: '',
  address: '', state: '', notes: '',
};

function OrgManagement({ onOrgsChange }: { onOrgsChange: (orgs: Org[]) => void }) {
  const [orgs,      setOrgs]      = useState<Org[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState<OrgFormState>(emptyOrg);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [confirm,   setConfirm]   = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const setF = (k: keyof OrgFormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/admin/orgs');
    const json = await res.json();
    const list = json.data ?? [];
    setOrgs(list);
    onOrgsChange(list);
    setLoading(false);
  }, [onOrgsChange]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  function startEdit(o: Org) {
    setEditId(o.id);
    setForm({
      name:            o.name ?? '',
      type:            o.type ?? '',
      license_type:    o.license_type ?? 'Standard',
      license_status:  o.license_status ?? 'active',
      license_start:   o.license_start ?? '',
      license_renewal: o.license_renewal ?? '',
      contact_name:    o.contact_name ?? '',
      contact_email:   o.contact_email ?? '',
      contact_phone:   o.contact_phone ?? '',
      address:         o.address ?? '',
      state:           o.state ?? '',
      notes:           o.notes ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { setEditId(null); setForm(emptyOrg); }

  async function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );

    if (editId) {
      const res = await fetch(`/api/admin/orgs?id=${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { showToast('Organization updated.'); cancelEdit(); loadOrgs(); }
      else { const d = await res.json(); showToast(d.error ?? 'Update failed.', false); }
    } else {
      const res = await fetch('/api/admin/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { showToast('Organization created.'); setForm(emptyOrg); loadOrgs(); }
      else { const d = await res.json(); showToast(d.error ?? 'Create failed.', false); }
    }
  }

  async function deleteOrg(id: string) {
    setConfirm(null);
    const res = await fetch(`/api/admin/orgs?id=${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Organization deleted.'); loadOrgs(); }
    else { const d = await res.json(); showToast(d.error ?? 'Delete failed.', false); }
  }

  const fieldRow = (label: string, children: React.ReactNode) => (
    <div>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Create / Edit form */}
      <div style={card}>
        <h2 style={sectionTitle}>{editId ? 'Edit Organization' : 'Add Organization'}</h2>
        <form onSubmit={submitOrg}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {fieldRow('Organization Name *', <input style={inp} value={form.name} onChange={e => setF('name', e.target.value)} required />)}
            {fieldRow('Type', (
              <select style={inp} value={form.type} onChange={e => setF('type', e.target.value)}>
                <option value="">— Select —</option>
                {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            ))}
            {fieldRow('License Type', (
              <select style={inp} value={form.license_type} onChange={e => setF('license_type', e.target.value)}>
                {LICENSE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            ))}
            {fieldRow('License Status', (
              <select style={inp} value={form.license_status} onChange={e => setF('license_status', e.target.value)}>
                {LICENSE_STATUSES.map(t => <option key={t}>{t}</option>)}
              </select>
            ))}
            {fieldRow('License Start', <input type="date" style={inp} value={form.license_start} onChange={e => setF('license_start', e.target.value)} />)}
            {fieldRow('License Renewal', <input type="date" style={inp} value={form.license_renewal} onChange={e => setF('license_renewal', e.target.value)} />)}
            {fieldRow('Contact Name', <input style={inp} value={form.contact_name} onChange={e => setF('contact_name', e.target.value)} />)}
            {fieldRow('Contact Email', <input type="email" style={inp} value={form.contact_email} onChange={e => setF('contact_email', e.target.value)} />)}
            {fieldRow('Contact Phone', <input style={inp} value={form.contact_phone} onChange={e => setF('contact_phone', e.target.value)} />)}
            {fieldRow('Address', <input style={inp} value={form.address} onChange={e => setF('address', e.target.value)} />)}
            {fieldRow('State', <input style={inp} value={form.state} onChange={e => setF('state', e.target.value)} placeholder="e.g. TX" />)}
          </div>
          {fieldRow('Notes', (
            <textarea style={{ ...inp, height: 80, resize: 'vertical', marginBottom: '1rem' }}
              value={form.notes} onChange={e => setF('notes', e.target.value)} />
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={btn(C.gold)}>
              {editId ? 'Save Changes' : 'Create Organization'}
            </button>
            {editId && (
              <button type="button" onClick={cancelEdit} style={btn(C.border, C.navy)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Org list */}
      <div style={card}>
        <h2 style={sectionTitle}>Organizations{orgs.length > 0 ? ` (${orgs.length})` : ''}</h2>
        {loading ? (
          <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading…</p>
        ) : orgs.length === 0 ? (
          <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '1.5rem 0' }}>
            No organizations yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                  {['Name', 'Type', 'License', 'Status', 'Renewal', 'Contact', 'Facilitators', ''].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left',
                      color: C.navy, fontWeight: 700, whiteSpace: 'nowrap',
                      fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map(o => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: C.navy }}>{o.name}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: C.muted }}>{o.type ?? '—'}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: C.muted }}>{o.license_type ?? '—'}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {o.license_status ? <StatusBadge s={o.license_status} /> : '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: C.muted }}>{o.license_renewal ?? '—'}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: C.muted }}>
                      {o.contact_name && <div>{o.contact_name}</div>}
                      {o.contact_email && <a href={`mailto:${o.contact_email}`} style={{ color: C.navy, fontSize: '0.8rem' }}>{o.contact_email}</a>}
                      {!o.contact_name && !o.contact_email && '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: C.navy, fontWeight: 600 }}>
                      {o.facilitator_count ?? 0}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(o)} style={btn(C.navy, '#fff', true)}>Edit</button>
                        {confirm === o.id ? (
                          <>
                            <button onClick={() => deleteOrg(o.id)} style={btn(C.danger, '#fff', true)}>Confirm</button>
                            <button onClick={() => setConfirm(null)} style={btn(C.border, C.navy, true)}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirm(o.id)}
                            disabled={(o.facilitator_count ?? 0) > 0}
                            title={(o.facilitator_count ?? 0) > 0 ? 'Move facilitators out first' : ''}
                            style={{ ...btn(C.danger, '#fff', true), opacity: (o.facilitator_count ?? 0) > 0 ? 0.4 : 1 }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LOGIN GATE
═════════════════════════════════════════════════════════════*/
function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [secret,  setSecret]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) { onAuth(); }
    else { setError('Incorrect secret.'); setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif',
      padding: '1rem' }}>
      <div style={{ ...card, width: '100%', maxWidth: 380, marginBottom: 0 }}>
        <h1 style={{ ...sectionTitle, textAlign: 'center', marginBottom: '1.5rem' }}>Admin Access</h1>
        <form onSubmit={submit}>
          <label style={fieldLabel}>Admin Secret</label>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
            required style={{ ...inp, marginBottom: '1rem' }} autoFocus />
          {error && <p style={{ color: C.danger, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btn(C.navy), width: '100%' }}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GLOBAL CODES TAB
═════════════════════════════════════════════════════════════*/
interface CodeRow {
  id: string; code: string; book_number: number; status: string;
  expires_at: string; redeemed_at: string | null; redeemed_by_email: string | null;
  created_at: string; batch_id: string; batch_notes: string | null;
  facilitator_id: string | null; facilitator_name: string | null; facilitator_email: string | null;
  organization_id: string | null; organization_name: string | null;
}

function GlobalCodesTab({ orgs, facilitators }: { orgs: Org[]; facilitators: Facilitator[] }) {
  const [codes,      setCodes]      = useState<CodeRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [orgFilter,  setOrgFilter]  = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [statFilter, setStatFilter] = useState('');
  const [facFilter,  setFacFilter]  = useState('');
  const [revoking,   setRevoking]   = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [tick,       setTick]       = useState(0);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const buildQS = useCallback(() => {
    const p = new URLSearchParams();
    if (orgFilter)  p.set('org',         orgFilter);
    if (bookFilter) p.set('book',        bookFilter);
    if (statFilter) p.set('status',      statFilter);
    if (facFilter)  p.set('facilitator', facFilter);
    return p.toString();
  }, [orgFilter, bookFilter, statFilter, facFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/codes?${buildQS()}`);
    const json = await res.json();
    setCodes(json.data ?? []);
    setLoading(false);
  }, [buildQS, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function revokeBatch(batchId: string) {
    if (!confirm('Revoke all active codes in this batch? This cannot be undone.')) return;
    setRevoking(batchId);
    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batchId, action: 'revoke_batch' }),
    });
    setRevoking(null);
    if (res.ok) { showToast('Batch revoked.'); setTick(t => t + 1); }
    else { const d = await res.json(); showToast('Error: ' + d.error, false); }
  }

  function exportCSV() {
    window.open(`/api/admin/codes?${buildQS()}&format=csv`, '_blank');
  }

  // Batch-level grouping for revoke action
  const batchRevokable = (batchId: string) =>
    codes.some(c => c.batch_id === batchId && c.status === 'active');

  const statusColor = (s: string) => s === 'active' ? C.success : s === 'redeemed' ? C.info :
    s === 'revoked' ? C.danger : C.muted;

  // Summary stats
  const stats = {
    total:    codes.length,
    active:   codes.filter(c => c.status === 'active').length,
    redeemed: codes.filter(c => c.status === 'redeemed').length,
    expired:  codes.filter(c => c.status === 'expired').length,
    revoked:  codes.filter(c => c.status === 'revoked').length,
  };

  // Unique batch IDs for display grouping
  const batchIds = Array.from(new Set(codes.map(c => c.batch_id)));

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 70, right: 20, zIndex: 9999,
          background: toast.ok ? C.success : C.danger,
          color: '#fff', padding: '0.7rem 1.2rem', borderRadius: 8,
          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,.18)',
        }}>{toast.msg}</div>
      )}

      {/* Summary stat tiles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',    val: stats.total,    color: C.navy },
          { label: 'Active',   val: stats.active,   color: C.success },
          { label: 'Redeemed', val: stats.redeemed, color: C.info },
          { label: 'Expired',  val: stats.expired,  color: C.muted },
          { label: 'Revoked',  val: stats.revoked,  color: C.danger },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '12px 18px', textAlign: 'center', minWidth: 100,
            boxShadow: '0 1px 3px rgba(0,0,0,.05)',
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color, fontFamily: 'Inter, sans-serif' }}>{val}</div>
            <div style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters + export */}
      <div style={{ ...card, marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={fieldLabel}>Organization</label>
            <select style={{ ...inp, width: 160 }} value={orgFilter} onChange={e => setOrgFilter(e.target.value)}>
              <option value="">All Orgs</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Book</label>
            <select style={{ ...inp, width: 110 }} value={bookFilter} onChange={e => setBookFilter(e.target.value)}>
              <option value="">All Books</option>
              {[1,2,3,4].map(n => <option key={n} value={n}>Book {n}</option>)}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Status</label>
            <select style={{ ...inp, width: 130 }} value={statFilter} onChange={e => setStatFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Facilitator</label>
            <select style={{ ...inp, width: 180 }} value={facFilter} onChange={e => setFacFilter(e.target.value)}>
              <option value="">All Facilitators</option>
              {facilitators.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
            </select>
          </div>
          <button onClick={() => setTick(t => t + 1)} style={btn(C.navy, '#fff', true)}>Apply</button>
          <button onClick={() => { setOrgFilter(''); setBookFilter(''); setStatFilter(''); setFacFilter(''); setTick(t => t + 1); }}
            style={btn(C.muted, '#fff', true)}>Clear</button>
          <button onClick={exportCSV} style={{ ...btn(C.gold, C.navy, true), marginLeft: 'auto' }}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Batch-grouped table */}
      {loading ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading…</p>
      ) : batchIds.length === 0 ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '2rem 0' }}>
          No codes found.
        </p>
      ) : (
        batchIds.map(batchId => {
          const batchCodes = codes.filter(c => c.batch_id === batchId);
          const first      = batchCodes[0];
          const canRevoke  = batchRevokable(batchId);

          return (
            <div key={batchId} style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              {/* Batch header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                flexWrap: 'wrap', gap: 8, marginBottom: '0.75rem' }}>
                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span style={{ fontWeight: 700, color: C.navy, fontSize: '0.9rem' }}>
                    Book {first.book_number} · {first.facilitator_name ?? 'Unknown Facilitator'}
                  </span>
                  {first.organization_name && (
                    <span style={{ color: C.muted, fontSize: '0.82rem', marginLeft: 8 }}>
                      · {first.organization_name}
                    </span>
                  )}
                  <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2 }}>
                    Batch generated {new Date(first.created_at).toLocaleDateString()}
                    {first.batch_notes ? ` · ${first.batch_notes}` : ''}
                    {' · '}
                    Expires {first.expires_at ? new Date(first.expires_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                {canRevoke && (
                  <button
                    disabled={revoking === batchId}
                    onClick={() => revokeBatch(batchId)}
                    style={btn(C.danger, '#fff', true)}
                  >
                    {revoking === batchId ? '…' : 'Revoke Batch'}
                  </button>
                )}
              </div>

              {/* Codes table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {['Code', 'Status', 'Redeemed By', 'Redeemed Date', 'Expires'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: C.muted,
                          fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                          fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batchCodes.map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 600, color: C.navy }}>
                          {c.code}
                        </td>
                        <td style={{ padding: '5px 8px' }}>
                          <span style={{
                            background: statusColor(c.status) + '18',
                            color: statusColor(c.status),
                            padding: '2px 8px', borderRadius: 4,
                            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                          }}>{c.status}</span>
                        </td>
                        <td style={{ padding: '5px 8px', color: C.muted }}>
                          {c.redeemed_by_email ?? '—'}
                        </td>
                        <td style={{ padding: '5px 8px', color: C.muted, whiteSpace: 'nowrap' }}>
                          {c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '5px 8px', color: C.muted, whiteSpace: 'nowrap' }}>
                          {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT PAGE
═════════════════════════════════════════════════════════════*/
type Tab = 'facilitators' | 'orgs' | 'codes';

export default function AdminFacilitatorsPage() {
  const [authed,        setAuthed]        = useState(false);
  const [tab,           setTab]           = useState<Tab>('facilitators');
  const [orgs,          setOrgs]          = useState<Org[]>([]);
  const [allFacils,     setAllFacils]     = useState<Facilitator[]>([]);
  const [refresh,       setRefresh]       = useState(0);

  useEffect(() => {
    if (document.cookie.includes('lg-admin-session=')) setAuthed(true);
  }, []);

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthed(false);
  }

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  return (
    <>
      {/* Inject fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={FONT_LINK} rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 640px) {
          .desktop-table { display: none !important; }
          .mobile-cards  { display: block !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
        {/* Topbar */}
        <div style={{ background: C.navy, height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>
            Live and Grieve™ — Admin
          </span>
          <button onClick={logout} style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>
            Log out
          </button>
        </div>

        {/* Tabs */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`,
          display: 'flex', padding: '0 1.5rem', position: 'sticky', top: 58, zIndex: 99 }}>
          {([
            { key: 'facilitators', label: 'Facilitators' },
            { key: 'orgs',         label: 'Organizations' },
            { key: 'codes',        label: 'Access Codes' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              fontWeight: 600, fontSize: '0.9rem', padding: '0.9rem 1.25rem',
              borderBottom: tab === key ? `3px solid ${C.gold}` : '3px solid transparent',
              color: tab === key ? C.navy : C.muted,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.25rem' }}>
          {tab === 'facilitators' && (
            <>
              <CreateFacilitatorForm orgs={orgs} onCreated={() => setRefresh(r => r + 1)} />
              <FacilitatorList orgs={orgs} refresh={refresh} onFacilsLoaded={setAllFacils} />
            </>
          )}
          {tab === 'orgs' && (
            <OrgManagement onOrgsChange={setOrgs} />
          )}
          {tab === 'codes' && (
            <GlobalCodesTab orgs={orgs} facilitators={allFacils} />
          )}
        </div>
      </div>
    </>
  );
}
