'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const GREEN = '#2D5016';
const NAVY = '#1c3028';

function QRPackContent() {
  const params = useSearchParams();
  const cohortId = params.get('cohort') || '';

  if (!cohortId) return <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>Missing cohort ID.</div>;

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const forms = [
    {
      label: 'Pre-Program Form',
      when: 'Distribute before Session 1 begins — participants scan to register and complete their pre-program form.',
      url: `${base}/outcomes/pre?cohort=${cohortId}`,
    },
    {
      label: 'Mid-Program Pulse',
      when: 'Distribute at Session 7 before participants leave — takes about 5 minutes.',
      url: `${base}/outcomes/mid?cohort=${cohortId}`,
    },
    {
      label: 'Post-Program Form',
      when: 'Distribute at Session 13 before the closing ceremony — this is the final program form.',
      url: `${base}/outcomes/post?cohort=${cohortId}`,
    },
    {
      label: '90-Day Follow-Up',
      when: 'Your site contact sends this link directly to consenting participants approximately 90 days after Session 13.',
      url: `${base}/outcomes/followup?cohort=${cohortId}`,
    },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: NAVY, maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: GREEN, margin: '0 0 0.25rem' }}>
          Live and Grieve™
        </h1>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: NAVY, margin: 0 }}>
          Participant Outcomes — QR Code Pack
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
        {forms.map(f => (
          <div key={f.label} style={{ border: `1px solid #DDD9D0`, borderRadius: 10, padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: GREEN, margin: '0 0 0.75rem' }}>{f.label}</h3>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(f.url)}`}
              alt={`QR code for ${f.label}`}
              width={200} height={200}
              style={{ marginBottom: '0.75rem' }}
            />
            <p style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.5, margin: '0 0 0.5rem' }}>{f.when}</p>
            <p style={{ fontSize: '0.65rem', color: '#9CA3AF', wordBreak: 'break-all', margin: 0 }}>{f.url}</p>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>
        Print this sheet and keep it in your program binder.
      </p>

      <div className="no-print" style={{ textAlign: 'center' }}>
        <button onClick={() => window.print()}
          style={{
            background: GREEN, color: '#fff', border: 'none', borderRadius: 8,
            padding: '0.65rem 2rem', fontSize: '0.95rem', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          }}>
          Print QR Pack
        </button>
      </div>
    </div>
  );
}

export default function QRPackPage() {
  return <Suspense><QRPackContent /></Suspense>;
}
