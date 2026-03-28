'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  navy:    '#2D3142',
  gold:    '#B8942F',
  bg:      '#f0f4f8',
  white:   '#ffffff',
  border:  '#d1d5db',
  muted:   '#6b7280',
  danger:  '#dc2626',
  success: '#16a34a',
  warn:    '#d97706',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${C.border}`,
  borderRadius: 4, fontSize: '0.9rem', boxSizing: 'border-box',
};
const btn = (bg: string, color = '#fff'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 4,
  padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
  cursor: 'pointer',
});
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: C.navy, marginBottom: 4,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Facilitator {
  id: string; user_id: string; full_name: string; email: string;
  phone?: string; role: string; cert_id: string; cert_status: string;
  cert_issued: string; cert_renewal: string; organization_id?: string;
  created_at: string; last_active?: string;
}
interface Org { id: string; name: string; contact_name?: string; contact_email?: string; facilitator_count: number; }

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? C.success : status === 'pending_renewal' ? C.warn : C.danger;
  return (
    <span style={{ background: color + '20', color, border: `1px solid ${color}`, borderRadius: 12,
      padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── Admin login gate ──────────────────────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [secret, setSecret] = useState('');
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) { onAuth(); }
    else { setError('Invalid secret.'); setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: C.white, borderRadius: 8, padding: '2.5rem',
        width: '100%', maxWidth: 380, boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
        <h1 style={{ fontSize: '1.3rem', color: C.navy, fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Admin Access
        </h1>
        <form onSubmit={submit}>
          <label style={label}>Admin Secret</label>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
            required style={{ ...inp, marginBottom: '1rem' }} />
          {error && <p style={{ color: C.danger, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btn(C.navy), width: '100%' }}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Create Facilitator form ───────────────────────────────────────────────────
function CreateFacilitatorForm({ orgs, onCreated }: { orgs: Org[]; onCreated: () => void }) {
  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '', phone: '',
    temp_password: '', track: 'community', org_id: '',
  });
  const [status, setStatus] = useState<{ ok?: boolean; message?: string; cert_id?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setStatus(null);
    const res = await fetch('/api/create-facilitator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    // Re-fetch with admin secret from cookie (middleware already validated)
    const res2 = await fetch('/api/create-facilitator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': document.cookie.match(/lg-admin-session=([^;]+)/)?.[1] ?? '',
      },
      body: JSON.stringify(form),
    });
    const data = await res2.json();
    setLoading(false);
    if (res2.ok) {
      setStatus({ ok: true, message: `Created! Cert ID: ${data.facilitator.cert_id}`, cert_id: data.facilitator.cert_id });
      setForm({ email: '', first_name: '', last_name: '', phone: '', temp_password: '', track: 'community', org_id: '' });
      onCreated();
    } else {
      setStatus({ ok: false, message: data.error ?? 'Unknown error' });
    }
    void res; // suppress unused warning
  }

  return (
    <div style={{ background: C.white, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', color: C.navy, fontWeight: 700, marginBottom: '1.25rem' }}>
        Add New Facilitator
      </h2>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={label}>First Name *</label>
            <input style={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
          </div>
          <div>
            <label style={label}>Last Name *</label>
            <input style={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
          </div>
          <div>
            <label style={label}>Email *</label>
            <input type="email" style={inp} value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div>
            <label style={label}>Phone</label>
            <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label style={label}>Temp Password *</label>
            <input type="text" style={inp} value={form.temp_password} onChange={e => set('temp_password', e.target.value)} required
              placeholder="They change on first login" />
          </div>
          <div>
            <label style={label}>Track</label>
            <select style={inp} value={form.track} onChange={e => set('track', e.target.value)}>
              <option value="community">Community</option>
              <option value="professional">Professional</option>
              <option value="ministry">Ministry</option>
              <option value="org_admin">Org Admin</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>Organization (optional)</label>
            <select style={inp} value={form.org_id} onChange={e => set('org_id', e.target.value)}>
              <option value="">— None —</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>

        {status && (
          <div style={{ background: status.ok ? C.success + '15' : C.danger + '15',
            border: `1px solid ${status.ok ? C.success : C.danger}`, borderRadius: 4,
            padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem',
            color: status.ok ? C.success : C.danger }}>
            {status.message}
          </div>
        )}

        <button type="submit" disabled={loading} style={btn(C.gold)}>
          {loading ? 'Creating…' : 'Create Facilitator + Send Welcome Email'}
        </button>
      </form>
    </div>
  );
}

// ── Facilitator list ──────────────────────────────────────────────────────────
function FacilitatorList({ refresh }: { refresh: number }) {
  const [data,    setData]    = useState<Facilitator[]>([]);
  const [count,   setCount]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [q,       setQ]       = useState('');
  const [statusF, setStatusF] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [patching, setPatching] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set('q', q);
    if (statusF) params.set('status', statusF);
    const res = await fetch(`/api/admin/facilitators?${params}`);
    const json = await res.json();
    setData(json.data ?? []);
    setCount(json.count ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
  }, [page, q, statusF]);

  useEffect(() => { load(); }, [load, refresh]);

  async function patchStatus(user_id: string, cert_status: string) {
    setPatching(user_id);
    await fetch('/api/admin/facilitators', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, cert_status }),
    });
    setPatching(null);
    load();
  }

  async function deleteFacilitator(user_id: string) {
    setConfirm(null);
    await fetch(`/api/admin/facilitators?user_id=${user_id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div style={{ background: C.white, borderRadius: 8, padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.1rem', color: C.navy, fontWeight: 700, margin: 0 }}>
          Facilitators ({count})
        </h2>
        <input placeholder="Search name / email / cert ID…" value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          style={{ ...inp, flex: 1, minWidth: 200, maxWidth: 300 }} />
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ ...inp, width: 'auto' }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_renewal">Pending Renewal</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={load} style={btn(C.navy)}>Refresh</button>
      </div>

      {loading ? <p style={{ color: C.muted }}>Loading…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Name', 'Email', 'Cert ID', 'Track', 'Status', 'Renewal', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left',
                    color: C.navy, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '1rem', color: C.muted, textAlign: 'center' }}>No facilitators found.</td></tr>
              )}
              {data.map(f => (
                <tr key={f.user_id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: C.navy }}>{f.full_name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: C.muted }}>{f.email}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{f.cert_id}</td>
                  <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>{f.role}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}><StatusBadge status={f.cert_status} /></td>
                  <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{f.cert_renewal}</td>
                  <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {f.cert_status !== 'active' && (
                        <button disabled={patching === f.user_id}
                          onClick={() => patchStatus(f.user_id, 'active')}
                          style={btn(C.success, '#fff')}>
                          Activate
                        </button>
                      )}
                      {f.cert_status === 'active' && (
                        <button disabled={patching === f.user_id}
                          onClick={() => patchStatus(f.user_id, 'expired')}
                          style={btn(C.warn, '#fff')}>
                          Expire
                        </button>
                      )}
                      {confirm === f.user_id ? (
                        <>
                          <button onClick={() => deleteFacilitator(f.user_id)}
                            style={btn(C.danger)}>Confirm Delete</button>
                          <button onClick={() => setConfirm(null)}
                            style={btn(C.muted)}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirm(f.user_id)}
                          style={btn(C.danger)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: '1rem', alignItems: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={btn(C.navy)}>← Prev</button>
          <span style={{ fontSize: '0.85rem', color: C.muted }}>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={btn(C.navy)}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Org management ────────────────────────────────────────────────────────────
function OrgManagement({ onOrgsChange }: { onOrgsChange: (orgs: Org[]) => void }) {
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name: '', contact_name: '', contact_email: '' });
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg,     setMsg]     = useState('');

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/orgs');
    const json = await res.json();
    const list = json.data ?? [];
    setOrgs(list);
    onOrgsChange(list);
    setLoading(false);
  }, [onOrgsChange]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg('Organization created.');
      setForm({ name: '', contact_name: '', contact_email: '' });
      loadOrgs();
    } else {
      const d = await res.json();
      setMsg('Error: ' + d.error);
    }
  }

  async function deleteOrg(id: string) {
    setConfirm(null);
    await fetch(`/api/admin/orgs?id=${id}`, { method: 'DELETE' });
    loadOrgs();
  }

  return (
    <div>
      {/* Create org */}
      <div style={{ background: C.white, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: C.navy, fontWeight: 700, marginBottom: '1.25rem' }}>
          Add Organization
        </h2>
        <form onSubmit={createOrg}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={label}>Organization Name *</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div>
              <label style={label}>Contact Name</label>
              <input style={inp} value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} />
            </div>
            <div>
              <label style={label}>Contact Email</label>
              <input type="email" style={inp} value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} />
            </div>
          </div>
          {msg && <p style={{ fontSize: '0.85rem', color: msg.startsWith('Error') ? C.danger : C.success, marginBottom: '0.75rem' }}>{msg}</p>}
          <button type="submit" style={btn(C.gold)}>Add Organization</button>
        </form>
      </div>

      {/* Org list */}
      <div style={{ background: C.white, borderRadius: 8, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: C.navy, fontWeight: 700, marginBottom: '1rem' }}>
          Organizations ({orgs.length})
        </h2>
        {loading ? <p style={{ color: C.muted }}>Loading…</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Name', 'Contact', 'Facilitators', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: C.navy, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '1rem', color: C.muted, textAlign: 'center' }}>No organizations yet.</td></tr>
              )}
              {orgs.map(o => (
                <tr key={o.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: C.navy }}>{o.name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: C.muted }}>
                    {o.contact_name && <span>{o.contact_name}<br /></span>}
                    {o.contact_email && <a href={`mailto:${o.contact_email}`} style={{ color: C.navy }}>{o.contact_email}</a>}
                    {!o.contact_name && !o.contact_email && '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>{o.facilitator_count}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {confirm === o.id ? (
                      <>
                        <button onClick={() => deleteOrg(o.id)} style={{ ...btn(C.danger), marginRight: 6 }}>Confirm Delete</button>
                        <button onClick={() => setConfirm(null)} style={btn(C.muted)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirm(o.id)} style={btn(C.danger)}
                        disabled={o.facilitator_count > 0} title={o.facilitator_count > 0 ? 'Remove all facilitators first' : ''}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function AdminFacilitatorsPage() {
  const [authed,  setAuthed]  = useState(false);
  const [tab,     setTab]     = useState<'facilitators' | 'orgs'>('facilitators');
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [refresh, setRefresh] = useState(0);

  // Check for existing admin cookie on mount
  useEffect(() => {
    const hasCookie = document.cookie.includes('lg-admin-session=');
    if (hasCookie) setAuthed(true);
  }, []);

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthed(false);
  }

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '0 2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56 }}>
        <span style={{ color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>
          Live and Grieve™ — Admin
        </span>
        <button onClick={logout} style={{ ...btn('#ffffff20', '#fff'), fontSize: '0.8rem' }}>
          Log out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: '0 2rem', display: 'flex', gap: 0 }}>
        {(['facilitators', 'orgs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent',
            padding: '0.85rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            color: tab === t ? C.navy : C.muted, textTransform: 'capitalize',
          }}>
            {t === 'orgs' ? 'Organizations' : 'Facilitators'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {tab === 'facilitators' && (
          <>
            <CreateFacilitatorForm orgs={orgs} onCreated={() => setRefresh(r => r + 1)} />
            <FacilitatorList refresh={refresh} />
          </>
        )}
        {tab === 'orgs' && (
          <OrgManagement onOrgsChange={setOrgs} />
        )}
      </div>
    </div>
  );
}
