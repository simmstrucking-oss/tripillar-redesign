'use client'

import { useEffect, useState } from 'react'

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
          const daysUntilRenewal = Math.floor((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilRenewal < 0) {
            setShowRenewalBanner(true)
            setBannerType('danger')
          } else if (daysUntilRenewal < 60) {
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
          <p style={{ color: bannerType === 'danger' ? '#C0392B' : '#C07D2F' }}>
            {bannerType === 'danger'
              ? `Your license expired on ${renewalDate}. Please contact Wayne to renew.`
              : `Your license renews on ${renewalDate}. Wayne will be in touch.`
            }
          </p>
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
