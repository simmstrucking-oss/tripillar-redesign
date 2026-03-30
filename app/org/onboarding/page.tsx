'use client';
/**
 * /org/onboarding — Organization Onboarding Checklist
 * 7-step guided setup for new org licensees.
 * Auth: Supabase session cookie; role must be org_admin.
 * Progress auto-saves via PATCH /api/org/onboarding.
 */
import { useState, useEffect, useCallback } from 'react';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';

const C = {
  navy:    '#1c3028',
  gold:    '#B8942F',
  goldLt:  '#FDF8EE',
  bg:      '#F4F1EC',
  white:   '#FFFFFF',
  border:  '#E2DDD7',
  muted:   '#7A7264',
  success: '#2E7D50',
  warn:    '#C07D2F',
  danger:  '#C0392B',
};

/* ── shared styles ── */

const cardStyle: React.CSSProperties = {
  background: C.white,
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  padding: '1.25rem 1.5rem',
  marginBottom: '1rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const btnGold: React.CSSProperties = {
  background: C.gold,
  color: C.white,
  border: 'none',
  borderRadius: 6,
  padding: '8px 20px',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const btnOutline: React.CSSProperties = {
  background: 'transparent',
  color: C.gold,
  border: `1.5px solid ${C.gold}`,
  borderRadius: 6,
  padding: '8px 20px',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.875rem',
  color: C.navy,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: C.navy,
  marginBottom: '0.25rem',
};

/* ── types ── */

interface OnboardingData {
  onboarding_progress: Record<string, boolean>;
  onboarding_complete: boolean;
  facilitator_candidate_name: string | null;
  facilitator_candidate_email: string | null;
  training_requested: boolean;
  target_cohort_date: string | null;
  cohort_group_size: string | null;
  cohort_format: string | null;
  org_name: string;
  user_name: string;
  user_email: string;
}

/* ── checkmark circle ── */

function StepCircle({ done, n }: { done: boolean; n: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: done ? `2px solid ${C.success}` : `2px solid ${C.border}`,
        background: done ? C.success : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
        color: done ? C.white : C.muted,
        fontSize: '0.8rem',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s',
      }}
    >
      {done ? '\u2713' : n}
    </div>
  );
}

/* ── main page ── */

