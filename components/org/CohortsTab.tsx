'use client'

import { useEffect, useState } from 'react'

interface Cohort {
  id: string
  book_module: string
  facilitator_name: string | null
  start_date: string
  status: string
  total_enrolled: number
  total_completed: number
}

interface CohortDetail extends Cohort {
  feedback_stats?: {
    avg_rating: number | null
    count: number
  }
}

export default function CohortsTab() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<CohortDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const res = await fetch('/api/org/cohorts')
      if (res.ok) {
        const data = await res.json()
        setCohorts(data.cohorts ?? (Array.isArray(data) ? data : []))
      }
    } catch (err) {
      console.error('Failed to fetch cohorts:', err)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/org/cohorts/${id}`)
      if (res.ok) setDetail(await res.json())
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) return <div>Loading cohorts...</div>

  if (cohorts.length === 0) {
    return (
      <div className="p-6 rounded border text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <p style={{ color: '#7A7264' }}>No cohorts found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid #E2DDD7' }}>
              {['Book', 'Facilitator', 'Start Date', 'Status', 'Enrolled', 'Completion'].map(h => (
                <th key={h} className="text-left p-3 font-semibold" style={{ color: '#1c3028' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map(c => {
              const rate = c.total_enrolled > 0
                ? Math.round((c.total_completed / c.total_enrolled) * 100) + '%'
                : '\u2014'
              return (
                <tr
                  key={c.id}
                  onClick={() => openDetail(c.id)}
                  className="cursor-pointer hover:bg-gray-50"
                  style={{ borderBottom: '1px solid #E2DDD7' }}
                >
                  <td className="p-3" style={{ color: '#1c3028' }}>{c.book_module || '\u2014'}</td>
                  <td className="p-3" style={{ color: '#1c3028' }}>{c.facilitator_name || '\u2014'}</td>
                  <td className="p-3" style={{ color: '#1c3028' }}>{c.start_date ? new Date(c.start_date).toLocaleDateString() : '\u2014'}</td>
                  <td className="p-3" style={{ color: '#1c3028' }}>{c.status || '\u2014'}</td>
                  <td className="p-3" style={{ color: '#1c3028' }}>{c.total_enrolled ?? 0}</td>
                  <td className="p-3" style={{ color: '#1c3028' }}>{rate}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detailLoading && <p style={{ color: '#7A7264' }}>Loading detail...</p>}

      {detail && !detailLoading && (
        <div className="p-6 rounded border" style={{ backgroundColor: '#FDF8EE', borderColor: '#B8942F' }}>
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-bold" style={{ color: '#1c3028', fontFamily: 'Playfair Display, serif' }}>
              {detail.book_module} — Detail
            </h4>
            <button onClick={() => setDetail(null)} className="text-lg" style={{ color: '#7A7264' }}>&times;</button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Status:</strong> {detail.status}</div>
            <div><strong>Enrolled:</strong> {detail.total_enrolled}</div>
            <div><strong>Completed:</strong> {detail.total_completed}</div>
            <div>
              <strong>Completion Rate:</strong>{' '}
              {detail.total_enrolled ? Math.round((detail.total_completed / detail.total_enrolled) * 100) : 0}%
            </div>
            {detail.feedback_stats?.avg_rating != null && (
              <div><strong>Avg Feedback Score:</strong> {detail.feedback_stats.avg_rating.toFixed(1)}</div>
            )}
            {detail.feedback_stats && (
              <div><strong>Feedback Count:</strong> {detail.feedback_stats.count}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
