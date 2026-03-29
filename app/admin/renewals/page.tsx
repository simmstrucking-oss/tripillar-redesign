'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SCHEDULE_A } from '@/lib/ila-template';

function adminSecret(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/admin-secret=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

interface RenewalRow {
  id: string;
  name: string;
  license_type: string;
  license_renewal: string;
  license_renewed_count: number;
  contact_name: string;
  contact_email: string;
  renewal_status: string | null;
  renewal_agreement_id: string | null;
}

function RenewalsContent() {
  const router = useRouter();
  const [renewals, setRenewals] = useState<RenewalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRenewal, setSendingRenewal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const secret = adminSecret();
    if (!secret) {
      router.push('/admin/login');
      return;
    }

    fetchRenewals();
  }, [router]);

  const fetchRenewals = async () => {
    try {
      const res = await fetch('/api/admin/renewals', {
        headers: {
          'x-admin-secret': adminSecret(),
        },
      });

      if (!res.ok) {
        setError('Failed to load renewals');
        return;
      }

      const data = await res.json();
      setRenewals(data.renewals || []);
    } catch (err) {
      setError('Error loading renewals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRenewal = async (org_id: string, org_name: string) => {
    setSendingRenewal(org_id);
    try {
      const res = await fetch('/api/admin/agreements/renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret(),
        },
        body: JSON.stringify({ org_id }),
      });

      if (res.ok) {
        setSuccessMsg(`Renewal agreement sent to ${org_name}.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        await fetchRenewals();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to send renewal agreement');
      console.error(err);
    } finally {
      setSendingRenewal(null);
    }
  };

  const getDaysUntilRenewal = (renewalDate: string): number => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    return Math.floor((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getRenewalFee = (license_type: string): number => {
    let scheduleKey = license_type;
    if (license_type === 'Community') {
      scheduleKey = 'Community Tier';
    } else if (license_type === 'Standard') {
      scheduleKey = 'Standard Organization';
    }
    return SCHEDULE_A[scheduleKey]?.fee || 0;
  };

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'sent':
        return '#FFC107'; // Yellow
      case 'org_signed':
        return '#B8942F'; // Gold
      case 'fully_executed':
        return '#2E7D50'; // Green
      default:
        return '#7A7264'; // Gray (not started)
    }
  };

  const getStatusLabel = (status: string | null): string => {
    if (!status) return 'Not started';
    if (status === 'org_signed') return 'Org Signed';
    if (status === 'fully_executed') return 'Executed';
    return status.replace(/_/g, ' ');
  };

  const getDaysColor = (days: number): string => {
    if (days > 30) return '#2E7D50'; // Green
    if (days > 0) return '#C07D2F'; // Orange/warn
    return '#C0392B'; // Red/danger
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading renewals...</div>;
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#F4F1EC', minHeight: '100vh' }}>
      <h1 style={{ color: '#2D3142', marginBottom: '30px' }}>
        License Renewals
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

      {successMsg && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {renewals.length === 0 ? (
        <p style={{ color: '#7A7264' }}>No renewals due within 90 days.</p>
      ) : (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1.2fr 1.2fr 1fr',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#2D3142',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            <div>Organization</div>
            <div>License Tier</div>
            <div>Renewal Date</div>
            <div>Days Until</div>
            <div>Renewal Fee</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {renewals.map((renewal) => {
            const days = getDaysUntilRenewal(renewal.license_renewal);
            const fee = getRenewalFee(renewal.license_type);
            const daysColor = getDaysColor(days);
            const statusColor = getStatusColor(renewal.renewal_status);

            return (
              <div
                key={renewal.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1.2fr 1.2fr 1fr',
                  gap: '12px',
                  padding: '12px',
                  borderBottom: '1px solid #E2DDD7',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong style={{ color: '#2D3142' }}>{renewal.name}</strong>
                </div>
                <div>{renewal.license_type}</div>
                <div>{new Date(renewal.license_renewal).toLocaleDateString()}</div>
                <div>
                  <span style={{ color: daysColor, fontWeight: 'bold' }}>
                    {days < 0 ? `Overdue ${Math.abs(days)}d` : `${days}d`}
                  </span>
                </div>
                <div>${fee}</div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: statusColor,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {getStatusLabel(renewal.renewal_status)}
                  </span>
                </div>
                <div>
                  {!renewal.renewal_status ? (
                    <button
                      onClick={() =>
                        handleSendRenewal(renewal.id, renewal.name)
                      }
                      disabled={sendingRenewal === renewal.id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: sendingRenewal === renewal.id ? '#ccc' : '#B8942F',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor:
                          sendingRenewal === renewal.id
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {sendingRenewal === renewal.id ? 'Sending...' : 'Send'}
                    </button>
                  ) : renewal.renewal_status === 'sent' ? (
                    <a
                      href={`/admin/agreements?id=${renewal.renewal_agreement_id}`}
                      style={{
                        color: '#B8942F',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      View
                    </a>
                  ) : renewal.renewal_status === 'org_signed' ? (
                    <a
                      href={`/admin/agreements?id=${renewal.renewal_agreement_id}`}
                      style={{
                        color: '#B8942F',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Review & Sign
                    </a>
                  ) : (
                    <a
                      href={`/admin/agreements?id=${renewal.renewal_agreement_id}`}
                      style={{
                        color: '#B8942F',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RenewalsAdmin() {
  return (
    <Suspense fallback={<div style={{ padding: '40px' }}>Loading...</div>}>
      <RenewalsContent />
    </Suspense>
  );
}
