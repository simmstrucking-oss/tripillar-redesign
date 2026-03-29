'use client'

import { useEffect, useState } from 'react'

interface Cohort {
  id: string
  book: string
  facilitator: string
  startDate: string
  status: string
  enrolled: number
  completionRate: number
}

interface CohortDetail {
  id: string
  book_module: string
  start_date: string
  status: string
  total_enrolled: number
  total_completed: number
  feedbackStats?: {
    avgScore?: number
    feedbackCount?: number
  }
}

export default function CohortsTab() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCohort, setSelectedCohort] = useState<CohortDetail | null>(null)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const res = await fetch('/api/org/cohorts')
      if (res.ok) {
        const data = await res.json()
        setCohorts(data)
      }
    } catch (err) {
      console.error('Failed to fetch cohorts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = async (cohortId: string) => {
    try {
      const res = await fetch(`/api/org/cohorts/${cohortId}`)
      if (res.ok) {
        const detail = await res.json()
        setSelectedCohort(detail)
      }
    } catch (err) {
      console.error('Failed to fetch cohort detail:', err)
    }
  }

  if (loading) return <div>Loading cohorts...</div>

  if (selectedCohort) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCohort(null)}
          className="px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: '#E2DDD7', color: '#2D3142' }}
        >
          ← Back to Cohorts
        </button>

        <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
          <h3 className="text-2xl font-bold mb-4" style={{ color: '#2D3142', fontFamily: 'Playfair Display, serif' }}>
            {selectedCohort.book_module}
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Status</p>
              <p className="text-lg font-semibold" style={{ color: '#2D3142' }}>
                {selectedCohort.status}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Start Date</p>
              <p className="text-lg font-semibold" style={{ color: '#2D3142' }}>
                {new Date(selectedCohort.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Enrolled</p>
              <p className="text-lg font-semibold" style={{ color: '#2D3142' }}>
                {selectedCohort.total_enrolled}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Completion Rate</p>
              <p className="text-lg font-semibold" style={{ color: '#2D3142' }}>
                {selectedCohort.total_enrolled > 0
                  ? Math.round((selectedCohort.total_completed / selectedCohort.total_enrolled) * 100)
                  : 0
                }%
              </p>
            </div>
          </div>

          {selectedCohort.feedbackStats?.feedbackCount && (
            <div className="p-4 rounded mt-6" style={{ backgroundColor: '#FDF8EE' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#2D3142' }}>
                Participant Feedback
              </p>
              <p className="text-lg font-semibold" style={{ color: '#B8942F' }}>
                {selectedCohort.feedbackStats.avgScore} / 5.0
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A7264' }}>
                Based on {selectedCohort.feedbackStats.feedbackCount} responses
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (cohorts.length === 0) {
    return (
      <div className="p-6 rounded border text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <p style={{ color: '#7A7264' }}>
          No cohorts yet. Your first cohort will appear here once launched.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm cursor-pointer">
        <thead>
          <tr style={{ borderBottom: '2px solid #E2DDD7' }}>
            <th className="text-left p-3 font-semibold" style={{ color: '#2D3142' }}>Book</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#2D3142' }}>Facilitator</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#2D3142' }}>Start Date</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#2D3142' }}>Status</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#2D3142' }}>Enrolled</th>
            <th className="text-left p-3 font-semibold" style={{ color: '#2D3142' }}>Completion</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map(c => (
            <tr
              key={c.id}
              onClick={() => handleRowClick(c.id)}
              style={{ borderBottom: '1px solid #E2DDD7' }}
              className="hover:bg-gray-50 transition"
            >
              <td className="p-3 font-medium" style={{ color: '#2D3142' }}>{c.book}</td>
              <td className="p-3" style={{ color: '#2D3142' }}>{c.facilitator}</td>
              <td className="p-3" style={{ color: '#2D3142' }}>
                {new Date(c.startDate).toLocaleDateString()}
              </td>
              <td className="p-3">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: c.status === 'active' ? '#E8F5E9' : '#FFF3CD',
                    color: c.status === 'active' ? '#2E7D50' : '#856404'
                  }}
                >
                  {c.status}
                </span>
              </td>
              <td className="p-3" style={{ color: '#2D3142' }}>{c.enrolled}</td>
              <td className="p-3 font-semibold" style={{ color: '#2D3142' }}>
                {c.completionRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
