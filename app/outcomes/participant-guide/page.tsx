'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const GREEN = '#2D5016';
const NAVY = '#1c3028';
const GOLD = '#B8882A';
const BG = '#F9F7F2';

function ParticipantGuideContent() {
  const params = useSearchParams();

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: NAVY, maxWidth: 720,
      margin: '0 auto', padding: '2rem 1.5rem', background: '#fff', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem',
        borderBottom: `3px solid ${GREEN}` }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: GREEN,
          margin: '0 0 0.25rem' }}>Live and Grieve™</h1>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: NAVY, margin: '0 0 0.5rem' }}>
          Participant Outcomes Program
        </p>
        <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>
          What to expect — and when
        </p>
      </div>

      {/* Intro */}
      <div style={{ background: BG, borderRadius: 10, padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem', border: `1px solid #DDD9D0` }}>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.75, margin: 0, color: NAVY }}>
          As part of this program, you will be invited to complete <strong>four short forms</strong> at
          different points during and after the 13-week group. These forms help us understand how
          participants experience the program and how grief changes over time.
        </p>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.75, margin: '0.75rem 0 0', color: NAVY }}>
          Each form takes about <strong>5 minutes</strong>. You access it by scanning a QR code with
          your phone camera — no app, no login, no account needed.
        </p>
      </div>

      {/* Touchpoints */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: GREEN,
        margin: '0 0 1rem' }}>Your Four Touchpoints</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {[
          {
            num: '1',
            title: 'Pre-Program Form',
            when: 'Before Session 1 begins',
            desc: 'A brief baseline — how you are feeling about grief right now, before the program starts. Your facilitator will share the QR code at your first session.',
          },
          {
            num: '2',
            title: 'Mid-Program Pulse',
            when: 'At Session 7',
            desc: 'A short check-in at the halfway point. Three questions to help us understand how things are shifting for you.',
          },
          {
            num: '3',
            title: 'Post-Program Form',
            when: 'At Session 13 (closing session)',
            desc: 'The final in-program form. Reflects on the full 13 weeks and how grief feels now compared to when you started.',
          },
          {
            num: '4',
            title: '90-Day Follow-Up',
            when: 'Approximately 90 days after Session 13',
            desc: 'A brief follow-up sent to you by your site contact. Helps us understand whether the changes you felt during the program are continuing over time.',
          },
        ].map(tp => (
          <div key={tp.num} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem',
            background: BG, borderRadius: 10, border: `1px solid #DDD9D0`,
            alignItems: 'flex-start' }}>
            <div style={{ minWidth: 36, height: 36, borderRadius: '50%', background: GREEN,
              color: '#fff', fontWeight: 700, fontSize: '1rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {tp.num}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: NAVY,
                marginBottom: '0.2rem' }}>{tp.title}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: GOLD,
                marginBottom: '0.4rem' }}>{tp.when}</div>
              <div style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.65 }}>{tp.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* How to scan */}
      <div style={{ background: '#EEF4FF', borderRadius: 10, padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem', border: '1px solid #C7D7F5' }}>
        <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 700,
          color: NAVY, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
          margin: '0 0 0.75rem' }}>How to Use a QR Code</h3>
        <ol style={{ fontSize: '0.9rem', lineHeight: 1.8, color: NAVY, margin: 0,
          paddingLeft: '1.25rem' }}>
          <li>Open your phone&apos;s <strong>camera app</strong> (no special app needed).</li>
          <li>Point it at the QR code on the sheet your facilitator hands you.</li>
          <li>Tap the link that appears on your screen.</li>
          <li>Complete the short form in your browser and tap <strong>Submit</strong>.</li>
        </ol>
        <p style={{ fontSize: '0.83rem', color: '#6B7280', margin: '0.75rem 0 0', lineHeight: 1.6 }}>
          Your responses are anonymous unless you choose to provide your name. All data is used
          only for program improvement and is never shared publicly.
        </p>
      </div>

      {/* Questions */}
      <div style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.7,
        borderTop: `1px solid #DDD9D0`, paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
        <strong style={{ color: NAVY }}>Questions?</strong> Speak with your facilitator.
        You can also reach Tri-Pillars™ LLC at{' '}
        <a href="tel:2703028814" style={{ color: GREEN }}>270-302-8814</a> or{' '}
        <a href="mailto:wayne@tripillarstudio.com" style={{ color: GREEN }}>wayne@tripillarstudio.com</a>.
      </div>

      <div className="no-print" style={{ textAlign: 'center', paddingTop: '1rem' }}>
        <button onClick={() => window.print()}
          style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 8,
            padding: '0.65rem 2rem', fontSize: '0.95rem', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
          Print This Guide
        </button>
        <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
          Print one copy per participant or display on screen
        </p>
      </div>
    </div>
  );
}

export default function ParticipantGuidePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>Loading…</div>}>
      <ParticipantGuideContent />
    </Suspense>
  );
}
