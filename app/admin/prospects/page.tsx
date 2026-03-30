'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Google Fonts ── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

/* ── Design tokens (matching facilitators page) ── */
const C = {
  navy:    '#1c3028',
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
interface Prospect {
  id: string;
  org_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  sector: string;
  notes?: string;
  status: string;
  created_at: string;
  created_by?: string;
}

interface ProspectCode {
  id: string;
  prospect_id: string;
  code: string;
  sector: string;
  expiry_days?: number;
  expires_at?: string;
  created_at: string;
  used_at?: string;
  used_by_email?: string;
  status: string;
}

interface ProspectActivity {
  id: string;
  prospect_id: string;
  code_id: string;
  event_type: string;
  event_data?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

interface ProspectCallRequest {
  id: string;
  prospect_id: string;
  code_id?: string;
  contact_name: string;
  org_name: string;
  phone: string;
  preferred_time?: string;
  message?: string;
  created_at: string;
  status: string;
}

interface EnrichedProspect extends Prospect {
  latest_code?: ProspectCode | null;
  last_activity?: string | null;
  call_requested?: boolean;
}

/* ── Helpers ── */
function adminSecret(): string {
  const m = document.cookie.match(/admin-secret=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SectorBadge({ sector }: { sector: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    'Nonprofit / Community Organization': { bg: '#3B82F6', color: '#fff' },
    'Hospital / Hospice': { bg: '#EF4444', color: '#fff' },
    'Church / Faith Community': { bg: '#8B5CF6', color: '#fff' },
    'Corporate / EAP': { bg: '#10B981', color: '#fff' },
    'Independent Facilitator': { bg: C.gold, color: C.navy },
  };
  const { bg, color } = colorMap[sector] || { bg: C.muted, color: '#fff' };
  return (
    <span style={{
      background: bg, color, borderRadius: 20, padding: '4px 12px',
      fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap' as const,
    }}>
      {sector.split('/')[0].trim()}
    </span>
  );
}

function StatusBadge({ s }: { s: string }) {
  const bg = s === 'active' ? C.success : s === 'used' ? C.gold : C.muted;
  return (
    <span style={{
      background: bg + '18', color: bg, border: `1px solid ${bg}40`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600,
      fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' as const,
    }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
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
   CREATE PROSPECT FORM
═════════════════════════════════════════════════════════════*/
function CreateProspectForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    org_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    sector: '',
    notes: '',
    expiry_days: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ code: string; prospect: Prospect } | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const res = await fetch('/api/admin/prospects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret(),
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult({ code: data.code.code, prospect: data.prospect });
      setForm({
        org_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        sector: '',
        notes: '',
        expiry_days: 30,
      });
      onCreated();
    } else {
      setError(data.error ?? 'Failed to create prospect');
    }
  }

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Create New Prospect</h2>

      {result && (
        <div style={{
          background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 8,
          padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <p style={{
            fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: C.navy,
            margin: '0 0 0.75rem', fontWeight: 700,
          }}>
            ✓ Prospect created — {result.prospect.org_name}
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.navy,
              margin: '0 0 0.5rem', fontWeight: 600,
            }}>
              Share this link:
            </p>
            <div style={{
              background: C.white, border: `1px solid ${C.gold}`, borderRadius: 6,
              padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem',
              color: C.navy, wordBreak: 'break-all' as const, marginBottom: '0.75rem',
            }}>
              https://tripillarstudio.com/explore/{result.code}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://tripillarstudio.com/explore/${result.code}`);
              }}
              style={{ ...btn(C.navy, '#fff', true) }}
            >
              Copy Link
            </button>
          </div>
          <button onClick={() => setResult(null)} style={{ ...btn(C.border, C.navy, true) }}>
            Create Another
          </button>
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={fieldLabel}>Organization Name *</label>
            <input style={inp} value={form.org_name} onChange={e => set('org_name', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Contact Name *</label>
            <input style={inp} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Contact Email *</label>
            <input type="email" style={inp} value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required />
          </div>
          <div>
            <label style={fieldLabel}>Contact Phone</label>
            <input type="tel" style={inp} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
          </div>
          <div>
            <label style={fieldLabel}>Sector *</label>
            <select style={inp} value={form.sector} onChange={e => set('sector', e.target.value)} required>
              <option value="">— Select —</option>
              <option value="Nonprofit / Community Organization">Nonprofit / Community Organization</option>
              <option value="Hospital / Hospice">Hospital / Hospice</option>
              <option value="Church / Faith Community">Church / Faith Community</option>
              <option value="Corporate / EAP">Corporate / EAP</option>
              <option value="Independent Facilitator">Independent Facilitator</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={fieldLabel}>Notes</label>
          <textarea
            style={{ ...inp, minHeight: 80, resize: 'vertical' }}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={fieldLabel}>Code Expiry</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { val: 30, label: '30 days (default)' },
              { val: 60, label: '60 days' },
              { val: 90, label: '90 days' },
              { val: 0, label: 'No expiry' },
            ].map(({ val, label }) => (
              <label key={val} style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: C.navy,
              }}>
                <input
                  type="radio"
                  name="expiry"
                  value={val}
                  checked={form.expiry_days === val}
                  onChange={() => set('expiry_days', val)}
                  style={{ accentColor: C.gold, width: 16, height: 16 }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: C.danger + '12', border: `1px solid ${C.danger}`,
            borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1rem',
            fontSize: '0.875rem', color: C.danger, fontFamily: 'Inter, sans-serif',
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ ...btn(loading ? C.muted : C.gold), opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating…' : 'Create Prospect & Generate Code'}
        </button>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PROSPECT LIST VIEW
═════════════════════════════════════════════════════════════*/
function ProspectListView({
  prospects,
  loading,
  onSelect,
}: {
  prospects: EnrichedProspect[];
  loading: boolean;
  onSelect: (p: EnrichedProspect) => void;
}) {
  const totalActive = prospects.filter(p => p.latest_code?.status === 'active').length;
  const callRequestsPending = prospects.filter(p => p.call_requested).length;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={sectionTitle}>Prospects</h2>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', val: prospects.length, color: C.navy },
          { label: 'Active Codes', val: totalActive, color: C.success },
          { label: 'Call Requests', val: callRequestsPending, color: C.warn },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '10px 14px', minWidth: 90, textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color, fontFamily: 'Inter, sans-serif' }}>{val}</div>
            <div style={{
              fontSize: '0.7rem', color: C.muted, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif', marginTop: 2,
            }}>{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif' }}>Loading…</p>
      ) : prospects.length === 0 ? (
        <p style={{
          color: C.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '2rem 0',
        }}>
          No prospects yet. Create one above.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
          }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                {['Organization', 'Contact', 'Sector', 'Code', 'Status', 'Last Activity', 'Call Req', ''].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '0.6rem 0.75rem', textAlign: 'left', color: C.navy, fontWeight: 700,
                      whiteSpace: 'nowrap', fontSize: '0.78rem', textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => (
                <tr
                  key={p.id}
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: C.navy }}>{p.org_name}</td>
                  <td style={{ padding: '0.65rem 0.75rem', color: C.muted }}>
                    <div style={{ fontSize: '0.875rem' }}>{p.contact_name}</div>
                    <div style={{ fontSize: '0.75rem' }}>{p.contact_email}</div>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <SectorBadge sector={p.sector} />
                  </td>
                  <td style={{
                    padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: C.navy,
                  }}>
                    {p.latest_code?.code ?? '—'}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {p.latest_code ? <StatusBadge s={p.latest_code.status} /> : '—'}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: C.muted, whiteSpace: 'nowrap' }}>
                    {p.last_activity ? relativeTime(p.last_activity) : '—'}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', color: C.warn, fontWeight: 600 }}>
                    {p.call_requested ? '⚠️ Yes' : '—'}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <button onClick={() => onSelect(p)} style={btn(C.navy, '#fff', true)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SEND AGREEMENT FORM
═════════════════════════════════════════════════════════════*/
function SendAgreementForm({
  prospect,
  onSuccess,
}: {
  prospect: Prospect;
  onSuccess: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    org_name: prospect.org_name,
    contact_name: prospect.contact_name,
    contact_email: prospect.contact_email,
    contact_title: '',
    org_address: '',
    org_state: '',
    license_tier: 'Community Tier',
    books_licensed: [
      'Book 1 — In The Quiet',
      'Book 2 — Through The Weight',
      'Book 3 — Toward the Light',
    ],
    license_start_date: new Date().toISOString().split('T')[0],
    test_mode: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleBook = (book: string) => {
    setFormData(prev => ({
      ...prev,
      books_licensed: prev.books_licensed.includes(book)
        ? prev.books_licensed.filter(b => b !== book)
        : [...prev.books_licensed, book],
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret(),
        },
        body: JSON.stringify({
          prospect_id: prospect.id,
          ...formData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `Agreement sent to ${formData.contact_email}\nToken: ${data.agreement.token}`
        );
        setShowForm(false);
        setFormData({
          ...formData,
          org_name: prospect.org_name,
          contact_name: prospect.contact_name,
          contact_email: prospect.contact_email,
        });
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send agreement');
      }
    } catch (err) {
      setError('Error sending agreement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const books = [
    'Book 1 — In The Quiet',
    'Book 2 — Through The Weight',
    'Book 3 — Toward the Light',
    'Book 4 — With the Memory',
  ];

  const tierFees: Record<string, number> = {
    'Community Tier': 1500,
    'Standard Organization': 2500,
    'Multi-site': 4000,
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
          color: C.navy, margin: 0,
        }}>
          Send License Agreement
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={btn(C.gold, C.navy, true)}
          >
            Send Agreement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: '1rem', marginTop: '0.75rem',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem',
            marginBottom: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
          }}>
            <div>
              <label style={fieldLabel}>Org Name</label>
              <input
                type="text"
                value={formData.org_name}
                onChange={e => setFormData({ ...formData, org_name: e.target.value })}
                required
                style={inp}
              />
            </div>
            <div>
              <label style={fieldLabel}>Contact Name</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                required
                style={inp}
              />
            </div>
            <div>
              <label style={fieldLabel}>Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                required
                style={inp}
              />
            </div>
            <div>
              <label style={fieldLabel}>Contact Title</label>
              <input
                type="text"
                value={formData.contact_title}
                onChange={e => setFormData({ ...formData, contact_title: e.target.value })}
                style={inp}
              />
            </div>
            <div>
              <label style={fieldLabel}>Org Address</label>
              <input
                type="text"
                value={formData.org_address}
                onChange={e => setFormData({ ...formData, org_address: e.target.value })}
                style={inp}
              />
            </div>
            <div>
              <label style={fieldLabel}>Org State</label>
              <input
                type="text"
                value={formData.org_state}
                onChange={e => setFormData({ ...formData, org_state: e.target.value })}
                style={inp}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel}>License Tier</label>
            <select
              value={formData.license_tier}
              onChange={e => setFormData({ ...formData, license_tier: e.target.value })}
              style={inp}
            >
              <option value="Community Tier">Community Tier</option>
              <option value="Standard Organization">Standard Organization</option>
              <option value="Multi-site">Multi-site</option>
            </select>
            <div style={{ fontSize: '0.8rem', color: C.muted, marginTop: 4 }}>
              Annual Fee: ${tierFees[formData.license_tier]}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel}>Books Licensed</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {books.map(book => (
                <label key={book} style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.books_licensed.includes(book)}
                    onChange={() => handleToggleBook(book)}
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  {book}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={fieldLabel}>License Start Date</label>
            <input
              type="date"
              value={formData.license_start_date}
              onChange={e => setFormData({ ...formData, license_start_date: e.target.value })}
              required
              style={inp}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.test_mode}
                onChange={e => setFormData({ ...formData, test_mode: e.target.checked })}
                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
              />
              Test Mode (exclude from reporting)
            </label>
          </div>

          {error && (
            <p style={{ color: C.danger, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ ...btn(C.gold, C.navy) }}
            >
              {loading ? 'Sending…' : 'Generate and Send Agreement'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={btn(C.border, C.navy)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PROSPECT DETAIL VIEW
═════════════════════════════════════════════════════════════*/
function ProspectDetailView({
  prospect,
  codes,
  activity,
  callRequests,
  onClose,
  onUpdated,
}: {
  prospect: Prospect;
  codes: ProspectCode[];
  activity: ProspectActivity[];
  callRequests: ProspectCallRequest[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(prospect.notes || '');
  const [status, setStatus] = useState(prospect.status);
  const [loading, setLoading] = useState(false);
  const [newCodeExpiry, setNewCodeExpiry] = useState(30);
  const [generatingCode, setGeneratingCode] = useState(false);

  const latestCode = codes[0];

  async function saveNotes() {
    setLoading(true);
    const res = await fetch(`/api/admin/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret(),
      },
      body: JSON.stringify({ notes }),
    });
    setLoading(false);
    if (res.ok) {
      setEditingNotes(false);
      onUpdated();
    }
  }

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret(),
      },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    if (res.ok) {
      setStatus(newStatus);
      onUpdated();
    }
  }

  async function generateNewCode() {
    setGeneratingCode(true);
    const res = await fetch(`/api/admin/prospects/${prospect.id}/codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret(),
      },
      body: JSON.stringify({
        expiry_days: newCodeExpiry === 0 ? null : newCodeExpiry,
      }),
    });
    setGeneratingCode(false);
    if (res.ok) {
      onUpdated();
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.white, borderRadius: 12, padding: '2rem',
        width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ ...sectionTitle, margin: 0, marginBottom: '0.5rem' }}>{prospect.org_name}</h2>
            <SectorBadge sector={prospect.sector} />
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: C.muted,
          }}>×</button>
        </div>

        {/* Status bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={fieldLabel}>Status</label>
          <select
            value={status}
            onChange={e => updateStatus(e.target.value)}
            disabled={loading}
            style={inp}
          >
            <option value="active">Active</option>
            <option value="in_conversation">In Conversation</option>
            <option value="closed">Closed</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>

        {/* Contact info */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem',
          fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', marginBottom: '1.5rem',
        }}>
          {[
            ['Contact Name', prospect.contact_name],
            ['Email', prospect.contact_email],
            ['Phone', prospect.contact_phone || '—'],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <div style={{
                color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.04em', marginBottom: 2,
              }}>{k}</div>
              <div style={{ color: C.navy, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Notes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={fieldLabel}>Notes</label>
          {editingNotes ? (
            <div>
              <textarea
                style={{ ...inp, minHeight: 80, resize: 'vertical', marginBottom: '0.5rem' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveNotes} disabled={loading} style={btn(C.gold, C.navy)}>
                  {loading ? '…' : 'Save'}
                </button>
                <button onClick={() => { setEditingNotes(false); setNotes(prospect.notes || ''); }} style={btn(C.border, C.navy)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '0.75rem', minHeight: 60, fontSize: '0.875rem', color: C.navy,
                fontFamily: 'Inter, sans-serif', marginBottom: '0.5rem',
              }}>
                {notes || '(no notes)'}
              </div>
              <button onClick={() => setEditingNotes(true)} style={btn(C.navy, '#fff', true)}>
                Edit Notes
              </button>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Current code */}
        {latestCode && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
              color: C.navy, marginBottom: '0.75rem',
            }}>
              Current Code
            </h3>
            <div style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '1rem', marginBottom: '0.75rem',
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700,
                color: C.navy, marginBottom: '0.75rem', letterSpacing: '2px',
              }}>
                {latestCode.code}
              </div>
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: C.muted, margin: '0 0 0.75rem',
              }}>
                Share this link:
              </p>
              <div style={{
                background: C.white, border: `1px solid ${C.gold}`, borderRadius: 4,
                padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem',
                color: C.navy, wordBreak: 'break-all' as const, marginBottom: '0.75rem',
              }}>
                https://tripillarstudio.com/explore/{latestCode.code}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://tripillarstudio.com/explore/${latestCode.code}`);
                }}
                style={{ ...btn(C.navy, '#fff', true) }}
              >
                Copy Link
              </button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', marginBottom: '1rem',
            }}>
              <div>
                <div style={{
                  color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.04em', marginBottom: 2,
                }}>Status</div>
                <StatusBadge s={latestCode.status} />
              </div>
              <div>
                <div style={{
                  color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.04em', marginBottom: 2,
                }}>Expires</div>
                <div style={{ color: C.navy }}>{latestCode.expires_at ? new Date(latestCode.expires_at).toLocaleDateString() : 'No expiry'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Generate new code */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
            color: C.navy, marginBottom: '0.75rem',
          }}>
            Generate New Code
          </h3>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={fieldLabel}>Expiry</label>
              <select
                value={newCodeExpiry}
                onChange={e => setNewCodeExpiry(parseInt(e.target.value))}
                style={inp}
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={0}>No expiry</option>
              </select>
            </div>
            <button
              onClick={generateNewCode}
              disabled={generatingCode}
              style={{ ...btn(C.gold, C.navy) }}
            >
              {generatingCode ? '…' : 'Generate Code'}
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Activity timeline */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
            color: C.navy, marginBottom: '0.75rem',
          }}>
            Activity Timeline
          </h3>
          {activity.length === 0 ? (
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: C.muted,
              margin: 0,
            }}>
              No activity yet. Share the link to get started.
            </p>
          ) : (
            <div style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '0.75rem',
            }}>
              {activity.map(a => (
                <div key={a.id} style={{
                  padding: '0.75rem', borderBottom: `1px solid ${C.border}`,
                  fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', color: C.navy,
                }}>
                  <div style={{ fontWeight: 600 }}>
                    {a.event_type === 'code_viewed' && '🔗 Code viewed'}
                    {a.event_type === 'pitch_deck_viewed' && '📊 Pitch deck viewed'}
                    {a.event_type === 'call_requested' && '📞 Call requested'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: C.muted, marginTop: 2 }}>
                    {relativeTime(a.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Send Agreement */}
        <SendAgreementForm prospect={prospect} onSuccess={onUpdated} />

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '1.25rem 0' }} />

        {/* Call requests */}
        {callRequests.length > 0 && (
          <div>
            <h3 style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
              color: C.navy, marginBottom: '0.75rem',
            }}>
              Call Requests
            </h3>
            {callRequests.map(cr => (
              <div key={cr.id} style={{
                background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 6,
                padding: '1rem', marginBottom: '0.75rem',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', marginBottom: '0.75rem',
                }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</div>
                    <div style={{ color: C.navy, fontWeight: 600 }}>{cr.contact_name}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</div>
                    <div style={{ color: C.navy }}>{cr.phone}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pref. Time</div>
                    <div style={{ color: C.navy }}>{cr.preferred_time || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: C.muted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
                    <select style={{ ...inp, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                {cr.message && (
                  <div style={{
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
                    padding: '0.75rem', fontSize: '0.85rem', color: C.navy, fontFamily: 'Inter, sans-serif',
                  }}>
                    {cr.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LOGIN GATE (same pattern as facilitators)
═════════════════════════════════════════════════════════════*/
function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) {
      onAuth();
    } else {
      setError('Incorrect secret.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif',
      padding: '1rem',
    }}>
      <div style={{ ...card, width: '100%', maxWidth: 380, marginBottom: 0 }}>
        <h1 style={{ ...sectionTitle, textAlign: 'center', marginBottom: '1.5rem' }}>
          Admin Access
        </h1>
        <form onSubmit={submit}>
          <label style={fieldLabel}>Admin Secret</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            required
            style={{ ...inp, marginBottom: '1rem' }}
            autoFocus
          />
          {error && (
            <p style={{ color: C.danger, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
          )}
          <button type="submit" disabled={loading} style={{ ...btn(C.navy), width: '100%' }}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT PAGE
═════════════════════════════════════════════════════════════*/
export default function AdminProspectsPage() {
  const [authed, setAuthed] = useState(false);
  const [prospects, setProspects] = useState<EnrichedProspect[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EnrichedProspect | null>(null);
  const [detailData, setDetailData] = useState<{
    codes: ProspectCode[];
    activity: ProspectActivity[];
    callRequests: ProspectCallRequest[];
  } | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (document.cookie.includes('admin-secret=')) setAuthed(true);
  }, []);

  // Load prospects
  useEffect(() => {
    if (!authed) return;
    (async () => {
      setLoading(true);
      const res = await fetch('/api/admin/prospects');
      const data = await res.json();
      setProspects(data.data || []);
      setLoading(false);
    })();
  }, [authed, refresh]);

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthed(false);
  }

  async function handleSelectProspect(p: EnrichedProspect) {
    setSelected(p);
    const res = await fetch(`/api/admin/prospects/${p.id}`);
    const data = await res.json();
    setDetailData({
      codes: data.codes || [],
      activity: data.activity || [],
      callRequests: data.callRequests || [],
    });
  }

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
        <div style={{
          background: C.navy, height: 58, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 1.5rem', position: 'sticky',
          top: 0, zIndex: 100,
        }}>
          <span style={{
            fontFamily: 'Playfair Display, serif', color: C.gold, fontWeight: 700, fontSize: '1.1rem',
          }}>
            Live and Grieve™ — Prospects
          </span>
          <button onClick={logout} style={{ ...btn('rgba(255,255,255,.15)', '#fff', true) }}>
            Log out
          </button>
        </div>

        {/* Main */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.25rem' }}>
          <CreateProspectForm onCreated={() => setRefresh(r => r + 1)} />
          <ProspectListView prospects={prospects} loading={loading} onSelect={handleSelectProspect} />
        </div>

        {/* Detail modal */}
        {selected && detailData && (
          <ProspectDetailView
            prospect={selected}
            codes={detailData.codes}
            activity={detailData.activity}
            callRequests={detailData.callRequests}
            onClose={() => { setSelected(null); setDetailData(null); }}
            onUpdated={() => setRefresh(r => r + 1)}
          />
        )}
      </div>
    </>
  );
}
