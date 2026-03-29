'use client';

import { useEffect, useState } from 'react';
import { PITCH_CONTENT, PROGRAM_INTRO } from '@/lib/pitch-content';

interface CodeData {
  prospect: {
    org_name: string;
    sector: string;
  };
  code: {
    id: string;
    code: string;
    sector: string;
    expires_at: string | null;
    used_at: string | null;
    prospect_id: string;
  };
}

interface FormData {
  contact_name: string;
  org_name: string;
  phone: string;
  preferred_time: string;
  message: string;
}

export default function ProspectLandingPage({
  params
}: {
  params: { code: string };
}) {
  const [codeData, setCodeData] = useState<CodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    contact_name: '',
    org_name: '',
    phone: '',
    preferred_time: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [pageLoadTime] = useState(() => performance.now());

  // Validate code on mount
  useEffect(() => {
    const validateCode = async () => {
      try {
        const response = await fetch(`/api/explore/${params.code}`);
        
        if (response.status === 404) {
          setError('invalid');
          return;
        }
        
        if (response.status === 410) {
          setError('expired');
          return;
        }

        const data = await response.json();
        setCodeData(data);

        // Log code_viewed activity
        if (data.code.id && data.code.prospect_id) {
          await fetch(`/api/explore/${params.code}/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'code_viewed',
              code_id: data.code.id,
              prospect_id: data.code.prospect_id
            })
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Error validating code:', err);
        setError('invalid');
      } finally {
        setLoading(false);
      }
    };

    validateCode();
  }, [params.code]);

  // Track time on page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (codeData?.code) {
        const duration = Math.round((performance.now() - pageLoadTime) / 1000);
        navigator.sendBeacon(
          `/api/explore/${params.code}/activity`,
          JSON.stringify({
            event_type: 'time_on_page',
            event_data: { duration_seconds: duration },
            code_id: codeData.code.id,
            prospect_id: codeData.code.prospect_id
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [codeData, params.code, pageLoadTime]);

  // Track pitch section scroll
  useEffect(() => {
    const handleScroll = () => {
      const pitchSection = document.getElementById('pitch-section');
      if (!pitchSection || !codeData?.code) return;

      const rect = pitchSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && !sessionStorage.getItem('pitch_viewed')) {
        sessionStorage.setItem('pitch_viewed', 'true');
        fetch(`/api/explore/${params.code}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'pitch_viewed',
            event_data: { sector: codeData.prospect.sector },
            code_id: codeData.code.id,
            prospect_id: codeData.code.prospect_id
          })
        }).catch(() => {});
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [codeData, params.code]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeData?.code) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/explore/${params.code}/request-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code_id: codeData.code.id,
          prospect_id: codeData.code.prospect_id
        })
      });

      if (response.ok) {
        setFormSubmitted(true);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F4F1EC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#7A7264', fontSize: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error === 'invalid') {
    return (
      <div style={{ backgroundColor: '#F4F1EC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '40px',
          borderRadius: '4px',
          maxWidth: '500px',
          textAlign: 'center',
          border: '1px solid #E2DDD7'
        }}>
          <h1 style={{ color: '#2D3142', fontFamily: 'Playfair Display, serif', fontSize: '28px', marginBottom: '20px' }}>
            Link Not Valid
          </h1>
          <p style={{ color: '#7A7264', fontSize: '16px', lineHeight: '1.6' }}>
            This link is not valid. Please contact{' '}
            <a href="mailto:wayne@tripillarstudio.com" style={{ color: '#B8942F', textDecoration: 'none' }}>
              wayne@tripillarstudio.com
            </a>
            {' '}for access.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'expired') {
    return (
      <div style={{ backgroundColor: '#F4F1EC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '40px',
          borderRadius: '4px',
          maxWidth: '500px',
          textAlign: 'center',
          border: '1px solid #E2DDD7'
        }}>
          <h1 style={{ color: '#2D3142', fontFamily: 'Playfair Display, serif', fontSize: '28px', marginBottom: '20px' }}>
            Link Expired
          </h1>
          <p style={{ color: '#7A7264', fontSize: '16px', lineHeight: '1.6' }}>
            This link has expired. Please contact{' '}
            <a href="mailto:wayne@tripillarstudio.com" style={{ color: '#B8942F', textDecoration: 'none' }}>
              wayne@tripillarstudio.com
            </a>
            {' '}}for access.
          </p>
        </div>
      </div>
    );
  }

  if (!codeData) {
    return null;
  }

  const pitch = PITCH_CONTENT[codeData.prospect.sector];

  return (
    <div style={{ backgroundColor: '#F4F1EC', minHeight: '100vh' }}>
      {/* Section 1: Program Introduction */}
      <section style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          color: '#2D3142',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          Live and Grieve™
        </h1>
        
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '24px',
          color: '#2D3142',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          {PROGRAM_INTRO.headline}
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#7A7264',
          lineHeight: '1.8',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {PROGRAM_INTRO.p1}
        </p>

        <p style={{
          fontSize: '16px',
          color: '#7A7264',
          lineHeight: '1.8',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          {PROGRAM_INTRO.p2}
        </p>

        <div style={{
          height: '1px',
          backgroundColor: '#B8942F',
          margin: '40px 0'
        }} />
      </section>

      {/* Section 2: Sector Pitch */}
      {pitch && (
        <section id="pitch-section" style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            color: '#2D3142',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {pitch.headline}
          </h2>

          <p style={{
            fontSize: '16px',
            color: '#7A7264',
            lineHeight: '1.8',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            {pitch.intro}
          </p>

          <div style={{ marginBottom: '40px' }}>
            {pitch.points.map((point, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderLeft: '4px solid #B8942F',
                  padding: '20px',
                  marginBottom: '16px',
                  borderRadius: '2px'
                }}
              >
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2D3142',
                  marginBottom: '10px',
                  margin: '0 0 10px 0'
                }}>
                  {point.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#7A7264',
                  lineHeight: '1.6',
                  margin: '0'
                }}>
                  {point.body}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            fontSize: '15px',
            fontStyle: 'italic',
            color: '#B8942F',
            textAlign: 'center',
            marginTop: '30px'
          }}>
            {pitch.cta}
          </p>
        </section>
      )}

      {/* Section 3: Request a Conversation */}
      <section style={{
        backgroundColor: '#2D3142',
        padding: '60px 20px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            color: '#FDF8EE',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            Ready to bring Live and Grieve™ to your community?
          </h2>

          <p style={{
            fontSize: '16px',
            color: '#B8942F',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Wayne Simms, Co-Founder, would love to talk.
          </p>

          {formSubmitted ? (
            <div style={{
              backgroundColor: 'rgba(183, 148, 47, 0.1)',
              border: '1px solid #B8942F',
              padding: '30px',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#FDF8EE',
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                Thank you. Wayne will be in touch shortly. In the meantime, feel free to explore more at{' '}
                <a href="https://tripillarstudio.com" style={{ color: '#B8942F', textDecoration: 'underline' }}>
                  tripillarstudio.com
                </a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#FDF8EE',
                  fontSize: '14px',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Your name <span style={{ color: '#C0392B' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2DDD7',
                    backgroundColor: '#F4F1EC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#FDF8EE',
                  fontSize: '14px',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Organization name <span style={{ color: '#C0392B' }}>*</span>
                </label>
                <input
                  type="text"
                  name="org_name"
                  value={formData.org_name}
                  onChange={handleFormChange}
                  placeholder={codeData.prospect.org_name}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2DDD7',
                    backgroundColor: '#F4F1EC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#FDF8EE',
                  fontSize: '14px',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Best phone number <span style={{ color: '#C0392B' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2DDD7',
                    backgroundColor: '#F4F1EC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#FDF8EE',
                  fontSize: '14px',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Preferred time to connect
                </label>
                <input
                  type="text"
                  name="preferred_time"
                  value={formData.preferred_time}
                  onChange={handleFormChange}
                  placeholder="e.g. weekday mornings, Tuesday afternoons"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2DDD7',
                    backgroundColor: '#F4F1EC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  color: '#FDF8EE',
                  fontSize: '14px',
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  Brief message ({formData.message.length}/300)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  maxLength={300}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2DDD7',
                    backgroundColor: '#F4F1EC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#B8942F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Sending...' : 'Request a Conversation'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
