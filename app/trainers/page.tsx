'use client';

import { useState, useEffect } from 'react';

const C = {
  navy:   '#1c3028',
  gold:   '#B8942F',
  goldLt: '#F5EDD5',
  bg:     '#F5F4F0',
  white:  '#FFFFFF',
  border: '#DDD9D0',
  muted:  '#6B7280',
  success:'#16A34A',
};

interface Trainer {
  id: string;
  full_name: string;
  trainer_cert_id: string | null;
  cert_issued: string | null;
  cert_renewal: string | null;
  books_authorized: number[];
}

function bookLabel(n: number) {
  const labels: Record<number, string> = {
    1: 'Book 1 — In The Quiet',
    2: 'Book 2 — Through The Weight',
    3: 'Book 3 — Toward the Light',
    4: 'Book 4 — With the Memory',
  };
  return labels[n] ?? `Book ${n}`;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trainers')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); } else { setTrainers(d.trainers ?? []); }
      })
      .catch(() => setError('Failed to load trainer registry.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" />
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ background: C.navy, color: C.white, padding: '3rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', letterSpacing: '0.12em', color: C.gold, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Live and Grieve™ — Tri-Pillars™ LLC
          </p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, margin: '0 0 1rem' }}>
            Certified Trainer Registry
          </h1>
          <p style={{ color: '#C4C8D8', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            The following individuals are authorized by Tri-Pillars™ LLC to train and certify
            Live and Grieve™ facilitators. Each holds a current Trainer Certification.
          </p>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {loading && (
            <p style={{ textAlign: 'center', color: C.muted, padding: '3rem 0' }}>Loading registry…</p>
          )}

          {error && (
            <p style={{ textAlign: 'center', color: '#DC2626', padding: '3rem 0' }}>{error}</p>
          )}

          {!loading && !error && trainers.length === 0 && (
            <div style={{ textAlign: 'center', color: C.muted, padding: '3rem 0', maxWidth: 520, margin: '0 auto' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: C.navy, fontFamily: 'Playfair Display, serif' }}>Certified trainers will be listed here as the program launches.</p>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>Trainer certifications are issued by Tri-Pillars™ LLC. Check back as our network grows.</p>
              <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
                Questions? <a href="/contact" style={{ color: C.gold, textDecoration: 'underline' }}>Contact us.</a>
              </p>
            </div>
          )}

          {!loading && trainers.length > 0 && (
            <div>
              <p style={{ color: C.muted, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {trainers.length} certified trainer{trainers.length !== 1 ? 's' : ''} listed
              </p>
              {trainers.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: C.navy, margin: 0 }}>
                        {t.full_name}
                      </h2>
                      {t.trainer_cert_id && (
                        <p style={{ fontSize: '0.8rem', color: C.muted, margin: '0.25rem 0 0', fontFamily: 'monospace' }}>
                          {t.trainer_cert_id}
                        </p>
                      )}
                    </div>
                    <span style={{
                      background: C.goldLt, color: C.gold, border: `1px solid ${C.gold}`,
                      borderRadius: 20, padding: '0.25rem 0.85rem', fontSize: '0.78rem', fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      Active
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: C.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cert Issued</p>
                      <p style={{ fontSize: '0.9rem', color: C.navy, margin: '0.2rem 0 0', fontWeight: 500 }}>{fmt(t.cert_issued)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: C.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Renewal Due</p>
                      <p style={{ fontSize: '0.9rem', color: C.navy, margin: '0.2rem 0 0', fontWeight: 500 }}>{fmt(t.cert_renewal)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: C.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Authorized Books</p>
                      <p style={{ fontSize: '0.9rem', color: C.navy, margin: '0.2rem 0 0', fontWeight: 500 }}>
                        {t.books_authorized.length > 0
                          ? t.books_authorized.map((b) => `Book ${b}`).join(', ')
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {t.books_authorized.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {t.books_authorized.map((b) => {
                        const bookBg = ['#c6cbcd','#d0c2c3','#becec3','#d4c8b4'][b-1] ?? '#e8e4dc';
                        return (
                          <span key={b} style={{
                            background: bookBg, color: '#1c3028',
                            border: `1px solid ${bookBg}`, borderRadius: 6,
                            padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 500,
                          }}>
                            {bookLabel(b)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: C.navy, lineHeight: 1.6 }}>
              <strong>Verification:</strong> To verify a trainer&apos;s certification or report a concern,
              contact <a href="mailto:ember@tripillarstudio.com" style={{ color: C.gold }}>ember@tripillarstudio.com</a>.
              Trainer certifications are issued by Tri-Pillars™ LLC and are non-transferable.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
