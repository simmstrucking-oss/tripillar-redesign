'use client';

import { useState, useEffect, useCallback } from 'react';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

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
};

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

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  excerpt: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

type View = 'list' | 'editor';

const CATEGORIES = ['News', 'Grief Education', 'Program Updates', 'Pilot Stories'];

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function adminSecret(): string {
  const m = document.cookie.match(/lg-admin-session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export default function ContentCMSPage() {
  const [view, setView] = useState<View>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Editor state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-secret': adminSecret(),
  }), []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog', { headers: headers() });
      if (res.ok) setPosts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function resetEditor(post?: Post) {
    if (post) {
      setEditingPost(post);
      setTitle(post.title);
      setSlug(post.slug);
      setSlugManual(true);
      setCategory(post.category);
      setExcerpt(post.excerpt ?? '');
      setBody(post.body ?? '');
      setPublished(post.published);
      setPublishedAt(post.published_at ? post.published_at.slice(0, 10) : '');
    } else {
      setEditingPost(null);
      setTitle('');
      setSlug('');
      setSlugManual(false);
      setCategory(CATEGORIES[0]);
      setExcerpt('');
      setBody('');
      setPublished(false);
      setPublishedAt('');
    }
    setMsg('');
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) setSlug(toSlug(val));
  }

  async function handleSave(pub: boolean) {
    setSaving(true);
    setMsg('');
    const payload = {
      title,
      slug,
      category,
      body,
      excerpt,
      published: pub,
      published_at: pub ? (publishedAt || new Date().toISOString().slice(0, 10)) : null,
    };
    try {
      const url = editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog';
      const method = editingPost ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
      if (res.ok) {
        setMsg(pub ? 'Published!' : 'Draft saved!');
        await loadPosts();
        setTimeout(() => { setView('list'); resetEditor(); }, 600);
      } else {
        const err = await res.json();
        setMsg(`Error: ${err.error}`);
      }
    } catch {
      setMsg('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post permanently?')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE', headers: headers() });
    await loadPosts();
  }

  function execCommand(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
  }

  return (
    <>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ background: C.navy, padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: C.goldLt, fontSize: '1.4rem', margin: 0 }}>
            Content Manager
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {view === 'editor' && (
              <button style={btn('#555')} onClick={() => { setView('list'); resetEditor(); }}>← Back to Posts</button>
            )}
            {view === 'list' && (
              <button style={btn(C.gold)} onClick={() => { resetEditor(); setView('editor'); }}>+ New Post</button>
            )}
            <a href="/admin/facilitators" style={{ ...btn('#444'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Admin Home</a>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* LIST VIEW */}
          {view === 'list' && (
            <div style={card}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: C.navy, fontSize: '1.2rem', margin: '0 0 1rem' }}>
                All Posts ({posts.length})
              </h2>
              {loading ? (
                <p style={{ color: C.muted }}>Loading…</p>
              ) : posts.length === 0 ? (
                <p style={{ color: C.muted }}>No posts yet. Click "New Post" to create one.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
                      <th style={{ padding: '8px 6px', color: C.navy }}>Title</th>
                      <th style={{ padding: '8px 6px', color: C.navy }}>Category</th>
                      <th style={{ padding: '8px 6px', color: C.navy }}>Status</th>
                      <th style={{ padding: '8px 6px', color: C.navy }}>Date</th>
                      <th style={{ padding: '8px 6px', color: C.navy }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 6px', color: C.navy, fontWeight: 500 }}>{p.title}</td>
                        <td style={{ padding: '10px 6px' }}>
                          <span style={{ background: C.goldLt, color: C.gold, padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>{p.category}</span>
                        </td>
                        <td style={{ padding: '10px 6px' }}>
                          <span style={{ color: p.published ? C.success : C.muted, fontWeight: 600, fontSize: '0.8rem' }}>
                            {p.published ? '● Published' : '○ Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 6px', color: C.muted, fontSize: '0.8rem' }}>
                          {p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '10px 6px', display: 'flex', gap: 6 }}>
                          <button style={btn(C.navy, '#fff', true)} onClick={() => { resetEditor(p); setView('editor'); }}>Edit</button>
                          <button style={btn(C.danger, '#fff', true)} onClick={() => handleDelete(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* EDITOR VIEW */}
          {view === 'editor' && (
            <div style={card}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: C.navy, fontSize: '1.2rem', margin: '0 0 1.5rem' }}>
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>

              {msg && (
                <div style={{ padding: '0.5rem 1rem', marginBottom: '1rem', borderRadius: 6, background: msg.startsWith('Error') ? '#FEE2E2' : '#DCFCE7', color: msg.startsWith('Error') ? C.danger : C.success, fontSize: '0.85rem', fontWeight: 500 }}>
                  {msg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={fieldLabel}>Title</label>
                  <input style={inp} value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Post title" />
                </div>
                <div>
                  <label style={fieldLabel}>Slug</label>
                  <input style={inp} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }} placeholder="url-friendly-slug" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={fieldLabel}>Category</label>
                  <select style={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={fieldLabel}>Published At</label>
                  <input style={inp} type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabel}>Excerpt <span style={{ color: C.muted, fontWeight: 400, textTransform: 'none' }}>({excerpt.length}/200)</span></label>
                <textarea
                  style={{ ...inp, minHeight: 60, resize: 'vertical' }}
                  value={excerpt}
                  onChange={(e) => { if (e.target.value.length <= 200) setExcerpt(e.target.value); }}
                  placeholder="Short description (max 200 chars)"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={fieldLabel}>Body</label>
                {/* Simple toolbar */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: 'B', cmd: 'bold' },
                    { label: 'I', cmd: 'italic' },
                    { label: 'H2', cmd: 'formatBlock', val: 'h2' },
                    { label: 'H3', cmd: 'formatBlock', val: 'h3' },
                    { label: '• List', cmd: 'insertUnorderedList' },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      style={{ ...btn('#eee', C.navy, true), fontWeight: b.label === 'B' ? 800 : b.label === 'I' ? 400 : 600, fontStyle: b.label === 'I' ? 'italic' : 'normal' }}
                      onMouseDown={(e) => { e.preventDefault(); execCommand(b.cmd, b.val); }}
                    >
                      {b.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    style={btn('#eee', C.navy, true)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const url = prompt('Enter URL:');
                      if (url) execCommand('createLink', url);
                    }}
                  >
                    Link
                  </button>
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  style={{
                    ...inp,
                    minHeight: 300,
                    overflowY: 'auto',
                    lineHeight: 1.7,
                  }}
                  dangerouslySetInnerHTML={{ __html: body }}
                  onBlur={(e) => setBody(e.currentTarget.innerHTML)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', color: C.navy, fontWeight: 500 }}>
                  <input type="checkbox" checked={published} onChange={(e) => {
                    setPublished(e.target.checked);
                    if (e.target.checked && !publishedAt) setPublishedAt(new Date().toISOString().slice(0, 10));
                  }} />
                  Published
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn('#555')} onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button style={btn(C.gold)} onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
