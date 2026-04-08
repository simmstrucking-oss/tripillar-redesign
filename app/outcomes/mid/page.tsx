'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PRIVACY_NOTICE = "Your responses are confidential. This form is used only to understand how the program helps participants and to improve future delivery. All responses are aggregated and de-identified \u2014 your individual responses are never attributed to you by name in any reporting. You may leave open-ended questions blank.";

const PAGE_BG = '#FAFAF8';
const GREEN = '#2D5016';
const BORDER = '#DDD9D0';
const MUTED = '#6B7280';
const NAVY = '#1c3028';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: PAGE_BG,
  fontFamily: 'Inter, sans-serif', color: NAVY,
};
const containerStyle: React.CSSProperties = {
  maxWidth: 540, margin: '0 auto', padding: '2rem 1.25rem',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.875rem', fontWeight: 600, color: NAVY, marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${BORDER}`,
  borderRadius: 8, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
  background: '#fff', boxSizing: 'border-box', color: NAVY,
};
const questionBlockStyle: React.CSSProperties = { marginBottom: '1.75rem' };

function RatingScale({ value, onChange, leftAnchor, rightAnchor }: {
  value: number; onChange: (n: number) => void; leftAnchor: string; rightAnchor: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            style={{
              flex: 1, minWidth: 32, height: 36, border: `1px solid ${value === n ? '#2D5016' : '#DDD9D0'}`,
              borderRadius: 6, background: value === n ? '#2D5016' : '#fff',
              color: value === n ? '#fff' : '#1c3028', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
        <span>{leftAnchor}</span>
        <span>{rightAnchor}</span>
      </div>
    </div>
  );
}

function MidForm() {
  const params = useSearchParams();
  const cohortId = params.get('cohort') || '';
  const emailParam = params.get('email') || '';

  const [phase, setPhase] = useState<'email' | 'survey' | 'done'>(emailParam ? 'survey' : 'email');
  const [email, setEmail] = useState(emailParam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Survey fields
  const [emotions, setEmotions] = useState(0);
  const [manageability, setManageability] = useState(0);
  const [connection, setConnection] = useState(0);
  const [surprised, setSurprised] = useState('');

  if (!cohortId) return <div style={pageStyle}><div style={containerStyle}><p>Missing cohort ID. Please use the link provided by your facilitator.</p></div></div>;

  async function handleSurvey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/outcomes/mid', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohortId, email,
        scores: { emotions, manageability, connection },
        surprised,
      }),
    });
    setSaving(false);
    if (res.ok) setPhase('done');
    else { const d = await res.json(); setError(d.error || 'Something went wrong'); }
  }

  const scoresValid = emotions > 0 && manageability > 0 && connection > 0;

  if (phase === 'done') {
    return (
      <div style={pageStyle}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={containerStyle}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: GREEN, marginBottom: '1rem' }}>Thank You</h1>
          <p style={{ lineHeight: 1.7, color: NAVY }}>Your responses have been recorded. Thank you for sharing how things are going so far.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={containerStyle}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: GREEN, marginBottom: '0.25rem' }}>
          Live and Grieve™
        </h1>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: NAVY, marginBottom: '1.5rem' }}>
          Mid-Program Check-In
        </h2>

        <div style={{ background: '#f0ede6', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.75rem', fontSize: '0.8rem', color: MUTED, lineHeight: 1.6 }}>
          {PRIVACY_NOTICE}
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        {phase === 'email' && (
          <form onSubmit={(e) => { e.preventDefault(); setPhase('survey'); }}>
            <div style={questionBlockStyle}>
              <label style={labelStyle}>Email address *</label>
              <input type="email" required style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button type="submit" disabled={!email}
              style={{
                width: '100%', padding: '0.75rem', border: 'none', borderRadius: 8,
                background: email ? GREEN : '#ccc',
                color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: email ? 'pointer' : 'not-allowed',
              }}>
              Continue
            </button>
          </form>
        )}

        {phase === 'survey' && (
          <form onSubmit={handleSurvey}>
            <div style={questionBlockStyle}>
              <label style={labelStyle}>Compared to Week 1, how well are you able to acknowledge and name your grief emotions?</label>
              <RatingScale value={emotions} onChange={setEmotions} leftAnchor="Much less able than Week 1" rightAnchor="Much more able than Week 1" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>Compared to Week 1, how manageable does your grief feel in daily life?</label>
              <RatingScale value={manageability} onChange={setManageability} leftAnchor="Much less manageable" rightAnchor="Much more manageable" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How connected do you feel to the other people in this group?</label>
              <RatingScale value={connection} onChange={setConnection} leftAnchor="Not connected at all" rightAnchor="Very connected" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>What has surprised you most about this program so far?</label>
              <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={surprised} onChange={e => setSurprised(e.target.value)}
                placeholder="Optional" />
            </div>

            <button type="submit" disabled={saving || !scoresValid}
              style={{
                width: '100%', padding: '0.75rem', border: 'none', borderRadius: 8,
                background: scoresValid ? GREEN : '#ccc',
                color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: scoresValid ? 'pointer' : 'not-allowed',
              }}>
              {saving ? 'Submitting\u2026' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MidPage() {
  return <Suspense><MidForm /></Suspense>;
}
