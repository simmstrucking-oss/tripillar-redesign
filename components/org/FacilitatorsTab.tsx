'use client'

import { useEffect, useState } from 'react'

interface Facilitator {
  id: string
  name: string
  cert_track: string
  cert_status: string
  cert_expiry: string
  books_certified: number
}

export default function FacilitatorsTab() {
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFacilitators()
  }, [])

  const fetchFacilitators = async () => {
    try {
      const res = await fetch('/api/org/facilitators')
      if (res.ok) {
        const data = await res.json()
        setFacilitators(data.facilitators ?? data)
      }
    } catch (err) {
      console.error('Failed to fetch facilitators:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading facilitators...</div>

  if (facilitators.length === 0) {
    return (
      <div className="p-6 rounded border text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <p style={{ color: '#7A7264' }}>
          No facilitators registered yet. They'll appear here once certified.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '2px solid #E2DDD7' }}>
            <th className="text-left p-3 font-semibold" style={{ color: '#1c3028' }}>Name</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#1c3028' }}>Cert Track</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#1c3028' }}>Status</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#1c3028' }}>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {facilitators.map(f => (
            <tr key={f.id} style={{ borderBottom: '1px solid #E2DDD7' }}>
              <td className="p-3" style={{ color: '#1c3028' }}>{f.name}</td>
              <td className="p-3" style={{ color: '#1c3028' }}>{f.books_certified} books</td>
              <td className="p-3">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: f.cert_status === 'active' ? '#E8F5E9' : '#FFF3CD',
                    color: f.cert_status === 'active' ? '#2E7D50' : '#856404'
                  }}
                >
                  {f.cert_status}
                </span>
              </td>
              <td className="p-3" style={{ color: '#1c3028' }}>
                {new Date(f.cert_expiry).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
