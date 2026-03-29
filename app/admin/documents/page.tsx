'use client';

import { useState, useEffect } from 'react';

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
  info:   '#2563EB',
  warn:   '#D97706',
};

const BUCKET_COLORS: Record<string, { bg: string; fg: string }> = {
  'facilitator-documents': { bg: '#DBEAFE', fg: '#1D4ED8' },
  'admin-documents':       { bg: '#FFEDD5', fg: '#C2410C' },
  'restricted-documents':  { bg: '#FEE2E2', fg: '#DC2626' },
};

interface FileEntry {
  name: string;
  bucket: string;
  folder: string;
  path: string;
  url: string | null;
}

interface FolderGroup {
  folder: string;
  files: FileEntry[];
}

export default function AdminDocumentsPage() {
  const [folders, setFolders]   = useState<FolderGroup[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [search, setSearch]     = useState('');

  // Check existing session
  useEffect(() => {
    const cookie = document.cookie.split('; ').find(c => c.startsWith('lg-admin-session='));
    if (cookie) { setAuthed(true); }
    else { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch('/api/admin/documents', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { setAuthed(false); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setFolders(data.folders ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load documents'); setLoading(false); });
  }, [authed]);

  function login() {
    document.cookie = `lg-admin-session=${password}; path=/; max-age=${60 * 60 * 8}`;
    setAuthed(true);
  }

  function logout() {
    document.cookie = 'lg-admin-session=; path=/; max-age=0';
    setAuthed(false);
    setFolders([]);
  }

  // Filter by search
  const filtered = search
    ? folders.map(f => ({
        ...f,
        files: f.files.filter(fi => fi.name.toLowerCase().includes(search.toLowerCase()) || fi.folder.toLowerCase().includes(search.toLowerCase())),
      })).filter(f => f.files.length > 0)
    : folders;

  const filteredTotal = filtered.reduce((sum, f) => sum + f.files.length, 0);

  if (!authed) {
    return (
      <>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '2rem', maxWidth: 360, width: '100%' }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', color: C.navy, fontSize: '1.3rem', margin: '0 0 1rem' }}>Admin Documents</h1>
            <input type="password" placeholder="Admin password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', padding: '0.55rem 0.75rem', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: C.white, boxSizing: 'border-box', color: C.navy, marginBottom: '0.75rem' }} />
            <button onClick={login} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '0.55rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', width: '100%' }}>
              Log In
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ minHeight: '100vh', background: C.bg }}>
        {/* Topbar */}
        <div style={{ background: C.navy, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>
              Live and Grieve™ — Document Library
            </span>
            <a href="/admin/facilitators" style={{ color: 'rgba(255,255,255,.7)', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', textDecoration: 'none' }}>
              ← Facilitators
            </a>
            <a href="/admin/dashboard" style={{ color: 'rgba(255,255,255,.7)', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', textDecoration: 'none' }}>
              Dashboard
            </a>
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            Log out
          </button>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.75rem 1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', color: C.navy, fontSize: '1.4rem', margin: 0 }}>
                All Documents ({total})
              </h1>
              <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', margin: '4px 0 0' }}>
                3 buckets: facilitator-documents, admin-documents, restricted-documents
              </p>
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', background: C.white, width: 260, boxSizing: 'border-box', color: C.navy }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: C.muted, fontFamily: 'Inter, sans-serif', padding: '3rem' }}>
              Loading documents...
            </div>
          ) : error ? (
            <div style={{ color: C.danger, fontFamily: 'Inter, sans-serif', padding: '1rem' }}>{error}</div>
          ) : (
            <>
              {search && <p style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', marginBottom: '1rem' }}>{filteredTotal} file{filteredTotal !== 1 ? 's' : ''} match &ldquo;{search}&rdquo;</p>}

              {filtered.map(group => (
                <div key={group.folder} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: '1rem', overflow: 'hidden' }}>
                  <div style={{ background: C.bg, padding: '0.6rem 1rem', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.navy, fontSize: '0.85rem' }}>
                      {group.folder}
                    </span>
                    <span style={{ color: C.muted, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginLeft: 8 }}>
                      ({group.files.length} file{group.files.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: C.muted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filename</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem 1rem', color: C.muted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', width: 140 }}>Bucket</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem 1rem', width: 100 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.files.map(file => {
                        const bColor = BUCKET_COLORS[file.bucket] ?? { bg: C.border, fg: C.muted };
                        return (
                          <tr key={file.path} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '0.55rem 1rem', color: C.navy, wordBreak: 'break-all' }}>{file.name}</td>
                            <td style={{ padding: '0.55rem 1rem' }}>
                              <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: bColor.bg, color: bColor.fg }}>
                                {file.bucket}
                              </span>
                            </td>
                            <td style={{ padding: '0.55rem 1rem', textAlign: 'right' }}>
                              {file.url ? (
                                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', textDecoration: 'none', display: 'inline-block' }}>
                                  Download
                                </a>
                              ) : (
                                <span style={{ color: C.muted, fontSize: '0.78rem' }}>No URL</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
