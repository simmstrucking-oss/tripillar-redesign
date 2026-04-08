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

function PostForm() {
  const params = useSearchParams();
  const cohortId = params.get('cohort') || '';
  const emailParam = params.get('email') || '';

  const [phase, setPhase] = useState<'email' | 'survey' | 'done'>(emailParam ? 'survey' : 'email');
  const [email, setEmail] = useState(emailParam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Survey fields
  const [sessionsAttended, setSessionsAttended] = useState('');
  const [emotions, setEmotions] = useState(0);
  const [disruption, setDisruption] = useState(0);
  const [isolation, setIsolation] = useState(0);
  const [meaning, setMeaning] = useState(0);
  const [selfcare, setSelfcare] = useState(0);
  const [manageability, setManageability] = useState(0);
  const [helpfulness, setHelpfulness] = useState(0);
  const [safety, setSafety] = useState(0);
  const [facilitatorSupport, setFacilitatorSupport] = useState(0);
  const [whatChanged, setWhatChanged] = useState('');
  const [tellSomeone, setTellSomeone] = useState('');
  const [anythingDifferent, setAnythingDifferent] = useState('');
  const [followupConsent, setFollowupConsent] = useState(false);

  if (!cohortId) return <div style={pageStyle}><div style={containerStyle}><p>Missing cohort ID. Please use the link provided by your facilitator.</p></div></div>;

  async function handleSurvey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/outcomes/post', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohortId, email,
        sessionsAttended: Number(sessionsAttended),
        scores: { emotions, disruption, isolation, meaning, selfcare, manageability, helpfulness, safety, facilitatorSupport },
        whatChanged, tellSomeone, anythingDifferent, followupConsent,
      }),
    });
    setSaving(false);
    if (res.ok) setPhase('done');
    else { const d = await res.json(); setError(d.error || 'Something went wrong'); }
  }

  const scoresValid = emotions > 0 && disruption > 0 && isolation > 0 && meaning > 0 && selfcare > 0 && manageability > 0 && helpfulness > 0 && safety > 0 && facilitatorSupport > 0;

  if (phase === 'done') {
    return (
      <div style={pageStyle}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={containerStyle}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: GREEN, marginBottom: '1rem' }}>Thank You</h1>
          <p style={{ lineHeight: 1.7, color: NAVY }}>Your responses have been recorded. Thank you for being part of this program and for sharing your experience.</p>
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
          Post-Program Form
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
              <label style={labelStyle}>How many sessions did you attend? *</label>
              <input type="number" min={1} max={13} required style={{ ...inputStyle, maxWidth: 120 }}
                value={sessionsAttended} onChange={e => setSessionsAttended(e.target.value)} placeholder="1–13" />
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
              <label style={labelStyle}>How helpful was this program overall?</label>
              <RatingScale value={helpfulness} onChange={setHelpfulness} leftAnchor="Not helpful at all" rightAnchor="Extremely helpful" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How safe did you feel sharing in this group?</label>
              <RatingScale value={safety} onChange={setSafety} leftAnchor="Not safe" rightAnchor="Completely safe" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>How supported did you feel by the facilitator?</label>
              <RatingScale value={facilitatorSupport} onChange={setFacilitatorSupport} leftAnchor="Not supported" rightAnchor="Fully supported" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>What changed for you during this program?</label>
              <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={whatChanged} onChange={e => setWhatChanged(e.target.value)}
                placeholder="Optional" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>What would you tell someone who is considering joining this program?</label>
              <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={tellSomeone} onChange={e => setTellSomeone(e.target.value)}
                placeholder="Optional" />
            </div>

            <div style={questionBlockStyle}>
              <label style={labelStyle}>Is there anything you would have done differently about the program?</label>
              <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={anythingDifferent} onChange={e => setAnythingDifferent(e.target.value)}
                placeholder="Optional" />
            </div>

            <div style={{ ...questionBlockStyle, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" id="followup-consent" checked={followupConsent} onChange={e => setFollowupConsent(e.target.checked)}
                style={{ marginTop: 3, accentColor: GREEN }} />
              <label htmlFor="followup-consent" style={{ fontSize: '0.85rem', color: NAVY, lineHeight: 1.5, cursor: 'pointer' }}>
                I consent to being contacted for a brief 90-day follow-up survey to help us understand the lasting impact of this program.
              </label>
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

export default function PostPage() {
  return <Suspense><PostForm /></Suspense>;
}
