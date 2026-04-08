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

function PreForm() {
  const params = useSearchParams();
  const cohortId = params.get('cohort') || '';

  const [phase, setPhase] = useState<'register' | 'survey' | 'done'>('register');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Survey fields
  const [lossType, setLossType] = useState('');
  const [timeSinceLoss, setTimeSinceLoss] = useState('');
  const [priorSupport, setPriorSupport] = useState('');
  const [emotions, setEmotions] = useState(0);
  const [disruption, setDisruption] = useState(0);
  const [isolation, setIsolation] = useState(0);
  const [meaning, setMeaning] = useState(0);
  const [selfcare, setSelfcare] = useState(0);
  const [manageability, setManageability] = useState(0);
  const [openHope, setOpenHope] = useState('');

  if (!cohortId) return <div style={pageStyle}><div style={containerStyle}><p>Missing cohort ID. Please use the link provided by your facilitator.</p></div></div>;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/outcomes/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName, cohortId }),
    });
    setSaving(false);
    if (res.ok) setPhase('survey');
    else { const d = await res.json(); setError(d.error || 'Something went wrong'); }
  }

  async function handleSurvey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/outcomes/pre', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohortId, email,
        lossType, timeSinceLoss, priorSupport,
        scores: { emotions, disruption, isolation, meaning, selfcare, manageability },
        openHope,
      }),
    });
    setSaving(false);
    if (res.ok) setPhase('done');
    else { const d = await res.json(); setError(d.error || 'Something went wrong'); }
  }

  const scoresValid = emotions > 0 && disruption > 0 && isolation > 0 && meaning > 0 && selfcare > 0 && manageability > 0;

  if (phase === 'done') {
    return (
      <div style={pageStyle}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={containerStyle}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: GREEN, marginBottom: '1rem' }}>Thank You</h1>
          <p style={{ lineHeight: 1.7, color: NAVY }}>Your responses have been recorded. We appreciate you taking the time to share where you are right now. Your facilitator will guide you through the rest of the program.</p>
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
          Pre-Program Form
        </h2>

        <div style={{ background: '#f0ede6', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.75rem', fontSize: '0.8rem', color: MUTED, lineHeight: 1.6 }}>
          {PRIVACY_NOTICE}
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        {phase === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={questionBlockStyle}>
              <label style={labelStyle}>Email address *</label>
              <input type="email" required style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div style={questionBlockStyle}>
              <label style={labelStyle}>What would you like to go by? *</label>
              <input type="text" required style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="First name or nickname" />
            </div>
            <button type="submit" disabled={saving || !email || !displayName}
              style={{
                width: '100%', padding: '0.75rem', border: 'none', borderRadius: 8,
                background: email && displayName ? GREEN : '#ccc',
                color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: email && displayName ? 'pointer' : 'not-allowed',
              }}>
              {saving ? 'Registering\u2026' : 'Continue'}
            </button>
          </form>
        )}

        {phase === 'survey' && (
          <form onSubmit={handleSurvey}>
            <div style={questionBlockStyle}>
              <label style={labelStyle}>What type of loss brings you here?</label>
              <select style={inputStyle} value={lossType} onChange={e => setLossType(e.target.value)}>
                <option value="">Select\u2026</option>
                <option value="Death of spouse or partner">Death of spouse or partner</option>
                <option value="Death of a child">Death of a child</option>
                <option value="Death of a parent">Death of a parent</option>
                <option value="Death of a sibling">Death of a sibling</option>
                <option value="Death of a close friend">Death of a close friend</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How long ago did this loss occur?</label>
              <select style={inputStyle} value={timeSinceLoss} onChange={e => setTimeSinceLoss(e.target.value)}>
                <option value="">Select\u2026</option>
                <option value="Less than 6 months ago">Less than 6 months ago</option>
                <option value="6-12 months ago">6–12 months ago</option>
                <option value="1-2 years ago">1–2 years ago</option>
                <option value="More than 2 years ago">More than 2 years ago</option>
              </select>
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>Have you been in a grief support group before?</label>
              <select style={inputStyle} value={priorSupport} onChange={e => setPriorSupport(e.target.value)}>
                <option value="">Select\u2026</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How well are you able to acknowledge and name your grief emotions?</label>
              <RatingScale value={emotions} onChange={setEmotions} leftAnchor="Rarely able to" rightAnchor="Fully able to" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How much has grief disrupted your ability to function in daily life?</label>
              <RatingScale value={disruption} onChange={setDisruption} leftAnchor="No disruption" rightAnchor="Completely disrupted" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How isolated do you feel in your grief?</label>
              <RatingScale value={isolation} onChange={setIsolation} leftAnchor="Not isolated at all" rightAnchor="Completely isolated" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How much have you been able to find meaning or purpose since your loss?</label>
              <RatingScale value={meaning} onChange={setMeaning} leftAnchor="None at all" rightAnchor="A great deal" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How well are you able to care for yourself — sleep, eating, basic needs?</label>
              <RatingScale value={selfcare} onChange={setSelfcare} leftAnchor="Very poorly" rightAnchor="Very well" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How much does thinking about your loss feel manageable right now?</label>
              <RatingScale value={manageability} onChange={setManageability} leftAnchor="Not manageable at all" rightAnchor="Completely manageable" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>In your own words — what are you hoping this group might give you?</label>
              <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={openHope} onChange={e => setOpenHope(e.target.value)}
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

export default function PrePage() {
  return <Suspense><PreForm /></Suspense>;
}
