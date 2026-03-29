'use client'

import { useEffect, useState } from 'react'
import { SCHEDULE_A } from '@/lib/ila-template'

interface LicenseData {
  license_type: string
  license_status: string
  license_start: string
  license_renewal: string
  contact_name: string
  contact_email: string
  ilaUrl?: string
}

export default function LicenseTab() {
  const [data, setData] = useState<LicenseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRenewalBanner, setShowRenewalBanner] = useState(false)
  const [bannerType, setBannerType] = useState<'warning' | 'danger'>('warning')
  const [daysUntilRenewal, setDaysUntilRenewal] = useState<number>(0)
  const [renewalFee, setRenewalFee] = useState<string | null>(null)
  const [requestingRenewal, setRequestingRenewal] = useState(false)
  const [renewalMessage, setRenewalMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchLicense()
  }, [])

  const fetchLicense = async () => {
    try {
      const res = await fetch('/api/org/license')
      if (res.ok) {
        const licenseData = await res.json()
        setData(licenseData)

        // Check renewal date
        if (licenseData.license_renewal) {
          const renewalDate = new Date(licenseData.license_renewal)
          const today = new Date()
          const days = Math.floor((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          setDaysUntilRenewal(days)

          // Map license_type to SCHEDULE_A key
          let scheduleKey = licenseData.license_type
          if (licenseData.license_type === 'Community') {
            scheduleKey = 'Community Tier'
          } else if (licenseData.license_type === 'Standard') {
            scheduleKey = 'Standard Organization'
          }

          const fee = SCHEDULE_A[scheduleKey]?.fee
          setRenewalFee(fee ? `$${fee}.00` : 'Contact Wayne for pricing')

          if (days < 0) {
            setShowRenewalBanner(true)
            setBannerType('danger')
          } else if (days <= 60 && days >= 0) {
            setShowRenewalBanner(true)
            setBannerType('warning')
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch license:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRenewal = async () => {
    if (!data) return
    setRequestingRenewal(true)
    try {
      const res = await fetch('/api/org/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'License renewal request',
          description: `Renewal request for ${data.contact_name}'s organization — renewal date ${new Date(data.license_renewal).toLocaleDateString()}`
        })
      })
      if (res.ok) {
        setRenewalMessage('Renewal request sent. Wayne will be in touch.')
      } else {
        setRenewalMessage('Failed to send renewal request. Please try again.')
      }
    } catch (err) {
      console.error('Failed to request renewal:', err)
      setRenewalMessage('Error sending renewal request.')
    } finally {
      setRequestingRenewal(false)
    }
  }

  if (loading) return <div>Loading license information...</div>
  if (!data) return <div>Failed to load license data.</div>

  const licenseStartDate = new Date(data.license_start).toLocaleDateString()
  const renewalDate = new Date(data.license_renewal).toLocaleDateString()

  return (
    <div className="space-y-6">
      {/* Renewal Banner */}
      {showRenewalBanner && (
        <div
          className="p-4 rounded"
          style={{
            backgroundColor: bannerType === 'danger' ? '#FDE8E8' : '#FFF3CD',
            borderLeft: `4px solid ${bannerType === 'danger' ? '#C0392B' : '#C07D2F'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: bannerType === 'danger' ? '#C0392B' : '#C07D2F', margin: 0 }}>
              {bannerType === 'danger'
                ? `Your license expired on ${renewalDate}. Please contact Wayne to renew.`
                : `Your license renews on ${renewalDate}. Your renewal fee is ${renewalFee}. Wayne will be in touch to confirm renewal.`
              }
            </p>
            {bannerType === 'warning' && daysUntilRenewal > 0 && (
              <button
                onClick={handleRequestRenewal}
                disabled={requestingRenewal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#C07D2F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: requestingRenewal ? 'not-allowed' : 'pointer',
                  opacity: requestingRenewal ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                  marginLeft: '16px'
                }}
              >
                {requestingRenewal ? 'Sending...' : 'Request Renewal'}
              </button>
            )}
          </div>
          {renewalMessage && (
            <p style={{ color: bannerType === 'danger' ? '#C0392B' : '#C07D2F', marginTop: '8px', marginBottom: 0, fontSize: '14px' }}>
              {renewalMessage}
            </p>
          )}
        </div>
      )}

      {/* License Info Card */}
      <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2D3142' }}>
          License Details
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>
              License Tier
            </p>
            <p className="text-base font-semibold" style={{ color: '#2D3142' }}>
              {data.license_type}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>
              Status
            </p>
            <p className="text-base font-semibold" style={{ color: '#2D3142' }}>
              {data.license_status}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>
              Start Date
            </p>
            <p className="text-base" style={{ color: '#2D3142' }}>
              {licenseStartDate}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>
              Renewal Date
            </p>
            <p className="text-base" style={{ color: '#2D3142' }}>
              {renewalDate}
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            const docRes = await fetch('/api/org/documents?file=ila')
            if (docRes.ok) {
              const { url } = await docRes.json()
              window.open(url, '_blank')
            }
          }}
          className="mt-6 px-4 py-2 rounded font-medium transition"
          style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
        >
          View License Agreement
        </button>
      </div>

      {/* Contact Info */}
      <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2D3142' }}>
          Organization Contact
        </h3>
        <p className="mb-2">
          <span className="font-medium" style={{ color: '#2D3142' }}>{data.contact_name}</span>
        </p>
        <p style={{ color: '#7A7264' }}>
          {data.contact_email}
        </p>
      </div>
    </div>
  )
}
