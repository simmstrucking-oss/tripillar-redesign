'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function adminSecret(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/admin-secret=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function AgreementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return <AgreementsInner router={router} searchParams={searchParams} />;
}

interface Agreement {
  id: string;
  token: string;
  org_name: string;
  license_tier: string;
  license_fee: number;
  status: string;
  created_at: string;
  sent_at?: string;
  org_signed_at?: string;
  wayne_signed_at?: string;
  expires_at: string;
  org_signature?: string;
  wayne_signature?: string;
}

function AgreementsInner({
  router,
  searchParams,
}: {
  router: any;
  searchParams: any;
}) {
  const selectedId = searchParams.get('id');

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [signature, setSignature] = useState('');
  const [cosigning, setCosigning] = useState(false);

  useEffect(() => {
    const secret = adminSecret();
    if (!secret) {
      router.push('/admin/login');
      return;
    }

    fetchAgreements();
  }, [router]);

  async function fetchAgreements() {
    try {
      const res = await fetch('/api/admin/agreements', {
        headers: {
          'x-admin-secret': adminSecret(),
        },
      });

      if (!res.ok) {
        setError('Failed to load agreements');
        return;
      }

      const data = await res.json();
      setAgreements(data.agreements || []);

      if (selectedId) {
        const agreement = data.agreements.find(
          (a: Agreement) => a.id === selectedId
        );
        if (agreement) {
          setSelectedAgreement(agreement);
        }
      }
    } catch (err) {
      setError('Error loading agreements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCosign() {
    if (!selectedAgreement || signature.length < 2) return;

    setCosigning(true);
    try {
      const res = await fetch(
        `/api/admin/agreements/${selectedAgreement.id}/cosign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': adminSecret(),
          },
          body: JSON.stringify({ wayne_signature: signature }),
        }
      );

      if (res.ok) {
        alert('Agreement fully executed and org contact notified.');
        setSignature('');
        await fetchAgreements();
        setSelectedAgreement(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to co-sign');
      console.error(err);
    } finally {
      setCosigning(false);
    }
  }

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent':
        return '#FFC107';
      case 'org_signed':
        return '#B8942F';
      case 'fully_executed':
        return '#2E7D50';
      case 'expired':
        return '#999';
      default:
        return '#ccc';
    }
  };

  const statusLabel = (status: string) => {
    return status === 'org_signed' ? 'Org Signed' : status.replace(/_/g, ' ');
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F1EC', minHeight: '100vh' }}>
      <h1 style={{ color: '#1c3028', marginBottom: '30px' }}>
        Institutional License Agreements
      </h1>

      {error && (
        <div
          style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading agreements...</p>
      ) : agreements.length === 0 ? (
        <p style={{ color: '#7A7264' }}>No agreements yet.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
          }}
        >
          {/* List */}
          <div>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#1c3028',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                <div>Org Name</div>
                <div>Tier</div>
                <div>Fee</div>
                <div>Status</div>
                <div></div>
              </div>

              {agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  onClick={() => setSelectedAgreement(agreement)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                    gap: '12px',
                    padding: '12px',
                    borderBottom: '1px solid #E2DDD7',
                    cursor: 'pointer',
                    backgroundColor:
                      agreement.status === 'org_signed'
                        ? 'rgba(184, 148, 47, 0.1)'
                        : selectedAgreement?.id === agreement.id
                          ? '#FDF8EE'
                          : 'transparent',
                    fontSize: '13px',
                  }}
                >
                  <div>{agreement.org_name}</div>
                  <div>{agreement.license_tier}</div>
                  <div>${agreement.license_fee}</div>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: statusBadgeColor(agreement.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      {statusLabel(agreement.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#B8942F' }}>→</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          {selectedAgreement && (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <h2 style={{ color: '#1c3028', marginBottom: '20px' }}>
                {selectedAgreement.org_name}
              </h2>

              <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                <p>
                  <strong>Tier:</strong> {selectedAgreement.license_tier}
                </p>
                <p>
                  <strong>Fee:</strong> ${selectedAgreement.license_fee}/year
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    style={{
                      backgroundColor: statusBadgeColor(
                        selectedAgreement.status
                      ),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                    }}
                  >
                    {statusLabel(selectedAgreement.status)}
                  </span>
                </p>
                <p>
                  <strong>Sent:</strong>{' '}
                  {selectedAgreement.created_at
                    ? new Date(selectedAgreement.created_at).toLocaleDateString()
                    : '—'}
                </p>
                {selectedAgreement.org_signed_at && (
                  <p>
                    <strong>Org Signed:</strong>{' '}
                    {new Date(selectedAgreement.org_signed_at).toLocaleDateString()}
                  </p>
                )}
                {selectedAgreement.wayne_signed_at && (
                  <p>
                    <strong>Wayne Signed:</strong>{' '}
                    {new Date(selectedAgreement.wayne_signed_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Co-sign Section */}
              {selectedAgreement.status === 'org_signed' && (
                <div
                  style={{
                    backgroundColor: '#FDF8EE',
                    border: `2px solid #B8942F`,
                    borderRadius: '8px',
                    padding: '15px',
                    marginTop: '20px',
                  }}
                >
                  <h3 style={{ color: '#B8942F', marginTop: 0, marginBottom: '15px' }}>
                    Review & Co-Sign
                  </h3>

                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                    Organization has signed. Enter your signature to finalize and
                    execute the agreement.
                  </p>

                  <input
                    type="text"
                    placeholder="Type your full legal name"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid #E2DDD7`,
                      borderRadius: '4px',
                      marginBottom: '10px',
                      boxSizing: 'border-box',
                    }}
                    disabled={cosigning}
                  />

                  <button
                    onClick={handleCosign}
                    disabled={signature.length < 2 || cosigning}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor:
                        signature.length < 2 || cosigning ? '#ccc' : '#B8942F',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor:
                        signature.length < 2 || cosigning
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {cosigning ? 'Co-signing...' : 'Co-Sign and Execute'}
                  </button>
                </div>
              )}

              {selectedAgreement.status === 'fully_executed' && (
                <div
                  style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    padding: '12px',
                    marginTop: '20px',
                    color: '#155724',
                    fontSize: '13px',
                  }}
                >
                  ✓ Agreement fully executed and org contact has been notified.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgreementsAdmin() {
  return (
    <Suspense fallback={<div style={{ padding: '40px' }}>Loading...</div>}>
      <AgreementsContent />
    </Suspense>
  );
}