export default function OrgOnboardingPage() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  /* step 4 local state */
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');

  /* step 5 local state */
  const [showStep5Form, setShowStep5Form] = useState(false);
  const [step5Desc, setStep5Desc] = useState('');

  /* step 6 local state */
  const [step6Checked, setStep6Checked] = useState(false);

  /* step 7 local state */
  const [cohortDate, setCohortDate] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [cohortFormat, setCohortFormat] = useState('');

  /* ── load on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/org/onboarding');
        if (!res.ok) return;
        const d = (await res.json()) as OnboardingData;
        setData(d);
        if (d.facilitator_candidate_name) setFacName(d.facilitator_candidate_name);
        if (d.facilitator_candidate_email) setFacEmail(d.facilitator_candidate_email);
        if (d.target_cohort_date) setCohortDate(d.target_cohort_date);
        if (d.cohort_group_size) setGroupSize(d.cohort_group_size);
        if (d.cohort_format) setCohortFormat(d.cohort_format);
        if (d.onboarding_progress?.['6']) setStep6Checked(true);
        setStep5Desc(
          `${d.org_name || '[Org Name]'} \u2014 Facilitator candidate: ${d.facilitator_candidate_name || '[name from step 4]'}`,
        );
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── helpers ── */

  const progress = data?.onboarding_progress ?? {};
  const completedCount = [1, 2, 3, 4, 5, 6, 7].filter(
    (n) => progress[String(n)],
  ).length;
  const allComplete = data?.onboarding_complete || completedCount >= 7;

  const patchOnboarding = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const res = await fetch('/api/org/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setData((prev) => (prev ? { ...prev, ...updated } : updated));
        }
      } catch {
        /* silent */
      }
    },
    [],
  );

  const markStep = useCallback(
    (step: number, extraFields?: Record<string, unknown>) => {
      setData((prev) => {
        if (!prev) return prev;
        const newProgress = { ...prev.onboarding_progress, [String(step)]: true };
        const count = [1, 2, 3, 4, 5, 6, 7].filter(
          (n) => newProgress[String(n)],
        ).length;
        const isComplete = count >= 7;

        const patch: Record<string, unknown> = {
          onboarding_progress: newProgress,
          ...extraFields,
        };
        if (isComplete) patch.onboarding_complete = true;
        patchOnboarding(patch);

        return {
          ...prev,
          onboarding_progress: newProgress,
          onboarding_complete: isComplete,
          ...(extraFields as Partial<OnboardingData>),
        };
      });
    },
    [patchOnboarding],
  );

  /* ── document opener ── */

  const openDoc = async (file: string, step: number) => {
    try {
      const res = await fetch(`/api/org/documents?file=${file}`);
      if (res.ok) {
        const json = await res.json();
        if (json.url) window.open(json.url, '_blank');
      }
    } catch {
      /* silent */
    }
    if (!progress[String(step)]) markStep(step);
  };

  /* ── render ── */

  if (loading) {
    return (
      <>
        <link href={FONT_LINK} rel="stylesheet" />
        <div
          style={{
            minHeight: '100vh',
            background: C.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            color: C.muted,
          }}
        >
          Loading&hellip;
        </div>
      </>
    );
  }

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          padding: '2.5rem 1rem 4rem',
          fontFamily: 'Inter, sans-serif',
          color: C.navy,
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.65rem',
                fontWeight: 700,
                color: C.navy,
                margin: '0 0 0.5rem',
              }}
            >
              Welcome to the Live&nbsp;and&nbsp;Grieve&trade; Partner Hub
            </h1>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                color: C.muted,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Your license is active. Here are the steps to get your
              organization ready to launch.
            </p>
          </div>

          {/* ── Progress banner ── */}
          <div
            style={{
              background: C.gold,
              borderRadius: 8,
              padding: '14px 20px',
              marginBottom: '1.5rem',
              color: C.white,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              textAlign: 'center',
            }}
          >
            {allComplete
              ? 'Launch preparation complete. Your facilitator certification training will be confirmed by Tri-Pillars™ shortly.'
              : `${completedCount} of 7 steps complete`}
          </div>

          {/* ── Step 1 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['1']} n="1" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 8px',
                  }}
                >
                  Review your Institutional License Agreement
                </h3>
                <button style={btnGold} onClick={() => openDoc('ila', 1)}>
                  Open Document
                </button>
              </div>
            </div>
          </div>

          {/* ── Step 2 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['2']} n="2" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 8px',
                  }}
                >
                  Review the Program Overview
                </h3>
                <button style={btnGold} onClick={() => openDoc('program-overview', 2)}>
                  Open Document
                </button>
              </div>
            </div>
          </div>

          {/* ── Step 3 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['3']} n="3" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 8px',
                  }}
                >
                  Review the Participant Appropriateness Guide
                </h3>
                <button
                  style={{ ...btnGold, marginBottom: 8 }}
                  onClick={() => openDoc('appropriateness-guide', 3)}
                >
                  Open Document
                </button>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: C.muted,
                    margin: 0,
                    lineHeight: 1.55,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Understanding who this program serves will help you identify
                  the right participants for your first cohort.
                </p>
              </div>
            </div>
          </div>

          {/* ── Step 4 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['4']} n="4" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 10px',
                  }}
                >
                  Identify your facilitator candidate
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      style={inputStyle}
                      placeholder="Full name"
                      value={facName}
                      onChange={(e) => setFacName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      style={inputStyle}
                      type="email"
                      placeholder="email@example.com"
                      value={facEmail}
                      onChange={(e) => setFacEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  style={btnGold}
                  onClick={() => {
                    if (!facName.trim() || !facEmail.trim()) return;
                    markStep(4, {
                      facilitator_candidate_name: facName.trim(),
                      facilitator_candidate_email: facEmail.trim(),
                    });
                    setStep5Desc(
                      `${data?.org_name || '[Org Name]'} \u2014 Facilitator candidate: ${facName.trim()}`,
                    );
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* ── Step 5 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['5']} n="5" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 8px',
                  }}
                >
                  Request facilitator certification training
                </h3>

                {data?.training_requested || progress['5'] ? (
                  <span
                    style={{
                      color: C.success,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Request submitted &#10003;
                  </span>
                ) : !showStep5Form ? (
                  <button
                    style={btnGold}
                    onClick={() => {
                      setStep5Desc(
                        `${data?.org_name || '[Org Name]'} \u2014 Facilitator candidate: ${facName || '[name from step 4]'}`,
                      );
                      setShowStep5Form(true);
                    }}
                  >
                    Submit Request
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={labelStyle}>Request type</label>
                      <input
                        style={{
                          ...inputStyle,
                          background: '#f8f6f3',
                          color: C.muted,
                        }}
                        readOnly
                        value="Facilitator certification training request"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <input
                        style={inputStyle}
                        value={step5Desc}
                        onChange={(e) => setStep5Desc(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={btnGold}
                        onClick={async () => {
                          try {
                            await fetch('/api/org/consultation', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                request_type:
                                  'Facilitator certification training request',
                                description: step5Desc,
                                submitted_by_name: data?.user_name || '',
                                submitted_by_email: data?.user_email || '',
                              }),
                            });
                          } catch {
                            /* silent */
                          }
                          markStep(5, { training_requested: true });
                          setShowStep5Form(false);
                        }}
                      >
                        Submit
                      </button>
                      <button
                        style={btnOutline}
                        onClick={() => setShowStep5Form(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Step 6 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['6']} n="6" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 8px',
                  }}
                >
                  Order participant workbooks
                </h3>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  <a
                    href="https://www.amazon.com/dp/PLACEHOLDER"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...btnGold,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Order on Amazon
                  </a>
                  <a
                    href="/contact?inquiry=bulk-workbook-order"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...btnOutline,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Bulk order (10+ copies)
                  </a>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: C.muted,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={step6Checked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setStep6Checked(checked);
                      if (checked) markStep(6);
                    }}
                    style={{ accentColor: C.success, width: 16, height: 16 }}
                  />
                  I&apos;ve placed my order
                </label>
              </div>
            </div>
          </div>

          {/* ── Step 7 ── */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <StepCircle done={!!progress['7']} n="7" />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: C.navy,
                    margin: '0 0 10px',
                  }}
                >
                  Confirm cohort launch readiness
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Target start date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={cohortDate}
                      onChange={(e) => setCohortDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Group size</label>
                    <select
                      style={{
                        ...inputStyle,
                        background: C.white,
                        cursor: 'pointer',
                      }}
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n)}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Format</label>
                    <select
                      style={{
                        ...inputStyle,
                        background: C.white,
                        cursor: 'pointer',
                      }}
                      value={cohortFormat}
                      onChange={(e) => setCohortFormat(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="In-person">In-person</option>
                      <option value="Virtual">Virtual</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <button
                  style={btnGold}
                  onClick={() => {
                    if (!cohortDate || !groupSize || !cohortFormat) return;
                    markStep(7, {
                      target_cohort_date: cohortDate,
                      cohort_group_size: groupSize,
                      cohort_format: cohortFormat,
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* ── Continue button ── */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <a
              href="/org/hub"
              style={{
                display: 'inline-block',
                background: C.gold,
                color: C.white,
                borderRadius: 8,
                padding: '12px 32px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              Continue to Hub &rarr;
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
